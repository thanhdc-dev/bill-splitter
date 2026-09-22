# Kế hoạch làm mới UI — Bill Splitter (theo hướng "biên nhận giấy")

> Trạng thái: **chờ review** — chưa bắt đầu triển khai. Sau khi duyệt, code sẽ được thực hiện theo
> đúng thứ tự các Pha dưới đây, mỗi pha có commit riêng để dễ review diff.

## Context

App bill-splitter đang dùng theme Angular Material 3 mặc định (`mat.$azure-palette`, Inter) — mọi
card/list-item đều bo góc + shadow xám giống nhau ("SaaS card kit"), không có bản sắc riêng, và số
tiền (nội dung quan trọng nhất) không được ưu tiên về mặt đọc/so sánh. Người dùng đã duyệt một mockup
trực quan (Artifact) theo hướng "hoá đơn/biên nhận giấy": màu lấy cảm hứng từ tiền Việt Nam (teal +
vàng đồng) thay cho azure Material, số tiền dùng font mono căn phải, motif ticket-stub/perforation
cho list, dotted-leader cho bảng chi tiêu, tear-line cho ranh giới nhập liệu/tổng kết. Mục tiêu của
kế hoạch này là áp phong cách đó vào toàn bộ code Angular thật, theo từng màn hình.

Toàn bộ codebase liên quan (`styles.scss`, `app.scss`, 20 component trong `src/app/components/`,
model, service liên quan) đã được khảo sát chi tiết trước khi viết plan này.

## Quyết định đã chốt với người dùng (không cần hỏi lại)

1. **Gộp FAB**: bỏ hẳn nút "Lưu tự động" riêng, chỉ còn 1 FAB "Lưu & chia sẻ" (gold). Về kỹ thuật an
   toàn: `save(true)` (`create-bill.ts:126-160`) đã luôn gọi `createBill()` trước khi copy URL, nên
   không mất khả năng lưu, chỉ mất khả năng "lưu mà không copy link".
2. **Vị trí `app-payment`** khi desktop chuyển 2 cột: đặt full-width ngay dưới hàng 2 cột
   (Khoản mục | Thành viên), bỏ hẳn khỏi tab trên desktop.
3. **Bills list thiếu `totalAmount`/`memberCount`**: `BillFindAll` (`bill-splitter.model.ts:62-68`)
   hiện chỉ có `{code, name, createdAt}` — KHÔNG có 2 field này (đã xác nhận đọc code, đây là backend
   khác repo). → Thêm field **optional** vào interface, UI ẩn/hiện dấu gạch ngang khi thiếu, KHÔNG gọi
   thêm API per-item (tránh N+1). Việc bổ sung backend nằm ngoài phạm vi commit frontend này.
4. **Nguyên tắc gold vs teal**: gold CHỈ dùng cho đúng 1 CTA chính toàn app (FAB "Lưu & chia sẻ").
   Mọi nút hành động khác (Download QR, Lưu trong dialog sửa khoản mục, Thêm khoản mục/thành viên...)
   dùng teal.

Các điểm nhỏ khác tự quyết định (nêu rõ để review, không cần hỏi lại):
- Badge mã bill: bỏ pill uppercase, hiện dạng text nhỏ màu `--ink-soft` cạnh tên (không nổi bật).
- Icon tròn kiểu Material ở `empty-state`/`image-lightbox`: **giữ nguyên**, không đổi sang hình vuông
  — ưu tiên thời gian cho phần có tác động UX lớn hơn.
- `qr-popup.scss` `.qr-image{background:white}`: chỉ đổi nếu xác nhận ảnh QR server trả nền trong
  suốt; nếu ảnh đã có nền trắng in sẵn thì giữ `white` cố định (không theo dark mode) vì QR cần nền
  trắng thật để máy quét đọc được — kiểm tra thực tế ở Pha 8 trước khi sửa.

## Token thiết kế mới (nguồn sự thật — dùng ở mọi pha)

