---
target: create-bill
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:2ba9ff1f9fb25e836bb269c66d9fb54ab562d72fa6845b1f7755a5a0aa462212"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-04T09-33-48Z
slug: src-app-components-create-bill-create-bill-html
closed: true
---
# Critique 3: create-bill

Method: dual-agent (A + B). Score 25/40 (Acceptable). Not like-for-like with runs 1-2 (24, 19): A did not read .ts/.scss or result-display source this time.

Priority issues:
- [P1] Rounded totals disagree and do not reconcile with the bill: member card raw (member-table.html:74) vs summary roundedToThousand (result-display.ts:123,138); 3 x 262.000 = 786.000 vs bill 785.000. Needs product decision on rounding. -> shape, harden
- [P1] Mobile: FAB covers amount column and last result row; add-expense row stacks on 3 rows. -> layout
- [P1] Desktop 1280: member table hides Thanh toan / Tong tien / delete behind horizontal scroll. -> adapt
- [P2] Stale "Vui long nhap ten thanh vien" error after successful add. -> harden
- [P2] A11y: 4 unnamed quantity inputs, member-name input without label, off-canvas sidebar focusable, "Xoa"/"Xoá" inconsistent. -> harden

False positives: input focus indicator (Material outline), 24px inputs, 52x32 slide-toggle inner button, design-system-color, nested-cards, overused-font.
