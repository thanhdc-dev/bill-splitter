# Bills: chuyển sang luồng upload Presigned URL — Tài liệu cho Webapp

> Hướng dẫn cho **webapp** đang dùng tính năng upload ảnh hoá đơn (bills). Endpoint upload multipart cũ (`POST /bills/upload-images`) đã bị **xoá hẳn** — webapp bắt buộc phải chuyển sang luồng mới bên dưới trước khi cập nhật lên bản này.
> Base URL API: `https://api.thanhdc.dev` (thay bằng domain thực tế). Ngày cập nhật: 2026-09-25.

---

## 1. Vì sao đổi flow

Endpoint cũ nhận file trực tiếp qua backend (`multipart/form-data`), tự suy ra phần mở rộng lưu trữ từ tên file client gửi lên và chỉ kiểm tra sơ bộ `mimetype` — cả hai đều do client tự khai báo, không được xác minh. Kẻ tấn công có thể giả `mimetype`/tên file để tải lên nội dung không phải ảnh (kể cả SVG chứa `<script>`), gây stored XSS khi file được phục vụ lại qua `/uploads`.

Luồng mới (giống hệt cách `photos` module đang làm): **webapp tự upload thẳng lên storage (S3) bằng presigned URL, backend không còn nhận/xử lý nội dung file nào nữa** — backend chỉ cấp URL và ghi nhận trạng thái, nên loại bỏ hoàn toàn vector tấn công trên.

### So sánh nhanh

| | Cũ | Mới |
|---|---|---|
| Endpoint | `POST /bills/upload-images` (multipart, tối đa 5 file/request) | `POST /bills/presigned-url` (1 file/request) → `POST /bills/confirm-upload` |
| File đi qua backend? | Có (backend nhận bytes rồi tự upload lên storage) | Không — webapp upload thẳng lên storage bằng presigned URL |
| Định dạng cho phép | `mimetype` bắt đầu bằng `image/` (client tự khai, **kể cả SVG**) | Whitelist cố định: JPEG / PNG / WebP |
| Định danh file trả về | `id` (số) | `fileId` (số) — dùng y hệt cách cũ khi tạo/sửa bill |

---

## 2. Luồng mới — 3 bước cho mỗi file

### Bước 1 — Xin presigned URL

**Endpoint:** `POST /bills/presigned-url` → `201`

**Body:**
```json
{
  "fileName": "receipt.jpg",
  "mimeType": "image/jpeg"
}
```

`mimeType` chỉ nhận 1 trong 3 giá trị: `image/jpeg` | `image/png` | `image/webp`.

**Response:**
```json
{
  "fileId": 42,
  "presignedUrl": "https://bucket.s3.amazonaws.com/bills/....jpg?X-Amz-...",
  "expiresIn": 900
}
```

**JavaScript (fetch):**
```js
const res = await fetch("https://api.thanhdc.dev/bills/presigned-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
});
const { fileId, presignedUrl } = await res.json();
```

### Bước 2 — Upload thẳng file lên `presignedUrl`

`PUT` trực tiếp tới `presignedUrl` (không gọi qua backend), body là bytes gốc của file. **Hết hạn sau 15 phút** (giá trị `expiresIn`, tính bằng giây).

```js
await fetch(presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});
```

### Bước 3 — Xác nhận upload đã xong

**Endpoint:** `POST /bills/confirm-upload` → `200`

**Body:**
```json
{
  "fileId": 42
}
```

**Response:**
```json
{
  "id": 42,
  "storagePath": "bills/....jpg",
  "status": "uploaded"
}
```

**Curl:**
```bash
curl -X POST "https://api.thanhdc.dev/bills/confirm-upload" \
  -H "Content-Type: application/json" \
  -d '{ "fileId": 42 }'
```

> Gọi lại `confirm-upload` nhiều lần với cùng `fileId` là **an toàn** (idempotent) — lần gọi sau chỉ trả lại trạng thái hiện tại, không xử lý lại.

> **Cập nhật (2026-09-25):** trước khi đổi trạng thái, backend kiểm tra file đã thật sự tồn tại trên storage (S3) hay chưa. Nếu gọi `confirm-upload` **trước khi** hoàn tất bước 2 (upload lên `presignedUrl`), hoặc bước 2 thất bại giữa chừng, sẽ nhận `404 ERR_BILL_FILE_NOT_FOUND` thay vì đổi trạng thái "khống". Webapp chỉ nên gọi `confirm-upload` **sau khi** `PUT` lên `presignedUrl` ở bước 2 đã trả về thành công.

---

## 3. Gắn file vào bill — không đổi

Sau khi `confirm-upload` thành công, dùng `fileId` (số) **y hệt cách cũ** khi tạo/sửa bill — trường `fileIds` trong `POST /bills` và `PUT /bills/:code` **không đổi**:

```json
{
  "name": "Hoá đơn siêu thị",
  "data": { "amount": 250000 },
  "fileIds": [42, 43]
}
```

> **Lưu ý:** chỉ file đã `confirm-upload` thành công (status `uploaded`) mới gắn được vào bill — `fileId` còn ở trạng thái `pending_upload` (chưa confirm, hoặc chưa từng upload) sẽ bị bỏ qua âm thầm, không báo lỗi.

---

## 4. Xử lý lỗi

| HTTP | `code` | Ý nghĩa & cách xử lý |
|---|---|---|
| `400` | `VALIDATION_FAIL` | Thiếu/sai tham số (vd: `mimeType` không nằm trong whitelist). Kiểm tra lại body. |
| `404` | `ERR_BILL_FILE_NOT_FOUND` | `fileId` không tồn tại, **hoặc** file chưa thật sự có mặt trên storage (chưa upload xong/upload lỗi ở bước 2). Kiểm tra lại `fileId`, hoặc thử upload lại từ bước 1 nếu bước 2 (PUT lên S3) từng lỗi. |

Upload trực tiếp lên `presignedUrl` (bước 2) trả lỗi theo chuẩn S3 (XML), không phải JSON của API này — thường gặp nhất là URL hết hạn (>15 phút): xin lại presigned URL mới từ bước 1.

---

## 5. Checklist migrate

- [ ] Đã bỏ mọi lời gọi `POST /bills/upload-images` (endpoint này giờ trả `404`).
- [ ] Với mỗi file: gọi `presigned-url` → `PUT` thẳng lên `presignedUrl` → `confirm-upload`, tuần tự (không cần song song nhiều file như trước vì mỗi file giờ là 1 request riêng). Chỉ gọi `confirm-upload` sau khi bước `PUT` đã thành công.
- [ ] Chỉ cho phép chọn file JPEG/PNG/WebP ở phía UI (khớp whitelist backend) để tránh lỗi `400` muộn.
- [ ] Đã kiểm thử luồng đầy đủ: upload → tạo bill với `fileIds` → xem lại bill (ảnh hiển thị đúng).
- [ ] Đã xử lý trường hợp `presignedUrl` hết hạn (>15 phút không upload) — xin lại từ bước 1.
