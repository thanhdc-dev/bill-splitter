# Tích hợp Passkey (WebAuthn) — Tài liệu cho Frontend

> Hướng dẫn cho **frontend** tích hợp đăng nhập không mật khẩu bằng Passkey (WebAuthn).
> Base URL API: `https://api.thanhdc.dev` (thay bằng domain thực tế). Ngày cập nhật: 2026-09-17.

---

## 1. Tổng quan

Passkey là cặp khoá public/private do trình duyệt + hệ điều hành (hoặc khoá bảo mật vật lý) quản lý. Private key **không bao giờ rời khỏi thiết bị** — server chỉ lưu public key và xác minh chữ ký. Người dùng đăng nhập bằng vân tay / FaceID / PIN thay vì mật khẩu.

Hệ thống hỗ trợ 2 luồng:

| Luồng | Mục đích | Yêu cầu đăng nhập trước? |
|---|---|---|
| **Đăng ký passkey** | User đang đăng nhập (bằng mật khẩu/OAuth) tạo thêm passkey cho thiết bị hiện tại | Có (`Authorization: Bearer`) |
| **Đăng nhập bằng passkey** | User đăng nhập bằng passkey đã đăng ký, không cần nhập email/mật khẩu | Không (public) |

Mỗi luồng gồm **2 request**: lấy `options` từ server → trình duyệt thực hiện ceremony → gửi kết quả về server verify.

```
[Đăng ký]  FE ──POST register/options──> BE ──> options
           FE ──startRegistration(options)──> Trình duyệt/OS (vân tay, FaceID...)
           FE ──POST register/verify──────> BE ──> { success: true }

[Đăng nhập] FE ──POST login/options──────> BE ──> { challengeId, options }
            FE ──startAuthentication(options)──> Trình duyệt/OS
            FE ──POST login/verify───────> BE ──> { accessToken, refreshToken, user }
```

---

## 2. Ràng buộc bắt buộc phải biết trước khi code

Đây là giới hạn của **chuẩn WebAuthn và trình duyệt**, không phải do backend:

1. **Bắt buộc HTTPS.** Ngoại lệ duy nhất là `http://localhost` (và `http://127.0.0.1`) khi dev. Chạy trên `http://` domain thật → trình duyệt từ chối.
2. **Passkey gắn chặt với domain.** Server cấu hình `rpId` (domain gốc) cho từng app; trang gọi WebAuthn phải nằm trên đúng `rpId` đó hoặc subdomain của nó. Passkey tạo ở `app-a.com` **không dùng được** ở `app-b.com` — không có cách nào vượt qua, kể cả backend dùng chung.
3. **`appKey` là bắt buộc ở mọi request passkey.** Backend dùng nó để tra `rpId`/`rpName`/`origins`. Đây là cùng `appKey` đã dùng cho OAuth (xem `docs/auth-login-v2-integration.md`).
4. **Ceremony chạy trong trình duyệt, không phải trên server.** User có tối đa **60 giây** để xác nhận (vân tay/PIN). Trong khi đó không có request nào tới API cả — timeout 5s của API không ảnh hưởng.

---

## 3. Điều kiện tiên quyết

### 3.1. Backend phải cấu hình RP trước

Trước khi FE gọi được bất kỳ API passkey nào, backend phải tạo cấu hình RP cho `appKey` của app (chỉ làm 1 lần). FE cần **cung cấp cho backend** 3 thông tin:

| Thông tin | Mô tả | Ví dụ |
|---|---|---|
| `rpId` | Domain gốc, **không** kèm scheme/port/path | `app.thanhdc.dev` |
| `rpName` | Tên hiển thị trên hộp thoại của OS/trình duyệt | `ThanhDC App` |
| `origins` | Danh sách origin đầy đủ (scheme + host + port), **không** dấu `/` cuối | `["https://app.thanhdc.dev", "https://www.app.thanhdc.dev"]` |

> **Dev local:** yêu cầu backend thêm `rpId: "localhost"` + `origins: ["http://localhost:4200"]` (đúng port dev server). Vì `rpId` khác nhau nên passkey tạo ở local **không** dùng được trên production và ngược lại — cần đăng ký riêng ở từng môi trường.

Nếu `appKey` chưa được cấu hình, mọi API passkey trả `400 ERR_PASSKEY_APP_NOT_CONFIGURED`.

### 3.2. Cài thư viện client

