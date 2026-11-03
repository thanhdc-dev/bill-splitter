# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hai vai ngang nhau, cả hai đều là đối tượng thiết kế:

- **Người tạo bill**: thường là người ứng tiền trước ở quán hoặc chuyến đi, nhập khoản mục và thành viên trên điện thoại, rồi chia sẻ kết quả cho cả nhóm.
- **Người nhận bill**: mở đường link được chia sẻ (route `/:code`) để xem phần mình phải trả và quét QR chuyển khoản. Không cần đăng nhập để xem.

## Product Purpose

Chia hóa đơn nhóm nhanh: chia đều hoặc theo món/số lượng, tính số tiền mỗi người phải trả, và tạo mã QR chuyển khoản (ngân hàng, Momo) để thanh toán ngay. Thành công là người nhận trả đúng số tiền của mình mà không phải hỏi lại người tạo bill.

## Positioning

Ai cũng dùng được máy tính chia tiền ngay, không cần tài khoản; người tạo chỉ cần đăng nhập khi lưu và chia sẻ bill bằng link ngắn; người được chia sẻ chỉ cần mở link là xem được, không phải tạo tài khoản. QR chuyển khoản gắn đúng số tiền từng người. Tagline hiện có: "Bạn cứ chill – bill tôi chia."

## Operating Context

- Dùng chủ yếu trên điện thoại, ngay tại bàn ăn hoặc lúc kết thúc chuyến đi; cài được như PWA (iOS/Android).
- Link chia sẻ được gửi qua mạng xã hội và nhắn tin, nên có ảnh xem trước (Open Graph) cho từng bill.
- Đăng nhập bằng OAuth (Google, Zalo, GitHub) hoặc passkey.
- Đính kèm ảnh biên lai vào bill.

## Capabilities and Constraints

- Angular 20 SPA, Angular Material (Material 3), Tailwind 4, service worker; deploy Vercel.
- Tạo bill (lưu và chia sẻ) yêu cầu đăng nhập. Điểm chặn nằm ở thao tác Lưu/Chia sẻ (`save()` trong `create-bill.ts`), không phải ở route: `/` không có auth guard, nên khách vẫn nhập khoản mục, thêm thành viên và xem kết quả chia tiền mà không cần tài khoản. Khi bấm lưu, khách thấy hộp thoại đăng nhập "Bạn cần đăng nhập để lưu và chia sẻ"; bill được giữ tạm ở local và tự tạo sau khi đăng nhập thành công, còn huỷ hộp thoại thì bản tạm bị xoá. Khách không được tải ảnh biên lai lên (backend cần biết người dùng). Chỉ `/bills` và `/setting` có auth guard.
- Giao diện sáng/tối/theo hệ thống, lựa chọn được ghi nhớ.
- Toàn bộ giao diện và copy bằng tiếng Việt (`lang="vi"`).

## Brand Commitments

- Giọng thân mật tiếng Việt, xưng hô gần gũi như tagline hiện có.
- Ưu tiên mobile và PWA.

## Evidence on Hand

- Ảnh chụp màn hình thật trong `docs/screenshots/`.
- Chưa có số liệu người dùng, testimonial hay case study: không được tự thêm.

## Product Principles

- Người nhận phải xem và trả tiền được mà không cần tài khoản.
- Số tiền và QR phải đúng và dễ đọc ngay trên điện thoại, một tay.
- Khách tính tiền thoải mái; đăng nhập chỉ là bước cuối để lưu và chia sẻ, và không được làm mất dữ liệu đã nhập. Phía người nhận không bao giờ bị chặn bởi đăng nhập.
- Giọng điệu thân mật nhưng thông tin tiền bạc luôn rõ ràng, không đùa ở chỗ cần chính xác.

## Accessibility & Inclusion

Đạt WCAG AA: contrast chữ 4.5:1 (icon và thành phần UI 3:1), vùng chạm tối thiểu 44px, tôn trọng `prefers-reduced-motion`, nhãn screen reader bằng tiếng Việt.
