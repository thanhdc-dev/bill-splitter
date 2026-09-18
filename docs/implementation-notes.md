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

---

## 2026-09-18 (đợt 3)

### Decision

Chuẩn hóa nền tảng và bật dark mode thật.

1. Thay theme **Material 2 `indigo-pink`** bằng theme **Material 3** dựng từ
   `mat.theme()` với `mat.$azure-palette`.
2. Định nghĩa lại token màu của app **dựa trên `--mat-sys-*`** thay vì hardcode.
3. Rút phần lặp thành dùng chung: class `.inline-add-form` / `.data-table-scroll` ở
   global, và component `app-bank-select` (ControlValueAccessor).
4. `ThemeService` chuyển sang 3 trạng thái **Sáng / Tối / Theo hệ thống**, có toggle
   trên thanh tiêu đề.

Các lựa chọn 1, 3, 4 đã được người dùng xác nhận trước khi triển khai.

### Before

- `angular.json` nạp `@angular/material/prebuilt-themes/indigo-pink.css` (M2, 96KB,
  **không có dark mode**). Không thể bật dark chỉ bằng CSS của app vì button, form-field,
  tab, dialog, table đều lấy màu từ theme này.
- ~95 chỗ hardcode màu trong SCSS component (`#f8fafc`, `#2c3e50`, `#3498db`, `#1976d2`,
  `#e60076`, `#dcfce7`...). `bills.scss` còn tự đặt `font-family: 'Segoe UI'`.
- `pwa-install-prompt.scss` có sẵn một block `@media (prefers-color-scheme: dark)`.
- Khối CSS "form thêm nhanh" lặp 3 lần (expense-form, member-table, payment) và
  `.table-scroll` lặp 2 lần, mỗi bản lệch nhau vài dòng.
- `payment.ts` và `setting.ts` trùng nguyên khối: `interface BankItemLabel`, mảng `banks`,
  `itemFilterCtrl`, `filteredItems`, `_filterItems()` — chỉ khác ở chỗ payment lưu
  `bank.code` còn setting lưu `bank.bin`.
- `ThemeService` tồn tại nhưng **không nơi nào inject**; không có UI bật/tắt.

### After

- `styles.scss` dùng `@use '@angular/material' as mat;` + `mat.theme((color: mat.$azure-palette, ...))`.
  Vì config truyền vào là một palette, `theme-type` mặc định là `color-scheme` nên mọi token
  được emit dưới dạng `light-dark()` — cả thư viện đổi màu chỉ bằng thuộc tính `color-scheme`.
  `html { color-scheme: light }`, `html.dark { color-scheme: dark }`.
- Token app map thẳng sang token hệ thống: `--surface-color: var(--mat-sys-surface)`,
  `--text-primary: var(--mat-sys-on-surface)`, `--border-color: var(--mat-sys-outline-variant)`,
  `--primary-color: var(--mat-sys-primary)`... nên **CSS tự viết cũng đổi theme miễn phí**.
  Chỉ 3 giá trị phải override riêng cho dark: `--success-*` (xanh lá cần sáng hơn trên nền tối),
  `--momo-color` (màu thương hiệu), và bộ `--shadow-*` (bóng phải đậm hơn khi nền tối).
- Toàn bộ hardcode màu đã thay bằng token; `'Segoe UI'` và block `prefers-color-scheme`
  trong PWA prompt đã bỏ.
- `.inline-add-form` và `.data-table-scroll` nằm ở `styles.scss`; 3 component chỉ còn giữ
  phần đặc thù (độ rộng cột, sticky, card mobile).
- `bank-select/` (NEW): ControlValueAccessor nên dùng được trực tiếp với `formControlName`,
  kể cả trong `formGroupName` lồng nhau của trang Cài đặt. `valueField` chọn `code` hay `bin`.
- `ThemeService`: `mode` signal (`light | dark | system`), `isDark` computed, `effect()` bật/tắt
  class `.dark` trên `<html>`. Thêm script đồng bộ trong `<head>` của `index.html` để áp dụng
  theme **trước khi Angular bootstrap**, tránh nháy trắng.
- Toggle đặt ở header, **ngoài nhánh `*ngIf` đăng nhập**, nên người chưa đăng nhập cũng dùng được
  (sidebar cũ chỉ hiện khi đã đăng nhập).
- README sửa lại mô tả dark mode cho khớp thực tế.

Kết quả đo: CSS bundle **98.27 kB → 17.22 kB** (transfer 8.88 kB → 3.23 kB).

### Reason

