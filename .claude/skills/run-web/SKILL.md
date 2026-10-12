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


## Gotchas & troubleshooting

Xem `.claude/skills/run-web/reference.md` — **chỉ đọc khi cần** (auth giả với `mock`/`set-ls`, `fill ... :: ...`, `position: fixed` trong screenshot, layout mobile vs desktop, dark mode, `sleep` sau transition, cổng 4300 bị chiếm).
