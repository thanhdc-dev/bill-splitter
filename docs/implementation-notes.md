# Implementation Notes

> Ghi chép quyết định triển khai theo quy ước tại `AGENTS.md`.
> Các ghi chép về tích hợp CDN ảnh (2026-06-11) nằm ở `docs/implementation-notes.html`.

## 2026-09-22 (bo góc `mat-card` trong `app-payment` chỉ ở 2 góc dưới)

### Decision

`mat-card` trong `payment.html` nằm ngay dưới `mat-tab-group` (tab "Ngân hàng"/"Momo"). Style
global `.mat-mdc-card` (`styles.scss:179`) áp `border-radius: var(--border-radius-lg) !important`
cho cả 4 góc, khiến 2 góc trên của card cũng bo tròn dù card nằm sát dưới thanh tab — nhìn tách
rời, không liền mạch với tab header phía trên (tab header vuông). Người dùng yêu cầu: chỉ bo 2
góc dưới, giữ 2 góc trên vuông.

### Before

`payment.scss` chỉ override `display/flex-direction/gap/padding` cho `mat-card`, không đụng tới
`border-radius` — card kế thừa nguyên `border-radius` 4 góc từ `.mat-mdc-card` global.

### After

Thêm rule trong `payment.scss`:
```scss
:host ::ng-deep .mat-mdc-card {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
```
Dùng `:host ::ng-deep` + class `.mat-mdc-card` (thay vì chỉ element selector `mat-card`) để đủ
specificity ghi đè rule global cũng dùng `!important`. Đã build (`ng build`) và chụp màn hình qua
skill `run-web` xác nhận cả 2 tab (Ngân hàng/Momo) đều vuông 2 góc trên, bo 2 góc dưới.

### Reason

Card là phần nội dung của tab đang active, về mặt thị giác nên liền một khối với tab header phía
trên (cùng cấp độ container), không tách rời như một card độc lập nổi bên dưới.

### Alternatives Considered

- Bọc `mat-tab-group` + `mat-card` trong 1 container chung rồi bo góc container thay vì card —
  không chọn vì phải đổi cấu trúc HTML, trong khi chỉ cần override `border-radius` là đủ.


## 2026-09-22 (revert CTA "Lưu & chia sẻ" về FAB nổi cố định)

### Decision

Quyết định trước đó cùng ngày (mục bên dưới, commit `ed75892`) đã bỏ FAB nổi
(`mat-fab.share-button`, `position: fixed bottom-7 right-7`) để thay bằng nút gộp trong
`.top-bar` cạnh ô "Tên hóa đơn", với lý do tránh che nội dung khi cuộn trên mobile. Người dùng
yêu cầu đảo ngược: đưa lại FAB nổi cố định góc dưới-phải, vì muốn nhấn "Lưu & chia sẻ" bất cứ
lúc nào trong lúc nhập liệu dài mà không phải cuộn lên top-bar. Người dùng xác nhận rõ ràng
chấp nhận đánh đổi che nội dung góc dưới-phải khi cuộn trên mobile.

Áp dụng cho cả `create-bill.html`/`.scss` và `bill-details.html`/`.scss` để giữ 2 trang đồng bộ
cấu trúc (đã được đồng bộ ở mục bên dưới cùng ngày) — người dùng xác nhận qua AskUserQuestion.

Các lựa chọn phụ đã hỏi và chốt:
- Top-bar sau khi bỏ nút: chỉ còn ô "Tên hóa đơn" full-width (không giữ chỗ trống).
- Kiểu FAB: icon-only tròn (`mat-fab`, không dùng extended FAB có nhãn chữ).
- Chồng lấn với `.upload-progress` (cũng fixed bottom-7 right-7 khi đang upload ảnh): không xử
  lý, chấp nhận rủi ro hiếm gặp vì 2 trạng thái (đang lưu + đang upload) ít khi trùng nhau.

### Before

`.top-bar` chứa cả ô tên và `<button mat-raised-button class="btn-gold top-bar__save">` (icon +
nhãn "Lưu & chia sẻ"), không có `.buttons`/`.share-button` fixed nào trong 2 file trên.

### After

- `create-bill.html`/`bill-details.html`: xoá nút khỏi `.top-bar` (chỉ còn ô tên), thêm lại
  `<div class="buttons fixed bottom-7 right-7"><button mat-fab class="fab-gold share-button">`
  sau `<app-bank>`, không gate theo `isEditable` ở `bill-details.html` (người xem read-only vẫn
  cần copy link).
- `create-bill.scss`/`bill-details.scss`: bỏ `.top-bar__save` và phần responsive tương ứng ở
  media query 600px; thêm lại block `.buttons { z-index: 999; button { transition/hover scale };
  .share-button__syncing { animation rotate } }` giống bản gốc trước mockup.

### Reason

Ưu tiên khả năng thao tác "lưu bất cứ lúc nào" trong lúc nhập liệu dài hơn là tránh che nội dung
— người dùng đánh giá đây là trade-off chấp nhận được vì vùng che chỉ ở góc dưới-phải, thường là
khoảng trống cuối trang trên mobile, và đây là pattern phổ biến (FAB Material Design).

### Alternatives Considered

- Giữ nút trong `.top-bar` (bản mockup đã duyệt trước đó) — bị loại vì không thoả yêu cầu mới
  "lưu bất cứ lúc nào không cần cuộn lên top".
- Extended FAB có nhãn chữ ("Lưu & chia sẻ" thay vì chỉ icon) — người dùng chọn icon-only để gọn
  hơn, giống bản gốc code trước khi áp mockup.

## 2026-09-22 (đồng bộ toàn bộ layout `bill-details.html` theo `create-bill.html`)

### Decision

Người dùng phát hiện `.bill-splitter-container` có `max-width` khác nhau giữa `bill-details.scss`
(1000px) và `create-bill.scss` (1280px). Khi so sánh sâu hơn phát hiện đây không chỉ là lệch CSS
mà lệch cả CẤU TRÚC: `bill-details.html` vẫn giữ layout cũ — luôn hiện 3 tab ("Khoản mục"/
"Thành viên"/"Thanh toán") ở mọi kích thước màn hình, không có layout 2 cột responsive, và dùng
2 FAB nổi cố định (share-button + auto-save-button) thay vì 1 nút gộp trên top-bar như
`create-bill.html` đã áp dụng ở các lượt sửa mockup trước. Đã hỏi và người dùng xác nhận: đồng
bộ TOÀN BỘ cấu trúc, không chỉ dừng ở style.

### After

- `bill-details.ts`: thêm `BreakpointObserver` + `MOBILE_BREAKPOINT` (`'(max-width: 767px)'`,
  giống hệt `create-bill.ts`/`member-table.ts`) + field `isMobile`; đổi `@ViewChild('tabGroup')
  tabGroup!: MatTabGroup` thành optional (`tabGroup?`) và guard `if (this.tabGroup)` trong
  `ngAfterViewInit` (tabGroup không tồn tại ở layout 2 cột desktop hoặc khi `isEditable=false`).
- `bill-details.html`: viết lại theo đúng cấu trúc `create-bill.html` — `top-bar` (tên hoá đơn +
  1 nút "Lưu & chia sẻ" duy nhất, gộp save+share); `@if(isMobile)` → tab 2 mục (Khoản mục/Thành
  viên), `@else` → `.two-col-layout` 2 cột song song; "Thanh toán" luôn hiện sẵn (`#payment-
  section`), không còn là tab thứ 3; thêm `.tear-line` trước `result-display`/`bank` (class dùng
  chung, đã có sẵn ở `styles.scss`). Giữ lại phần bill-details ĐẶC THÙ mà create-bill không có:
  `@if(isEditable)` bọc quanh tên input (nếu không editable thì hiện text tĩnh) và quanh toàn bộ
  form khoản mục/thành viên/thanh toán (ẩn hết khi xem hoá đơn không phải của mình); nút "Lưu &
  chia sẻ" KHÔNG gate theo `isEditable` (người xem read-only vẫn cần copy được link).
- `bill-details.scss`: viết lại theo đúng `create-bill.scss` (top-bar, `.mat-tab-label`,
  `.mat-mdc-tab-header`, `.two-col-layout`, keyframe `rotate`, media query 600px, `.upload-
  progress`), bỏ hẳn block `.buttons`/`.share-button__syncing` cũ (không còn FAB nổi).
- `bill-details.html`: `uploadProgress` đổi vị trí từ `bottom-[170px]` (từng phải né 2 FAB nổi)
  về `bottom-7` như `create-bill.html`, vì FAB không còn.

### Không đổi (đã kiểm tra, an toàn)

- `bank.ts:96` `billTabControlService.changeTab(2)` (nút settings trên `<app-bank>`) — index 2
  giờ không còn tồn tại ở CẢ 2 trang (create-bill lẫn bill-details) vì tab "Thanh toán" đã bị bỏ
  từ trước ở create-bill; `if (this.tabGroup)` khiến lệnh này là no-op an toàn (chỉ còn tác dụng
  `window.scrollTo` về đầu trang) — đúng hành vi đã được chấp nhận từ trước ở create-bill, không
  phải lỗi mới phát sinh.
- `billAutoSaveService`/`counter$` (đếm ngược tự động lưu) — không phụ thuộc UI button đã xoá,
  vẫn gọi `this.save()` trực tiếp qua subscription, không bị ảnh hưởng.
- Bỏ hẳn chỉ báo trực quan "đã lưu/chưa lưu" (icon `cloud_upload`/`cloud_done` trên FAB auto-save
  cũ) — hệ quả tất yếu của việc gộp còn 1 nút theo đúng pattern `create-bill` (nơi cũng không có
  chỉ báo này); không thêm lại vì mục tiêu là khớp `create-bill` 100%, không phải giữ tính năng
  cũ bằng mọi giá.

### Verify

- `tsc --noEmit` sạch.
- `run-web`: bill hợp lệ + không có `userId` (mặc định `isEditable=true`) → desktop hiện đúng 2
  cột + thanh toán luôn hiện + top-bar 1 nút; mobile (390px) hiện đúng 2 tab icon-only, chuyển
  tab mượt (frame chồng hình chỉ là animation giữa chừng, đã xác nhận bằng cách chờ 1000ms).
  Bill có `userId` khác user hiện tại (mô phỏng xem hoá đơn người khác) → tên hiện text tĩnh,
  form khoản mục/thành viên/thanh toán bị ẩn hoàn toàn, nhưng `result-display` và `bank` (QR +
  thông tin ngân hàng) vẫn hiện, nút "Lưu & chia sẻ" vẫn bấm được.

## 2026-09-22 (khoảng cách giữa input + giữa form và nút Lưu ở `/setting` và payment form)

### Decision

Người dùng phản hồi: các input trong form "Thông Tin Thanh Toán" (`setting.html`) bị sát nhau,
thiếu khoảng cách trên/dưới; sau đó tiếp tục phản hồi nút "Lưu" cũng sát ngay dưới form.

Nguyên nhân khoảng cách input: `setting.html` dùng lẫn lộn 2 cách tạo khoảng cách — class
`mt-4` (margin-top Tailwind, 16px) gắn rải rác trên MỘT SỐ field, và `gap: 4px` khai trên
`mat-card` (thêm ở lượt sửa trước, quá nhỏ). Do đặt trong flexbox (`display:flex`), `gap` cộng
dồn với `margin-top` của field thay vì bị collapse, nhưng vì chỉ 1 vài field có `mt-4` (field
đầu và field 2 ở tab Ngân hàng có, field 3 và 2 field cuối tab Momo không có) nên khoảng cách
không đều — chỗ 20px (16+4), chỗ chỉ 4px.

### After

- `setting.scss` — `mat-card { gap: 16px; padding: 20px; }` (tăng từ 4px, thêm padding vì field
  là con trực tiếp của `mat-card`, không qua `mat-card-content` nên không có padding sẵn); thêm
  `.button-group { margin-top: 24px; }`.
- `setting.html` — bỏ hết class `mt-4` rải rác trên từng field, để `gap` của `mat-card` là nguồn
  khoảng cách DUY NHẤT giữa các field (nhất quán với `.expense-card`/`.member-panel`, cũng dùng
  gap 16px).
- `payment.scss`/`payment.html` — áp dụng đúng pattern tương tự (thêm `mat-card { display:flex;
  flex-direction:column; gap:16px; padding:20px; }`, bỏ `mt-4` trên các field) để đồng bộ 2 form
  giống hệt nhau như đã sửa border/shadow ở mục trước.

### Verify

- `tsc --noEmit` sạch.
- Chụp `run-web` cả 2 trang (`/` payment-section và `/setting`): khoảng cách giữa 3 field đều
  16px, đồng nhất giữa 2 trang; nút "Lưu" ở `/setting` đã có khoảng cách rõ với form phía trên.

## 2026-09-22 (sửa gốc rễ: `.mat-mdc-card` mất viền vì thiếu `!important`)

### Decision

Người dùng phản hồi kèm ảnh chụp: form "Thông Tin Thanh Toán" ở `/setting` vẫn chưa đồng bộ với
giao diện tương ứng ở trang tạo hoá đơn (`create-bill`), dù đã sửa ở lượt audit trước. Thay vì
đoán qua đọc code, đo trực tiếp bằng `getComputedStyle` qua `run-web` cho `mat-card` ở cả 2
trang:

- `#payment-section .mat-mdc-card` (create-bill, **không có** override cục bộ nào): `border-
  width: 0px` — card KHÔNG có viền thật, dù `styles.scss:179-185` khai `.mat-mdc-card { border:
  1px solid var(--border-color); ... }` cho MỌI mat-card.
- `.settings-container mat-card` (setting, **có** override cục bộ tôi thêm ở lượt sửa trước):
  `border-width: 1px` — có viền.

Nguyên nhân: rule toàn cục ở `styles.scss:182` (cũ) khai `border: 1px solid var(--border-color)`
KHÔNG có `!important`, trong khi `border-radius`/`box-shadow`/`background-color` cùng khối đều có
— hàng loạt CSS được `@include mat.theme(...)` sinh ra ở đầu file (Material 3 theming API mới,
tự sinh style cho mọi component đang dùng) có selector cụ thể hơn `.mat-mdc-card` đơn, nên thắng
riêng phần `border` (không `!important`) trong khi 3 thuộc tính còn lại (có `!important`) vẫn áp
dụng bình thường. Card nào có thêm 1 override cục bộ (selector cụ thể hơn nhờ attribute do
Angular view encapsulation sinh ra, như `mat-card` tôi thêm ở `setting.scss` lượt trước) mới đủ
đặc hiệu để thắng — nên chỉ những trang tôi từng "vá" cục bộ mới có viền, còn lại (create-bill,
payment, và có thể còn nơi khác) đều mất viền mà không ai để ý vì box-shadow/bo góc/nền vẫn đúng,
nhìn qua vẫn giống "card" nhưng thiếu viền mảnh đặc trưng của theme.