```
--ink:#1C1B1A          --ink-soft:#6E6862
--paper:#F7F3EC         --surface:#FFFFFF
--border:rgba(28,27,26,.16)     --border-subtle:rgba(28,27,26,.08)
--teal:#1B6B72  --teal-dark:#123F44  --teal-soft:#E3EFEE      (primary — thay azure)
--gold:#B8722E  --gold-soft:#F5E6D3                            (CHỈ CTA chính)
--green:#2F7D4F --green-soft:#E1F0E5                            (success/đã thanh toán)
--font-mono: 'IBM Plex Mono', ui-monospace, monospace          (CHỈ cho số tiền/số lượng)
```
Giữ nguyên `--momo-color` (brand Momo, hồng) và giữ đỏ cho danger — không đổi 2 màu này.
Mỗi biến raw trên cần cặp giá trị riêng trong `html.dark {...}` (không thể ăn theo `light-dark()`
tự động của Material nữa vì giờ là màu literal do ta tự quản, khác với cách làm cũ dựa 100% vào
`--mat-sys-*`).

## Thứ tự triển khai theo pha

### Pha 0 — Hạ tầng token + font (bắt buộc làm trước tiên)
**File:** `src/styles.scss`, `src/index.html`
- Thêm Google Fonts IBM Plex Mono vào `<link>` sẵn có trong `index.html` (cùng request với Inter).
- Thay đổi cách gọi `mat.theme()`: không dùng `mat.$azure-palette` nữa, cấu hình màu primary/tertiary
  từ palette suy ra từ `#1B6B72`/`#B8722E` (cần build thử `ng build` để chắc API `mat.define-colors`
  chấp nhận, vì Material 3 đòi cấu trúc palette nhất định, không chỉ gán hex tuỳ ý).
- Viết lại block `:root {...}`/`html.dark {...}` theo 2 lớp: lớp "raw" (token mới, liệt kê ở trên) và
  lớp "role" (giữ tên biến cũ `--primary-color`, `--bg-color`... trỏ vào raw mới) để không phải sửa
  hàng trăm chỗ đang dùng `var(--primary-color)` trong các component.
- **Giữ nguyên ý nghĩa `--accent-soft-bg`** (= teal soft, không đổi thành gold) để tránh side-effect
  ngầm ở `bills.scss`/`image-upload.scss` đang dùng biến này cho hover — thêm biến MỚI riêng
  `--gold-soft-bg`/`--gold-soft-fg` cho CTA.
- Verify: `ng serve`, test cả 2 theme, kiểm tra contrast (AA) ink/paper, ink/surface, trắng/teal,
  trắng/gold; test nút `color="warn"` vẫn tách bạch rõ khỏi teal/gold.

### Pha 1 — Motif dùng chung + override Material toàn cục
**File:** `src/styles.scss`
- Class `.receipt-ticket` (+ `.receipt-ticket__stub`) cho ticket-stub, dùng `::before/::after` làm 2
  notch tròn (perforation) — quy ước biến `--notch-bg` (mặc định `var(--bg-color)`, nơi đặt trong
  card/dialog khác nền phải tự override) vì notch giả lập lỗ đục bằng hình tròn cùng màu nền cha.
- Class `.leader-row`/`.leader-row__fill` (dotted-leader: `border-bottom: 2px dotted var(--border)`).
- Class `.tear-line` (border dashed + 2 notch 2 đầu) cho ranh giới nhập liệu/tổng kết.
- Class `.mono-amount` (font mono, `tabular-nums`, dùng cho MỌI số tiền tĩnh) và `.mono-text` (số tài
  khoản, không phải tiền).
- Class `.btn-gold`/`.fab-gold` cho CTA chính (phẳng, ít shadow) — các nút khác giữ teal qua
  `color="primary"` như hiện tại (không cần đổi nhiều).
- Override toàn cục `.mat-mdc-option:hover/.selected` (dropdown `mat-select` render ngoài DOM component
  qua `.cdk-overlay-container`, không override được từ style riêng của `bank-select.scss`), và
  `.mat-mdc-dialog-surface` (border/radius mới cho mọi dialog).
