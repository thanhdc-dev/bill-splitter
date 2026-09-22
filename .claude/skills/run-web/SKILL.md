---
name: run-web
description: Build/serve the bill-splitter Angular app and drive it with a headless-Chromium Playwright REPL to see real UI changes (screenshots, click/fill, console errors). Use when asked to run the app, take a screenshot, or verify a UI/CSS change actually renders correctly.
---

Bill-splitter is an Angular (`ng serve`, esbuild dev-server) web app. There is no
`chromium-cli` in this environment, so UI verification goes through a small
Playwright REPL driver at `.claude/skills/run-web/driver.mjs` (its own
`package.json`/`node_modules`, isolated from the app — never imported by app code).

## Prerequisites (already done once, safe to re-run)

```bash
cd .claude/skills/run-web && npm install   # installs local `playwright` package
npx playwright install chromium            # downloads the browser binary (~ms-playwright cache)
```

## Dev server

```bash
cd <repo root>
(npx ng serve --port 4300 > /tmp/ng-serve.log 2>&1 &)
timeout 60 bash -c 'until curl -sf http://localhost:4300 >/dev/null; do sleep 1; done'
```

**Stop / restart**: `ng serve`'s `$!` is only the npm/ng wrapper — it does not forward
SIGTERM to the esbuild dev-server it spawns, so killing `$!` does not free the port.
Find and kill the actual listener before relaunching, or the next `ng serve` fails with
`Port 4300 is already in use`:

```bash
netstat -ano | grep ':4300.*LISTENING'          # note the PID (last column)
powershell -NoProfile -Command "Stop-Process -Id <PID> -Force"
```

Check `/tmp/ng-serve.log` for real compile errors after (re)starting — `grep -iE error`.

## Drive

Pipe a script to the driver's stdin (it queues lines and runs them strictly in order,
so `launch` always finishes before `nav`/`screenshot` run):

```bash
node .claude/skills/run-web/driver.mjs <<'EOF'
launch 1280x900
nav http://localhost:4300/
wait-for text=Chia
screenshot 01-home
click-text Thành viên
screenshot 02-members-tab
EOF
```

Screenshots land in `.claude/skills/run-web/screenshots/` (override: `SCREENSHOT_DIR`).
**Always actually open/Read the PNG after** — a headless run "succeeding" only proves no
exception was thrown, not that the page looks right.

### Commands