### After

- `styles.scss:182` — thêm `!important` vào `border: 1px solid var(--border-color)` của
  `.mat-mdc-card` (rule gốc, áp dụng cho MỌI card trong app, không cần vá từng nơi nữa).
- `setting.scss` — bỏ override `border`/`box-shadow`/`background-color` cục bộ trong khối
  `mat-card {...}` (thêm ở lượt audit trước) vì giờ đã dư thừa, global rule tự lo được; chỉ giữ
  lại phần layout (`display: flex; flex-direction: column; gap: 4px;`).
- `bill-details.scss` — GIỮ NGUYÊN override `.mat-mdc-card { border: none; ... }` (không xoá):
  đây không phải bản sao dư thừa của global rule mà là chủ đích tắt hẳn viền cho card NGOÀI
  CÙNG của trang, y hệt cách `create-bill.scss:10-14` xử lý card ngoài cùng tương ứng của nó
  (2 trang cùng vai trò tương đương).

### Verify

- Đo lại `getComputedStyle` sau khi sửa: cả `#payment-section .mat-mdc-card` (create-bill) và
  `.settings-container mat-card` (setting) đều trả về `borderWidth: 1px`, `borderColor: rgba(28,
  27, 26, 0.16)` — giống hệt nhau.
- Chụp ảnh `run-web` 2 trang cạnh nhau: hình dạng viền/bo góc/shadow khớp nhau hoàn toàn.
- `tsc --noEmit` sạch.

## 2026-09-22 (audit toàn app + sửa các điểm chưa đồng bộ với theme "biên nhận")

### Decision

Chạy 1 agent audit toàn bộ `src/app/components/**` để tìm chỗ lệch chuẩn design system mới
(class `.flat-field`, nền `--surface-color`/`--surface-muted`, bo góc button, màu CSS variable,
border/shadow của card, `<app-empty-state>`, màu tab active, `mat-error` đối xứng). Sau khi tự
đọc code + verify bằng `run-web`, xác nhận sửa 8 điểm và loại 3 điểm agent báo là false
positive (không sửa, kèm lý do).

### After (đã sửa)

- `bill-details.html:5` — thêm `flat-field`/`floatLabel="always"`/`subscriptSizing="dynamic"`
  cho input tên hoá đơn (trước đó chỉ `appearance="outline"` trơn, khác `create-bill.html`).
- `edit-field-dialog.html:4` — thêm `flat-field`/`subscriptSizing="dynamic"` (bỏ
  `floatLabel="always"` vì field này không có `mat-label`, floating label không có tác dụng).
- `bill-details.scss` — thêm `border: none; box-shadow: var(--shadow-sm) !important;
  background-color: var(--surface-color);` cho `.mat-mdc-card`, sao chép đúng pattern đã dùng ở
  `create-bill.scss:10-14` (2 trang tương đương về vai trò: tạo hoá đơn mới vs xem/sửa hoá đơn
  đã lưu).
- `setting.scss` — thêm border/shadow/background tương tự cho `mat-card` (trước đó không có
  wrapper nào khác cấp cho border như `payment.html` có `.inline-add-form`, nên tự nó phải có).
- `qr-popup.scss` — thêm `border: none; box-shadow: none !important;` cho `.qr-popup-card`.
  Lý do: đây là nội dung bên trong `MatDialog`, mà `.mat-mdc-dialog-surface` (global,
  `styles.scss:244-249`) đã tự có border + shadow-md riêng; giữ nguyên sẽ thành viền/bóng đúp
  (dialog surface + mat-card lồng bên trong).
- `expense-form.scss` (`.expense-add-row__submit`) và `member-table.scss`
  (`.member-panel__submit`) — đổi `color: #fff !important` → `color: var(--on-primary-color)
  !important` (biến đã có sẵn tại `styles.scss:99`, tránh hardcode).
- `member-table.scss` — xoá luôn block `&__hint` (CSS chết, không còn phần tử nào dùng sau khi
  đã gộp hint vào placeholder ở lần sửa trước cùng ngày).
- `member-table.html` — thêm `<mat-error>` cho `formControlName="name"` khi lỗi `required`
  (trước đó `expense-form.html` — form "thêm nhanh" cùng cấu trúc — đã có, còn member-table thì
  không, bất đối xứng).

### Không sửa (agent báo nhưng xác nhận là false positive)

- **`bank.scss:64` `.copy-btn { border-radius: 50% }`**: agent cho là lệch chuẩn "bo nhẹ", nhưng
  quy tắc "bo nhẹ" (`border-radius-lg`) chỉ áp cho `.mat-mdc-fab`/`.mat-mdc-mini-fab` (nút CTA
  nổi bật, `styles.scss:198-202`) — không áp cho icon-button nhỏ. Toàn app không override
  `mat-icon-button` mặc định (vẫn tròn), nên `.copy-btn` tròn là NHẤT QUÁN với các icon-button
  khác, không phải lệch chuẩn.
- **`payment.html` nền chồng nền**: agent nghi ngờ `.inline-add-form` (viền, không còn nền mờ
  sau lần sửa trước) bọc `mat-card` con có thể chồng viền/nền. Kiểm tra lại: `mat-card` con
  không tự có border/shadow riêng (không override), nên chỉ có đúng 1 lớp viền từ
  `.inline-add-form` — không phải lỗi. Đã verify lại bằng ảnh chụp `run-web` (không thấy viền
  đúp).
- **`create-bill.html`/`bill-details.html` mat-tab-group "thiếu override màu active/inactive"**:
  agent chỉ đọc code, không chạy app, nên kết luận sai. Thực tế `--mat-sys-primary` được override
  toàn cục thành teal (`styles.scss:40,49`) nên MỌI `mat-tab-group` trong app (kể cả không có
  `::ng-deep` riêng) đã tự động có label/underline active màu teal — verify bằng ảnh chụp
  `run-web` ở `/` (mobile 390px): tab "Khoản mục" active hiện đúng màu teal dù component không
  override gì thêm. `payment.scss`/`setting.scss` có override riêng vì lý do KHÁC: tab Momo cần
  màu hồng riêng khi active (`--momo-color`), không phải vì thiếu màu teal mặc định.
- **`member-table.html:41` `<p class="member-card__hint">Chưa có khoản mục nào để chia.</p>`
  không dùng `<app-empty-state>`**: xem lại ngữ cảnh — đây là dòng hint nhỏ lồng trong từng
  `.member-card` (mobile, có thể lặp lại nhiều lần nếu nhiều thành viên), không phải empty-state
  cấp trang. Dùng `<app-empty-state>` (icon tròn lớn + tiêu đề + mô tả) ở đây sẽ lặp lại nhiều
  lần trên màn hình, thừa thãi và nặng nề hơn — giữ nguyên đoạn text ngắn là lựa chọn đúng, không
  sửa.

### Verify

- `tsc --noEmit` sạch sau tất cả thay đổi.
- `run-web`: chụp lại `/setting` (card có viền), `/` mobile 390px (tab màu teal đúng, lỗi
  required "Vui lòng nhập tên thành viên" hiện đúng khi bỏ trống).
- Không verify trực tiếp được `bill-details.scss`/`qr-popup.scss` qua `run-web` (cần mock API
  lấy chi tiết hoá đơn theo `:code` phức tạp hơn) — 2 thay đổi này sao chép đúng pattern đã verify
  ở `create-bill.scss`/`.mat-mdc-dialog-surface` nên rủi ro thấp, nhưng nên xem lại bằng mắt khi
  có dữ liệu thật.

## 2026-09-22 (cải thiện UI/UX form "Thông tin ngân hàng" — Setting/Payment)

### Decision

Sau khi phân tích ảnh chụp form "Thông Tin Thanh Toán" (tab Ngân hàng trong `app-setting`,
cũng dùng chung `app-bank-select` với `app-payment`), đã xác nhận với người dùng 2 điểm chưa
rõ trong đặc tả rồi triển khai:

- `accountNumber` (tab Ngân hàng, `setting.ts`): chỉ thêm `Validators.required`, KHÔNG giới
  hạn định dạng/độ dài (khác với đề xuất ban đầu là ràng buộc pattern số 6-19 ký tự) — người
  dùng chọn phương án lỏng hơn để tránh chặn nhầm số tài khoản hợp lệ ở ngân hàng ít gặp.
- `bankBin`, `accountName`, `accountNumber` (tab Ngân hàng): cả 3 đều required — người dùng
  xác nhận chọn phương án "Recommended".

Ngoài ra, tự quyết định (không đổi business logic nên không cần hỏi thêm):
- Đồng bộ `appearance="outline"` cho `app-bank-select` (trước đó dùng mặc định `fill`, lệch
  với 2 input `outline` cạnh nó) — áp dụng chung cho cả `setting.html` và `payment.html` vì
  cả hai cùng dùng chung component.
- Thêm `mat-select-trigger` hiển thị logo + tên ngân hàng đã chọn ở trạng thái đóng dropdown
  (trước đó chỉ options mở ra mới có logo, chọn xong không có phản hồi trực quan).
- Thêm `@Input() required` cho `BankSelectComponent` để hiển thị `mat-error` riêng khi chưa
  chọn ngân hàng, chỉ bật ở `setting.html` (không bật ở `payment.html` vì form đó cho phép để
  trống ngân hàng khi tạo hoá đơn, không muốn đổi hành vi ngoài phạm vi yêu cầu).

### Before

- `bank-select.html`: `<mat-form-field class="bank-select">` (appearance mặc định `fill`),
  không có `mat-select-trigger`, không có input `required`.
- `setting.ts`: `bankBin`, `accountName`, `accountNumber` không có validator nào.

### After

- `bank-select.ts`: thêm `@Input() required`, thêm `selectedValue` signal + `selectedBank`
  computed để render trigger.
- `bank-select.html`: `appearance="outline"`, thêm khối `<mat-select-trigger>` hiển thị
  logo+tên khi đã chọn, thêm `<mat-error>` khi `required=true` và control invalid.
- `setting.ts`: `bankBin`/`accountName`/`accountNumber` đều `[Validators.required]`.
- `setting.html`: truyền `[required]="true"` cho `app-bank-select`, thêm `mat-error` cho
  `accountName`/`accountNumber`.
- `setting.scss`: thêm `gap` giữa các field trong `mat-card` để nhóm trực quan rõ hơn, style
  nhỏ cho `.select-bank` trigger.
- Đã build (`tsc --noEmit`) không lỗi và verify bằng `run-web` (chọn ngân hàng → trigger hiện
  logo/tên; bấm Lưu khi trống → hiện đúng 2 mat-error + hint tổng).

### Reason

Ảnh chụp gốc cho thấy 3 field trong cùng 1 form nhưng có 2 kiểu form-field khác nhau (fill vs
outline), không có phản hồi trực quan sau khi chọn ngân hàng, và không có validation nào cho
tab Ngân hàng dù tab Momo đã có — gây thiếu nhất quán trải nghiệm và không rõ trường bắt buộc.

### Alternatives Considered

- Ràng buộc `accountNumber` bằng pattern số + độ dài 6-19 ký tự: người dùng từ chối vì lo chặn
  nhầm định dạng hợp lệ ở ngân hàng ít phổ biến.
- Để 3 field vẫn optional, chỉ sửa phần giao diện (appearance, spacing, trigger): người dùng
  chọn phương án required thay vì phương án này.
- Bật `required` cho `bankBin` luôn ở `payment.html`: không chọn, vì sẽ đổi hành vi cho phép bỏ
  trống ngân hàng khi tạo hoá đơn — ngoài phạm vi được xác nhận.

### Bổ sung cùng ngày — đồng bộ màu viền `.flat-field` với theme "biên nhận"

Sau khi xem lại, các field vừa sửa (`bank-select`, `account-name`, `account-number`, cả 2 tab
Ngân hàng/Momo ở cả `setting.html` và `payment.html`) vẫn dùng viền/label mặc định của
Material outline — khác màu/kiểu với `.flat-field` đã dùng ở top-bar (`create-bill.html`),
`member-table.html`, `expense-form.html` (viền `--border-color`, label tĩnh phía trên, focus
màu teal, định nghĩa tại `styles.scss:497-533`). Đã thêm class `flat-field` +
`floatLabel="always"` + `subscriptSizing="dynamic"` cho toàn bộ field còn lại ở 2 file trên để
nhất quán với phần còn lại của app — không phải quyết định kiến trúc mới, chỉ là áp dụng đúng
class dùng chung đã có sẵn. Verify lại bằng `run-web`: màu viền, vị trí label khớp; phát hiện
1 frame chồng hình giữa lúc chuyển tab Ngân hàng/Momo khi sleep 300ms — xác nhận chỉ là hiệu ứng
animation của `mat-tab-group` chưa kết thúc (không phải lỗi layout), chụp lại sau 1000ms cho
thấy giao diện ổn định bình thường.

### Bổ sung cùng ngày — bỏ `background-color` của `.inline-add-form`

Theo phản hồi trực tiếp của người dùng khi xem lại `bank-select.html`: bỏ
`background-color: var(--surface-muted)` khỏi `.inline-add-form` (`styles.scss:432`). Trước
khi sửa đã kiểm tra: `expense-form.html`/`member-table.html` — 2 nơi comment còn nhắc tới class
này — thực ra đã đổi sang class riêng (`expense-add-row`, `member-panel__add`) từ đợt áp mockup
trước, không còn dùng `.inline-add-form` trực tiếp; chỉ `payment.html` còn dùng class này. Vì
`payment.html` tự bọc nội dung trong `mat-card` (nền `--surface-color`), nền mờ của
`.inline-add-form` tạo hiệu ứng "nền chồng nền" (khối be mờ bao ngoài card trắng) — đúng vấn đề
đã nêu trong lần phân tích UI/UX ban đầu. Xác nhận an toàn (không phá layout `expense-form`/
`member-table`) bằng cách grep toàn bộ usage trước khi sửa, và verify lại bằng ảnh chụp
`run-web` ở `/` (trang tạo hoá đơn) — nền be mờ đã biến mất, chỉ còn 1 lớp nền trắng.

### Bổ sung cùng ngày — gộp `.member-panel__hint` vào placeholder

Theo yêu cầu người dùng: chuyển nội dung `<p class="member-panel__hint">Nhập nhiều tên cùng
lúc bằng cách ngăn cách bởi dấu phẩy</p>` (`member-table.html`) thành `placeholder` của input
"Tên thành viên", rồi xoá thẻ `<p>` đó. Mục đích: cột "Khoản mục" (`expense-form.html`, không
có dòng hint tương tự) và cột "Thành viên" lệch chiều cao ở empty state vì dòng hint chiếm thêm
~20px. Không có CSS riêng cho `.member-panel__hint` trong `member-table.scss` nên không phải
dọn thêm gì. Verify bằng ảnh chụp `run-web` ở trang tạo hoá đơn (`/`): 2 card "Khoản mục" và
"Thành viên" đã cân chiều cao ở trạng thái rỗng.

