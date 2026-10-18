# Đặc Tả Kỹ Thuật Backend Endpoint: `GET /bills/:code/og`

> **Mục tiêu:** Cung cấp endpoint công khai siêu nhẹ (< 1KB), tốc độ phản hồi cực nhanh (< 15ms) để Vercel Edge Function (`/api/og`) và các bot mạng xã hội (Facebook, Zalo, Twitter/X, Telegram) truy xuất metadata xem trước (Open Graph preview) mà không gây tải cho database.

---

## 1. Nguyên Tắc Thiết Kế

1. **Endpoint Công Khai (Public):** Không yêu cầu xác thực Bearer Token hay Session Cookie. Bất kỳ ai có đường link chia sẻ đều có thể đọc metadata cơ bản.
2. **Kích Thước Siêu Nhẹ (< 1KB):** Không trả về danh sách chi tiết từng món đồ (`expenses`) hay danh sách phân chia chi tiết của từng thành viên (`participations`). Chỉ trả về các trường tổng hợp cần thiết.
3. **Database Indexing Tối Ưu:** Đảm bảo cột `code` đã được đánh Index Unique (hoặc Primary/B-Tree Index) để tốc độ lookup đạt < 15ms.
4. **Header Cache Cực Kỳ Quan Trọng:** Bắt buộc cấu hình header HTTP Cache:
   ```http
   Cache-Control: public, s-maxage=60, stale-while-revalidate=300
   ```
   *Giúp Edge Function và CDN của Vercel/Cloudflare tái sử dụng dữ liệu trong 60 giây, ngăn chặn hiện tượng database bị quá tải khi một link viral được hàng chục bot quét cùng lúc.*

---

## 2. Đặc Tả Request & Response

### 2.1. Request

- **Method:** `GET`
- **URL:** `https://api.thanhdc.app/bills/:code/og`
- **Path Parameter:**
  - `code` (string): Mã hoá đơn duy nhất (ví dụ: `abc123`).

### 2.2. Response Thành Công (`200 OK`)

**Content-Type:** `application/json; charset=utf-8`

**Body mẫu:**
```json
{
  "code": "abc123",
  "name": "Ăn trưa Cơm Tấm Cali",
  "title": "Hóa đơn: Ăn trưa Cơm Tấm Cali — Bill Splitter",
  "description": "Tổng tiền: 1.250.000 ₫ • 5 người tham gia. Bấm để xem chi tiết và quét QR thanh toán.",
  "totalAmount": 1250000,
  "memberCount": 5,
  "createdAt": "2026-10-18T07:30:00.000Z"
}
```

### 2.3. Response Khi Không Tìm Thấy (`404 Not Found`)

Khi `code` không tồn tại trong cơ sở dữ liệu:
```json
{
  "statusCode": 404,
  "message": "Bill not found",
  "error": "Not Found"
}
```

---

## 3. TypeScript Response Interface

```typescript
export interface IBillOgRO {
  /** Mã hoá đơn duy nhất */
  code: string;
  /** Tên hoá đơn gốc */
  name: string;
  /** Tiêu đề đã định dạng cho thẻ Open Graph (khuyến nghị <= 70 ký tự) */
  title: string;
  /** Đoạn mô tả ngắn gọn (tổng tiền, số người tham gia; khuyến nghị 100 - 250 ký tự) */
  description: string;
  /** Tổng tiền thanh toán (VND) */
  totalAmount: number;
  /** Số lượng thành viên tham gia chia tiền */
  memberCount: number;
  /** Thời gian tạo hoá đơn */
  createdAt: string;
}
```

---

## 4. Mã Nguồn Mẫu (NestJS Controller & Service)

### Controller
```typescript
import { Controller, Get, Param, NotFoundException, Header } from '@nestjs/common';

@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get(':code/og')
  @Header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  async getBillOg(@Param('code') code: string): Promise<IBillOgRO> {
    const ogData = await this.billsService.getBillOg(code);
    if (!ogData) {
      throw new NotFoundException({
        code: 'ERR_BILL_NOT_FOUND',
        message: 'Bill not found',
      });
    }
    return ogData;
  }
}
```

### Service
```typescript
async getBillOg(code: string): Promise<IBillOgRO | null> {
  // Chỉ SELECT bảng bills, KHÔNG JOIN relations (Zero-JOIN) giúp query cực nhanh < 10ms
  const bill = await this.billRepository.findOne({
    where: { code },
    select: ['code', 'name', 'data', 'createdAt'],
  });

  if (!bill) return null;

  const totalAmount = Number(bill.data?.totalAmount) || 0;
  const memberCount = Array.isArray(bill.data?.members) ? bill.data.members.length : 0;
  
  // Định dạng tiền tệ VND
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  const title = `Hóa đơn: ${bill.name} — Bill Splitter`.slice(0, 70);
  const description = `Tổng tiền: ${formattedAmount} • ${memberCount} người tham gia. Bấm để xem chi tiết và quét QR thanh toán.`.slice(0, 300);

  return {
    code: bill.code,
    name: bill.name,
    title,
    description,
    totalAmount,
    memberCount,
    createdAt: bill.createdAt.toISOString(),
  };
}
```

---

## 5. Tương Thích Ngược & Cơ Chế Hoạt Động Của Frontend

- Frontend Vercel Edge Function (`/api/og`) đã được thiết kế sẵn cơ chế **Zero-blocking**:
  1. Frontend sẽ ưu tiên gọi `GET /bills/:code/og`.
  2. Nếu backend chưa kịp triển khai endpoint này (trả về `404`), Edge Function sẽ tự động fallback gọi `GET /bills/:code` (endpoint hiện có), tự trích xuất dữ liệu để phục vụ người dùng ngay mà không bị gián đoạn.
  3. Khi Backend deploy xong endpoint `/bills/:code/og`, hệ thống sẽ tự động chuyển sang dùng endpoint mới siêu nhẹ này mà không cần sửa đổi thêm mã nguồn Frontend.
