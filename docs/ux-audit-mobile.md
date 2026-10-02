# Báo cáo kiểm tra UX mobile — bill-splitter

- Ngày kiểm tra: 2026-10-01 → 2026-10-02
- Commit làm mốc: `1482fc0` (feat(share): Web Share API) — working tree sạch lúc kiểm tra
- Phạm vi: đọc code (không sửa) + chạy app thật bằng skill `run-web` (Playwright, Chromium headless) ở viewport 360×740, thêm một lần ở 1024×800, backend `http://localhost:3000`
- Trạng thái lúc kiểm tra ban đầu: chưa sửa gì. **Cập nhật 2026-10-02 (đối chiếu lại code + app thật, HEAD `3cab523`)**: xem bảng tổng kết ngay dưới; các mục đánh dấu ✅ đã được sửa.


## Tổng kết đối chiếu lại (2026-10-02, HEAD `3cab523`)

Kiểm tra bằng đọc code + chạy app thật (skill `run-web`, 360×740, backend local).

| Trạng thái | Mục |
|---|---|
| ✅ Đã sửa | UX-01, 02, 03, 04, 05, 07, 08, 09, 10, 11, 13, 14, 15, 16, 17, 18, 19 |
| ⚠️ Sửa một phần | UX-06 (chữ nội dung đã ≥14px; nhãn floating của field vẫn 12px, đo `12px`, giữ theo quyết định đợt 5) ; UX-13 (đã sửa thông báo lỗi, màn callback vẫn chưa có timeout/thử lại) |
| ⛔ Không phải lỗi | UX-12 (form thành viên tách dấu phẩy thành nhiều người) |

Bằng chứng chạy app: `/ZZZZZZ` hiện "Không tìm thấy hóa đơn" + nút "Về trang chủ"; FAB hiện ngay (opacity 1, container `padding-bottom` 96px); tab có chữ; nút khoản mục/± /xoá/+ đo 40–48px (nút xoá 40×40 là `mat-icon-button`, vùng chạm thật 48px theo notes đợt 5); xoá khoản mục → snackbar "Hoàn tác" và khôi phục được; khách bấm FAB → 1 dialog đăng nhập kèm dòng giải thích; `/setting` 3 tab vừa 360px, không pager, nút Lưu nền vàng, tiêu đề 20px; header "Hi, Test User". Các mục UX-04/09/13/18/19 xác nhận qua code (+ notes), chưa thao tác lỗi backend thật.

## Cách đọc file này

- **Nguồn** của mỗi vấn đề: `Code` = chỉ đọc source; `Run` = đã thấy khi chạy app; `Code+Run` = cả hai.
- Số dòng tham chiếu theo commit `1482fc0`. Các file đổi trong commit đó (đã cập nhật số dòng): `bill-details.ts`, `bills.ts`, `bills.html`, `create-bill.ts`. Số dòng ở các file còn lại lấy từ trạng thái trước commit đó nhưng các file này không bị commit đụng tới.
- Trước khi sửa, mở lại file để xác nhận dòng còn đúng.
- "Chạm" = vùng chạm. Chuẩn so sánh: 48dp (chạm), 14px (chữ).

## 1. Danh sách vấn đề (xếp theo mức ảnh hưởng)

### Cao