### Bổ sung cùng ngày — rút gọn placeholder input "Tên thành viên"

Placeholder "Nhập nhiều tên cùng lúc bằng cách ngăn cách bởi dấu phẩy" quá dài, bị cắt chữ
trong input (thấy rõ ở ảnh chụp `run-web` trước đó: chỉ hiện "...ngăn cách b"). Đã đưa 4 lựa
chọn cho người dùng (ví dụ cụ thể / diễn giải ngắn / diễn giải sát nghĩa gốc / bỏ hẳn), người
dùng chọn dùng ví dụ cụ thể. Đổi thành `placeholder="VD: Tèo, Tý, Tủn"` tại `member-table.html`
— ngắn, không bị cắt, và ví dụ cụ thể giúp hiểu ngay quy ước dùng dấu phẩy mà không cần đọc câu
giải thích dài.

## 2026-09-22 (tiếp — sửa lỗi phát sinh sau khi áp mockup)

### Decision

Sau khi áp 10 điểm khác biệt so với mockup (mục trước), rà lại bằng ảnh chụp thực tế qua
`run-web` phát hiện thêm 5 lỗi/điểm chưa cân đối, đã sửa từng cái theo phản hồi trực tiếp
của người dùng trên ảnh chụp UI thật (không phải theo mockup tĩnh nữa).

### Before

- **Top-bar (CreateBill)**: input "Tên hóa đơn" và nút "Lưu & chia sẻ" lệch hàng —
  `align-items: flex-end` cộng `margin-bottom: 1.34375em` (số phỏng đoán theo baseline
  outline-field mặc định) không khớp với field đã bị `.flat-field` override; không có
  khoảng cách với card "Khoản mục/Thành viên" bên dưới.
- **Expense-add-row / member-panel__add**: input và nút "+" lệch hàng tương tự; khi bo góc
  qua `--mdc-outlined-text-field-container-shape` chưa được set, `.mat-mdc-text-field-wrapper`
  border-radius không có tác dụng thật (viền vẽ bằng SVG notched-outline riêng); khi mat-error
  xuất hiện (validate lỗi), field cao thêm khiến nút "+" (`align-items:center`, không có
  `subscriptSizing="dynamic"`) trôi lệch theo — thử `margin-top:20px` (đoán, chưa đo) vẫn sai vì
  không dựa trên `getBoundingClientRect()` thực tế.
- **member-panel__submit**: `<form>` mang cả 2 class `inline-add-form member-panel__add` —
  selector global `.inline-add-form > button { padding: 0 24px !important }` (dành cho nút
  raised-button "Thêm thành viên" cũ, dài) vô tình áp lên cả nút `mat-mini-fab` 42px mới, ép
  content-box về 0 → icon "+" biến mất hoàn toàn dù `color`/`opacity` computed đều hợp lệ.
- **member-avatar**: còn sót ở `.member-cards` (card mobile) và `td.mat-column-name` (bảng
  desktop) sau khi đã quyết định bỏ avatar khỏi card tổng kết (`result-display`) — không nhất
  quán giữa các nơi hiển thị tên thành viên.
- **two-col-layout**: `grid-template-columns: 1.25fr 1fr` (không `minmax(0, …)`) → track bị ép
  giãn theo min-content của bảng con (`.data-table-scroll table { min-width: 600px }`), đẩy
  card "Thành viên" tràn ra ngoài `.bill-splitter-container` (max-width 1000px) khi có ≥2 cột
  khoản mục động.
- **member-table-scroll**: cột `isPaid`/`actions` không có `width` nhất quán — `actions` khai
  `width: 48px` nhưng vô tác dụng (bảng `table-layout: auto`, kích thước thật = content 40px +
  padding cell 12px 16px = 72px); cột khoản mục dùng chung padding `12px 16px` với cột text dù
  chỉ chứa `app-quantity-selector`; `.quantity-input` rộng 60px dù chỉ cần hiển thị số 0-99
  (bước 0.5).

### After

- **Top-bar**: `align-items: center` (bỏ `flex-end` + margin hack); thêm
  `subscriptSizing="dynamic"` cho field tên hoá đơn để field không còn dư khoảng trắng subscript
  khi trống; `.top-bar { margin-bottom: 22px }` tạo khoảng cách với nội dung bên dưới (khớp gap
  22px của mockup CreateBill).
- **`.flat-field`** (`styles.scss`, dùng chung cho 3 field): thêm
  `--mdc-outlined-text-field-container-shape: var(--border-radius-sm)` để bo góc là biến điều
  khiển đúng của SVG notched-outline (không phải border-radius trên wrapper); yêu cầu luôn đi
  kèm `subscriptSizing="dynamic"` trên mọi field dùng class này.
- **expense-add-row__submit**: `align-items: flex-start` (không phải `center`) +
  `margin-top: 3px` — con số lấy từ đo thật bằng `getBoundingClientRect()` (khung input 48px,
  nút 42px → lệch 6px, chia đôi = 3px), không còn trôi theo độ dài mat-error.
- **member-table Tên thành viên**: dòng `<mat-hint>` cố định (luôn hiện, không phải lỗi) được
  tách ra khỏi `mat-form-field` thành `<p class="member-panel__hint">` riêng bên dưới cả hàng
  input+nút — lý do tương tự (hint cũng làm field cao hơn nút, dù `subscriptSizing="dynamic"`).
- **member-panel__add**: bỏ hẳn class `.inline-add-form` khỏi `<form>` này, tự khai lại
  `display:flex; align-items:center; gap:8px` + `.mat-mdc-form-field{flex:1;min-width:0}` ngay
  trong `member-panel__add` — không còn phụ thuộc/dính selector `> button` của class global.
- **member-avatar**: gỡ khỏi `.member-cards` (mobile) và `td.mat-column-name` (bảng desktop);
  xoá luôn định nghĩa `.member-avatar` (global, `styles.scss`) vì không còn nơi nào dùng.
- **two-col-layout**: `grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr)` +
  `min-width: 0` trên `.expense-form`/`.member-table` — track không còn bị ép giãn theo
  min-content của bảng con; `.data-table-scroll` tự cuộn ngang bên trong card đúng như thiết
  kế. Đồng thời tăng `.bill-splitter-container { max-width: 1280px }` (từ 1000px, khớp canvas
  gốc của mockup CreateBill) để card "Thành viên" có thêm chỗ trước khi phải cuộn.
- **member-table-scroll**: thêm class `qty-cell` cho th/td cột khoản mục động
  (`padding: 12px 8px; text-align:center`, hẹp hơn cột text mặc định); gộp
  `.mat-column-isPaid`/`.mat-column-actions` cùng `width: 64px; padding: 12px 8px;
  text-align:center` để 2 cột control nhỏ đối xứng nhau (thay vì 74.8px/72px lệch); giảm
  `.quantity-input { width: 35px }` (từ 60px).

### Reason

Mọi con số/quyết định ở đây đều xuất phát từ **đo thực tế bằng
`getBoundingClientRect()`/`getComputedStyle()`** qua driver Playwright của skill `run-web`
(không suy đoán bằng mắt) sau khi người dùng chỉ ra lệch hàng/tràn layout cụ thể trên ảnh chụp
— vì các lần sửa "đoán số" trước đó (margin-top 20px, margin-bottom 1.34375em) đều sai và phải
sửa lại lần 2. `.inline-add-form > button` là bài học về việc **class dùng chung không nên gán
bừa cho phần tử có vai trò khác** (mini-fab 42px khác hẳn raised-button 56px mà rule đó nhắm
tới) — CSS global scope càng rộng, càng dễ vô tình áp lên phần tử không định nhắm tới.

### Alternatives Considered

- **two-col-layout tràn**: cân nhắc bỏ `max-width` của `.bill-splitter-container` thay vì
  `minmax(0, …)`. Không chọn vì không sửa nguyên nhân gốc (track vẫn bị ép theo min-content),
  chỉ đẩy vấn đề thành tràn *toàn trang* thay vì tràn cục bộ, và làm mất giới hạn độ rộng có
  chủ đích trên màn hình lớn.
- **member-panel__submit mất icon**: cân nhắc thêm `!important` đè lại `padding` thay vì bỏ
  class `.inline-add-form`. Không chọn vì vá triệu chứng, không giải quyết việc form này đang
  mang nhầm 1 class thiết kế cho nút khác hẳn — dễ tái phát nếu sau này còn override nào khác
  từ `.inline-add-form` áp nhầm vào.

## 2026-09-22

### Decision

So sánh UI hiện tại với mockup "biên nhận" đã duyệt trước đó (artifact
`claude.ai/artifact/UZsnGSYT43hWR5R1P3xUi4`, 3 artboard: `Bills`, `CreateBill`, `Result`)
và triển khai 10 điểm khác biệt đã liệt kê với người dùng. Trước khi làm, 2 điểm mockup
không nói rõ đã được hỏi và người dùng chốt:

- **Avatar-stub ở card "Mỗi người cần trả"** (`result-display`): mockup không có, bản cũ có
  thêm (vòng tròn chữ cái đầu 36px bên trái) → người dùng chọn **bỏ đi**, làm phẳng đúng
  mockup thay vì giữ chi tiết thừa.
- **Đổi Angular Material icon font sang SVG line-icon tuỳ chỉnh** (mockup vẽ tay, hiện tại
  dùng `mat-icon` ligature): người dùng chọn **giữ nguyên Material icon** — việc đổi toàn bộ
  icon rủi ro/effort không tương xứng lợi ích thẩm mỹ.

### Before

- **Bills** (`bills.html/.scss`): tiêu đề "Danh sách" 28px/600 căn giữa, không phụ đề; số tiền
  14px; nút xoá `mat-icon-button color="warn"` (đỏ); gap danh sách 12px.
- **CreateBill** (`create-bill.html/.scss`): nút "Lưu & chia sẻ" là `mat-fab` nổi cố định
  `fixed bottom-7 right-7`; ô tên hoá đơn/khoản mục/thành viên dùng
  `mat-form-field appearance="outline"` mặc định (label nổi trong notch viền); card
  "Khoản mục" bo `--border-radius-md` (12px)/padding 20px/gap 14px; cột "Thành viên"
  (`member-table`) không có card bao ngoài hay tiêu đề riêng — chỉ có `.inline-add-form` +
  `.data-table-scroll` rời rạc, không đối xứng với "Khoản mục"; bảng thành viên không có
  avatar; nút thêm khoản mục/thành viên là `mat-mini-fab` tròn.
- **Result** (`result-display.html/.scss`): card "Khoản mục" giới hạn `max-height:480px` cuộn
  dọc + header/footer sticky; card "Mỗi người cần trả" có `member-amount__stub` (avatar chữ
  cái đầu) bên trái mỗi dòng.

### After

- **Bills**: tiêu đề "Hoá đơn của bạn" 22px/800 căn trái + phụ đề "N hoá đơn đã lưu · chạm để
  mở lại"; số tiền 17px/700; nút xoá dùng class `.delete-btn` dùng chung (global, `styles.scss`)
  màu trung tính `--text-secondary`, đổi đậm hơn khi hover, không còn đỏ; gap danh sách 14px.
- **CreateBill**: nút lưu chuyển thành `mat-raised-button.btn-gold` nằm trong `.top-bar` cạnh ô
  tên hoá đơn (không còn FAB nổi); 3 ô nhập chính (tên hoá đơn, thêm khoản mục, thêm thành
  viên) dùng `floatLabel="always"` + class `.flat-field` (global) để label tĩnh phía trên, viền
  mảnh, bớt "chrome" Material — vẫn giữ nguyên `mat-form-field`/`FormControl`/`mat-error` nên
  không mất validation. Card "Khoản mục" bo `--border-radius-lg` (16px)/padding 22px/gap 16px;
  thêm `.member-panel` (mới, trong `member-table.scss`) làm card bao cột "Thành viên" đối xứng
  với "Khoản mục" (tiêu đề + icon `groups`, cùng bo góc/padding); bảng thành viên có thêm
  `.member-avatar` (vòng tròn chữ cái đầu, dùng chung ở cả bảng desktop và card mobile); nút
  thêm khoản mục/thành viên đổi từ tròn sang vuông bo 8px (`--border-radius-sm`) 42×42.
- **Result**: bỏ `max-height`/sticky của card "Khoản mục" — hiện đầy đủ không cuộn, bo góc
  tăng lên `--border-radius-lg`; bỏ `member-amount__stub` — card "Mỗi người cần trả" phẳng như
  mockup (chỉ tên + số tiền + icon trạng thái).

### Reason

Khớp lại với mockup đã được duyệt ở phiên trước, giảm cảm giác "Material mặc định" (form
field nổi, FAB tròn) để đúng tinh thần thiết kế "biên nhận giấy" đã chọn cho app. Nút xoá đổi
màu trung tính vì xoá 1 dòng dữ liệu (khoản mục/thành viên/hoá đơn) là thao tác thường xuyên
trong luồng dùng, không cần tín hiệu cảnh báo đỏ liên tục — mockup cũng không dùng đỏ ở đây.

### Alternatives Considered

- **Input**: cân nhắc bỏ hẳn `mat-form-field`, viết `<input>` thuần theo đúng pixel mockup
  (label hoàn toàn tách khỏi viền, không có notch cutout). Không chọn vì sẽ mất
  validation/`mat-error` có sẵn của Reactive Forms, rủi ro regression cao hơn nhiều so với lợi
  ích thẩm mỹ — chọn `floatLabel="always"` + override CSS làm giải pháp cân bằng, chấp nhận
  còn 1 khác biệt nhỏ (label vẫn nằm trên đường viền theo cách vẽ của Material outline, không
  tách hẳn ra ngoài như mockup).
- **Avatar-stub tổng kết & icon SVG**: xem phần Decision — đã hỏi người dùng thay vì tự quyết.

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

---

## 2026-09-18 (đợt 3b — hồi quy phát hiện khi rà soát)

### Decision

Hai lỗi do chính đợt 3 gây ra, sửa ngay:

1. `color="warn"` mất tác dụng sau khi đổi sang Material 3 → map thủ công sang `--mat-sys-error`.
2. `bills.loadData()` nuốt lỗi → tách trạng thái lỗi khỏi trạng thái rỗng.

### Before

- M2 sinh các class palette `.mat-warn` / `.mat-primary`; `mat.theme()` của M3 **không sinh**
  chúng (kiểm chứng: `grep -c "\.mat-warn"` trên CSS bundle = 0). 24 chỗ dùng `color="..."`
  trong template im lặng mất tác dụng — đáng kể nhất là 4 nút xóa `color="warn"` không còn màu đỏ,
  tức là nút phá hủy mất hẳn tín hiệu cảnh báo mà không có lỗi build nào báo.
