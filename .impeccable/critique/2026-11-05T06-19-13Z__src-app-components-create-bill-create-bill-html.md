---
target: create-bill
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:08bd2ccdf98ca22f43bd272a7a636fbd4578998d6c4c2ad10c3317a169a15238"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-05T06-19-13Z
slug: src-app-components-create-bill-create-bill-html
---
# Critique 5: create-bill

Method: dual-agent (A + B). Score 29/40 (Good). No P0; 2 P1. Not like-for-like with earlier runs.

Priority issues:
- [P1] QR popup has no context: no title passed (result-display.ts:181-185), shows "QR Code" without member name, amount or bank. -> clarify
- [P1] Per-item per-person prices (each rounded up) do not sum to the per-person total (167+95+34=296 vs 295). Consequence of rounding expense-meta per-person. -> clarify (needs a decision)
- [P2] Mobile flow splits across tabs, long member card list, no persistent total. -> layout
- [P2] Bank info shown twice (form + confirmation card after upload); bank name truncates. -> distill
- [P2] Desktop 1280: empty space under expenses, flat result hierarchy. -> layout
- [P3] Snackbar and FAB cover content. -> polish

Minor: English "QR Code" title; placeholder contrast; 10px floating labels; mono vs sans amounts; download button enabled on QR error; bank card narrower than receive card; weak 1px focus on quantity input.
False positives: design-system-color, nested-cards, overused-font, inner switch/checkbox sizes, mat-select inner height, tab order starting at result/FAB.