Nên dùng `@simplewebauthn/browser` (cùng nhà với thư viện server, khớp format JSON sẵn) thay vì gọi `navigator.credentials` thủ công — thư viện lo phần encode/decode base64url và chuẩn hoá lỗi.

```bash
npm install @simplewebauthn/browser@^14.0.0
```

> Backend đang dùng `@simplewebauthn/server@14.x`. Giữ client ở major 14 để khớp format. Lưu ý API từ v13 trở đi nhận **object**: `startRegistration({ optionsJSON })`, không phải `startRegistration(options)`.

---

## 4. Danh sách endpoint

| Method & Path | Mô tả | Auth |
|---|---|---|
| `POST /auth/passkey/register/options` | Lấy option để tạo passkey mới | Bearer |
| `POST /auth/passkey/register/verify` | Gửi kết quả đăng ký để server lưu | Bearer |
| `GET /auth/passkey/credentials?appKey=` | Danh sách passkey của user trong app | Bearer |
| `DELETE /auth/passkey/credentials/:id` | Xoá 1 passkey | Bearer |
| `POST /auth/passkey/login/options` | Lấy option để đăng nhập | Public |
| `POST /auth/passkey/login/verify` | Xác minh & nhận token | Public |

> `POST /auth/passkey/rp-configs` là API quản trị dành cho backend — FE không dùng.

---

## 5. Kiểm tra hỗ trợ trình duyệt

Luôn kiểm tra trước khi hiển thị nút "Đăng nhập bằng passkey" / "Thêm passkey":

```ts
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';

// Trình duyệt có hỗ trợ WebAuthn không (điều kiện tối thiểu)
if (!browserSupportsWebAuthn()) {
  // Ẩn toàn bộ UI passkey, chỉ hiện đăng nhập mật khẩu/OAuth
}

// Thiết bị có sẵn vân tay/FaceID/Windows Hello không (gợi ý nên mời user tạo passkey)
const hasPlatformAuthenticator = await platformAuthenticatorIsAvailable();

// Trình duyệt có hỗ trợ autofill passkey (Conditional UI) không — xem mục 7.2
const supportsAutofill = await browserSupportsWebAuthnAutofill();
```

---

## 6. Luồng A — Đăng ký passkey (user đang đăng nhập)

### 6.1. Bước 1 — Lấy options

**Endpoint:** `POST /auth/passkey/register/options` → `200`

**Request:**
```json
{ "appKey": "webA" }
```

**Response** (cấu trúc chuẩn W3C — **truyền nguyên vẹn** cho thư viện, không sửa/lọc field):
```json
{
  "challenge": "5WMAmdqccLDibwuTBoY4zadcYDcxU8rk4mdrDmdWPBg",
  "rp": { "name": "ThanhDC App", "id": "app.thanhdc.dev" },
  "user": {
    "id": "CzFE4_jBDQiqZiicuIRLPWlnebkwfezd5LDpKUlfPFk",
    "name": "thanh@example.com",
    "displayName": "Dinh Cong Thanh"
  },
  "pubKeyCredParams": [
    { "alg": -8, "type": "public-key" },
    { "alg": -7, "type": "public-key" },
    { "alg": -257, "type": "public-key" }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [
    { "id": "ZXhpc3RpbmctY3JlZGVudGlhbC1pZA", "transports": ["internal"], "type": "public-key" }
  ],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": { "credProps": true },
  "hints": []
}
```

**Curl:**
```bash
curl -X POST "https://api.thanhdc.dev/auth/passkey/register/options" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "appKey": "webA" }'
```

> `excludeCredentials` chứa các passkey user đã đăng ký cho app này — trình duyệt dùng nó để **chặn đăng ký trùng thiết bị**. Nếu user cố tạo passkey lần 2 trên cùng thiết bị, thư viện ném lỗi `ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED` (xem mục 9.2).

### 6.2. Bước 2 — Chạy ceremony + gửi verify

**Endpoint:** `POST /auth/passkey/register/verify` → `200`

**Request:**
```json
{
  "appKey": "webA",
  "attestationResponse": { "id": "...", "rawId": "...", "response": { "...": "..." }, "type": "public-key", "clientExtensionResults": {} },
  "deviceName": "iPhone 15 của Thanh"
}
```

- `attestationResponse`: **nguyên vẹn** object mà `startRegistration()` trả về, không bóc tách field.
- `deviceName` (tuỳ chọn, tối đa **100 ký tự**): tên hiển thị trong danh sách passkey. Nên cho user tự đặt, hoặc tự sinh từ User-Agent. Gửi dài hơn → `400 VALIDATION_FAIL`.

