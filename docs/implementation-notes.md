# Implementation Notes

Ghi chép các quyết định triển khai theo quy ước tại `AGENTS.md`.

---

## 2026-09-17

### Decision

Tích hợp đăng nhập bằng Passkey (WebAuthn) theo `docs/passkey-frontend-integration.md`, gồm 11 quyết định:

1. **`rpId` dùng root domain `thanhdc.dev`** thay vì `chiatien.thanhdc.dev`.
2. **Chỉ cấu hình RP cho 2 môi trường**: production và dev local.
3. **Entry point đăng nhập**: nút "Đăng nhập bằng Passkey" đặt **phía dưới** Google/Zalo trong `LoginDialogComponent`; **không** dùng Conditional UI (autofill).
4. **Interceptor bỏ qua auto-refresh** cho các endpoint passkey public.
5. **Sau khi passkey đăng nhập thành công**: đóng dialog bằng giá trị **falsy** rồi điều hướng `/?save=true`.
6. **Màn quản lý passkey**: tab "Bảo mật" thứ 3 trong `/setting`, nội dung nạp lười bằng `matTabContent`.
7. **`deviceName`**: dialog riêng `PasskeyNameDialogComponent` cho user tự nhập, prefill từ User-Agent.
8. **Mời tạo passkey**: snackbar sau khi đăng nhập OAuth, chỉ hiện đúng một lần.
9. **Kiến trúc**: `PasskeyService` riêng + `models/passkey.model.ts`, không gộp vào `AuthService`.
10. **`@simplewebauthn/browser` nạp bằng dynamic import**; hàm kiểm tra hỗ trợ tự viết bằng API gốc.
11. **`AuthUser.picture` chuyển thành optional** thay vì gọi thêm `GET /auth/me` sau khi đăng nhập passkey.

### Before

- `AuthService` lo toàn bộ xác thực: OAuth login-url, verify code, token, `/auth/me`.
- `LoginDialogComponent` chỉ có 2 nút OAuth, luôn `window.location.href` để redirect đi.
- `authInterceptor` bắt **mọi** lỗi 401 và gọi `/auth/refresh`, chỉ loại trừ chính URL refresh.
- `/setting` có 2 tab (Ngân hàng, Momo) bọc trong một `<form>` với nút Lưu dùng chung.
- `AuthUser.picture` là `string` bắt buộc.

### After

Thêm mới:

| File | Vai trò |
|---|---|
| `src/app/models/passkey.model.ts` | `IPasskeyCredentialRO`, `IPasskeyLoginOptionsRO`, `IPasskeyLoginRO`, `IApiErrorRO`... |
| `src/app/services/passkey.service.ts` | 6 endpoint passkey, retry challenge, map lỗi sang tiếng Việt |
| `src/app/components/passkey-manager/` | Danh sách / thêm / xoá passkey |
| `src/app/components/passkey-name-dialog/` | Dialog đặt tên thiết bị (maxlength 100) |
| `src/app/shared/helpers/device-name.helper.ts` | Đoán tên thiết bị từ User-Agent |

Sửa đổi:

- `auth-interceptor.ts`: thêm `SKIP_REFRESH_URLS = ['/auth/refresh', '/auth/passkey/login/']`.
- `login-dialog.*`: thêm nút passkey (ẩn khi `isSupported()` false), xử lý login + điều hướng.
- `setting.*`: thêm tab "Bảo mật", ẩn nút Lưu ở tab này, tiêu đề đổi theo tab, đọc query param `tab=security`.
- `oauth-callback.ts`: thêm `promptPasskeySetup()`.
- `auth.model.ts`: `picture?: string`.

Kết quả build production: thư viện nằm ở lazy chunk **13.49 kB** (3.29 kB transfer), initial bundle không đổi.

### Reason

**1. `rpId: thanhdc.dev`** — cho phép tái dùng passkey cho các app khác cùng thuê bao `thanhdc.dev` trong tương lai. Đánh đổi: mọi subdomain của `thanhdc.dev` đều truy cập được passkey này.

**2. Chỉ production + dev local** — dự án hiện chưa có môi trường staging riêng.

**3. Không dùng Conditional UI** — app không có form email/password nào, cả luồng đăng nhập nằm trong `MatDialog`. Autofill đòi ô `autocomplete="username webauthn"` phải có sẵn khi trang load, nghĩa là phải dựng thêm UI chỉ để phục vụ autofill, đồng thời phải quản lý huỷ ceremony khi user bấm OAuth.

**4. Bỏ qua auto-refresh cho passkey login** — `POST /auth/passkey/login/verify` là API public nhưng dùng `401` làm mã lỗi nghiệp vụ (`ERR_PASSKEY_VERIFICATION_FAILED`, `ERR_PASSKEY_CREDENTIAL_REVOKED`). Nếu để interceptor xử lý, nó sẽ gọi `/auth/refresh` với refresh token không tồn tại, nuốt mất mã lỗi gốc và component không hiển thị được cảnh báo bảo mật cho passkey bị thu hồi.

