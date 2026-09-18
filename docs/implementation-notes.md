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

---

## 2026-09-18 (đợt 2)

### Decision

Xử lý nhóm UX: bảng ma trận thành viên × khoản mục trên mobile, và trạng thái rỗng
trên toàn bộ các màn hình danh sách.

1. Cột "Tên thành viên" của `member-table` bám trái (`sticky`) khi cuộn ngang.
2. Dưới 768px, `member-table` **không** cuộn ngang nữa mà đổi hẳn sang layout một card
   cho mỗi thành viên, chọn bằng `BreakpointObserver` của CDK.
3. Thêm component dùng chung `app-empty-state` và áp dụng cho `bills`, `expense-form`,
   `member-table`, `result-display`.

### Before

- `member-table.scss` đặt `min-width: 600px`; mỗi khoản mục thêm một cột ~120px chứa
  `quantity-selector`. Với 5 khoản mục + 4 cột cố định, bảng rộng ~1000px trên màn hình 375px:
  người dùng cuộn ngang thì mất luôn cột tên, không biết đang chỉnh cho ai.
- `getDisplayedColumns()` được gọi từ template và **gán lại state** (`this.displayedColumns`)
  bên trong, chạy lại mỗi chu kỳ change detection.
- Hai `subscribe()` trong constructor `member-table` không hủy.
- `expense-form.html` dùng `*ngIf="expenses$ | async as expenses"`: mảng rỗng là truthy nên
  nhánh này **không bao giờ** bắt được trạng thái rỗng — bảng hiện ra chỉ có mỗi header.
- `bills.html` không phân biệt "đang tải" với "chưa có hóa đơn nào": cả hai đều là trang trắng
  chỉ có chữ "Danh sách".
- `result-display` hiện bảng "Chi tiết chia tiền" rỗng (chỉ header + dòng "Tổng cộng" bằng 0)
  khi người dùng chưa nhập gì.

### After

- `empty-state/` (NEW): `icon` + `title` + `description` + `<ng-content>` cho nút hành động,
  có biến thể `[compact]` khi đặt trong tab/card đã có padding.
- `member-table.html` chia 3 nhánh: rỗng → `app-empty-state`; mobile → `.member-cards`;
  còn lại → bảng cũ với `<ng-container matColumnDef="name" sticky>`.
- Card mobile gồm: tên + nút xóa (header), danh sách khoản mục kèm `quantity-selector` (body),
  checkbox "Đã thanh toán" + tổng tiền (footer).
- `member-table.ts`: `displayedColumns` tính sẵn trong subscribe thay vì trong template;
  cả 3 subscribe dùng `takeUntilDestroyed()`; thêm `getParticipation()`; xóa
  `validateAndUpdateQuantity()` (dead code, không nơi nào gọi) và `expensesColumns`.
- `bills.ts`: thêm cờ `isLoading` (set trong `try/finally`), template chia 3 nhánh
  loading / empty / list; empty state có CTA "Tạo hóa đơn mới".
- `expense-form` và `result-display`: kiểm tra `.length` thay vì truthiness, có empty state
  hướng dẫn bước tiếp theo.
- Bỏ `class="mat-elevation-z8"` trên các bảng — SCSS vốn đã override shadow nên nó không có tác dụng.
- `add-member-form` thêm `mat-hint` nói rõ có thể nhập nhiều tên cách nhau bởi dấu phẩy
  (tính năng đã có trong `onSubmit()` nhưng không ai biết).

### Reason

- **Sticky + card layout** giải quyết vấn đề UX nặng nhất: thao tác chính của app là điền
  số phần cho từng người ở từng món, mà trên điện thoại thao tác đó đang phải làm mù.
- **Card thay vì chỉ sticky** ở mobile: với 5+ khoản mục, sticky chỉ giảm nhẹ chứ không xóa
  được việc cuộn ngang. Card bỏ hẳn trục ngang, đổi lại là trang dài hơn — chấp nhận được
  vì số thành viên thường nhỏ.
