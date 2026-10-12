# bill-splitter

Angular 20 SPA (Angular Material, Tailwind 4, RxJS, PWA/service worker), deploy Vercel. Node 22 (`.nvmrc`).

@AGENTS.md

## Lệnh

- `npm start` / `npm run start:dev` — dev server
- `npm run lint` · `npm test` · `npm run build:prod`
- Trước khi tạo PR: lint + test + typecheck (`npx ng build`)

## Bản đồ `src/app/`

- `components/<tên>/` — mỗi component 3 file `.ts/.html/.scss` (create-bill, bill-details, bills, payment, bank, result-display, login-dialog, passkey-manager, ...)
- `services/` — `bill-splitter.service.ts` (logic chia tiền, lớn nhất), `auth`, `passkey`, `qr`, `bill-share`, `bill-auto-save`, `theme`, `seo`, `pwa-update`
- `core/cdn/` — pipe/service URL ảnh CDN
- `models/`, `interfaces/`, `constants/` (có `bank.constants.ts` ~8 KB), `guards/`, `interceptors/`, `directives/`
- Style toàn cục: `src/styles.scss` (~20 KB) — chỉ đọc phần cần thiết (dùng `Grep` rồi `Read` với `offset`/`limit`)

## Tiết kiệm token

- **KHÔNG đọc**: `package-lock.json`, `dist/`, `.angular/`, `docs/screenshots/`, `public/images/` (đã chặn trong `.claude/settings.json`).
- `docs/implementation-notes.md` chỉ là index; chi tiết ở `docs/notes/YYYY-MM.md` — chỉ `Grep '^## '` + `Read` theo `offset`/`limit`, không đọc cả file.
- Khảo sát rộng nhiều file → giao cho subagent `Explore`; review Angular/bảo mật → `angular-reviewer` / `security-reviewer`.
- Xem UI thật: skill `run-web`.
