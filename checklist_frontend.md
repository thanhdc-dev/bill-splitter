# Checklist Lưu Ý Chi Tiết Cho Website

Danh sách kiểm tra này được đúc rút từ các điểm quan trọng về thẩm mỹ, tính dễ tiếp cận (accessibility), hiệu năng và trải nghiệm di động nhằm giúp website đạt độ hoàn thiện cao nhất trước khi phát hành.

## **1. Trải nghiệm thị giác & Thẩm mỹ chi tiết (UI & Polish)**
- [x] Tùy chỉnh màu chọn văn bản (`::selection`) sao cho đồng bộ với bảng màu thương hiệu. _(styles.scss, dùng token teal `--accent-soft-bg/fg`)_
- [x] Tinh chỉnh thanh cuộn (scrollbar) tinh tế, phù hợp với thiết kế mà không làm ảnh hưởng đến tính khả dụng. _(đã có sẵn, styles.scss:282-294)_
- [ ] Đồng bộ hóa trạng thái hover trên tất cả các nút (buttons) và liên kết (links). _(chưa audit toàn bộ, chỉ xác nhận rải rác có hover)_
- [x] Thiết lập hiệu ứng chuyển động (transitions) mượt mà nhưng có kiểm soát (không quá lố). _(đã dùng transform/opacity hợp lý; nay thêm reduced-motion)_

## **2. Khả năng truy cập (Accessibility - A11y)**
- [ ] Đảm bảo độ tương phản màu sắc (color contrast) đủ tiêu chuẩn, không bị lỗi contrast. **Cần đo thủ công bằng Lighthouse/axe — không tự động hoá được trong môi trường agent hiện tại.**
- [x] Giữ lại hoặc tùy chỉnh đường viền khi focus (visible focus indicators) thay vì tắt hẳn. _(sửa: logo header dùng `<a>` + focus ring 2px riêng, xem docs/implementation-notes.md 2026-09-29)_
- [x] Sử dụng HTML ngữ nghĩa đúng cách. _(sửa: `<h1 routerLink>` → `<h1><a routerLink>`; không tìm thấy div-giả-button nào khác trong `src/`)_
- [x] Hỗ trợ đầy đủ việc điều hướng bằng bàn phím (Keyboard navigation). _(verify bằng Tab qua Playwright, hoạt động đúng sau khi sửa logo)_
- [x] Tôn trọng tùy chọn giảm chuyển động của hệ thống (`prefers-reduced-motion`). _(mới thêm, styles.scss)_

## **3. Hiệu năng & Kỷ luật mã nguồn (Performance & Discipline)**
- [x] Kiểm tra, nén và định kích thước hình ảnh phù hợp. _(logo ngân hàng ~15-20KB/ảnh webp, ổn; `public/thumbnail.webp` 452KB hơi nặng cho ảnh OG — chưa xử lý, ưu tiên thấp)_
- [x] Loại bỏ mã JavaScript không dùng đến (unused JS). _(sửa: `app.routes.ts` chuyển `loadComponent`, main bundle 1.1MB → ~38.7KB)_
- [ ] Hạn chế tối đa hiện tượng dịch chuyển bố cục đột ngột (Layout Shifts). _(rủi ro thấp — ảnh đều có width/height — nhưng chưa đo CLS thực tế bằng công cụ)_
- [x] Kiểm tra và tối ưu thời gian tải font chữ. _(đã có `display=swap`, index.html:13)_
- [ ] Chạy test Lighthouse ở chế độ **ẩn danh (Incognito)**. **Cần bạn tự chạy — không chạy được trong môi trường headless này.**

## **4. Kiểm thử trên thiết bị di động (Mobile Readiness)**
- [ ] Chạy và kiểm tra điểm số Lighthouse trên thiết bị di động. **Cần bạn tự chạy.**
- [x] Kiểm tra thực tế trải nghiệm trên màn hình nhỏ. _(sửa: FAB "Lưu & chia sẻ" từng đè lên tab "Momo" ngay khi tải trang ở 390px — nay ẩn tới khi cuộn quá 120px, xem docs/implementation-notes.md 2026-09-29)_