- **M3 thay vì tự viết dark override cho M2**: M2 không có dark, tự viết sẽ phải override
  ~15 nhóm class Material và vỡ mỗi lần nâng version. M3 cho dark mode đúng trên mọi component
  với chi phí gần bằng 0.
- **Token app derive từ `--mat-sys-*`**: nếu định nghĩa hai bảng màu riêng (light và dark) thì
  mỗi lần thêm màu phải nhớ thêm ở cả hai nơi. Derive thì chỉ có một nguồn sự thật.
- **`bank-select` là CVA thay vì nhận `[formControl]`**: trang Cài đặt bọc field trong
  `formGroupName="bankAccount"`; CVA cho phép giữ nguyên `formControlName` ở cả hai nơi thay vì
  phải lấy control ra bằng getter.
- **Toggle ở header, không phải sidebar**: sidebar chỉ tồn tại khi đã đăng nhập, mà đây là app
  dùng được không cần tài khoản.
- **Script chống nháy trong index.html**: theme áp dụng trong `effect()` chỉ chạy sau bootstrap,
  người chọn giao diện Tối sẽ thấy một nhịp màu trắng. Đây là giải pháp chuẩn cho vấn đề này,
  đổi lại là một đoạn logic bị lặp ở hai nơi (đã ghi chú chéo trong cả hai file).

### Alternatives Considered

- **M3 palette sinh từ chính `#3f51b5`** (chạy schematic `@angular/material:theme-color`):
  giữ đúng màu indigo hiện tại. Người dùng chọn `azure-blue` dựng sẵn cho gọn, chấp nhận màu
  chủ đạo đổi từ indigo sang xanh azure.
- **Giữ M2 + tự viết dark**: bị loại, xem Reason.
- **Rút `.inline-add-form` thành component thay vì class global**: component sẽ phải nhận
  content projection cho form field lẫn nút, phức tạp hơn mà không thêm giá trị — đây thuần
  túy là vấn đề layout.
- **Đưa hành vi `itemFilterCtrl.patchValue(label)` vào `bank-select`**: cả payment và setting
  trước đây set ô tìm kiếm bằng label của ngân hàng đã chọn, khiến mở dropdown ra thì danh sách
  đã bị lọc còn đúng 1 dòng. Đã bỏ hẳn — mở dropdown giờ thấy đủ danh sách.
- **Bỏ `::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none }`** ở `payment.scss`:
  đã bỏ luôn trong đợt này vì nó ẩn mất chỗ hiện `mat-error`. Đổi lại mỗi field cao thêm ~20px.

### Kiểm chứng

`npm run build:prod` pass. `npx ng serve` khởi động sạch, HTTP 200. `npm run lint` vẫn chỉ còn
2 lỗi `no-empty-function` có sẵn. Kiểm tra CSS output: `html.dark{color-scheme:dark}` có mặt,
49 token `light-dark()`, `--momo-color` có cả bản light và dark, script chống nháy nằm trong
`dist/browser/index.html`.

**Chưa kiểm tra bằng mắt trên trình duyệt thật.** Cần một lượt xem tay: độ tương phản ở chế độ
Tối (nhất là bảng, QR trên nền tối, logo ngân hàng nền trắng), và form Thanh toán / Cài đặt vẫn
lưu đúng sau khi đổi sang `app-bank-select`.

---

## Còn tồn đọng (cập nhật 2026-09-18, sau đợt 3)

1. **UX chưa làm**: progress khi upload ảnh; snackbar "Hoàn tác" thay cho xóa khoản mục/thành viên
   tức thì (hiện xóa bill thì có confirm, xóa khoản mục thì không — không nhất quán); gộp 2 FAB
   chồng nhau ở `create-bill` / `bill-details`; skeleton thay spinner cho `bills`.
2. Lightbox ảnh tự chế trong `image-upload` nên thay bằng `MatDialog` (hiện không focus trap,
   `(keydown)` bắt mọi phím để đóng).
3. `setting.html` có `Validators.pattern` cho số điện thoại Momo nhưng **không có `<mat-error>`**
   nào để hiện lỗi — người dùng nhập sai không biết vì sao không lưu được.
4. `styles.scss` còn dùng `@import './tailwind.css'` (Sass đã deprecate `@import`). Chưa đổi vì
   `@use` không nhận file CSS và pipeline Tailwind v4 đang phụ thuộc vào cách import này.
5. 2 lỗi lint `no-empty-function` có sẵn ở `thousand-separator.ts:28` và
   `bill-splitter.service.ts:54` — chưa đụng vì ngoài phạm vi UI.
6. Kiểm tra tương phản chế độ Tối và kiểm thử tay form Thanh toán / Cài đặt (xem Kiểm chứng đợt 3).
