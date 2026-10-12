# run-web — gotchas & troubleshooting

Tham chiếu chi tiết cho `SKILL.md`. Chỉ đọc khi gặp hành vi lạ (fixed element trong screenshot, route sau `authGuard`, layout mobile/desktop, sidebar transition, form payment, cổng 4300 bị chiếm).

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