- `loadData()` ở đợt 2 dùng `try/finally` không có `catch`: khi API hỏng, `bills` vẫn là `[]` nên
  empty state khẳng định "Chưa có hóa đơn nào được chia sẻ" trong khi thực tế là lỗi mạng.

### After

- `styles.scss` map `[color="warn"]` trên icon-button / button / raised-button sang
  `--mat-sys-error`.
- `bills` có cờ `hasError` riêng và một empty state "Không tải được danh sách" kèm nút Thử lại.

### Reason

- Đây là **hạn chế của việc chuyển M2 → M3**, không phải lựa chọn thiết kế: `color` input vẫn
  được template chấp nhận nên không có cảnh báo nào, nhưng không còn CSS đứng sau nó.
- Nói với người dùng "bạn chưa có hóa đơn nào" khi thật ra máy chủ hỏng là sai lệch thông tin,
  và còn khiến họ tưởng dữ liệu đã mất.

### Alternatives Considered

- **Thay hết `color="warn"` bằng class riêng trong template**: sạch hơn về lâu dài (không dựa vào
  một API đã ngừng hoạt động), nhưng phải sửa 24 chỗ. Giữ lại cho đợt dọn sau.
- **Dùng `mat.icon-button-overrides()`**: đúng chuẩn M3 hơn nhưng override toàn cục cho mọi
  icon-button, trong khi ở đây chỉ cần các nút mang thuộc tính `color="warn"`.

---

---

## 2026-09-18 (đợt 4)

### Decision

Xử lý phần backlog còn lại đã ghi ở cuối đợt 3: rò rỉ subscription (mục B), thiếu phản hồi lỗi
form và lightbox không tiếp cận được (mục D), xoá không có hoàn tác và thiếu tiến trình upload
(mục C, một phần). Không gộp 2 FAB thành một nút — xem Alternatives.

### Before

- **Rò rỉ subscription**: `result-display.ts`, `create-bill.ts`, `payment.ts`, `bank.ts`,
  `oauth-callback.ts`, `bill-details.ts` gọi `.subscribe()` trực tiếp trên observable của
  service (số liệu kiểm: 4/3/2/1/1/2 lần `.subscribe()`, 0 cơ chế huỷ ở hầu hết). Người dùng
  đi lại giữa `/` và `/:code` liên tục sẽ chồng thêm subscription lên cùng signal của
  `BillSplitterService` mỗi lần vào lại trang.
  - `result-display.ts` còn có 2 field chết (`expenses`, `members`): gán trong subscribe nhưng
    không đọc ở đâu — template dùng `expenses$ | async` riêng, gán 2 lần cho cùng dữ liệu.
- **Lightbox ảnh tự chế** ([image-upload.html] cũ): `<div (click)="closePreview()" (keydown)="closePreview()">`
  — không `role="dialog"`, không focus trap, bấm **phím bất kỳ** là đóng (không riêng Esc).
- **`setting.html`**: `Validators.pattern` cho số điện thoại Momo nhưng không `<mat-error>`;
  nút Lưu chỉ `[disabled]="settingsForm.invalid"` — người dùng nhập sai không biết vì sao
  không bấm được.
- **Xoá không hoàn tác**: `removeExpense()`/`removeMember()` xoá ngay, trong khi xoá bill
  ở `bills.ts` có confirm dialog — không nhất quán.
- **Upload ảnh không có tiến trình**: `uploadImages()` dùng `firstValueFrom(this.http.post(...))`,
  không `reportProgress`. Người dùng upload 5 ảnh × 5MB trên mạng chậm chỉ thấy icon xoay của
  FAB, không biết còn bao lâu.

### After

- Toàn bộ subscribe còn thiếu cleanup đã thêm `takeUntilDestroyed()`:
  - Trong `constructor()` (injection context): không cần truyền `DestroyRef`.
  - Trong `ngOnInit()`/`ngAfterViewInit()` (không phải injection context):
    `inject(DestroyRef)` ở field rồi truyền `takeUntilDestroyed(this.destroyRef)`.
  - `result-display.ts`: xoá field `expenses`/`members` chết, bỏ 2 subscribe không cần thiết
    (chỉ giữ `billName$`/`bankInfo$` — 2 cái có side-effect thật ngoài template).
  - `pwa-update.service.ts` **không đổi**: service `providedIn: 'root'` sống suốt đời app,
    subscribe ở đó không phải rò rỉ.
- `image-upload/` (bỏ) → `image-lightbox/` (NEW): `ImageLightboxComponent` mở qua `MatDialog`,
  có điều hướng ảnh trước/sau khi có nhiều ảnh, `cdkFocusInitial` trên nút đóng. Panel style
  riêng (`.image-lightbox-panel`) để ảnh đứng tự do trên overlay tối thay vì trong card trắng
  mặc định của `MatDialog`. Grid ảnh giờ `role="button" tabindex="0"` với `keydown.enter`/`space`
  thay cho `(keydown)` bắt mọi phím.
- `setting.html`: thêm `<mat-error>` cho số điện thoại Momo; bỏ `[disabled]`, nút Lưu luôn bấm
  được — `onSubmit()` đã có sẵn `markAllAsTouched()` ở nhánh invalid, giờ thêm dòng gợi ý
  "Vui lòng kiểm tra lại các trường có lỗi ở trên" xuất hiện đúng lúc đó.
- `BillSplitterService`: thêm `restoreExpense(expense, index)` / `restoreMember(member, index)`
  chèn lại đúng vị trí cũ. `expense-form.ts`/`member-table.ts`: xoá xong mở snackbar
  `Hoàn tác` (5s) gọi restore khi được bấm.
- `uploadImages(files, onProgress?)`: tham số thứ 2 optional, không phá vỡ 2 lời gọi cũ không
  truyền nó. Khi có, chuyển sang `reportProgress: true, observe: 'events'`, lọc
  `HttpEventType.UploadProgress` để báo % và `HttpEventType.Response` để resolve. `create-bill.ts`
  và `bill-details.ts` hiện `mat-progress-spinner` xác định (0-100%) phía trên cụm FAB khi đang
  upload.
- Cả 2 FAB (share/save) có `matTooltip` + `aria-label` mô tả rõ hành động — xem Alternatives
  về việc không gộp thành một nút.

Kiểm chứng: `npx tsc --noEmit` sạch, `npm run lint` chỉ còn 2 lỗi có sẵn từ trước, `npm run build:prod`
pass, `ng serve` khởi động sạch (HTTP 200).

### Reason

- **`takeUntilDestroyed()` cần injection context**: gọi trong `ngOnInit`/`ngAfterViewInit` không
  có `ComponentRef` ngầm định như constructor, nên phải tự `inject(DestroyRef)` rồi truyền tay —
  bỏ qua bước này sẽ throw `NG0203` ngay khi component khởi tạo, không phải lỗi âm thầm.
- **Xoá field chết ở `result-display.ts` thay vì thêm `takeUntilDestroyed` cho chúng**: sửa cho
  đúng gốc thay vì sửa cho hết cảnh báo — 2 subscribe đó không có tác dụng gì để mà giữ lại.
- **`MatDialog` cho lightbox thay vì tự quản lý focus**: CDK overlay đã giải quyết đúng vấn đề
  (focus trap, Esc, `aria-modal`) mà `<div (click)>` không thể tự làm đúng mà không viết lại
  gần như toàn bộ logic của Dialog.
- **Bỏ `[disabled]` ở nút Lưu, không chỉ thêm `mat-error`**: một nút bị khoá im lặng và một nút
  luôn bấm được nhưng báo lỗi rõ khi bấm là hai UX khác hẳn nhau — cách sau cho người dùng biết
  *tại sao* không lưu được thay vì chỉ thấy nút không phản ứng.
- **`restoreExpense`/`restoreMember` chèn theo `index`** chứ không `push` vào cuối: thứ tự trong
  bảng phản ánh thứ tự nhập, hoàn tác mà đổi thứ tự sẽ gây khó chịu hơn là giúp ích.
- **`uploadImages` progress là optional param, không đổi return type**: 3 lời gọi cũ
  (`create-bill.ts` ×2, `bill-details.ts` ×1) tiếp tục chạy đúng như trước nếu không cần progress;
  chỉ nơi cần mới trả thêm chi phí.

### Alternatives Considered

- **Gộp 2 FAB (share/save) thành một nút**: được ghi trong backlog đợt 3 nhưng **không làm** ở
  đợt này. Hai hành động không hoàn toàn giống nhau (share = lưu + copy link + điều hướng; save =
  chỉ lưu + điều hướng) và gộp sẽ phải quyết định hành vi mới cho nút duy nhất — đó là lựa chọn
  sản phẩm cần xác nhận, không phải rewrite kỹ thuật đơn thuần. Việc thêm `matTooltip` rõ nghĩa
  cho từng nút là phần an toàn có thể làm ngay; phần gộp để lại cho người dùng quyết định.
- **Tiến trình per-file thay vì per-batch**: cả `maxFiles` ảnh đi trong một multipart request,
  nên `HttpEventType.UploadProgress` chỉ cho % của toàn bộ payload, không tách được file nào
  xong trước. Tách thành N request riêng (1 file/request) sẽ cho progress chính xác hơn nhưng
  đổi hẳn giao thức với backend (`upload-images` hiện nhận nhiều file trong 1 request) — ngoài
  phạm vi một lần polish UI.
- **Đưa lightbox vào component riêng nhưng vẫn không dùng `MatDialog`** (ví dụng CDK Overlay
  trực tiếp): cho toàn quyền tuỳ biến hơn, nhưng phải tự viết lại chính xác thứ `MatDialog` đã
  làm sẵn (focus trap, backdrop click, Esc, scroll lock) — không có lý do để không dùng nó.

---

## Còn tồn đọng (cập nhật 2026-09-18, sau đợt 4)

1. **Chưa xem bằng mắt trên trình duyệt thật** (không có công cụ điều khiển browser trong session
   này). Cần một lượt kiểm tra tay:
   - Tương phản chế độ Tối — đặc biệt QR code và logo ngân hàng (ảnh `.webp` nền trắng) trên
     surface tối.
   - Form Thanh toán / Cài đặt vẫn lưu đúng sau khi đổi sang `app-bank-select` (đợt 3).
   - Lightbox ảnh mới (`ImageLightboxComponent`), tiến trình upload, snackbar hoàn tác — cả ba
     đều mới viết ở đợt 4, chỉ mới qua compile + build, chưa chạy tay.
2. **Gộp 2 FAB (share/save)**: cân nhắc nhưng chưa làm — xem "Alternatives Considered" ở đợt 4.
   Cần người dùng quyết định hành vi mong muốn khi gộp trước khi động vào.
3. `skeleton` thay `mat-spinner` cho danh sách `bills` — chưa làm, mức độ ưu tiên thấp.
4. `styles.scss` còn dùng `@import './tailwind.css'` (Sass deprecate). Chưa đổi vì `@use` không
   nhận file CSS và pipeline Tailwind v4 đang phụ thuộc cách import này.
5. 2 lỗi lint `no-empty-function` có sẵn ở `thousand-separator.ts:28` và
   `bill-splitter.service.ts:54` — chưa đụng vì ngoài phạm vi UI.
6. **0 file test** trong toàn dự án (`*.spec.ts`), dù Karma/Jasmine đã cấu hình sẵn trong
   `angular.json`. Không có cách nào chạy test tự động để bảo vệ các thay đổi qua 4 đợt —
   toàn bộ xác nhận đến từ `tsc --noEmit`, `ng lint`, `ng build` và đọc code, không phải test.

## 2026-09-21

### Decision

Sau khi mở app thật và phân tích UX của `#themeMenu` (dropdown 3 lựa chọn Sáng/Tối/Theo hệ
thống, đánh dấu bằng icon ✓), phát hiện `.theme-check { margin-left: auto }` không đẩy được
dấu tích ra sát mép phải hàng vì wrapper flex nội bộ của `mat-menu-item` — khiến nhãn text của
3 dòng bị lệch hàng với nhau (bug thật, thấy được qua screenshot).

Người dùng chọn đơn giản hoá thay vì vá riêng bug lệch hàng: bỏ hẳn chế độ `system`, chỉ còn
2 trạng thái `light`/`dark`, thay dropdown bằng 1 nút toggle duy nhất trên header.

Hai điểm chưa rõ trong yêu cầu gốc đã hỏi lại người dùng và chốt:
- **Persist**: người dùng mới (chưa có `localStorage.theme`) → detect `prefers-color-scheme`
  một lần duy nhất, lưu ngay vào `localStorage`. Từ sau đó app không còn theo dõi thay đổi giao
  diện hệ thống nữa (bỏ hẳn `matchMedia('change')` listener) — đổi trạng thái chỉ qua nút bấm.
- **Icon**: nút hiển thị icon của giao diện **sẽ chuyển tới** khi bấm (đang sáng → hiện icon mặt
  trăng), không phải giao diện hiện tại — nhấn mạnh hành động thay vì trạng thái.

### Before

- `ThemeMode = 'light' | 'dark' | 'system'`; `ThemeService` giữ 2 signal (`modeSignal` +
  `systemPrefersDark`) và 1 `matchMedia('change')` listener để tự theo hệ thống khi ở mode
  `system`.
- `app.html`: nút `mat-icon-button` mở `mat-menu` 3 item, mỗi item tự so `themeMode() === '...'`
  để hiện icon `check` (bug lệch hàng nêu trên).
- `index.html`: script chống-nháy coi `!mode || mode === 'system'` là "theo hệ thống".

### After

- `ThemeMode = 'light' | 'dark'`. `readStoredMode()` đọc `localStorage`; nếu chưa có, detect
  `matchMedia('(prefers-color-scheme: dark)')` **một lần** và gọi `persistMode()` ngay (ghi
  `localStorage`) trước khi trả về — không còn theo dõi thay đổi hệ thống về sau.
- `ThemeService.toggle()` thay cho `setMode(mode)` gọi từ 3 nút menu.
- `app.html`: bỏ hẳn `mat-menu`/`MatMenuModule`; 1 nút `(click)="toggleTheme()"`,
  `[attr.aria-label]`/`[matTooltip]` lấy từ `themeToggleLabel()` (text mô tả hành động, ví dụ
  "Chuyển sang giao diện Tối"), icon lấy từ `themeIcon()` (icon của trạng thái đích).
- Xoá CSS `.theme-check` (không còn markup dùng tới) và đơn giản hoá điều kiện `system` trong
  script chống-nháy của `index.html`.
- Đã chạy `ng build --configuration development` (pass) và chạy thật app qua Chrome headless
  (CDP) với profile trắng để mô phỏng "người dùng mới": xác nhận detect hệ thống → lưu
  `localStorage` ngay → bấm toggle đổi đúng theme/icon/label → reload vẫn giữ lựa chọn đã lưu
  (không detect lại hệ thống).

