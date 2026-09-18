# Implementation Notes

> Ghi chép quyết định triển khai theo quy ước tại `AGENTS.md`.
> Các ghi chép về tích hợp CDN ảnh (2026-06-11) nằm ở `docs/implementation-notes.html`.

## 2026-09-18

### Decision

Dọn nhóm "quick-win" sau đợt rà soát UI: sửa các lỗi accessibility chặn người dùng,
gỡ tài nguyên tải trùng, xoá CSS/config chết, và nối `dark:` variant của Tailwind v4
vào class `.dark` mà `ThemeService` đang set (chuẩn bị cho dark mode ở giai đoạn sau).

Phạm vi được chốt với người dùng: **giữ nhận diện giao diện hiện tại**, chỉ sửa lỗi và
chuẩn hoá — không đổi bố cục hay bảng màu trong đợt này.

### Before

- `index.html`: `viewport` có `maximum-scale=1, user-scalable=no`; `<title>` khai báo 2 lần;
  `<link rel="manifest">` 2 lần; tải font Roboto (không dùng ở đâu vì app dùng Inter);
  `apple-touch-icon` trỏ tới `images/icon-192.png` — file không tồn tại.
- `styles.scss`: `@import url(...Inter)` (chặn render) và `@import '@angular/material/prebuilt-themes/indigo-pink.css'`,
  trong khi `angular.json > styles` cũng đã nạp đúng theme đó → theme vào bundle 2 lần.
- `main.ts`: `registerLocaleData(localeVi)` gọi **sau** `bootstrapApplication`.
- `bills.html`: thẻ bill là `<div [tabindex]="index">` (positive tabindex) với `(keydown)` bắt **mọi** phím
  → nhấn Tab cũng điều hướng sang trang bill.
- `qr-popup.html`: `tabindex="0"` / `tabindex="1"` gán tay trên `<button>`, kèm `role="button"` thừa.
- `edit-field-dialog.html`: nút "Cancel" / "Save" — chuỗi tiếng Anh duy nhất còn lại trong app.
- `app.html`: menu sidebar là `<div (click)>` → không focus/kích hoạt được bằng bàn phím;
  không đóng bằng Esc; nút toggle không thông báo trạng thái.
- `app.scss`: ~40 dòng CSS không có markup tương ứng (`.header-content`, `.header-actions`,
  `.content-wrapper`, `.avatar`) cùng media query của chúng.
- `tailwind.config.ts`: khai báo `prefix: "tw-"` và `darkMode: "class"` nhưng **không được Tailwind v4 đọc**
  (không có directive `@config`) — bằng chứng là template đang dùng `flex`, `w-full` không prefix mà vẫn chạy.

### After

- `index.html`: bỏ khoá zoom; còn 1 `<title>`, 1 `<link rel="manifest">`; bỏ Roboto;
  Inter + Material Icons nạp qua `<link>` kèm `preconnect`; `apple-touch-icon` trỏ `icons/icon-192x192.png`.
- `styles.scss`: chỉ còn `@import './tailwind.css'`, kèm comment nói rõ font và theme được nạp ở đâu.
- `main.ts`: `registerLocaleData(localeVi)` chạy trước `bootstrapApplication`.
- `bills.html`: `role="button"` + `tabindex="0"` + `(keydown.enter)` / `(keydown.space)` (có `preventDefault`);
  `bills.scss` thêm `:focus-visible` outline vì thẻ nay focus được.
- `qr-popup.html`: bỏ `tabindex` và `role` gán tay, trả về thứ tự tab tự nhiên của DOM.
- `edit-field-dialog.html`: "Hủy" / "Lưu", kèm `aria-label`.
- `app.html`: menu sidebar là `<button type="button">` trong `<nav aria-label>`; `app-container` bắt
  `(keydown.escape)` để đóng; `aside` có `aria-hidden` + `inert` khi đóng; nút toggle có `aria-expanded`.
  `app.scss` reset lại style cho `<button>` để menu giữ nguyên hình dạng, thêm `:focus-visible`.
- `app.scss`: xoá CSS chết (159 → 139 dòng), đổi màu hardcode của header (`#f5f5f5`, `#ddd`)
  sang `var(--surface-color)` / `var(--border-color)`; tên người dùng có `text-overflow: ellipsis`.
