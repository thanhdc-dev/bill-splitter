# Implementation Notes — Index

Ghi chép quyết định triển khai theo quy ước tại `AGENTS.md`. File này chỉ là **mục lục**; nội dung đầy đủ nằm ở `docs/notes/YYYY-MM.md`.

**Cho agent:** chỉ đọc index này, rồi mở đúng file tháng (dùng `Grep` tìm heading + `Read` với `offset`/`limit`). Không đọc cả file tháng nếu không cần.

## 2026-09 → [notes/2026-09.md](notes/2026-09.md)

- 2026-09-17
- 2026-09-22 (giảm chiều cao `.header` — reset margin-top mặc định của `h1`)
- 2026-09-22 (giảm khoảng cách trên/dưới tiêu đề "Chi tiết chia tiền")
- 2026-09-22 (bỏ nút icon `settings` trong header `app-result-display`)
- 2026-09-22 (fix selector chết khiến `h2` "Chi tiết chia tiền" luôn hiển thị cỡ mặc định trình duyệt, không phải 1.25rem đã khai báo)
- 2026-09-22 (giảm 50% padding `.member-amount` trên mobile — fix CSS specificity)
- 2026-09-22 (cải thiện UX/UI `app-result-display`: chia-cho-0, trạng thái thanh toán, phân cấp thị giác)
- 2026-09-22 (bo góc `mat-card` trong `app-payment` chỉ ở 2 góc dưới)
- 2026-09-22 (revert CTA "Lưu & chia sẻ" về FAB nổi cố định)
- 2026-09-22 (đồng bộ toàn bộ layout `bill-details.html` theo `create-bill.html`)
- 2026-09-22 (khoảng cách giữa input + giữa form và nút Lưu ở `/setting` và payment form)
- 2026-09-22 (sửa gốc rễ: `.mat-mdc-card` mất viền vì thiếu `!important`)
- 2026-09-22 (audit toàn app + sửa các điểm chưa đồng bộ với theme "biên nhận")
- 2026-09-22 (cải thiện UI/UX form "Thông tin ngân hàng" — Setting/Payment)
- 2026-09-22 (tiếp — sửa lỗi phát sinh sau khi áp mockup)
- 2026-09-22
- 2026-09-18
- 2026-09-18 (đợt 2)
- 2026-09-18 (đợt 3)
- 2026-09-18 (đợt 3b — hồi quy phát hiện khi rà soát)
- 2026-09-18 (đợt 4)
- Còn tồn đọng (cập nhật 2026-09-18, sau đợt 4)
- 2026-09-21
- 2026-09-21 (Pha 0 — redesign "biên nhận giấy": token màu + font)
- 2026-09-21 (Pha 1 — motif dùng chung + override Material toàn cục)
- 2026-09-21 (Pha 2 — danh sách hoá đơn)
- 2026-09-21 (Pha 3 — layout 2 cột + gộp FAB cho trang tạo hoá đơn)
- 2026-09-21 (Pha 4-12 — áp theme mới cho các component còn lại, chạy song song)
- 2026-09-21 (Rà soát toàn bộ 13 pha bằng browser thật — sửa 1 bug nghiêm trọng)
- 2026-09-21 (Làm lại card "Khoản mục" cho đúng mockup đã duyệt)
- 2026-09-22 (cải thiện UI card `app-bank`: grid label-value, nhấn mạnh số tài khoản, feedback copy, khung QR)
- 2026-09-22 (cải thiện UI dialog `qr-popup`: nút đóng nhanh, caption QR, cân đối trọng số action)
- 2026-09-22 (fix global: `.mat-mdc-raised-button` thiếu trong rule bo góc `border-radius-sm`)
- 2026-09-22
- 2026-09-29

## 2026-10 → [notes/2026-10.md](notes/2026-10.md)

- 2026-10-01
- 2026-10-01 (đợt 2)
- 2026-10-01 (đợt 3)
- 2026-10-01 (đợt 4)
- 2026-10-01 (đợt 5)
- 2026-10-01 (đợt 6)
- 2026-10-01 (đợt 7)
- 2026-10-01 (đợt 8)
- 2026-10-01 (đợt 9)
- 2026-10-01 (đợt 10)
- 2026-10-01 (đợt 11)
- 2026-10-01 (đợt 12)
- 2026-10-01 (đợt 13)
- 2026-10-01 (đợt 14)
- 2026-10-01 (đợt 15)
- 2026-10-02 (UX audit mobile — đợt 1: trạng thái tải/không tìm thấy/lỗi ở `bill-details`)
- 2026-10-02 (UX audit mobile — đợt 2: báo lỗi/thành công cho các thao tác ghi, UX-04)
- 2026-10-02 (UX audit mobile — đợt 3: gộp 2 dialog đăng nhập khi lưu/chia sẻ lúc chưa đăng nhập, UX-07)
- 2026-10-02 (UX audit mobile — đợt 4: FAB hiện từ đầu, né PWA prompt/upload-progress, nhãn tab, UX-02 + UX-05)
- 2026-10-02 (UX audit mobile — đợt 5: vùng chạm tối thiểu và cỡ chữ tối thiểu, UX-03 + UX-06 + UX-11)
- 2026-10-02 (UX audit mobile — đợt 6: trang Cài đặt, UX-08 + UX-14 + UX-15)
- 2026-10-02 (UX audit mobile — đợt 7: chữ/thông báo và validate hộp thoại sửa, UX-10/13/16/18/19)
- 2026-10-02 (sửa warning build: Sass `mixed-decls` ở `.upload-progress`)
- 2026-10-02 (UX audit mobile — đợt 8: thu gọn thẻ hoá đơn và sửa tên dài tràn thẻ, UX-17)
- 2026-10-05 (cấu hình deploy Vercel)
- 2026-10-05 (đổi domain `thanhdc.dev` → `thanhdc.app`)
- 2026-10-06
- 2026-10-06 (đổi query param `app` → `client` ở `login-url`)
- 2026-10-12 (thêm Claude Code hooks và skill `log-decision`)
- 2026-10-12 (thêm subagents `angular-reviewer` và `security-reviewer`)
- 2026-10-12 (tối ưu token cho agent: chia notes theo tháng, CLAUDE.md, deny list)
- 2026-10-13 (tối ưu change detection: computed thay hàm trong template, OnPush cho 7 component)
- 2026-10-13 (tối ưu tải ảnh và cache headers Vercel, nhóm 2)
- 2026-10-13 (router preloading, lazy login dialog, siết budget, nhóm 3)