### Reason

Người dùng chủ động muốn giảm từ 3 trạng thái xuống 2 để đơn giản hoá thao tác đổi theme (1
click thay vì mở menu rồi chọn), đồng thời gọn lại `ThemeService`. Việc này cũng loại bỏ luôn
vector gây ra bug lệch hàng ở dropdown cũ mà không cần vá riêng.

### Alternatives Considered

- **Giữ dropdown, chỉ đổi cách đánh dấu item chọn** (nền tô màu + label đậm thay vì icon ✓) —
  bị người dùng bỏ qua để chọn hướng đơn giản hoá luôn cả số lượng trạng thái.
  - Xem thêm 2 phương án khác đã đề xuất trong hội thoại (segmented control 3 nút, kết hợp cả
    hai) — không được chọn vì người dùng ưu tiên "đơn giản hơn" với 1 icon duy nhất.
- **Không chốt lưu ngay lần đầu, tiếp tục theo hệ thống ngầm cho đến khi người dùng tự chọn** —
  người dùng từ chối, chọn "chốt ngay và lưu localStorage" vì đơn giản hơn và khớp sát mô tả gốc.
- **Icon thể hiện trạng thái hiện tại** (đang tối → hiện icon mặt trăng) — đây là lựa chọn được
  gợi ý là "Recommended" vì khớp hành vi nút cũ, nhưng người dùng chọn ngược lại: icon thể hiện
  trạng thái sẽ chuyển tới.

## 2026-09-21 (Pha 0 — redesign "biên nhận giấy": token màu + font)

### Decision

Bắt đầu triển khai kế hoạch làm mới UI đã duyệt (`docs/ui-redesign-plan.md`). Pha 0 thay bảng
màu Material 3 mặc định (`mat.$azure-palette`) bằng bảng màu riêng của app (teal + vàng đồng,
lấy cảm hứng từ tiền Việt Nam) và thêm font mono cho số tiền/số lượng — hạ tầng token dùng
chung cho toàn bộ các pha sau.

Phát hiện trong lúc triển khai: **Angular Material 20 không có API Sass công khai để tạo một
palette M3 mới từ hex tuỳ ý** — `@angular/material` chỉ export sẵn một số palette dựng trước
(`$azure-palette`, `$violet-palette`...), hàm `mat.define-theme()`/`define-colors()` chỉ nhận
*palette đã có*, không có hàm sinh palette từ 1 màu gốc. Do đó không thể "đổi tên palette" như
kế hoạch ban đầu kỳ vọng.

### Before

- `styles.scss`: `@include mat.theme((color: mat.$azure-palette, ...))` — mọi token
  `--mat-sys-primary*` (dùng bởi button/fab/tab/select/checkbox màu `color="primary"`) đều là
  azure Material mặc định.
- Token app (`--bg-color`, `--primary-color`, `--surface-color`...) được **suy ra** từ
  `--mat-sys-*` (vd `--primary-color: var(--mat-sys-primary)`), nên phụ thuộc hoàn toàn vào
  palette Material — không có cách chèn màu tuỳ chỉnh mà không đổi tên biến ở hàng chục file.
- `index.html`: chỉ nạp font Inter; `theme-color` = `#1976d2` (xanh Material). `manifest.webmanifest`
  cùng giá trị `#1976d2`/`#fafafa`.

### After

- **Giữ `mat.theme()` với `$azure-palette`** (vẫn cần nó để sinh đúng các token M3 khác: shape,
  motion, state, typography) nhưng override ngay 4 token màu primary mà component trong app thực
  sự dùng (`--mat-sys-primary`, `--mat-sys-on-primary`, `--mat-sys-primary-container`,
  `--mat-sys-on-primary-container`) bằng hex teal literal, đặt trong cùng khối `html {}`/
  `html.dark {}` (specificity `html.dark` > `html` nên tự thắng khi bật dark mode, không cần
  `!important`) — nhờ vậy mọi component Material dùng `color="primary"` đổi sang teal mà không
  phải generate lại palette.
- Token app tách 2 lớp trong `:root`/`html.dark`: **raw** (hex literal mới: `--ink`, `--paper`,
  `--teal*`, `--gold*`, `--green*`, `--font-mono`...) và **role** (giữ nguyên tên biến cũ
  `--primary-color`, `--bg-color`, `--accent-soft-bg`... trỏ sang raw mới) — mọi component đang
  dùng `var(--primary-color)` tự đổi màu, không phải sửa từng file.
- `--accent-soft-bg`/`--accent-soft-fg` **giữ nguyên ý nghĩa cũ** (= teal soft, không đổi thành
  gold) để không phá ngầm các nơi đang dùng 2 biến này cho hover (`bills.scss`,
  `image-upload.scss`). Gold có cặp biến riêng `--gold-soft-bg`/`--gold-soft-fg`, chỉ dùng cho
  CTA chính ở các pha sau.
- Mỗi biến raw có 1 giá trị riêng trong `html.dark {}` (không dùng `light-dark()` cho token app,
  giữ đúng convention cũ của file là override phẳng trong `html.dark {}`) — `--teal`/`--gold`
  giữ nguyên giữa 2 theme (dùng làm màu NỀN fill: FAB, ticket-stub, chữ trắng lên trên — không
  phụ thuộc theme), còn `--teal-dark`/`--teal-soft`/`--gold-dark`/`--gold-soft` đảo tông ở dark
  mode vì đây là màu dùng làm CHỮ/NỀN NHẠT, phải đảo để đọc được trên nền tối.
- Thêm `--font-mono: 'IBM Plex Mono', ui-monospace, ...` — nạp font qua `index.html` (gộp vào
  cùng 1 request Google Fonts với Inter). Font này sẽ được gán cho số tiền/số lượng ở Pha 1+
  (chưa có class `.mono-amount` ở Pha 0, đó là việc của Pha 1).
- Đổi luôn `theme-color` trong `index.html` và `theme_color`/`background_color` trong
  `manifest.webmanifest` từ xanh Material (`#1976d2`/`#fafafa`) sang teal/paper mới
  (`#1B6B72`/`#F7F3EC`) — không nằm trong kế hoạch gốc nhưng cùng bản chất "hạ tầng token màu",
  bỏ sót sẽ để lại thanh trạng thái/màu splash PWA xanh Material lạc tông với UI mới.
- Verify: `ng build --configuration=development` pass (chỉ còn cảnh báo Sass deprecation
  `@import`/mixed-decls đã có từ trước, không phải lỗi mới); `ng serve` khởi động sạch, không có
  lỗi runtime trong log. **Chưa xem bằng mắt trên trình duyệt thật** (không có công cụ điều khiển
  browser trong session này) — cần người dùng tự mở `ng serve` và soát contrast/màu ở cả 2 theme
  trước khi qua Pha 1.

### Reason

Kế hoạch ban đầu giả định có thể "generate palette M3 mới từ hex" giống cách đổi
`mat.$azure-palette` sang một palette khác — khảo sát mã nguồn `@angular/material` (bản
`^20.0.2`) cho thấy API đó không tồn tại ở bản public. Override trực tiếp 4 CSS custom property
`--mat-sys-primary*` là cách tối thiểu, rủi ro thấp nhất để rebrand đúng màu mà không phải tự
tính toán lại toàn bộ ~40 token M3 (fixed/dim/container variants) cho 2 palette (primary +
tertiary) × 2 theme — trong khi component thực tế trong app chỉ dùng 4 token đó qua
`color="primary"`, không dùng `color="tertiary"` hay các biến thể fixed-tone ở đâu cả.

### Alternatives Considered

- **Tự viết hàm Sass sinh palette M3 từ hex** (dùng thuật toán HCT tone-based như Material Color
  Utilities) — khả thi về nguyên tắc nhưng tốn công vượt xa lợi ích ở quy mô app này (chỉ 4 token
  thực sự được dùng), tăng rủi ro sai lệch contrast on-color nếu tính tay không đúng thuật toán
  gốc. Bỏ qua.
- **Gọi thêm package `@material/material-color-utilities` (JS, không phải Sass) để build-time
  generate palette rồi ghi ra file token** — khả thi nhưng thêm 1 bước build riêng ngoài Angular
  CLI, không tương xứng với lợi ích khi chỉ cần đúng 4 token màu. Bỏ qua, có thể xem lại nếu sau
  này cần nhiều token M3 hơn (vd dùng `color="tertiary"` thật cho gold thay vì class CSS riêng).
- **Dùng `light-dark()` cho token app raw mới** (giống cách Material tự sinh token) thay vì
  override phẳng trong `html.dark {}` — cân nhắc nhưng đổi khác convention hiện có của file
  (toàn bộ token app cũ, ví dụ `--success-bg`/`--success-fg`, đều dùng pattern `html.dark {}`),
  giữ nguyên convention để code nhất quán, dễ đọc hơn là trộn 2 kỹ thuật trong cùng file.

## 2026-09-21 (Pha 1 — motif dùng chung + override Material toàn cục)

### Decision

Thêm 5 nhóm class dùng chung vào `styles.scss` (không component nào sở hữu riêng, vì đây là
ngôn ngữ hình ảnh của cả app): `.mono-amount`/`.mono-text` (số tiền/số liệu dùng font mono),
`.receipt-ticket`/`.receipt-ticket__stub` (motif "cuống vé" + notch đục lỗ), `.leader-row`
(dotted-leader nối tên khoản mục ↔ số tiền), `.tear-line` (ranh giới nhập liệu/tổng kết),
`.btn-gold`/`.fab-gold` (CTA vàng đồng). Đồng thời override toàn cục `.mat-mdc-option`
(dropdown mat-select, render ngoài DOM component qua `.cdk-overlay-container`) và
`.mat-mdc-dialog-surface` (mọi dialog) sang theme mới; giảm shadow FAB từ `--shadow-md` xuống
`--shadow-sm`; thêm outline `focus-visible` rõ ràng cho toàn bộ nút Material.

### Before

`.mat-mdc-fab`/`.mat-mdc-mini-fab` dùng `box-shadow: var(--shadow-md)`; `mat-select`
dropdown option hover/selected dùng màu Material mặc định (`--mat-sys-secondary-container`,
xem CSS gốc của `MatOption` trong `node_modules`); `.mat-mdc-dialog-surface` không có override
nào (border-radius/màu mặc định M3); chưa có class nào cho motif "biên nhận".

### After

- `.receipt-ticket__stub` tạo notch bằng `::before`/`::after` ngay trên chính stub (không phải
  markup riêng) với `right: -7px` — nhờ vậy width của stub tuỳ biến theo nội dung mà notch vẫn
  luôn nằm đúng ngay tại đường nối, không cần tính toán vị trí theo từng nơi dùng. Quy ước biến
  `--notch-bg` (mặc định `var(--bg-color)`) để nơi đặt `.receipt-ticket` trên nền khác nền trang
  (trong `mat-card`, dialog...) tự override, tránh notch lộ viền sai màu.
- `.mat-mdc-option` override dùng đúng class/attribute thật đã xác nhận trong mã nguồn Angular
  Material 20 (`node_modules/@angular/material/fesm2022/option-*.mjs`): `.mdc-list-item--selected`
  không dùng (đã có sẵn `[aria-selected="true"]` phản chiếu cùng giá trị `selected`, đơn giản
  hơn), `.mat-mdc-option-active` (trạng thái focus bàn phím) — tránh đoán tên class sai.
- `.mat-mdc-dialog-surface` xác nhận đúng là class thật (`mat-dialog-container.ts` template:
  `<div class="mat-mdc-dialog-surface mdc-dialog__surface">`) trước khi override — không đụng gì
  tới `.image-lightbox-panel ... .mdc-dialog__surface` đã có (selector đó cụ thể hơn nên vẫn
  thắng, không bị rule mới đè).
- Verify: `ng build --configuration=development` pass, không lỗi Sass mới (chỉ còn các cảnh báo
  deprecation cũ). **Chưa xem bằng mắt** dropdown/dialog/ticket thật trên trình duyệt (không có
  công cụ browser trong session) — để dành cho Pha 2 khi có component thật dùng các class này.

### Reason