- `tailwind.config.ts`: xoá. Thay bằng `@custom-variant dark (&:where(.dark, .dark *));` trong `src/tailwind.css`.

Kiểm chứng: `npm run build:prod` pass (CSS bundle 98.27 kB, không còn `@import fonts.googleapis`,
token `--primary-color` khai báo đúng 1 lần). `npm run lint` còn **2 lỗi có sẵn từ trước**
(`no-empty-function` ở `thousand-separator.ts:28` và `bill-splitter.service.ts:54`) — ngoài phạm vi đợt này.

### Reason

- **Khoá zoom** (`maximum-scale=1`) vi phạm WCAG 2.1 SC 1.4.4 và chặn hẳn người dùng thị lực kém.
- **tabindex dương** phá thứ tự tab của cả trang; `(keydown)` không lọc phím là lỗi chức năng thật
  (Tab = điều hướng ngoài ý muốn), không chỉ là vấn đề a11y.
- **Theme và font tải trùng** làm phình CSS và `@import` trong CSS chặn render — chi phí sửa gần bằng 0.
- **`registerLocaleData` sau bootstrap** là phụ thuộc ngầm mong manh: toàn bộ hiển thị tiền tệ
  (`currency:'VND':...:'vi'`) dựa vào nó, không có lý do gì để nó chạy sau.
- **`tailwind.config.ts` chết** gây hiểu nhầm nghiêm trọng: người đọc tưởng đang có `tw-` prefix
  và dark mode class-based, cả hai đều không đúng.
- **Giữ `ThemeService`** vì người dùng đã chốt sẽ triển khai dark mode thật ở giai đoạn sau;
  gỡ nó bây giờ rồi viết lại là lãng phí.

### Alternatives Considered

- **Giữ `tailwind.config.ts` và thêm `@config` vào `tailwind.css`**: sẽ bật `tw-` prefix, làm hỏng
  toàn bộ class Tailwind đang dùng trong template. Loại.
- **Bọc thẻ bill trong `<button>`** thay vì `role="button"`: không được, bên trong đã có nút copy/xoá
  → nested button là HTML không hợp lệ.
- **Dùng `cdkTrapFocus` (CDK) cho sidebar** ngay trong đợt này: đúng hướng nhưng kéo thêm phụ thuộc
  và cần kiểm thử focus restore; hoãn sang đợt refactor sidebar. `inert` đã chặn được focus rò rỉ
  vào sidebar khi đóng — phần lớn giá trị với chi phí thấp.
- **Gỡ luôn `ThemeService` + mục dark mode trong README**: bị loại vì người dùng chọn làm dark mode thật.

### Còn tồn đọng (đã thống nhất, làm ở giai đoạn sau)

1. **Nhóm 2 — UX**: sticky cột tên thành viên + chuyển `member-table` sang card layout ở mobile
   (hiện `min-width: 600px` + cột động → cuộn ngang mất ngữ cảnh); empty state / skeleton cho
   `bills` và các tab rỗng; progress khi upload ảnh; snackbar "Hoàn tác" thay cho xoá tức thì;
   gộp 2 FAB chồng nhau ở `create-bill` / `bill-details`.
2. **Nhóm 3 — nền tảng**: chuẩn hoá token màu/spacing (còn 13 chỗ hardcode màu, `bills.scss`
   còn tự đặt `font-family: 'Segoe UI'`); rút component dùng chung (form "thêm nhanh" lặp 3 lần,
   `.table-scroll` lặp 2 lần, form ngân hàng/Momo ở `payment` và `setting` gần như trùng hoàn toàn);
   **sau đó** mới bật dark mode thật (toggle + inject `ThemeService`).
3. Lightbox ảnh tự chế trong `image-upload` nên thay bằng `MatDialog` (hiện không focus trap,
   `(keydown)` bắt mọi phím để đóng).
4. `.mat-mdc-form-field-subscript-wrapper { display: none }` ở 3 nơi đang ẩn luôn chỗ hiện `mat-error`
   → form Thanh toán / Cài đặt không có phản hồi lỗi.