**5. Đóng dialog bằng giá trị falsy** — đây là điểm dễ sai nhất. Với OAuth, `window.location.href` khiến trang unload nên code sau `dialog.afterClosed()` ở `create-bill.ts` và `bill-details.ts` không bao giờ chạy. Passkey đăng nhập tại chỗ nên code đó **sẽ** chạy. Nếu đóng dialog bằng `true`, `create-bill` vừa chạy tiếp `createBill()` vừa bị `/?save=true` kích hoạt `save()` lần nữa → tạo trùng hoá đơn. Đóng bằng falsy khiến phía gọi dừng lại (`if (!loginResult) return;`) và để việc lưu cho query param, đúng bằng hành vi của `OauthCallback`.

**6. `matTabContent`** — mặc định `mat-tab` render nội dung ngay cả khi chưa mở tab, sẽ gọi `GET /auth/passkey/credentials` mỗi lần vào `/setting`. Bọc `ng-template matTabContent` để chỉ gọi API khi user thực sự mở tab.

**7. Dialog đặt tên riêng** — API không có endpoint đổi tên passkey sau khi tạo, nên nếu tự sinh tên từ User-Agent thì user muốn sửa phải xoá và đăng ký lại. Hỏi trước một lần là rẻ hơn.

**8. Snackbar chỉ hiện một lần** — cờ `passkeyPromptShown` được ghi ngay lúc hiện snackbar (không phải lúc user bấm), để dù user bỏ qua hay để nó tự tắt cũng không bị hỏi lại.

**9. Service riêng** — `AuthService` đã gánh token + OAuth + `/auth/me`; thêm 6 endpoint nữa sẽ quá dài.

**10. Dynamic import + tự kiểm tra hỗ trợ** — app là PWA, cần giữ initial bundle nhỏ. Nếu dùng `browserSupportsWebAuthn()` của thư viện để ẩn/hiện nút thì chỉ riêng việc mở dialog đăng nhập đã kéo cả thư viện về, làm mất ý nghĩa của dynamic import. `PasskeyService.isSupported()` kiểm tra trực tiếp `window.PublicKeyCredential` + `navigator.credentials.create`, đúng logic thư viện làm.

**11. `picture` optional** — `login/verify` trả `user` gồm `{ id, fullname, email }`, thiếu `picture`. Field này hiện chưa được dùng ở bất kỳ template nào, nên nới kiểu rẻ hơn một request `GET /auth/me`.

### Alternatives Considered

| Quyết định | Phương án khác | Lý do loại |
|---|---|---|
| `rpId` | `chiatien.thanhdc.dev` | An toàn hơn nhưng khoá passkey vào đúng một app |
| Entry point | Trang `/login` riêng, hoặc dialog + autofill | Thay đổi lớn, ảnh hưởng 3 nơi đang mở dialog |
| 401 interceptor | `HttpContextToken SKIP_AUTH`, hoặc gọi bằng `fetch` | Context token sạch hơn nhưng thêm khái niệm mới; `fetch` phá vỡ tính nhất quán với các service khác |
| Sau đăng nhập | Chạy tiếp hành động đang dở, hoặc `location.reload()` | Chạy tiếp cần sửa cả `create-bill` và `bill-details`; reload làm mất form đang nhập |
| Vị trí UI | Route `/setting/security`, hoặc section ngoài tab-group | Tab tái dùng được `authGuard` sẵn có, không thêm route |
| `deviceName` | Tự sinh từ UA, hoặc bỏ trống | Không sửa được tên sau khi tạo (API không có PATCH) |
| Dialog đặt tên | Tái dùng `EditFieldDialogComponent` | Component đó có nút "Cancel"/"Save" tiếng Anh và không hỗ trợ `maxlength`; sửa nó sẽ ảnh hưởng các màn hình đang dùng |
| Mời tạo passkey | Không mời, hoặc dialog bắt buộc chọn | Không mời thì gần như không ai biết tính năng; dialog bắt buộc gây khó chịu |
| `picture` | Gọi `GET /auth/me` sau khi verify | Tốn thêm một request cho field chưa dùng |

### Assumptions & Deviations

- **Quy ước đặt tên interface**: codebase hiện dùng `AuthUser`, `AuthTokens`, `SettingsData` (không có tiền tố `I`). Các interface mới trong `passkey.model.ts` theo chuẩn cá nhân `IXxxRO` / `IXxxDTO`, nên tồn tại hai phong cách song song. Chưa đổi tên các interface cũ để tránh diff lan rộng.
- **Lint**: 2 lỗi `no-empty-function` ở `thousand-separator.ts` và `bill-splitter.service.ts` đã tồn tại từ trước, không liên quan thay đổi này.
- **Chưa test được thực tế**: mọi API passkey trả `400 ERR_PASSKEY_APP_NOT_CONFIGURED` cho tới khi backend tạo rp-config (xem mục dưới).

### Backend cần cấu hình trước khi chạy được

| Môi trường | `rpId` | `rpName` | `origins` |
|---|---|---|---|
| Production | `thanhdc.dev` | `Chia Tiền` | `["https://chiatien.thanhdc.dev"]` |
| Dev local | `localhost` | `Chia Tiền` | `["http://localhost:4200"]` |

`appKey` cho cả hai: `chiatien` (giá trị trong `src/environments/*.ts`, dùng chung với luồng OAuth).

Lưu ý: vì `rpId` khác nhau, passkey đăng ký ở local **không** dùng được trên production và ngược lại — phải đăng ký riêng ở từng môi trường. Đây là ràng buộc của chuẩn WebAuthn, không có cách vượt qua.