Tách motif thành class dùng chung 1 lần trong `styles.scss` (giống cách `.inline-add-form`/
`.data-table-scroll` đã làm) thay vì lặp lại SCSS tương tự ở `bills.scss`, `member-table.scss`,
`result-display.scss` — vì cả 3 nơi đó dùng chung đúng 1 khái niệm hình ảnh ("cuống vé", "đường
chấm dẫn"). Override overlay Material (`mat-select` panel, dialog) buộc phải đặt ở file global vì
nội dung 2 loại đó render ra `.cdk-overlay-container`, ngoài cây DOM/style-scope của component gọi
chúng — không thể override từ `bank-select.scss` hay `confirm-dialog.scss`.

### Alternatives Considered

- **Markup riêng cho notch** (2 `<span>` tuyệt đối định vị theo % width của stub) thay vì
  `::before/::after` trên chính stub — bị bỏ vì phải tính lại vị trí theo từng chiều rộng stub cụ
  thể ở mỗi nơi dùng; đặt trên mép phải của chính stub (`right: -7px`) tự động đúng vị trí bất kể
  stub rộng bao nhiêu.
- **Dùng `panelClass` trên từng `MatSelect`/`MatDialog` để scope override** thay vì global — bị
  bỏ vì `panelClass` chỉ áp lên container overlay, không "chui" được vào nội dung `<mat-option>`/
  `.mat-mdc-dialog-surface` do chính Material component tự render, global vẫn là cách duy nhất áp
  được màu cho nội dung đó.

## 2026-09-21 (Pha 2 — danh sách hoá đơn)

### Decision

Áp `.receipt-ticket` (Pha 1) vào item danh sách hoá đơn: bỏ badge mã bill dạng pill chữ hoa,
bỏ hover-lift, thêm hiển thị tổng tiền + số người ngay trên list.

Giả định ban đầu (lúc lập `docs/ui-redesign-plan.md`) là API `GET /bills` chưa trả
`totalAmount`/số thành viên, dựa trên đọc `BillFindAll` cũ (chỉ có `code, name, createdAt`) — nên
kế hoạch gốc định làm field optional + ẩn "—" chờ backend. Người dùng xác nhận lại thực tế: API
đã trả kèm `data: { totalAmount, members, expenses, bankInfo }` cho mỗi item (giống hệt shape của
`BillFindOne.data`), chỉ là model TypeScript trong repo chưa khai đúng. Sửa lại theo dữ liệu thật
thay vì theo giả định trong kế hoạch.

### Before

- `bill-splitter.model.ts`: `BillFindAll.data` chỉ có `{ code, name, createdAt }`.
- `bills.ts`: `interface Bill { code, name, createdAt }` — không có tổng tiền/số người.
- `bills.html`: mỗi item là `<div class="bill">` phẳng, header có `.bill-code` (pill uppercase,
  nền `--accent-soft-bg`) + `.bill-date` (ngày đầy đủ qua `formatDate()`), không có tổng tiền/số
  người.
- `bills.scss`: `.bill:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }`.

### After

- `bill-splitter.model.ts`: `BillFindAll.data` mỗi item thêm `data: { expenses, members,
  bankInfo, totalAmount }` — tái dùng đúng `BillFindOneExpense`/`BillFindOneMember` đã khai sẵn
  trong file, không định nghĩa type trùng lặp.
- `bills.ts`: `Bill` thêm `data: { totalAmount: number; members: { id: string }[] }` (bắt buộc,
  không optional — dữ liệu luôn có). Thêm `getStubDay()`/`getStubMonth()` (tách ngày/tháng cho
  cuống vé).
- `bills.html`: mỗi item giờ là `.bill.receipt-ticket` (stub teal trái hiện ngày/tháng qua
  `.bill-stub`), mã bill chuyển xuống thành text nhỏ mono màu `--text-secondary` cạnh tên (không
  còn pill), thêm `.bill-meta` hiện tổng tiền (`.mono-amount`, từ `item.data.totalAmount`) và số
  người tham gia (`item.data.members.length`). Vẫn giữ `title="{{formatDate(...)}}"` trên toàn
  item để có ngày đầy đủ khi hover (cuống vé chỉ hiện ngày/tháng, không có năm).
- `bills.scss`: bỏ hoàn toàn `transform`/`box-shadow` khi hover, chỉ đổi `border-color`/
  `background`/màu chữ (đúng nguyên tắc "chỉ giữ hiệu ứng có ý nghĩa trạng thái"). Layout đổi
  theo cấu trúc `.receipt-ticket` (stub + `.bill-content` thay cho `.bill` phẳng cũ).
- Verify: `ng build` + `ng lint` pass (0 lỗi mới; 2 lỗi lint pre-existing ở
  `thousand-separator.ts`/`bill-splitter.service.ts` không liên quan, đã ghi từ đợt trước).
  **Chưa xem bằng mắt** trên trình duyệt thật (không có công cụ browser trong session).

### Reason

Danh sách hoá đơn trước đó không cho biết tổng tiền/số người mà phải mở từng bill mới biết —
đây là gap UX được phát hiện khi review giao diện ban đầu. Model cũ trong repo chỉ là chưa khai
đúng field API đã trả sẵn, không phải hạn chế backend thật — sửa model để khớp thực tế thay vì
giữ optional/ẩn dữ liệu không cần thiết.

### Alternatives Considered

- **Giữ field optional, ẩn "—" chờ backend** — phương án ban đầu trong kế hoạch, dựa trên giả
  định sai về API. Bỏ sau khi người dùng xác nhận API đã trả đủ dữ liệu.
- **Hiện ngày đầy đủ (dd/mm/yyyy) ngay trên cuống vé** thay vì chỉ ngày/tháng — bỏ vì cuống vé
  quá hẹp (56px) để chứa cả năm mà không vỡ dòng; ngày đầy đủ vẫn xem được qua `title` khi hover.

## 2026-09-21 (Pha 3 — layout 2 cột + gộp FAB cho trang tạo hoá đơn)

### Decision

Thống nhất breakpoint mobile/desktop của trang tạo hoá đơn về `(max-width: 767px)` (khớp
`MOBILE_BREAKPOINT` của `member-table.ts`, thay `600px` cũ). Dưới ngưỡng: giữ `mat-tab-group`
2 tab (Khoản mục/Thành viên). Từ ngưỡng: `.two-col-layout` (grid 2 cột) hiện song song, không
qua tab. "Thanh toán" bỏ hẳn khỏi tab ở mọi breakpoint, luôn full-width ngay dưới. Gộp 2 FAB
(share + auto-save) thành 1 FAB gold duy nhất "Lưu & chia sẻ".

### Before

- `create-bill.ts`: không có khái niệm mobile/desktop, `@ViewChild('tabGroup') tabGroup!:
  MatTabGroup` (non-null assertion — tabGroup luôn tồn tại vì tab luôn render).
- `create-bill.html`: 1 `mat-tab-group` cố định 3 tab (Khoản mục/Thành viên/Thanh toán) ở mọi
  kích thước màn hình, chỉ đổi label→icon dưới 600px. 2 `mat-fab color="primary"` xếp chồng
  (`share-button` + `auto-save-button`), `upload-progress` định vị `bottom-[170px]` để tránh
  đè lên cả 2 FAB.

### After

- `create-bill.ts`: thêm `BreakpointObserver` + `MOBILE_BREAKPOINT = '(max-width: 767px)'`
  (copy nguyên văn từ `member-table.ts` để 2 nơi luôn đồng bộ ngưỡng), field `isMobile`. Đổi
  `tabGroup!: MatTabGroup` → `tabGroup?: MatTabGroup` (optional thật, vì giờ có thể không tồn
  tại ở desktop) và thêm guard `if (this.tabGroup)` trong `ngAfterViewInit` trước khi gán
  `selectedIndex` — nếu không sẽ crash khi `BillTabControlService.changeTab()` được gọi lúc
  đang ở layout desktop.
- `create-bill.html`: `@if (isMobile) { <mat-tab-group> 2 tab } @else { <div
  class="two-col-layout"> 2 cột }` — chỉ 1 bộ DOM render tại 1 thời điểm (không double-render
  `app-expense-form`/`app-member-table`, tránh 2 instance cùng subscribe `expenses$`/`members$`).
  `app-payment` chuyển ra ngoài, đặt cố định dưới cả 2 nhánh. Thêm `<div class="tear-line">`
  giữa `mat-card` (vùng nhập liệu) và `app-result-display` (vùng tổng kết). Bỏ hẳn nút
  `auto-save-button`; nút còn lại đổi `color="primary"` → class `.fab-gold` (Pha 1). Dịch
  `upload-progress` từ `bottom-[170px]` xuống `bottom-24` và FAB từ `bottom-[100px]` xuống
  `bottom-7` (chỉ còn 1 FAB, không cần chỗ cho 2 nút xếp chồng nữa).
- `create-bill.scss`: thêm `.two-col-layout { display:grid; grid-template-columns: 1.25fr 1fr;
  gap:24px; }`. Bỏ padding-top của `.expense-form`/`.member-table` khi ở trong `.two-col-layout`
  (đã có gap của grid, không cần cộng thêm padding riêng).
- **Chưa sửa** `onSettingClick()` trong `result-display.ts` (gọi `changeTab(1)` để nhảy tab
  Thanh toán) — đây là việc của Pha 6, chạy sau vì cần biết chắc `tabGroup` đã optional-safe.
  Ghi chú: quan sát thấy code hiện tại gọi `changeTab(1)` nhưng comment nói "giả sử tab Setting
  có index là 1" — với 3 tab cũ (Khoản mục=0, Thành viên=1, Thanh toán=2) thì `changeTab(1)`
  thực ra nhảy tới tab Thành viên, không phải Thanh toán (có vẻ là bug từ trước, không phải do
  đợt sửa này). Với 2 tab mới, index 1 vẫn hợp lệ và vẫn trỏ tới Thành viên — hành vi không đổi,
  không phải regression, nhưng cần xử lý đúng ý định gốc ở Pha 6.
- Verify: `ng build` + `ng lint` pass (0 lỗi mới). **Chưa xem bằng mắt** trên trình duyệt thật.

### Reason

Luồng thực tế khi chia tiền là thêm món rồi thêm người rồi quay lại thêm món — tab ẩn buộc
người dùng bấm qua lại liên tục trên desktop dù màn hình đủ rộng để hiện cả 2 cùng lúc. Về FAB:
`save(true)` (share) đã luôn gọi `createBill()` trước khi copy URL, nên gộp về 1 nút không mất
khả năng lưu, chỉ mất khả năng "lưu mà chưa muốn lộ link" — người dùng đã xác nhận đánh đổi này
ở bước lập kế hoạch.

### Alternatives Considered

- **Giữ cả 2 DOM (tab + 2 cột), ẩn bằng CSS `display:none` theo breakpoint** thay vì
  `@if/@else` — bị bỏ vì tạo 2 instance `app-expense-form`/`app-member-table` cùng lúc, hai form
  nội bộ cùng chạy song song có thể gây trùng lặp sự kiện/focus không mong muốn.
- **Giữ 2 FAB, chỉ thu nhỏ nút lưu phụ** (phương án 2 trong kế hoạch) — người dùng chọn phương
  án 1 (chỉ 1 CTA) ở bước lập kế hoạch vì đơn giản hơn và không thực sự mất chức năng.

## 2026-09-21 (Pha 4-12 — áp theme mới cho các component còn lại, chạy song song)

### Decision

Sau Pha 3, các pha còn lại (4: expense-form, 5: member-table + quantity-selector, 6:
result-display, 7: payment + bank-select, 8: bank + qr-popup, 9: image-upload + image-lightbox,
10: setting + 3 dialog, 11-12: pwa-install-prompt/empty-state/app shell) đều thao tác trên các
tập file KHÔNG chồng lấp nhau (không có 2 pha nào cùng sửa 1 file, trừ 1 điểm giao duy nhất:
Pha 6 cần thêm 1 `id` vào `create-bill.html` — đã xác định rõ trước và giao đúng cho 1 nhánh).
Theo yêu cầu của người dùng ("phase nào có thể song song thì thực hiện song song"), toàn bộ 8
nhóm việc trên được giao cho 8 agent chạy nền độc lập cùng lúc, mỗi agent chỉ đọc/sửa đúng phạm
vi file của mình, không tự ý `ng build`/`ng lint`/git — người điều phối (tôi) tự build/lint/
review/ghi tài liệu/commit tập trung sau khi tất cả agent hoàn tất, để tránh nhiều agent cùng
sửa `styles.scss`/`docs/implementation-notes.md` gây xung đột.

### Before / After (tóm tắt theo từng pha — chi tiết đầy đủ xem diff git của từng file)

- **Pha 4 — `expense-form.scss`**: `.mat-column-amount` thêm `font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;` (số tiền khoản mục), giữ nguyên `mat-table`.
- **Pha 5 — `quantity-selector.scss`**: sửa bug `background: white` hardcode → `var(--surface-color)`;
  thêm font mono cho `.quantity-input` (giữ `text-align:center`, khác số tiền tĩnh luôn `right`).
  **`member-table.scss`**: `.mat-column-totalAmount`/`.member-card__total` thêm font mono +
  đổi màu `var(--primary-color)` → `var(--teal-dark)`; `.member-card` bỏ `box-shadow`, thêm
  `border-left: 3px solid var(--teal)` (gợi "cuống vé" mà không cần đổi cấu trúc); checkbox "Đã
  thanh toán" override 7 CSS custom property MDC (`--mdc-checkbox-selected-*`, tên đã xác nhận
  qua đọc `node_modules/@angular/material/checkbox/_m3-checkbox.scss` — không đoán) sang
  `var(--green)`.
- **Pha 6 — `result-display.html`/`.scss`/`.ts`**: đổi bảng "Khoản mục" từ `mat-table`
  (`CdkTable`) sang thẻ `<table>` HTML thường + `*ngFor` (giữ ngữ nghĩa accessibility có sẵn của
  bảng HTML, không cần tự thêm ARIA) — mỗi dòng dùng `.leader-row` (dotted-leader thật giữa tên
  và số tiền), thông tin "người tham gia"/"mỗi người trả" gộp vào `.expense-meta` (dòng phụ nhỏ,
  muted) dưới tên khoản mục, không mất thông tin so với bảng 4 cột cũ. Sticky header/footer tự
  làm bằng `position: sticky` (theo tiền lệ kỹ thuật box-shadow giả viền đã dùng ở cột `name`
  sticky trong `member-table.scss`). "Mỗi người cần trả" đổi sang ticket-lite
  (`.member-amount__stub` dải teal-soft hiện chữ cái đầu tên + `.member-amount__body`), bỏ
  hover-lift, `--notch-bg: var(--surface-color)` vì nằm trong `mat-card`. **Sửa kèm**:
  `onSettingClick()` trước đó gọi `billTabControlService.changeTab(1)` để nhảy tab "Thanh toán"
  — nhưng Pha 3 đã bỏ Thanh toán khỏi tab hẳn, nên đổi thành
  `document.getElementById('payment-section')?.scrollIntoView(...)`; thêm `id="payment-section"`
  vào đúng `<div class="payment">` trong `create-bill.html` (đây là điểm giao duy nhất giữa 2
  pha, đã lường trước khi giao việc). Xoá import `BillTabControlService`/`MatTableModule`/
  `displayedColumns` không còn dùng. Tôi (người điều phối) review thêm 1 chỗ sau khi agent xong:
  `.amount` (số tiền mỗi người trong "Mỗi người cần trả") bị đổi màu về `var(--text-primary)`
  mặc định, mất nhấn — sửa lại thành `var(--teal-dark)` + `font-weight:700` để khớp mức nhấn của
  các số tiền khác trong trang (bills list, member-table, expense-form đều tô teal-dark).
- **Pha 7 — `payment.html`**: thêm class `.mono-text` (đã có sẵn global) vào 3 input số tài
  khoản/số điện thoại. `bank-select.scss` không cần sửa (đã review, không có hardcode).
- **Pha 8 — `bank.scss`**: `.container` giảm từ `--border-radius-lg`+`--shadow-md` xuống
  `--border-radius-md`+`--shadow-sm`; ảnh QR bỏ hẳn `border-radius`/`box-shadow`, chỉ còn viền
  mảnh. **`qr-popup.scss`**: sửa bug `:host{width:"400px";max-width:"90vw"}` (quote sai khiến vô
  hiệu) → `width:400px; max-width:90vw;`. `.qr-image{background:white}` **giữ nguyên** — đã kiểm
  tra `qr.service.ts`/`result-display.ts`: ảnh QR do backend generate động qua endpoint
  `/qr/bank`/`/qr/momo` (ngoài repo frontend), không thể xác nhận chắc chắn ảnh có nền đục hay
  trong suốt, nên giữ nguyên theo đúng nguyên tắc "không chắc thì không đổi, QR cần nền trắng
  thật để máy quét đọc được". Nút Download đổi `mat-raised-button` → `mat-stroked-button` (vẫn
  teal, không dùng gold vì đây không phải CTA chính toàn app).
- **Pha 9 — `image-upload.scss`**: `box-shadow` hardcode rgba → `var(--shadow-sm)`;
  `.remove-btn` nền đen mờ hardcode → `var(--overlay-color)`; bỏ `transform: scale(1.05)` hover
  nhưng giữ nguyên phần đổi `opacity` hiện nút xoá (có ý nghĩa chức năng). `image-lightbox.scss`/
  `.html`: đọc toàn bộ, không có gì cần sửa (đã dùng biến sẵn từ trước).