#### UX-01 — Trang chi tiết hoá đơn không có loading và không có trạng thái lỗi — `Code+Run` — ✅ **Đã sửa**
- `init()` được gọi bằng `.then()` mà không có `.catch`: [bill-details.ts:157](../src/app/components/bill-details/bill-details.ts#L157).
- `fetchBill` log lỗi rồi ném lại: [bill-splitter.service.ts:422-425](../src/app/services/bill-splitter.service.ts#L422-L425). Không có interceptor nào hiện lỗi cho người dùng ([auth-interceptor.ts:56-66](../src/app/interceptors/auth-interceptor.ts#L56-L66)).
- Route `:code` không có trang "không tìm thấy": [app.routes.ts:23-26](../src/app/app.routes.ts#L23-L26).
- **Đã thấy khi chạy:** mở `/ZZZZZZ` (backend trả 404 thật) → trang trống chỉ có card "Chưa có gì để chia", console `ERROR HttpErrorResponse`, không có thông báo nào. Cùng kết quả khi backend tắt (connection refused).
- Người dùng tưởng đó là hoá đơn rỗng.
- Hướng sửa gợi ý: thêm trạng thái `isLoading`/`hasError`/`notFound` giống [bills.html:9-40](../src/app/components/bills/bills.html#L9-L40); dùng lại `app-empty-state`.
- **Chưa xác nhận:** empty state "Chưa có khoản mục nào" có chớp lên trước khi dữ liệu về hay không (lấy mẫu sau `nav` cho `false`, không bắt được). Suy luận từ code là có, cần thử với backend chậm.

#### UX-02 — Hành động chính (Lưu/Chia sẻ) ẩn lúc đầu, chỉ có icon, che nội dung — `Code+Run` — ✅ **Đã sửa**
- FAB `opacity:0; pointer-events:none` đến khi cuộn: [create-bill.scss:32-41](../src/app/components/create-bill/create-bill.scss#L32-L41). Khi mới mở trang, `opacity: 0`.
- FAB chỉ có icon `share`, tooltip không dùng được trên cảm ứng: [create-bill.html:74-79](../src/app/components/create-bill/create-bill.html#L74-L79), [bill-details.html:82-87](../src/app/components/bill-details/bill-details.html#L82-L87).
- Một nút vừa lưu vừa chia sẻ nhưng chỉ gợi ý "chia sẻ".
- Không chừa `padding-bottom` cho FAB (đo: `0px`). **Đã thấy:** FAB 56×56 tại (276,656) che chữ "Tối đa 5 ảnh" trong khung upload (ảnh `m04-fab-scrolled.png`).
- `.upload-progress` đặt cùng toạ độ `bottom-7 right-7` với FAB ([create-bill.html:64,70](../src/app/components/create-bill/create-bill.html#L64)); PWA prompt `z-index:1000` > FAB `999` — **chưa kiểm chứng khi chạy**.
- Khi đã đăng nhập: bấm FAB một lần → tạo `/U9vt3c`, không có dialog (đã chạy).

#### UX-03 — Vùng chạm nhỏ ở các thao tác dùng nhiều nhất — `Code+Run` — ✅ **Đã sửa**

Kích thước **đo thật** ở 360px:

| Control | Kích thước | File |
|---|---|---|
| Nút tên khoản mục (sửa tên) | 99×17 | [expense-form.scss:96-115](../src/app/components/expense-form/expense-form.scss#L96-L115) |
| Nút số tiền khoản mục (sửa số tiền) | 70×17 | [expense-form.scss:129-144](../src/app/components/expense-form/expense-form.scss#L129-L144) |
| Ô số lượng (quantity input) | 39×34 | [quantity-selector.scss:52-54](../src/app/components/quantity-selector/quantity-selector.scss#L52-L54) |
| Hộp quantity-selector | 129×42 (`overflow:hidden` cắt vùng chạm 48px của nút) | [quantity-selector.scss:8](../src/app/components/quantity-selector/quantity-selector.scss#L8) |
| Nút ± | 40×40 | [quantity-selector.scss:17-36](../src/app/components/quantity-selector/quantity-selector.scss#L17-L36) |
| Nút xoá (khoản mục/thành viên/hoá đơn) | 40×40 | `mat-icon-button` |
| Nút "+" thêm khoản mục/thành viên | 42×42 | [expense-form.scss:51-55](../src/app/components/expense-form/expense-form.scss#L51-L55), [member-table.scss:52-56](../src/app/components/member-table/member-table.scss#L52-L56) |
| Nút chia sẻ ở danh sách hoá đơn | 40×40 | [bills.scss:169-173](../src/app/components/bills/bills.scss#L169-L173) |
| Nút copy số tài khoản | ≈36 (chưa đo) | [bank.scss:96-105](../src/app/components/bank/bank.scss#L96-L105) |
| Nút xoá ảnh | 32×32, không có `aria-label` | [image-upload.scss:137-142](../src/app/components/image-upload/image-upload.scss#L137-L142), [image-upload.html:90-94](../src/app/components/image-upload/image-upload.html#L90-L94) |
| Icon trạng thái / nút QR trong kết quả | 36×36 (đo trên icon "đã thanh toán") | [result-display.scss:156-161](../src/app/components/result-display/result-display.scss#L156-L161) |

- Sửa tên/số tiền khoản mục còn không có dấu hiệu bấm được (không icon bút).
- Lưu ý: `mat-icon-button` và `mat-mini-fab` có thể có vùng chạm 48px dù nhìn thấy 40/42px; chưa đo vùng chạm thật của các nút Material.

#### UX-04 — Thao tác ghi thất bại thì im lặng — `Code` (một phần `Run`) — ✅ **Đã sửa**
- Xoá hoá đơn không try/catch, không toast thành công: [bills.ts:107](../src/app/components/bills/bills.ts#L107).
- Lưu cài đặt không try/catch: [setting.ts:108](../src/app/components/setting/setting.ts#L108).
- Tải cài đặt không bắt lỗi: [setting.ts:82-102](../src/app/components/setting/setting.ts#L82-L102). Khi backend tắt: console báo lỗi, màn hình không báo gì (đã thấy).
- `createBill` không try/catch: [create-bill.ts:188](../src/app/components/create-bill/create-bill.ts#L188).
- Lưu bill ở chi tiết chỉ `console.error`: [bill-details.ts:284-286](../src/app/components/bill-details/bill-details.ts#L284-L286).
- **Đã được sửa bởi commit `1482fc0`:** lỗi copy link nay được xử lý trong `BillShareService` ([bill-share.service.ts:49](../src/app/services/bill-share.service.ts#L49), snackbar "Không thể sao chép link"). Trên trang tạo hoá đơn đã thấy snackbar này khi chạy.

### Trung bình

#### UX-05 — Tab "Khoản mục"/"Thành viên" chỉ có icon ở ≤600px — `Code+Run` — ✅ **Đã sửa**
- Nhãn `display:none`: [create-bill.scss:108-119](../src/app/components/create-bill/create-bill.scss#L108-L119). Đo: tên tab đọc ra là `receipt` / `groups`, `aria-label` = null.
- Tiêu đề lặp trong card ([expense-form.html:2](../src/app/components/expense-form/expense-form.html#L2)).
- Không đồng nhất với tab Ngân hàng/Momo ở dưới (có chữ): [payment.html:6](../src/app/components/payment/payment.html#L6).

#### UX-06 — Chữ dưới 14px phổ biến — `Code+Run` — ⚠️ **Đã sửa một phần** (nhãn floating field vẫn 12px theo quyết định)
- Nhãn field 12px ([styles.scss:554](../src/styles.scss#L554)) — đo: `12px`.
- Meta khoản mục 12px ([expense-form.scss:117-120](../src/app/components/expense-form/expense-form.scss#L117-L120)); số tiền phụ trong card thành viên 12px ([member-table.scss:222](../src/app/components/member-table/member-table.scss#L222)).
- Danh sách hoá đơn: mã 12px, tháng 11px, subtitle 13px, số người 13px ([bills.scss:21,87,133,153](../src/app/components/bills/bills.scss#L21)) — đo đúng.
- Dòng thông tin ở kết quả 12.8px ([result-display.scss:71](../src/app/components/result-display/result-display.scss#L71)); tên/kích thước ảnh 12px/10px ([image-upload.scss:178,188](../src/app/components/image-upload/image-upload.scss#L178)); nút PWA prompt mobile 13px ([pwa-install-prompt.scss:101](../src/app/components/pwa-install-prompt/pwa-install-prompt.scss#L101)) — `Code`.

#### UX-07 — Lưu khi chưa đăng nhập qua 2 dialog liên tiếp — `Code` — ✅ **Đã sửa**
- Confirm "Bạn cần đăng nhập để lưu và chia sẻ" rồi mới tới dialog chọn provider: [create-bill.ts:167-181](../src/app/components/create-bill/create-bill.ts#L167-L181), [bill-details.ts:230-243](../src/app/components/bill-details/bill-details.ts#L230-L243).
- Tổng: FAB → "Đăng nhập" → chọn provider = 3 chạm trước khi chuyển OAuth.
- **Chưa chạy lại** vì các lần chạy dùng tài khoản đã đăng nhập.

#### UX-08 — Form thiết lập thanh toán thiếu hướng dẫn — `Code+Run` — ✅ **Đã sửa**
- Không có hint/placeholder cho "Họ & Tên", "Số tài khoản"; không có `inputmode`/`autocomplete`: [setting.html:35,59](../src/app/components/setting/setting.html#L35) — đo: `inputMode=""`, `autocomplete=""`.
- Tab Momo có 3 field (tên, SĐT, số tài khoản) không giải thích: [setting.html:51-70](../src/app/components/setting/setting.html#L51-L70).
- Chỉ tab Ngân hàng có validation; Momo không: [payment.html:10-44](../src/app/components/payment/payment.html#L10-L44).
- Validation khi bấm Lưu với form trống hoạt động (lỗi từng ô + dòng nhắc) — đã chạy.

#### UX-09 — Mẫu xoá không nhất quán — `Code+Run` — ✅ **Đã sửa**
- Xoá hoá đơn: có hộp xác nhận, thông điệp "bill #code" lẫn tiếng Anh ([bills.ts:95-105](../src/app/components/bills/bills.ts#L95-L105)).
- Xoá khoản mục/thành viên: xoá ngay, không xác nhận, không undo ([expense-form.html:65](../src/app/components/expense-form/expense-form.html#L65), [member-table.html:40](../src/app/components/member-table/member-table.html#L40)). Đã thấy: bấm xoá → số hàng về 0 ngay. Xoá thành viên làm mất toàn bộ lựa chọn tham gia của người đó.

#### UX-14 — Trang Cài đặt: tab "Bảo mật" bị ẩn ở 360px — `Run` (mới) — ✅ **Đã sửa**
- 3 tab chiếm ≈52→445px trên viewport 360px nên Material bật phân trang (`pager: true`); tab Bảo mật nằm ngoài màn hình, phải bấm mũi tên mới thấy: [setting.html:5-85](../src/app/components/setting/setting.html#L5-L85).

#### UX-15 — Trang Cài đặt: CTA yếu và tiêu đề quá to — `Run` (mới) — ✅ **Đã sửa**
- Nút "Lưu" (`color="primary"`) có nền `rgb(250, 249, 253)` — gần trắng, nhìn như nút phụ dù là hành động chính duy nhất: [setting.html:92-99](../src/app/components/setting/setting.html#L92-L99). Kích thước 74×40.
- Tiêu đề `.settings-title` 28px, to hơn tiêu đề danh sách hoá đơn (22px): [setting.html:2](../src/app/components/setting/setting.html#L2).

### Thấp

| ID | Vấn đề | Nguồn | Vị trí |
|---|---|---|---|
| UX-10 ✅ Đã sửa | Empty state "chọn ai tham gia ở **tab** Thành viên" sai ở ≥768px (layout 2 cột, không có tab). Đã xác nhận ở 1024px. | Code+Run | [expense-form.html:45](../src/app/components/expense-form/expense-form.html#L45) |
| UX-11 ✅ Đã sửa | Sidebar action cao ≈44px (`padding:10px`); mini-fab "+" cao 42px. (Field cao **48px**, không phải 46px — xem mục Đính chính.) | Code | [app.scss:123](../src/app/app.scss#L123), [expense-form.scss:53](../src/app/components/expense-form/expense-form.scss#L53) |
| UX-12 ⛔ Không phải lỗi (form tách "," thành nhiều người) | Placeholder "VD: Tèo, Tý, Tủn" gợi ý nhập nhiều tên nhưng form chỉ nhận một tên mỗi lần; nút "+" chỉ có icon. | Code | [member-table.html:10](../src/app/components/member-table/member-table.html#L10) |
| UX-13 ✅ Đã sửa | Lỗi OAuth cụt ("Đăng nhập thất bại:" kết thúc bằng dấu hai chấm, không lý do); màn callback chỉ có spinner, không timeout/thử lại. | Code | [oauth-callback.ts:37](../src/app/components/oauth-callback/oauth-callback.ts#L37) |
| UX-16 ✅ Đã sửa | Header cắt tên người dùng ở 360px: "Xin chào, Thanh ...". | Run | [app.html:22](../src/app/app.html#L22), [app.scss:154-156](../src/app/app.scss#L154-L156) |
| UX-17 ✅ Đã sửa (đợt 8: lưới 2 dòng ở ≤768px, thẻ 147 → 92px ở 360px, 5 thẻ 849 → 516px; kèm sửa tên dài tràn thẻ — xem `docs/implementation-notes.md`) | Mỗi thẻ hoá đơn cao ≈140px ở 360px → danh sách dài phải cuộn nhiều (9 hoá đơn ≈ 1400px+). | Run | [bills.scss:200-225](../src/app/components/bills/bills.scss#L200-L225) |
| UX-18 ✅ Đã sửa | Tên nút lẫn tiếng Anh: "Download" trong QR popup; thông điệp xoá "bill #…". | Code | [qr-popup.html:37](../src/app/components/qr-popup/qr-popup.html#L37), [bills.ts](../src/app/components/bills/bills.ts#L100) |
| UX-19 ✅ Đã sửa | `edit-field-dialog` không validate giá trị rỗng/âm. | Code | [edit-field-dialog.html](../src/app/components/edit-field-dialog/edit-field-dialog.html) |

## 2. Phân tích theo từng màn hình

| Màn | (1) Hành động chính | (2) Chạm từ `/` | (3) Chạm/chữ nhỏ | (4) Loading / rỗng / lỗi | (5) Form | (6) Thiếu nhất quán |
|---|---|---|---|---|---|---|
| **Tạo hoá đơn** `/` | Nhập khoản mục + thành viên → Lưu. FAB vàng ẩn lúc đầu, chỉ icon (UX-02). | 0 | UX-03, UX-06 | Rỗng: có. Loading/lỗi: không áp dụng (bill cục bộ). Lỗi `createBill`: không (UX-04). | Dài nhưng chia khối rõ; thiếu hướng dẫn thứ tự (thêm khoản mục trước khi gán người). | Tab icon-only (UX-05); hai nhóm tab khác kiểu |
| **Chi tiết hoá đơn** `/:code` | Như trên; chế độ xem/sửa theo quyền. Nút chia sẻ hiện cả khi chỉ đọc. | 0 qua link; 3 từ danh sách | UX-03, UX-06 | Loading: không. Lỗi/404: không (UX-01). | Như trên | Gần trùng lặp với trang tạo, khác ở `isEditable` và luồng lưu |
| **Danh sách** `/bills` | Mở lại hoá đơn (chạm cả thẻ). Màn xử lý trạng thái đủ nhất. | 2 (⚙ → "Danh sách đã chia sẻ") | Nút 40px, chữ 11–13px | Loading, lỗi + thử lại, rỗng + CTA: đủ ([bills.html:9-40](../src/app/components/bills/bills.html#L9-L40)). Xoá lỗi: không (UX-04). | Không có form | Thẻ `role="button"` chứa 2 nút lồng bên trong |
| **Cài đặt** `/setting` | Lưu thông tin thanh toán; CTA yếu (UX-15). | 2 (⚙ → "Cài đặt"); tab Bảo mật 3 chạm và bị ẩn (UX-14) | Field 48px, nhãn 12px | Loading: không. Lỗi tải/lưu: không (UX-04). | 3 field/tab; thiếu hint, `inputmode` (UX-08) | Ngân hàng có lỗi từng field, Momo không |
| **Dialog đăng nhập** | Chọn provider (3 nút). | 1 (icon login) | Nút Material 36–40px | Có trạng thái "Đang xử lý..." | Không | Mở nối tiếp dialog xác nhận (UX-07) |
| **Dialog sửa field / QR** | Sửa 1 giá trị; xem/tải QR | 1 sau khi cuộn tới | Nút mặc định Material | Sửa field: không validate (UX-19) | 1 field | "Download" tiếng Anh (UX-18) |
| **OAuth callback** | Không có (tự chuyển trang) | tự động | — | Spinner có; không timeout/thử lại (UX-13) | — | — |

## 3. Đính chính so với báo cáo miệng trước

- Nút sửa tên/số tiền khoản mục cao **17px** (không phải "≈20px").
- Field `flat-field` cao **48px** (không phải 46px) → bỏ phần "46px dưới 48" khỏi UX-11.
- Ô số lượng rộng **39px** (không phải 35px; CSS khai 35px, cộng padding).
- Nút copy ở danh sách hoá đơn nay là nút **chia sẻ** (icon `share`, dùng Web Share API) sau commit `1482fc0`; phần "copy lỗi chỉ log" của UX-04 đã được xử lý.

## 4. Chưa kiểm chứng được

- Vùng chạm thật của `mat-icon-button`/`mat-mini-fab` (có thể 48px dù nhìn thấy nhỏ hơn).
- FAB chồng với PWA prompt và `.upload-progress`; hành vi với bàn phím ảo.
- Luồng chưa đăng nhập (UX-07): các lần chạy dùng tài khoản đã đăng nhập.
- QR/ngân hàng: tài khoản test chưa có thông tin ngân hàng; Momo chưa thử.
- Copy clipboard thành công: headless chặn quyền clipboard; chỉ thấy nhánh lỗi. Web Share API chưa thử được trên headless.
- Chớp empty state khi tải bill (UX-01).
- Hành vi ở 768px–1024px ngoài kiểm tra empty state; chưa chụp màn hình desktop.

## 5. Quyết định cần hỏi người dùng trước khi sửa (theo AGENTS.md)

Các điểm dưới đây không có đáp án hiển nhiên; cần hỏi và ghi vào `docs/implementation-notes.md` khi thực hiện:

1. **UX-02:** FAB — hiện từ đầu hay vẫn ẩn đến khi cuộn? Thêm nhãn chữ (extended FAB) hay giữ icon? Tách "Lưu" khỏi "Chia sẻ"? (Có quyết định cũ ngày 2026-09-22 về FAB nổi cố định — xem `docs/implementation-notes.md`.)
2. **UX-07:** Gộp 2 dialog đăng nhập thành một?
3. **UX-09:** Xoá khoản mục/thành viên: thêm xác nhận hay undo (snackbar)?
4. **UX-05:** Hiện lại nhãn tab ở mobile hay thêm `aria-label`?
5. **UX-01:** Thiết kế trang "không tìm thấy" / lỗi tải: dùng `app-empty-state` có nút "Thử lại" và "Về trang chủ"?

## 6. Cách chạy lại để kiểm chứng

```bash
# Dev server
cd <repo> && (npx ng serve --port 4300 > "$TEMP/ng-serve.log" 2>&1 &)
timeout 120 bash -c 'until curl -sf http://localhost:4300 >/dev/null; do sleep 2; done'

# Backend thật chạy ở http://localhost:3000 (môi trường development).
# Đăng nhập giả lập: set localStorage `accessToken` và `refreshToken` (lấy từ response /auth/callback),
# rồi nav lại — xem .claude/skills/run-web/SKILL.md.
node .claude/skills/run-web/driver.mjs <<'EOF'
launch 360x740
nav http://localhost:4300/ZZZZZZ
sleep 1500
text .bill-splitter-container
EOF
```

Ghi chú khi chạy:
- Driver đóng trình duyệt khi hết stdin → dialog/state mất; thao tác nhiều bước phải nằm trong **một** lần pipe.
- `launch` lần hai trả "already launched" và **không** đổi viewport; dùng `viewport WxH`.
- `click-text Xóa` có thể không khớp đúng nút trong dialog; dùng selector `mat-dialog-actions button:last-child` và kiểm tra dialog nêu đúng mã hoá đơn trước khi xác nhận.
- Dừng server: `netstat -ano | grep ':4300.*LISTENING'` rồi `Stop-Process -Id <PID> -Force`.
- Ảnh chụp lần kiểm tra nằm ở `.claude/skills/run-web/screenshots/` (`m01`…`m11`); có thể bị ghi đè ở lần chạy sau.

## 7. Dữ liệu thử đã tạo

- Bill thử `U9vt3c` ("Test UX Lau") đã tạo qua UI và **đã xoá**; danh sách của tài khoản test trở lại 8 hoá đơn. Không còn dữ liệu thử nào.