| command | what it does |
|---|---|
| `launch [WxH]` | launch headless Chromium, viewport `WxH` (default `1280x800`) |
| `viewport WxH` | resize the existing page (e.g. `390x844` for phone width) |
| `nav <url>` | navigate, waits for `domcontentloaded` |
| `wait-for <css-sel>` / `wait-for text=<t>` | wait up to 15s for an element/text |
| `screenshot [name]` | full-page PNG -> `screenshots/<name>.png` (see Gotchas re: `position: fixed`) |
| `screenshot-el <sel> [name]` | screenshot one element only (crop to a component) |
| `screenshot-clip x,y,w,h [name]` | pixel-exact crop in page coords — for something small (a notch, a focus ring); combine with `eval document.body.style.zoom='6'` first to inspect sub-pixel detail |
| `click <css-sel>` | Playwright locator click |
| `click-text <text>` | click the first `button`/`a`/`[role=button]` containing text |
| `fill <sel> :: <value>` | fill an input — note the ` :: ` delimiter (see Gotchas) |
| `press <key>` | keyboard press (e.g. `Enter`) |
| `set-theme light\|dark` | writes `localStorage.theme` (app's own key) — `nav` again after to apply |
| `set-ls <key> :: <value>` | raw `localStorage.setItem` — e.g. `accessToken` to fake a logged-in session (see Auth below) |
| `mock <url-glob> :: <json>` | `page.route()` — fulfill matching requests with this JSON instead of hitting the real backend. Register **before** the `nav`/action that triggers the request |
| `sleep [ms]` | wait (default 300ms) — needed after anything CSS-`transition`ed (sidebar, dialogs) before trusting `getComputedStyle`/a screenshot |
| `eval <js>` | `page.evaluate(js)`, prints JSON |
| `text [css-sel]` | print `innerText` (whole body if no selector) |
| `quit` | close the browser |

Console `error`/`pageerror` events print automatically as `[console.error]`/`[pageerror]`
as soon as they happen — read them, don't just check the screenshot.

## App-specific gotchas

- **`fill` needs ` :: ` (space-colon-colon-space), not a plain space**, because CSS
  selectors here routinely need a descendant combinator to disambiguate — e.g.
  `expense-form` and `member-table` both have `input[formcontrolname="name"]` on screen at
  once in the desktop 2-column layout. Always scope: `fill .expense-form
  input[formcontrolname="name"] :: Ốc xào me` / `fill .member-table
  input[formcontrolname="name"] :: Thanh, Khương`.
- **`screenshot` (fullPage) can visually duplicate/misplace `position: fixed` elements**
  (the FAB, the account sidebar `aside.sidebar`) when the page is taller than the
  viewport — Playwright stitches fullPage screenshots by scrolling, and fixed elements
  get re-captured at each scroll offset. If something fixed-positioned looks wrong in a
  screenshot, check `getBoundingClientRect()` via `eval` before assuming it's a real bug
  (e.g. the sidebar's real resting state is `right: -300px`, fully off-screen — a
  fullPage screenshot can still show a sliver of it).
- **`/bills` and `/setting` are behind `authGuard`** (`AuthService.isLoggedIn()` = truthy
  `userSubject`, populated by an `APP_INITIALIZER` that reads `localStorage.accessToken` and
  calls `GET <apiUrl>/auth/me`). To view them without a real backend/login:
  ```
  nav http://localhost:4300/          # establish the origin first — localStorage needs it
  set-ls accessToken :: fake-token
  mock http://localhost:3000/auth/me :: {"id":1,"fullname":"Test","email":"t@t.dev","picture":""}
  mock http://localhost:3000/bills :: {"data":[...]}   # match BillFindAll shape — each item needs
                                                          # a nested data:{totalAmount,members,...}
  nav http://localhost:4300/bills
  ```
  Register `mock` calls *before* the `nav` that triggers the request. Use the exact origin
  in the glob (`http://localhost:3000/auth/me`), not a bare `**/auth/me` — a broad glob can
  also match the *page* navigation itself (e.g. `**/bills` matches
  `http://localhost:4300/bills`, the Angular route, and Playwright will serve your mock JSON
  as the page instead of loading the app — Chrome's JSON viewer is a dead giveaway this
  happened).
- **Desktop (≥768px) vs mobile (<768px) layouts differ structurally**, not just via CSS —
  `create-bill.html` renders either a `mat-tab-group` (mobile) or a 2-column grid
  (desktop), decided by `BreakpointObserver` in `create-bill.ts`. Use `launch 390x844`
  (phone) vs `launch 1280x…` (desktop) to see the actual different DOM, not just a
  reflow.
- **Dark mode**: `set-theme dark` then `nav` again (the app reads `localStorage.theme`
  once at bootstrap via a blocking script in `index.html`, same as a real page load).
- **CSS-`transition`ed state (the account sidebar, dialogs) needs a `sleep` before you trust
  `getComputedStyle`/a screenshot.** Angular adds the triggering class (e.g. `.sidebar.open`)
  synchronously, so `wait-for .sidebar.open` returns immediately — but the 0.3s `transition:
  right` is still animating, so a `getBoundingClientRect()`/`getComputedStyle` read right
  after can catch a mid-animation value (looks like the element "didn't move"). `click ...`
  then `sleep 400` then check, not the other way around.
- **A payment form quirk, not a driver bug**: filling the Momo-only fields in `payment.html`
  does *not* reach `BillSplitterService` unless a bank is also selected in the "Ngân hàng" tab
  — `payment.ts`'s `handleFormChanges()` looks up `BANKS.find(...)` from the `bank` control
  and skips the whole update (Momo fields included) if that lookup is empty. To see `<app-bank>`
  render at all, select a bank first: `click mat-select`, `wait-for text=Vietcombank`,
  `click-text Vietcombank`, then fill the rest.

## Troubleshooting

- **`Port 4300 is already in use`**: a previous `ng serve` is still holding the port (see
  Dev server / Stop above) — almost always this, not a real conflict with another app.
- **Stale compile error in a screenshot that the current source doesn't have**: the dev
  server that's actually listening on the port predates your latest edit (leftover from
  an earlier session). Kill the real listener (`netstat` + `Stop-Process`) and restart
  `ng serve` fresh — don't debug the "error" in the source.