- **Pha 10 — `setting.scss`**: xoá dead code `.settings-wrapper` (xác nhận không dùng trong
  `setting.html`); `.form-error-hint` đổi `var(--mat-sys-error)` → `var(--danger-color)`.
  **`edit-field-dialog.scss`** (trước đó rỗng hoàn toàn): thêm style dialog cơ bản + class
  `.mono-amount` áp cho input khi `type` là `amount`/`number` (không áp cho `text`).
  **`confirm-dialog.scss`**: không cần sửa (đã review). **`login-dialog.scss`**: thêm rule
  `.zalo-btn` bị thiếu từ trước (copy đúng layout `.google-btn`, không đổi màu icon brand Zalo).
- **Pha 11-12 — `app.scss`**: bỏ `.settings-btn:hover/.active { transform: rotate(90deg) }`
  (animation không có ý nghĩa trạng thái), thay bằng đổi `background-color: var(--surface-muted)`.
  **`pwa-install-prompt.scss`**: đổi 1 giá trị hardcode `border-radius: 12px` → `var(--border-radius-md)`
  (đúng cùng giá trị, chỉ đổi nguồn biến); animation `slideUp` giữ nguyên. **`empty-state.scss`**:
  đọc toàn bộ, xác nhận không cần sửa (đã đúng theme từ trước).
- Verify (tôi tự chạy sau khi tổng hợp tất cả nhánh, KHÔNG phải agent tự chạy): `ng build
  --configuration=development` và `ng lint` đều pass — 0 lỗi mới, chỉ còn 2 lỗi lint pre-existing
  không liên quan (`thousand-separator.ts`, `bill-splitter.service.ts`, đã ghi từ các đợt trước).
  **Chưa xem bằng mắt** trên trình duyệt thật (không có công cụ browser trong session).

### Reason

Các pha này sửa những tập file hoàn toàn tách biệt (không có 2 pha nào cùng sửa 1 file ngoài 1
điểm giao đã lường trước), nên chạy song song bằng nhiều agent độc lập giảm đáng kể thời gian so
với làm tuần tự từng pha, đúng yêu cầu của người dùng. Giữ việc build/lint/ghi tài liệu/commit ở
người điều phối (không giao cho từng agent) để tránh nhiều tiến trình cùng ghi vào 1 file
(`styles.scss` đã hoàn tất từ Pha 0-1 nên không ai cần sửa lại; `docs/implementation-notes.md`
nếu 8 agent cùng sửa sẽ conflict).

### Alternatives Considered

- **Giao luôn việc ghi `docs/implementation-notes.md` cho từng agent** — bị loại vì 8 agent viết
  đồng thời vào cùng 1 file rất dễ ghi đè/conflict lẫn nhau (agent chạy nền không thấy thay đổi
  của agent khác); gộp về 1 người viết sau khi tổng hợp toàn bộ kết quả an toàn hơn.
- **Để mỗi agent tự chạy `ng build`/`ng lint` sau khi sửa** — bị loại vì nhiều tiến trình `ng
  build` chạy đồng thời có thể cùng ghi vào 1 thư mục `dist/` (outputPath chung), dễ gây file bị
  ghi đè nửa chừng/kết quả sai; build 1 lần sau khi tất cả agent xong vừa an toàn vừa đủ để phát
  hiện lỗi tổng thể.
- **Dùng `.receipt-ticket` đúng 100% (có notch thật) cho `.member-card` (Pha 5) và
  `.member-amount` (Pha 6)** — cả 2 nhánh đều chọn đơn giản hoá thành viền mảnh + dải màu/stub
  không notch, vì cấu trúc nội dung (header/list/footer nhiều phần) phức tạp hơn ticket đơn giản
  trong mockup gốc — ưu tiên đơn giản/an toàn hơn đúng tuyệt đối hình mẫu.

## 2026-09-21 (Rà soát toàn bộ 13 pha bằng browser thật — sửa 1 bug nghiêm trọng)

### Decision

Sau khi có công cụ điều khiển browser thật (skill `run-web`, `.claude/skills/run-web/`), rà
soát lại từng pha bằng ảnh chụp thật thay vì chỉ đọc code. Phát hiện **`--mat-sys-primary`
(và 3 token liên quan) chưa từng thực sự được override** kể từ Pha 0, dù `ng build` luôn pass
và mọi chỗ tôi kiểm tra bằng mắt trước đó (FAB, tab, dropdown, checkbox...) tình cờ đều xanh
teal đúng — vì tất cả những chỗ đó dùng biến RIÊNG của app (`--teal`, `--accent-soft-bg`,
`.fab-gold`...) có `!important` đè lên, không thực sự đi qua `--mat-sys-primary`. Bug chỉ lộ ra
ở các nút Material "trần" không có override riêng, ví dụ nút trong `app-empty-state`
(`mat-raised-button color="primary"` không kèm class gì thêm) — kiểm tra bằng
`getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary')` cho ra
`light-dark(#005cbb, #abc7ff)` (azure gốc), không phải teal.

### Before

`src/styles.scss`: override `--mat-sys-primary`/`--mat-sys-on-primary`/
`--mat-sys-primary-container`/`--mat-sys-on-primary-container` được viết TIẾP TRONG cùng khối
`html { @include mat.theme(...); color-scheme: light; --mat-sys-primary: ...; }` — tưởng rằng
"khai báo sau trong cùng rule sẽ thắng" theo cascade CSS thông thường.

### After

Tách override thành **rule `html {}` HOÀN TOÀN RIÊNG**, đặt sau khối gọi `mat.theme()`, và
thêm `!important` trên cả 4 dòng (2 lớp phòng thủ, không chỉ dựa vào thứ tự source nữa):

```scss
html { @include mat.theme(...); color-scheme: light; }
html.dark { color-scheme: dark; }

html {
  --mat-sys-primary: #1B6B72 !important;
  --mat-sys-on-primary: #FFFFFF !important;
  --mat-sys-primary-container: #E3EFEE !important;
  --mat-sys-on-primary-container: #123F44 !important;
}
html.dark {
  --mat-sys-primary: #6FBFC4 !important;
  --mat-sys-on-primary: #00363A !important;
  --mat-sys-primary-container: #1B3A3D !important;
  --mat-sys-on-primary-container: #9FDEE2 !important;
}
```

Verify sau fix: `getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary')`
trả về đúng `#1B6B72` (sáng) / `#6FBFC4` (tối); nút `app-empty-state` đổi màu chữ từ
`rgb(0, 92, 187)` (azure) sang `rgb(27, 107, 114)` (teal) — xác nhận bằng ảnh chụp thật ở cả 2
theme. `ng build` vẫn pass.

Rà soát thêm bằng browser thật (điền dữ liệu giả qua form, mock API `/auth/me` và `/bills` bằng
`page.route()` để xem được các trang cần đăng nhập) xác nhận các pha còn lại **khớp thiết kế**,
không cần sửa gì thêm:
- Bills list: cuống vé + notch đục lỗ render đúng (notch khá nhỏ ở kích thước thật, phải zoom
  6x mới thấy rõ — không phải bug, chỉ là chi tiết tinh tế đúng như thiết kế).
- `result-display`: dotted-leader, "Tham gia: Thanh(x0.5)...", ticket-lite "Tổng tiền mỗi người
  cần trả" với check xanh khi đã thanh toán — đúng mockup.
- `create-bill` 2 cột desktop / tab mobile, dark mode, dropdown ngân hàng hover teal — đúng.
- `bank`/`qr-popup`: card viền mảnh không shadow nặng, QR nền trắng đục không vỡ, nút Download
  stroked teal, dialog width đúng 400px — đúng theo Pha 8.
- `login-dialog`: nút Zalo giờ đã có layout đồng nhất với nút Google — đúng theo Pha 10.

2 nghi vấn ban đầu hoá ra là **artifact của chính công cụ test**, không phải bug thật (đã xác
minh bằng `getBoundingClientRect()`/chờ transition trước khi kết luận, không sửa nhầm code
đúng): ảnh `fullPage` làm phần tử `position:fixed` (sidebar, FAB) hiện sai vị trí do Playwright
stitch nhiều đoạn cuộn; và sidebar "không thấy" khi kiểm tra `getComputedStyle` ngay sau click
— vì đọc giữa lúc CSS transition 0.3s còn đang chạy dở, chưa đợi xong.

### Reason

`ng build`/`ng lint` xanh chỉ xác nhận code hợp lệ về mặt cú pháp/kiểu, không xác nhận Sass
cascade thật sự resolve đúng ý đồ — đặc biệt với mixin phức tạp như `mat.theme()` (đã có cảnh
báo deprecation "mixed declarations" từ Pha 0 nhưng lúc đó đánh giá nhầm là vô hại). Đây đúng
là trường hợp AGENTS.md cảnh báo: kiểm tra bằng mắt trên trình duyệt thật mới phát hiện được.

### Alternatives Considered

- **Chỉ thêm `!important` mà không tách rule riêng** — có thể đã đủ để fix (vì `!important`
  thắng bất kể thứ tự), nhưng giữ nguyên cấu trúc lồng trong khối `mat.theme()` vẫn tiềm ẩn rủi
  ro tương tự cho các token khác thêm sau này; tách rule riêng loại bỏ hẳn phụ thuộc vào hành vi
  "mixed declarations" của Sass, dễ audit hơn.
- **Đổi sang dùng `mat.define-theme` với cấu hình primary tuỳ biến thay vì override token sau
  khi build** — đã cân nhắc lại ở đợt rà soát này nhưng vẫn giữ quyết định gốc từ Pha 0 (không
  có API Sass công khai để build palette M3 từ hex tuỳ ý ở bản `^20.0.2`).

## 2026-09-21 (Làm lại card "Khoản mục" cho đúng mockup đã duyệt)

### Decision

