---
target: create-bill
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:08bd2ccdf98ca22f43bd272a7a636fbd4578998d6c4c2ad10c3317a169a15238"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-05T07-01-47Z
slug: src-app-components-create-bill-create-bill-html
---
# Critique 6: create-bill

Method: dual-agent (A + B). Score 27/40 (Acceptable). No P0; 1 P1. Evidence quality reduced: shared Playwright tab contaminated early runs; A did not read .ts/.scss.

Priority issues:
- [P1] Enter on the QR button opens two stacked dialogs (result-display.html:89,97 click + keyup.enter); dialog has no accessible name; focus returns to body. -> harden
- [P2] Momo form asks three overlapping identifiers; card shown when name+phone (bank.ts:140-144) but QR built only from accountNumberMomo (bank.ts:146-153) -> blank gap. -> harden (needs decision)
- [P2] Rounding explained twice and apart: (i) only with surplus, a footnote for the approx marker always. -> clarify
- [P2] Mobile member cards ~1000px long; snackbar covers the edit area. -> layout
- [P2] Quantity inputs have only a faint 1px wrapper border on focus. -> polish

Minor: differing QR captions; "Sao chep so tai khoan" used for phone; bank card after image upload; truncated bank names; image-upload zone is a div without role=button; 768 label truncation.
False positives: design-system-color, nested-cards, overused-font, inner switch/checkbox/dialog button sizes, first mat-option is the search row.