- Bớt `box-shadow` mặc định của `.mat-mdc-fab`/`.mat-mdc-card` (dòng 102-124 hiện tại) theo hướng "ít
  shadow, viền mảnh là chính".
- Verify: mở `bank-select` dropdown và 1 dialog (`confirm-dialog`) xem hover option/border đổi đúng;
  test Tab/focus-visible trên `.btn-gold`.

### Pha 2 — Danh sách hoá đơn (`components/bills/`)
**File:** `bills.html`, `bills.scss`, `bills.ts`
- Đổi `.bill` từ card bo góc đều sang `.receipt-ticket` (stub teal trái hiện ngày `dd/thg M`).
- Bỏ badge uppercase pill `.bill-code`; hiện mã dạng text nhỏ `--ink-soft` cạnh tên.
- Bỏ hover `transform: translateY(-2px)` — chỉ đổi border-color khi hover.
- Thêm hiển thị tổng tiền (`.mono-amount`) + số người, field optional theo quyết định #3 (ẩn nếu
  API chưa trả — mở rộng interface `Bill` cục bộ trong `bills.ts`).
- Verify: 3 trạng thái (loading/error/empty/có data), responsive ≤480/768px, dark mode.

### Pha 3 — Trang tạo hoá đơn: layout + FAB (`components/create-bill/`)
**File:** `create-bill.html`, `create-bill.scss`, `create-bill.ts`
- Thống nhất 1 breakpoint **768px** cho toàn trang (khớp `MOBILE_BREAKPOINT` của `member-table.ts`,
  thay `600px` hiện tại).
- Dùng `BreakpointObserver` (giống `member-table.ts`) để chỉ render 1 bộ DOM tại 1 thời điểm: mobile
  → giữ `mat-tab-group` 2 tab (Khoản mục/Thành viên); desktop → `.two-col-layout` (grid `1.25fr 1fr`)
  chứa `app-expense-form` + `app-member-table`, KHÔNG double-render 2 instance cùng lúc (tránh 2 form
  cùng subscribe `expenses$`/`members$`).