Người dùng đối chiếu ảnh chụp app thật với ảnh mockup gốc (`CreateBill.dc.html` đã duyệt ở bước
lập kế hoạch) và chỉ ra `expense-form` (card "Khoản mục") không giống thiết kế. Đúng — kế hoạch
Pha 4 (`docs/ui-redesign-plan.md`) cố tình giới hạn phạm vi rất hẹp ("chỉ thêm `.mono-amount`
cho cột số tiền, giữ nguyên `mat-table`") để giảm rủi ro, nhưng hệ quả là phần khung card
(tiêu đề + icon), nút thêm gọn kiểu icon, và danh sách item kiểu receipt (tên + số người tham
gia + số tiền + xoá) chưa từng được làm — component vẫn là `mat-table` + form field to + nút
"Thêm khoản mục" dạng text đầy đủ, khác hẳn mockup. Làm lại đúng theo mockup lần này.

### Before

- `expense-form.html`: `<form class="inline-add-form">` (class layout dùng chung toàn app) với
  2 `mat-form-field` to (có `mat-label` nổi) + `button mat-raised-button` text "Thêm khoản mục".
  Danh sách hiển thị qua `<table mat-table>` 3 cột (name/amount/actions), mỗi dòng có nút bút
  chì riêng để sửa tên/tiền, không có thông tin số người tham gia.
- `expense-form.ts`: chỉ có `expenses$`, không có `members$` — không đủ dữ liệu để tính số người
  tham gia mỗi khoản mục.
- `onSubmit()` gọi `this.expenseForm.reset()` — chỉ xoá giá trị, không xoá cờ `submitted` của
  `FormGroupDirective`, nên sau lần submit đầu tiên, các ô trống sau mỗi lần thêm mới đều hiện
  viền đỏ lỗi validation (ErrorStateMatcher mặc định của Material xét `invalid && (touched ||
  submitted)`) dù người dùng chưa động vào gì — lỗi có sẵn từ trước, chỉ lộ rõ hơn khi field co
  gọn lại theo thiết kế mới (không có `mat-label` che bớt).

### After

- `expense-form.html`: viết lại theo đúng cấu trúc mockup — `.expense-card` (khung viền mảnh,
  bo góc) chứa `<h2>` icon `receipt` + "Khoản mục", hàng nhập liệu gọn (`input` không
  `mat-label`, chỉ placeholder + `aria-label`, ô số tiền cố định 130px) và `mat-mini-fab` icon
  "+" (thay nút text to). Danh sách đổi từ `mat-table` sang `<ul class="expense-list">` +
  `*ngFor`: mỗi dòng có tên (giờ là `<button>` bấm để sửa, thay nút bút chì riêng — gọn hơn,
  vẫn giữ đúng chức năng sửa qua `EditFieldDialogComponent`, chỉ đổi cách kích hoạt), dòng phụ
  nhỏ "`N` người ăn chung" (thông tin MỚI, khớp mockup), số tiền (`.mono-amount`, cũng bấm để
  sửa) và nút xoá mờ (opacity 0.6→1 khi hover, theo đúng pattern cũ).
- `expense-form.ts`: thêm `members$` (từ `billSplitterService.members$`) và
  `getParticipantCount(expense, members)` (giống hệt cách tính ở `result-display.ts`) để bind
  "N người ăn chung". Sửa `onSubmit()` nhận thêm `FormGroupDirective` (qua template ref
  `#expenseFormDirective="ngForm"`) và gọi `formDirective.resetForm()` thay vì
  `expenseForm.reset()` — xoá luôn cờ `submitted`, hết viền đỏ dai dẳng sau mỗi lần thêm.
- `expense-form.scss`: viết mới hoàn toàn theo khung `.expense-card`, không còn phụ thuộc
  `.inline-add-form`/`.data-table-scroll` (2 class layout dùng chung của `styles.scss`) — nút
  "+" tô `var(--teal)` khi hợp lệ, `var(--surface-muted)` khi disabled (không dùng `.fab-gold`
  vì đây không phải CTA chính toàn app).
- Verify: `ng build` + `ng lint` pass. Xem bằng browser thật (skill `run-web`) ở cả 2 theme,
  cả mobile (390px, hàng nhập liệu tự xuống dòng) và desktop, xác nhận: nút "+" đổi màu đúng
  theo trạng thái hợp lệ/disabled, viền đỏ không còn lặp lại sau khi thêm khoản mục, layout
  khớp sát mockup (tiêu đề icon, danh sách kiểu receipt có số người tham gia).

### Reason

Kế hoạch Pha 4 chủ động thu hẹp phạm vi để giảm rủi ro ở giai đoạn đó (ưu tiên làm
`result-display` — màn hình trọng tâm — trước), nhưng việc đó vô tình bỏ sót phần khung/danh
sách của `expense-form` dù đây cũng là 1 trong 2 card chính ở màn hình tạo hoá đơn theo mockup
đã duyệt. Người dùng phát hiện qua so sánh ảnh trực tiếp — đúng loại sai lệch mà lẽ ra nên bắt
được ở bước rà soát trước đó nếu so ảnh mockup cạnh ảnh app thật thay vì chỉ soát theo hạng mục
kỹ thuật (dark mode, breakpoint, override Material...).

### Alternatives Considered

- **Giữ nút bút chì riêng để sửa tên/tiền** (như bản cũ) thay vì bấm trực tiếp vào text — bị bỏ
  vì mockup không có icon bút chì nào, thêm 2 icon nữa mỗi dòng sẽ rối hơn hẳn so với thiết kế;
  bấm-để-sửa là pattern phổ biến và giữ nguyên được chức năng.
- **Không sửa bug viền đỏ, để nguyên phạm vi chỉ đổi UI** — cân nhắc nhưng bug này LỘ RÕ ngay
  trong ảnh chụp khi làm theo thiết kế mới (ô nhỏ lại, không còn `mat-label` che bớt phần viền),
  và fix chỉ tốn vài dòng (đổi `reset()` → `resetForm()`) nên sửa luôn thay vì để lại một sai
  lệch mới với mockup (mockup không có trạng thái lỗi đỏ dai dẳng).

## 2026-09-22 (cải thiện UI card `app-bank`: grid label-value, nhấn mạnh số tài khoản, feedback copy, khung QR)

### Decision

Người dùng gửi ảnh chụp card "Thông tin ngân hàng" và hỏi đề xuất cải thiện giao diện. Sau khi
xem `bank.html`/`bank.scss`, đề xuất 3 điểm và người dùng đồng ý thực hiện cả 3: (1) đưa 3 dòng
"Ngân hàng/Họ tên/Số tài khoản" từ `<p><strong>` sang layout dạng bảng 2 cột (label - value) để
căn thẳng hàng, số tài khoản in đậm + font mono để dễ đọc/copy hơn; (2) nút copy đổi icon thành
`check` tạm thời (2s) sau khi copy thành công, thay vì chỉ dựa vào snackbar; (3) bọc khung nền
(`--surface-muted`) quanh ảnh QR kèm caption "Quét để chuyển khoản" để nhóm QR thành 1 khối rõ
ràng hơn thay vì ảnh trơ trọi.

Không thêm logo ngân hàng như gợi ý ban đầu — `BankInfoItem`/`BankItem` (`bank.model.ts`) không
có field logo/icon URL nào, thêm vào sẽ vượt phạm vi 1 lần chỉnh UI đơn thuần.

### Before

- `bank.html`: mỗi dòng thông tin là 1 thẻ `<p><strong>Label: </strong><span>Value</span></p>`
  riêng lẻ, không căn cột; số tài khoản cùng cỡ chữ với các dòng khác; nút copy luôn hiện icon
  `content_copy` tĩnh; ảnh QR (`<img>`) đặt trực tiếp trong `.right`, không có khung/caption.
- `bank.ts`: `onCopyAccountNumber`/`onCopyMomoAccountNumber` chỉ mở snackbar, không có state phản
  hồi trên chính nút bấm.
- `bank.scss`: `.left` dùng `flex-direction: column` + `gap` cho từng `<p>`; `.right` chỉ style
  `img` (border, max-width).

### After

- `bank.html`: 2 khối info (ngân hàng, Momo) đổi sang `<div class="info-grid">` gồm các cặp
  `span.label` / `span.value`; dòng số tài khoản/số điện thoại dùng `span.value--account` bọc
  `span.mono-text.account-number` (tái dùng class `.mono-text` có sẵn ở `styles.scss` — đã được
  ghi chú "dùng cho số tài khoản/số điện thoại, KHÔNG in đậm như tiền" — nên chỉ thêm bold+size
  qua `.account-number` cục bộ, không sửa class global) + nút copy `[class.copy-btn--copied]`
  đổi `<mat-icon>` giữa `content_copy` và `check` theo state. Ảnh QR bọc trong `div.qr-frame` +
  `span.qr-caption`.
- `bank.ts`: thêm 2 field `isAccountNumberCopied`/`isMomoNumberCopied`; trong `.then()` của
  `navigator.clipboard.writeText(...)` set `true` rồi `setTimeout(() => ... = false, 2000)` để
  icon tự trở lại sau 2s (không cần thêm `ChangeDetectorRef` vì component đang ở default zone).
- `bank.scss`: `.left` bỏ style cũ của từng `<p>`, chuyển style vào `.info-grid` (CSS grid
  `auto 1fr`, `.label` bold màu `--text-primary`, `.account-number` tăng size + bold); thêm
  `.qr-frame` (nền `--surface-muted`, border, radius, giống pattern card-trong-card đã dùng ở
  nơi khác trong app) và `.qr-caption`; thêm modifier `.copy-btn--copied` đổi màu icon sang
  `--primary-color`; sửa media query mobile để nhắm `.info-grid`/`.account-number` thay vì
  `.left` (do đã đổi cấu trúc).
- Verify: `ng serve` + skill `run-web`, chụp cả desktop (1280px) và mobile (390px) sau khi chọn
  ngân hàng + điền số tài khoản/Momo trên `create-bill`. Xác nhận: grid label-value thẳng hàng,
  số tài khoản nổi bật rõ, khung QR có caption, layout mobile xếp QR lên trên hợp lý. Không test
  được icon `check` thật qua Playwright headless vì `navigator.clipboard.writeText` bị chặn bởi
  policy sandbox của Chromium headless (`NotAllowedError: Write permission denied`) — đây là hạn
  chế môi trường test, không phải lỗi code; logic set/reset boolean qua `setTimeout` đơn giản và
  đã soát lại bằng mắt.

### Reason

Người dùng chủ động hỏi góp ý UI cho 1 component cụ thể (không phải yêu cầu sửa bug), agent đề
xuất theo nguyên tắc UX chung (phân cấp thông tin, feedback tức thời cho hành động, nhóm trực
quan phần tử liên quan) và người dùng duyệt toàn bộ trước khi triển khai.

### Alternatives Considered

- **Thêm logo ngân hàng cạnh tên** — bị loại vì không có dữ liệu logo trong model, sẽ cần thêm
  field mới + nguồn ảnh, vượt phạm vi 1 lần chỉnh CSS/layout.
- **Dùng animation/transition phức tạp hơn cho nút copy** (vd. scale, ripple riêng) — chọn cách
  đơn giản nhất (đổi icon + màu, tự reset sau 2s) vì đã có Material ripple mặc định trên
  `mat-icon-button`... (thực ra `copy-btn` là `<button>` thường, không phải `mat-icon-button`,
  nhưng đổi thành mat-icon-button sẽ đổi hành vi hiện tại — giữ nguyên `<button>` thường để không
  đổi phạm vi ngoài yêu cầu).

## 2026-09-22 (cải thiện UI dialog `qr-popup`: nút đóng nhanh, caption QR, cân đối trọng số action)

### Decision

Tiếp tục mạch cải thiện UI trước đó (`app-bank`), người dùng chọn dòng `qr-image-container` trong
`qr-popup.html` và hỏi đề xuất cải thiện giao diện. Agent đề xuất 3 điểm, người dùng đồng ý triển
khai cả 3: (1) thêm nút đóng nhanh dạng icon `close` ở góc phải header, bên cạnh nút "Đóng" đã có
sẵn ở actions (không bỏ nút cũ — dialog QR có thể được thao tác trên mobile nơi nút icon góc trên
thuận tay hơn); (2) thêm caption "Quét mã để xem chi tiết" dưới ảnh QR, nhất quán với caption vừa
thêm ở `app-bank`; (3) đảo trọng số 2 nút action — "Download" (hành động chính) đổi từ
`mat-stroked-button` sang `mat-raised-button color="primary"`, "Đóng" (hành động phụ) đổi từ
`mat-raised-button` sang `mat-stroked-button`, đồng thời đổi thứ tự DOM (Đóng trước, Download sau)
để nút chính nằm cuối cùng bên phải theo `align="end"` — đúng quy ước thường gặp (hành động chính
ở vị trí dễ bấm nhất, thường là ngoài cùng bên phải).

### Before

- `qr-popup.html`: `mat-card-header` chỉ có `mat-card-title`, không có nút đóng nào ở header.
  `.qr-image-container` chỉ chứa `<img>`, không có caption. `mat-card-actions` có "Download"
  (`mat-stroked-button color="primary"`) đứng trước, "Đóng" (`mat-raised-button`, không màu) đứng
  sau.
- `qr-popup.scss`: `.qr-image-container` là `flex` hàng ngang căn giữa, không có style cho
  caption. `mat-card-header { position: relative; ... }` đã có sẵn (chưa dùng tới) — có vẻ để
  dành cho việc định vị tuyệt đối 1 phần tử con sau này.

### After

- `qr-popup.html`: thêm `<button mat-icon-button class="close-button" aria-label="close dialog"
  (click)="closeDialog()"><mat-icon>close</mat-icon></button>` ngay trong `mat-card-header`, tái
  dùng lại đúng hàm `closeDialog()` mà nút "Đóng" ở dưới đang gọi (không thêm state/logic mới).
  Thêm `<span class="qr-caption">Quét mã để xem chi tiết</span>` sau `<img>` trong
  `.qr-image-container`. Đảo thứ tự + đổi variant 2 nút action: "Đóng" (`mat-stroked-button`,
  không màu) đứng trước, "Download" (`mat-raised-button color="primary"`) đứng sau.
- `qr-popup.scss`: `.qr-image-container` đổi `flex-direction: column` + `gap: 8px` để chứa thêm
  caption theo chiều dọc dưới ảnh (giữ nguyên `align-items: center`). Thêm `.qr-caption` (font
  nhỏ, màu `--text-secondary`, giống `.qr-caption` vừa thêm ở `bank.scss`). Thêm `.close-button`
  dùng `position: absolute; top: 8px; right: 8px;` — tận dụng đúng `position: relative` đã có sẵn
  trên `mat-card-header` từ trước.
- Verify: `ng serve` + skill `run-web` — dựng lại luồng tạo hoá đơn thật (thêm khoản mục, thành
  viên, gán khối lượng tiêu thụ, chọn ngân hàng + điền số tài khoản) để `<app-bank>` và nút
  "Hiện QR ngân hàng" xuất hiện đủ điều kiện (`isShowBankInfo`), sau đó bấm mở `qr-popup` thật qua
  `result-display.showQRPopup()`. Chụp ảnh xác nhận: nút X hiện đúng vị trí góc phải header,
  caption hiện dưới QR, Download đã đổi màu primary/raised còn Đóng đổi thành stroked; bấm nút X
  đóng dialog thành công (dialog biến mất khỏi DOM).

### Reason

Người dùng chủ động hỏi góp ý UI cho dialog QR sau khi vừa duyệt cách làm tương tự ở `app-bank`,
áp dụng cùng nguyên tắc: nhất quán ngôn ngữ thiết kế (caption dưới QR), thêm lối thoát nhanh cho
dialog (chuẩn UX phổ biến), và đúng phân cấp thị giác cho hành động chính/phụ.

### Alternatives Considered

- **Bỏ hẳn nút "Đóng" ở actions sau khi đã có nút X** — cân nhắc nhưng giữ lại vì đây là dialog
  QR có thể dùng trên mobile, có nút đóng ở cả 2 vị trí (góc trên quen thuộc + actions rõ ràng)
  không phải anti-pattern nghiêm trọng, và người dùng không yêu cầu bỏ; giữ để không thu hẹp vùng
  bấm ngoài ý muốn.
- **Định vị nút X bằng flex/justify-content thay vì absolute** — bị loại vì sẽ phải bọc thêm 1
  `<div>` quanh title, trong khi `mat-card-header` đã có sẵn `position: relative` (dấu hiệu được
  chuẩn bị trước cho đúng mục đích này), dùng `position: absolute` đơn giản hơn và không đổi cấu
  trúc DOM ngoài việc thêm nút.

## 2026-09-22 (fix global: `.mat-mdc-raised-button` thiếu trong rule bo góc `border-radius-sm`)

### Decision

Người dùng phát hiện qua ảnh chụp `qr-popup`: nút "Download" (bo tròn hẳn, pill) và nút "Đóng"
(bo góc vuông vức hơn) có hình dạng khác nhau dù cùng nằm trong 1 `mat-card-actions`. Điều tra
`styles.scss:195` thấy rule `border-radius: var(--border-radius-sm) !important` chỉ áp cho
`.mat-mdc-button, .mat-mdc-unelevated-button, .mat-mdc-outlined-button` — thiếu
`.mat-mdc-raised-button` (class mà `mat-raised-button` sinh ra), nên MỌI nút `mat-raised-button`
trong toàn app (không riêng `qr-popup`) đang giữ nguyên bo tròn pill mặc định của Material 3,
lệch với style "biên nhận" (bo góc nhẹ `--border-radius-sm` = 8px) áp dụng nhất quán ở mọi nơi
khác. Đã hỏi người dùng chọn giữa sửa cục bộ (chỉ `qr-popup.scss`) hoặc sửa global — người dùng
chọn sửa global vì đây rõ ràng là thiếu sót trong rule dùng chung, không phải khác biệt có chủ
đích.

### Before

```scss
.mat-mdc-button, .mat-mdc-unelevated-button, .mat-mdc-outlined-button {
  border-radius: var(--border-radius-sm) !important;
  ...
}
```

### After

```scss
.mat-mdc-button, .mat-mdc-unelevated-button, .mat-mdc-outlined-button, .mat-mdc-raised-button {
  border-radius: var(--border-radius-sm) !important;
  ...
}
```

- Verify: `getComputedStyle` qua `run-web` xác nhận cả "Đóng" và "Download" trong `qr-popup` đều
  trả về `border-radius: 8px`. Kiểm tra thêm nút CTA vàng "Lưu & chia sẻ" (`mat-raised-button` +
  `.btn-gold`, dùng ở `create-bill`/`bill-details`) — cũng đổi từ pill sang bo góc 8px, đã chụp
  ảnh xác nhận cả light lẫn dark mode đều nhất quán, không có nút nào bị lệch nền/màu do đổi
  border-radius.

### Reason

Rule border-radius-sm là ngôn ngữ hình ảnh chung "biên nhận giấy" áp cho toàn bộ nút trong app;
thiếu 1 loại button (`raised`) trong danh sách selector là một lỗ hổng ở rule dùng chung, ảnh
hưởng mọi nơi dùng `mat-raised-button` (kể cả CTA chính "Lưu & chia sẻ"), không phải giới hạn ở
`qr-popup`. Sửa global giải quyết tận gốc thay vì phải lặp lại 1 override cục bộ mỗi khi
`mat-raised-button` xuất hiện ở component mới.

### Alternatives Considered

- **Chỉ override cục bộ trong `qr-popup.scss`** (`.download-button { border-radius: ... }`) —
  bị loại vì không sửa gốc, các nút `mat-raised-button` khác trong app (CTA vàng, nút Lưu ở các
  dialog...) vẫn lệch, để lại đúng loại thiếu nhất quán mà người dùng vừa phát hiện, có nguy cơ
  lặp lại vấn đề này ở component mới sau này.