**Response:**
```json
{ "success": true }
```

### 6.3. Code mẫu đầy đủ

```ts
import { startRegistration } from '@simplewebauthn/browser';

const API = 'https://api.thanhdc.dev';
const APP_KEY = 'webA';

async function registerPasskey(accessToken: string, deviceName?: string) {
  // 1. Lấy options từ server
  const optionsRes = await fetch(`${API}/auth/passkey/register/options`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appKey: APP_KEY }),
  });
  if (!optionsRes.ok) throw await optionsRes.json();
  const optionsJSON = await optionsRes.json();

  // 2. Trình duyệt/OS hỏi vân tay, FaceID, PIN... (tối đa 60s)
  const attestationResponse = await startRegistration({ optionsJSON });

  // 3. Gửi kết quả về server để lưu
  const verifyRes = await fetch(`${API}/auth/passkey/register/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appKey: APP_KEY, attestationResponse, deviceName }),
  });
  if (!verifyRes.ok) throw await verifyRes.json();

  return verifyRes.json(); // { success: true }
}
```

> **Lưu ý:** challenge được lưu theo `user + appKey` và chỉ sống **5 phút**. Mỗi lần gọi `register/options` sẽ **ghi đè** challenge cũ → không chạy 2 ceremony đăng ký song song cho cùng 1 user. Sau khi verify (thành công hay thất bại), challenge bị xoá — muốn thử lại phải gọi `register/options` lần nữa.

---

## 7. Luồng B — Đăng nhập bằng passkey

### 7.1. Cách 1 — User bấm nút "Đăng nhập bằng passkey"

**Bước 1 — Lấy options.** `POST /auth/passkey/login/options` → `200`

**Request:**
```json
{ "appKey": "webA" }
```

`email` là **tuỳ chọn**:

| Body | Hành vi |
|---|---|
| `{ "appKey": "webA" }` | Discoverable — trình duyệt tự liệt kê mọi passkey của site, user chọn tài khoản. **Khuyến nghị dùng cách này.** |
| `{ "appKey": "webA", "email": "a@example.com" }` | Server trả `allowCredentials` giới hạn theo passkey của email đó. Nếu email không tồn tại hoặc chưa có passkey, `allowCredentials` là mảng rỗng (trình duyệt vẫn hiện mọi passkey, **không** báo lỗi — tránh lộ email nào đã đăng ký). |

**Response:**
```json
{
  "challengeId": "0f1c4c1e-6f6b-4d5e-9a3e-2b2a1c4f7e88",
  "options": {
    "rpId": "app.thanhdc.dev",
    "challenge": "-gcdvS3h9SqSK_1gnpscHWqfWIFX6qd1ErM-d-6-tnM",
    "timeout": 60000,
    "userVerification": "preferred"
  }
}
```

- `challengeId`: FE **phải giữ lại** để gửi kèm ở bước verify. Không lưu lâu dài, chỉ giữ trong biến/state của màn hình đăng nhập.
- `options`: truyền nguyên vẹn cho `startAuthentication()`.

**Bước 2 — Verify.** `POST /auth/passkey/login/verify` → `200`

**Request:**
```json
{
  "challengeId": "0f1c4c1e-6f6b-4d5e-9a3e-2b2a1c4f7e88",
  "appKey": "webA",
  "assertionResponse": { "id": "...", "rawId": "...", "response": { "...": "..." }, "type": "public-key", "clientExtensionResults": {} }
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": { "id": 123, "fullname": "Dinh Cong Thanh", "email": "thanh@example.com" }
}
```

> Token trả về **giống hệt** flow đăng nhập mật khẩu/OAuth — dùng chung cơ chế `GET /auth/me`, `POST /auth/refresh`, `DELETE /auth/logout`. Không có bước OTP/2FA nào thêm sau khi passkey xác thực thành công.

**Code mẫu:**

```ts
import { startAuthentication } from '@simplewebauthn/browser';