- `app-payment` chuyển ra full-width dưới `.two-col-layout` ở CẢ 2 breakpoint (bỏ khỏi tab hẳn, theo
  quyết định #2) — nghĩa là `mat-tab-group` trên mobile giờ chỉ còn 2 tab, không còn 3.
- **Guard bắt buộc**: `ngAfterViewInit` hiện gọi `this.tabGroup.selectedIndex = index`
  (`create-bill.ts:118-124`) khi `BillTabControlService` phát tín hiệu — khi ở desktop `tabGroup` có
  thể undefined (không còn cần chuyển tab payment vì payment đã full-width) → thêm `if (this.tabGroup)`
  và xem lại `result-display.ts` (`onSettingClick`) có còn cần nhảy tab không khi payment không còn
  là tab riêng (có thể đổi thành scroll-to-element).
- Gộp FAB theo quyết định #1: bỏ `.auto-save-button`, đổi `.share-button` sang `.fab-gold`, cập nhật
  vị trí `upload-progress` (hiện định vị theo có 2 FAB xếp chồng, cần dịch lại khi chỉ còn 1).
- Verify: resize qua 768px xem chuyển layout đúng không lỗi `tabGroup` undefined; test luồng save/share
  đầy đủ (chưa đăng nhập → dialog → tiếp tục lưu); dark mode.

### Pha 4 — expense-form
**File:** `expense-form.scss`, `expense-form.html`
- Thêm `.mono-amount` cho cột số tiền (giữ `text-align:right`, màu teal).
- **Giữ nguyên `mat-table` + `.data-table-scroll`** (không đổi sang dotted-leader ở pha này — dotted-
  leader cấu trúc mới chỉ làm ở Pha 6/result-display trước để giảm rủi ro làm 2 nơi cùng lúc; nếu ổn
  sẽ áp lại cho expense-form sau, không nằm trong phạm vi lần này).
- Verify: thêm/sửa/xoá khoản mục, dialog sửa tên/tiền vẫn hoạt động.

### Pha 5 — member-table + quantity-selector
**File:** `quantity-selector.scss`, `member-table.scss`, `member-table.html`
- Sửa bug `background: white` hardcode (`quantity-selector.scss:9`) → `var(--surface-color)`.
- Thêm `font-family: var(--font-mono)` cho `.quantity-input` (ưu tiên cao — nơi nhập số lượng trực
  tiếp), giữ `text-align:center` (khác với số tiền tĩnh luôn `right`).
- `.member-card` → dùng `.receipt-ticket` (đơn giản hoá, không cần notch nếu quá rối với bảng con).
- `.member-card__total`/`.mat-column-totalAmount` → `.mono-amount`.
- Custom màu `mat-checkbox` "Đã thanh toán" sang `--green` (qua CSS variable MDC — cần soi tên biến
  đúng theo Angular Material đang dùng, kiểm tra bằng DevTools trước khi áp).
- Verify: nhập số lượng qua bàn phím + nút +/-, cả 2 layout mobile/desktop (breakpoint 767px), dark
  mode (bug background:white phải hết).

### Pha 6 — result-display (trọng tâm, rủi ro kỹ thuật cao nhất)
**File:** `result-display.html`, `result-display.scss`, (đọc lại `result-display.ts` — không sửa
logic tính toán, chỉ nơi render)
- Viết lại bảng "Khoản mục" từ `mat-table` sang layout thủ công (`*ngFor` + flex mỗi dòng) để có
  dotted-leader THẬT giữa tên và số tiền (mat-table không cho chèn span kéo dài giữa 2 cột trong 1
  hàng) — cột "Người tham gia" chuyển thành dòng phụ nhỏ dưới tên khoản mục.
- Tự thêm `role="table"/"row"/"cell"` hoặc dùng `<table>` semantic để không mất accessibility của
  `mat-table` cũ; sticky header/footer tự làm bằng `position: sticky` (test kỹ Safari mobile).
- `.member-amounts .member-amount` → "ticket-lite" theo mockup: dùng `.receipt-ticket` thu nhỏ, icon
  trạng thái đã trả (green) / nút QR (teal).
- Bỏ hover `translateY(-2px)`; amount → `.mono-amount`.
- Làm SAU Pha 3 (phối hợp qua `BillTabControlService`/`onSettingClick`).
- Verify: nhiều khoản mục/tên dài, empty state, sticky header khi cuộn ngang mobile, Tab qua từng
  dòng + đọc Accessibility Tree trong DevTools.

### Pha 7 — payment + bank-select
**File:** `payment.scss`, `bank-select.scss`
- Giữ `--momo-color` riêng cho tab Momo (không đổi). Outline `mat-form-field` ăn theo Pha 1 (không
  cần sửa riêng nhiều).
- `bank-select` dropdown hover ăn theo override toàn cục ở Pha 1, không cần sửa riêng.
- Verify: chuyển tab Ngân hàng/Momo, chọn bank, nhập liệu, cả 2 theme.

### Pha 8 — bank + qr-popup
**File:** `bank.scss`, `qr-popup.scss`, `qr-popup.html`
- `.container` (bo góc lớn + shadow) → khung "phiếu/tem" (viền mảnh, bỏ shadow to). Ảnh QR bỏ
  border-radius/shadow, thêm viền mảnh kiểu tem.
- Sửa bug `:host{width:"400px";max-width:"90vw"}` (bỏ quote sai).
- `.qr-image{background:white}`: kiểm tra ảnh QR server có nền trong suốt không TRƯỚC khi đổi (xem
  ghi chú ở phần quyết định).
- Nút Download: đổi từ `mat-raised-button` sang phẳng, màu **teal** (không phải gold — theo quyết
  định #4).
- Verify: mở popup QR 2 theme, đo `:host` width có hiệu lực thật, test download.

### Pha 9 — image-upload + image-lightbox
**File:** `image-upload.scss`, `image-lightbox.scss` (đọc lại trước khi sửa — chưa khảo sát hết)
- Đổi `box-shadow rgba(...)` hardcode → `var(--shadow-sm)`; `.remove-btn` nền đen mờ hardcode →
  `var(--overlay-color)`.
- Bỏ `transform: scale(1.05)` hover trên `.preview-item` nhưng GIỮ phần đổi opacity hiện nút xoá
  (có ý nghĩa chức năng, không phải trang trí thuần).
- Verify: upload/xoá/xem ảnh, dark mode, nút xoá hiện đúng trên mobile.

### Pha 10 — setting + dialog (confirm/edit-field/login)
**File:** `setting.scss`, `edit-field-dialog.scss`, `confirm-dialog.scss`, `login-dialog.scss`
- Dọn dead code `.settings-wrapper` (không dùng trong HTML).
- Đổi `.form-error-hint` từ `var(--mat-sys-error)` → `var(--danger-color)` (thống nhất nguồn biến).
- `edit-field-dialog.scss` (hiện rỗng): thêm style dialog mới + **bắt buộc `.mono-amount`/`.mono-text`
  cho input** (đây là nơi sửa số tiền/số lượng) — nút Lưu màu teal (không phải CTA chính toàn app).
- `login-dialog.scss`: bổ sung rule `.zalo-btn` đang THIẾU (đã xác nhận đọc `login-dialog.html:40-98`
  — class `.zalo-btn` tồn tại trong HTML nhưng không có CSS tương ứng, chỉ `.google-btn` được style).
- Verify: mở từng dialog cả 2 theme, input tiền hiện mono, nút Zalo có style đúng.

### Pha 11 — dọn nhẹ: pwa-install-prompt, empty-state, oauth-callback
**File:** `pwa-install-prompt.scss`, `empty-state.scss`
- Chỉ rà lại border-radius/shadow theo token mới (đã dùng biến sẵn, phần lớn tự ăn theo Pha 0).
- `empty-state`: giữ nguyên icon tròn + border dashed sẵn có (đã gần đúng phong cách receipt).
- `oauth-callback`: không cần sửa (màu spinner ăn theo Pha 0 tự động).

### Pha 12 — app shell (header + sidebar)
**File:** `src/app/app.scss`
- Bỏ `.settings-btn:hover/.active { transform: rotate(90deg) }` (animation xoay không có ý nghĩa
  trạng thái) — chỉ giữ đổi màu nền khi active.
- Verify: mở/đóng sidebar, đăng nhập/đăng xuất, đổi theme từ header.

## Phụ thuộc giữa các pha
Pha 0 → Pha 1 bắt buộc trước tất cả. Pha 6 nên làm sau Pha 3 (phối hợp qua
`BillTabControlService`). Các pha còn lại (2, 4, 5, 7, 8, 9, 10, 11, 12) độc lập tương đối, có thể
làm theo đúng thứ tự trên (ưu tiên theo giá trị UX/rủi ro).

## Tài liệu hoá theo AGENTS.md
Mỗi pha khi triển khai thực tế cần bổ sung mục vào `docs/implementation-notes.md` theo định dạng
chuẩn của repo (Decision/Before/After/Reason/Alternatives Considered) — đặc biệt cho các quyết định
đã chốt ở trên (gộp FAB, vị trí payment, xử lý field thiếu ở bills list, nguyên tắc gold/teal) vì đây
đúng là loại quyết định "khác với đặc tả/đánh đổi được chấp nhận" mà AGENTS.md yêu cầu ghi vết.

## Verify tổng thể sau khi xong toàn bộ
- `ng serve` + click qua toàn bộ luồng chính: tạo hoá đơn → thêm khoản mục/thành viên → xem kết quả
  chia tiền → thêm QR/Momo → lưu & chia sẻ → mở lại từ danh sách.
- Test dark/light ở mọi màn hình đã sửa.
- Test breakpoint 768px (resize DevTools) cho `create-bill` và `member-table`.
- Test accessibility: Tab qua toàn bộ nút/link, kiểm tra focus-visible rõ trên nền teal/gold mới,
  contrast tối thiểu AA.
- `ng build` để chắc chắn theme Material config mới (Pha 0) không lỗi build.
