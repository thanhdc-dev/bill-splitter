<div align="center">
  <h1>🧾 Bill Splitter</h1>
  <p>Một ứng dụng web thông minh, nhanh chóng và bảo mật giúp bạn dễ dàng tính toán và chia sẻ tiền hóa đơn với bạn bè và gia đình.</p>
</div>

---

## Tính Năng

* **Chia Tiền Linh Hoạt:** Chia đều hóa đơn cho một nhóm hoặc chia theo phần/số lượng cụ thể
* **Tạo Mã QR Thanh Toán Nhanh:** Tạo ngay mã QR chuyên dụng cho việc chuyển khoản ngân hàng, ví điện tử Momo trực tiếp giúp thanh toán nhanh nhất.
* **Lưu & Chia Sẻ Hóa Đơn:** Tự động lưu các dữ liệu hóa đơn của bạn và dễ dàng chia sẻ chúng thông qua các đường liên kết (link) ngắn.
* **Xác Thực Nhanh Chóng:** Quy trình đăng nhập an toàn, tiện dụng, hỗ trợ OAuth qua **Google** và **Zalo**.
* **Tải Lên Ảnh Biên Lai:** Cho phép đính kèm hình ảnh hóa đơn/biên lai trực tiếp vào hóa đơn được tạo để đảm bảo sự minh bạch.
* **Hỗ Trợ PWA:** Có thể cài đặt trực tiếp như một Progressive Web App (PWA) trên các thiết bị iOS và Android để đem lại trải nghiệm mượt mà như ứng dụng gốc.
* **Giao Diện Sáng/Tối:** Hệ thống hỗ trợ chuyển đổi giao diện nền Sáng/Tối (Dark/Light theme) tích hợp sẵn phù hợp với tùy chọn của riêng bạn.
* **Tối Ưu Hóa SEO:** Đảm bảo các liên kết chia sẻ hóa đơn có khả năng hiển thị trước (preview) đầy đủ, nổi bật trên các mạng xã hội.

## Nền Tảng Công Nghệ

* **Framework Frontend:** Angular 20
* **Thiết Kế Giao Diện:** Tailwind CSS 4, Angular Material, và SCSS
* **PWA:** Angular Service Worker
* **Thư Viện Khác:** RxJS, `ngx-mat-select-search`

## Hướng Dẫn Cài Đặt

### Yêu Cầu Trước Khi Cài Đặt

Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/) trên máy tính của mình. Ứng dụng đã có sẵn file `.nvmrc` chỉ định phiên bản Node.js phù hợp nhất.

### Cài Đặt

1. Sao chép (*Clone*) mã nguồn (repository):
   ```bash
   git clone <repository-url>
   cd bill-splitter
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

### Khởi Chạy Môi Trường Phát Triển

Để chạy server phát triển trong máy tính của bạn:
```bash
npm start
# hoặc 
ng serve
```

Hãy mở trình duyệt và truy cập vào `http://localhost:4200/`. Ứng dụng sẽ tự động tải lại bất cứ khi nào bạn thay đổi bất kỳ tập tin mã nguồn nào.

### Build Ứng Dụng (Production)

Để biên dịch và build dự án cho môi trường Release (sản phẩm hoàn thiện), hãy chạy:

```bash
npm run build:prod
# hoặc
ng build --configuration=production
```

Các file cấu thành ứng dụng sau khi build xong sẽ được tự động lưu trữ trong thư mục `dist/`.