async function loginWithPasskey(email?: string) {
  // 1. Lấy options + challengeId
  const optionsRes = await fetch(`${API}/auth/passkey/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appKey: APP_KEY, ...(email ? { email } : {}) }),
  });
  if (!optionsRes.ok) throw await optionsRes.json();
  const { challengeId, options } = await optionsRes.json();

  // 2. User chọn tài khoản + xác thực sinh trắc học
  const assertionResponse = await startAuthentication({ optionsJSON: options });

  // 3. Verify để lấy token
  const verifyRes = await fetch(`${API}/auth/passkey/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, appKey: APP_KEY, assertionResponse }),
  });
  if (!verifyRes.ok) throw await verifyRes.json();

  return verifyRes.json(); // { accessToken, refreshToken, user }
}
```

### 7.2. Cách 2 — Conditional UI (autofill) — khuyến nghị

Vì backend đăng ký passkey ở chế độ `residentKey: "required"` (discoverable), trình duyệt có thể gợi ý passkey **ngay trong ô input** giống gợi ý mật khẩu — user không cần bấm nút riêng.

Điều kiện: ô input phải có `autocomplete="username webauthn"` và ceremony phải được khởi động **ngay khi trang load** (không đợi click).

```html
<input type="text" name="email" autocomplete="username webauthn" />
```

```ts
import { browserSupportsWebAuthnAutofill, startAuthentication } from '@simplewebauthn/browser';