- **`BreakpointObserver` thay vì chỉ ẩn/hiện bằng CSS**: nếu render cả hai rồi ẩn bằng
  `display: none`, DOM sẽ có gấp đôi số `quantity-selector` và mat-table vẫn dựng cột cho
  toàn bộ khoản mục — lãng phí, và hai bản sao dễ lệch nhau khi sửa sau này.
- **`displayedColumns` tính sẵn**: gán state từ trong template là nguồn lỗi change detection
  kinh điển, và đằng nào cũng phải chạm vào hàm này khi thêm nhánh card.
- **Cờ `isLoading`**: không có nó thì empty state sẽ nhấp nháy sai mỗi lần vào trang,
  tức là empty state gây hiểu nhầm nhiều hơn là giúp ích.

### Alternatives Considered

- **Đảo trục bảng** (chọn khoản mục → tick thành viên tham gia): gọn hơn khi số khoản mục
  lớn hơn số thành viên, nhưng đổi hẳn mô hình thao tác người dùng đang quen. Để ngỏ, không làm.
- **`cdk-virtual-scroll` cho danh sách card**: chưa cần, số thành viên thực tế hiếm khi quá vài chục.
- **Chỉ làm sticky, bỏ card layout**: rẻ hơn nhưng không giải quyết được gốc vấn đề (xem trên).
- **Skeleton loader cho `bills`** thay vì spinner: đẹp hơn nhưng cần dựng thêm khung giả lập;
  spinner đủ cho danh sách ngắn, để lại cho đợt polish.

### Kiểm chứng

`npm run build:prod` pass; `npx ng serve` khởi động sạch, HTTP 200. `npm run lint` vẫn chỉ còn
2 lỗi `no-empty-function` có sẵn từ trước. **Chưa kiểm tra bằng mắt trên trình duyệt thật**
(môi trường hiện không có công cụ điều khiển trình duyệt) — phần hiển thị breakpoint 767px
và sticky column cần một lượt xem tay trước khi merge.

---

## Còn tồn đọng (cập nhật 2026-09-18, sau đợt 2)

1. **Nhóm 2 — phần chưa làm**: progress khi upload ảnh; snackbar "Hoàn tác" thay cho xóa
   khoản mục/thành viên tức thì (hiện xóa bill thì có confirm, xóa khoản mục thì không —
   không nhất quán); gộp 2 FAB chồng nhau ở `create-bill` / `bill-details`; skeleton thay
   spinner cho `bills`.
2. **Nhóm 3 — nền tảng**: chuẩn hóa token màu/spacing (còn nhiều chỗ hardcode `#f8fafc`,
   `#2c3e50`, `#1976d2`...; `bills.scss` còn tự đặt `font-family: 'Segoe UI'`); rút component
   dùng chung (form "thêm nhanh" lặp 3 lần, `.table-scroll` lặp 2 lần, form ngân hàng/Momo ở
   `payment` và `setting` gần như trùng hoàn toàn); **sau đó** mới bật dark mode thật
   (thêm toggle + inject `ThemeService`, vốn đang tồn tại nhưng chưa nơi nào dùng).
3. Lightbox ảnh tự chế trong `image-upload` nên thay bằng `MatDialog` (hiện không focus trap,
   `(keydown)` bắt mọi phím để đóng).
4. `.mat-mdc-form-field-subscript-wrapper { display: none }` ở `expense-form` và `payment`
   đang ẩn luôn chỗ hiện `mat-error` → form Thanh toán / Cài đặt không có phản hồi lỗi.
   (`member-table` đã bỏ để hiện `mat-hint`.)
5. 2 lỗi lint `no-empty-function` có sẵn ở `thousand-separator.ts:28` và
   `bill-splitter.service.ts:54` — chưa đụng vì ngoài phạm vi UI.