async function setupPasskeyAutofill() {
  if (!(await browserSupportsWebAuthnAutofill())) return;

  const optionsRes = await fetch(`${API}/auth/passkey/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appKey: APP_KEY }), // không truyền email
  });
  const { challengeId, options } = await optionsRes.json();

  try {
    // Promise chỉ resolve khi user chọn passkey trong gợi ý autofill
    const assertionResponse = await startAuthentication({
      optionsJSON: options,
      useBrowserAutofill: true,
    });

    const verifyRes = await fetch(`${API}/auth/passkey/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, appKey: APP_KEY, assertionResponse }),
    });
    const tokens = await verifyRes.json();
    // -> lưu token, chuyển trang
  } catch {
    // User gõ mật khẩu bình thường thay vì chọn passkey — bỏ qua, không báo lỗi
  }
}
```

> **Lưu ý:**
> - Challenge sống 5 phút. Nếu user để trang đăng nhập mở lâu hơn rồi mới chọn passkey → `400 ERR_PASSKEY_CHALLENGE_EXPIRED`. Nên bắt lỗi này và tự động gọi lại `login/options` + retry 1 lần.
> - Chỉ chạy được **một** ceremony tại một thời điểm. Nếu đã bật autofill mà user bấm thêm nút "Đăng nhập bằng passkey", hãy gọi `WebAuthnAbortService.cancelCeremony()` trước khi khởi động ceremony mới (thư viện tự huỷ ceremony cũ khi gọi `startAuthentication()` lần nữa).

---

## 8. Luồng C — Quản lý passkey (màn hình cài đặt tài khoản)

### 8.1. Danh sách passkey

**Endpoint:** `GET /auth/passkey/credentials?appKey=webA` → `200`

**Response:**
```json
[
  { "id": 12, "deviceName": "iPhone 15 của Thanh", "createdAt": "2026-09-17T03:20:11.000Z", "lastUsedAt": "2026-09-17T08:04:52.000Z" },
  { "id": 9, "deviceName": null, "createdAt": "2026-09-10T10:00:00.000Z", "lastUsedAt": null }
]
```

- Sắp xếp mới nhất trước; chỉ trả passkey **còn hiệu lực** của đúng `appKey` được truyền (passkey ở app khác hoặc đã bị thu hồi không xuất hiện).
- `lastUsedAt: null` = chưa từng dùng để đăng nhập. `deviceName: null` = user không đặt tên — FE nên hiển thị nhãn mặc định kiểu "Thiết bị không tên".

```ts
async function listPasskeys(accessToken: string) {
  const res = await fetch(`${API}/auth/passkey/credentials?appKey=${APP_KEY}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
```

### 8.2. Xoá passkey

**Endpoint:** `DELETE /auth/passkey/credentials/:id` → `204 No Content` (không có body)

```ts
async function deletePasskey(accessToken: string, id: number) {
  const res = await fetch(`${API}/auth/passkey/credentials/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await res.json(); // 404 ERR_PASSKEY_NOT_FOUND
}
```

> **Lưu ý UX:** xoá ở server **không** xoá passkey khỏi iCloud Keychain / Google Password Manager của user. Nên hiển thị nhắc nhở user tự xoá trong trình quản lý mật khẩu của họ nếu muốn dọn sạch. Ngoài ra nên cảnh báo khi user xoá passkey **cuối cùng** nếu đó là cách đăng nhập duy nhất họ đang dùng.

---

## 9. Xử lý lỗi

Có **2 nhóm lỗi tách biệt**: lỗi từ API (HTTP) và lỗi từ ceremony trong trình duyệt.

### 9.1. Lỗi từ API

Format lỗi thống nhất toàn hệ thống:

```json
{
  "timestamp": "2026-09-17T08:00:00.000Z",
  "method": "POST",
  "path": "/auth/passkey/login/verify",
  "statusCode": 400,
  "code": "ERR_PASSKEY_CHALLENGE_EXPIRED",
  "error": null
}
```

| HTTP | `code` | Ý nghĩa & cách xử lý |
|---|---|---|
| `400` | `VALIDATION_FAIL` | Thiếu/sai field. `error` là object map `{ tênField: ["thông báo"] }` — tiện hiển thị lỗi theo field. |
| `400` | `ERR_PASSKEY_APP_NOT_CONFIGURED` | `appKey` chưa được backend cấu hình RP. Không phải lỗi user — báo backend (xem mục 3.1). |
| `400` | `ERR_PASSKEY_LIMIT_REACHED` | Đã đạt tối đa **10 passkey** cho app này. Yêu cầu user xoá bớt passkey cũ trước khi thêm mới. |
| `400` | `ERR_PASSKEY_CHALLENGE_EXPIRED` | Challenge hết hạn (>5 phút), đã dùng rồi, `challengeId` sai, hoặc `appKey` không khớp với lúc lấy options. Gọi lại `*/options` và thử lại từ đầu. |
| `400` | `ERR_PASSKEY_VERIFICATION_FAILED` | Dữ liệu ceremony không hợp lệ: sai origin/`rpId`, payload bị sửa, passkey đã tồn tại (đăng ký), hoặc không tìm thấy credential (đăng nhập). Kiểm tra lại cấu hình `origins`/`rpId` trước khi nghi ngờ phía user. |
| `400` | `ERR_USER_NOT_FOUND` | Token hợp lệ nhưng user không còn tồn tại. Xoá token, đưa về màn hình đăng nhập. |
| `401` | `ERR_PASSKEY_VERIFICATION_FAILED` | Chữ ký không hợp lệ khi đăng nhập. Cho phép thử lại từ `login/options`. |
| `401` | `ERR_PASSKEY_CREDENTIAL_REVOKED` | Passkey đã bị **thu hồi vĩnh viễn** vì hệ thống phát hiện dấu hiệu bị nhân bản (sign counter không tăng). Không retry được — yêu cầu user đăng nhập bằng cách khác rồi xoá + đăng ký lại passkey mới. Nên hiển thị cảnh báo bảo mật rõ ràng. |
| `401` | `UNAUTHORIZED` | Thiếu/sai/hết hạn `accessToken` ở các API cần đăng nhập. Refresh token 1 lần, fail thì về màn hình đăng nhập. |
| `404` | `ERR_PASSKEY_NOT_FOUND` | Xoá passkey không tồn tại hoặc không thuộc về user hiện tại. Reload lại danh sách. |
| `408` | *(null)* | Request quá 5 giây. Hiếm gặp, cho phép retry. |
| `429` | `TOO_MANY_REQUESTS` | Vượt giới hạn đăng nhập passkey: mặc định **10 request / 60 giây / IP**, tính chung cả `login/options` và `login/verify` (1 lần đăng nhập = 2 request → khoảng 5 lượt/phút). Chặn nút đăng nhập và mời user thử lại sau ~1 phút. |
| `429` | *(chuỗi `ThrottlerException: ...`)* | Throttle chung toàn hệ thống. Vì `code` khác nhau giữa 2 loại throttle, FE nên bắt theo `statusCode === 429` thay vì dựa vào `code`. |

### 9.2. Lỗi từ ceremony trong trình duyệt

`startRegistration()` / `startAuthentication()` ném `WebAuthnError` có thuộc tính `.code`:

| `.code` | Ý nghĩa & cách xử lý |
|---|---|
| `ERROR_CEREMONY_ABORTED` | User bấm huỷ hoặc quá 60 giây. **Không phải lỗi hệ thống** — im lặng bỏ qua hoặc hiện thông báo nhẹ, đừng show lỗi đỏ. |
| `ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED` | Thiết bị này đã đăng ký passkey cho tài khoản rồi (do `excludeCredentials`). Báo user: "Thiết bị này đã có passkey", không cần tạo thêm. |
| `ERROR_INVALID_DOMAIN` | Trang không chạy trên HTTPS hoặc `localhost`. Lỗi cấu hình môi trường. |
| `ERROR_INVALID_RP_ID` | `rpId` server trả về không khớp domain đang mở. Sai cấu hình RP — báo backend (mục 3.1). |
| `ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT` | Authenticator (thường là khoá bảo mật cũ) không hỗ trợ discoverable credential. Gợi ý user dùng thiết bị/trình duyệt khác. |
| `ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT` | Thiết bị không hỗ trợ xác thực người dùng (PIN/sinh trắc). Tương tự trên. |
| `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY` | Lỗi khác — đọc `error.cause` để biết chi tiết, log lại để debug. |

```ts
import { WebAuthnError } from '@simplewebauthn/browser';

try {
  await registerPasskey(accessToken, deviceName);
} catch (error) {
  if (error instanceof WebAuthnError) {
    if (error.code === 'ERROR_CEREMONY_ABORTED') return; // user tự huỷ, bỏ qua
    if (error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
      showMessage('Thiết bị này đã được đăng ký passkey rồi.');
      return;
    }
    showMessage('Thiết bị không hỗ trợ passkey hoặc cấu hình chưa đúng.');
    return;
  }
  // Lỗi API — error là object theo format mục 9.1
  showMessage(mapApiErrorCode(error.code));
}
```

---

## 10. Giới hạn & quy tắc cần nhớ

| Hạng mục | Giá trị | Ảnh hưởng tới FE |
|---|---|---|
| Số passkey tối đa | **10** / user / `appKey` | Disable nút "Thêm passkey" khi danh sách đã đủ 10, kèm gợi ý xoá bớt. |
| Độ dài field | `appKey` ≤ 50, `deviceName` ≤ 100 ký tự | Vượt quá → `400 VALIDATION_FAIL`. Nên giới hạn `maxlength` ngay trên input đặt tên thiết bị. |
| Thời hạn challenge | **5 phút** | Trang đăng nhập mở lâu → phải lấy options mới. |
| Thời hạn ceremony | **60 giây** | Do trình duyệt áp; quá hạn ném `ERROR_CEREMONY_ABORTED`. |
| Throttle đăng nhập | 10 request / 60s / IP | Tính chung `login/options` + `login/verify`. Response **thành công** có kèm `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` để biết còn bao nhiêu lượt; riêng response `429` **không** kèm các header này. |
| Phạm vi passkey | Theo `appKey` **và** `rpId` | Passkey của app A không hiện ở app B; passkey ở `localhost` không dùng được trên production. |
| Clone detection | Tự động thu hồi | Passkey bị thu hồi không thể khôi phục — chỉ có thể xoá và tạo lại. |
| Đăng ký trùng thiết bị | Bị chặn | Trình duyệt tự chặn qua `excludeCredentials`. |

---

## 11. Checklist trước khi go-live

- [ ] Đã gửi backend `rpId` + `rpName` + `origins` cho **từng môi trường** (local/staging/production) và backend đã tạo rp-config.
- [ ] App chạy trên HTTPS ở staging/production; dev dùng `http://localhost:<port>` đúng port đã đăng ký trong `origins`.
- [ ] Ẩn toàn bộ UI passkey khi `browserSupportsWebAuthn()` trả `false`.
- [ ] Truyền `optionsJSON` / `attestationResponse` / `assertionResponse` **nguyên vẹn**, không tự map lại field.
- [ ] Giữ đúng `challengeId` giữa 2 bước đăng nhập; gửi `appKey` giống nhau ở cả 2 bước.
- [ ] Xử lý `ERROR_CEREMONY_ABORTED` như thao tác huỷ bình thường, không hiện lỗi đỏ.
- [ ] Xử lý `ERR_PASSKEY_CHALLENGE_EXPIRED` bằng cách tự lấy options mới + retry 1 lần.
- [ ] Có thông báo riêng, rõ ràng cho `ERR_PASSKEY_CREDENTIAL_REVOKED` (cảnh báo bảo mật) và `ERR_PASSKEY_LIMIT_REACHED`.
- [ ] Màn hình quản lý passkey: hiển thị `deviceName`/`lastUsedAt`, cảnh báo khi xoá passkey cuối cùng, nhắc user tự dọn trong trình quản lý mật khẩu.
- [ ] Token nhận từ `login/verify` được lưu và refresh **giống hệt** flow đăng nhập hiện có (xem `docs/auth-login-v2-integration.md`).
- [ ] Đã kiểm thử tối thiểu: Chrome + Windows Hello, Safari/iOS + FaceID, và trường hợp user huỷ giữa chừng.
