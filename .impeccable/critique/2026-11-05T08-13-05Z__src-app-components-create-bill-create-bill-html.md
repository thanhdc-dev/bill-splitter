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
timestamp: 2026-11-05T08-13-05Z
slug: src-app-components-create-bill-create-bill-html
---
# Critique 7: create-bill

Method: dual-agent (A + B), isolated browser contexts. Score 27/40 (Acceptable). No P0; 1 P1.

Priority issues:
- [P1] Momo data not saved unless a bank is selected (payment.ts:84-102): Momo-only users get no card and no QR button, no message. Confirmed by A, B and code. -> harden
- [P2] Bank info shown twice and far from where it is entered; page ~3600px at 390. -> distill
- [P2] Desktop/tablet: tall member cards vs short expense list, wide result with narrow tiles. -> layout
- [P3] Bank select: 50 options, no pinned popular banks. -> polish
- [P3] QR popup caption "Quet ma de xem chi tiet" is vague. -> clarify

Verified OK this run: Enter opens one dialog with role + aria-label, focus trapped and returned; focus indicators present at 768/1280 light+dark; 0 contrast failures; no console errors.
False positives: A's claim of a bright grey dark-mode upload slab with invisible text (measured 13.5:1 / 7.3:1, dark brown); design-system-color, nested-cards, overused-font; inner switch/checkbox sizes; Material input focus misses.
Decisions honored (not re-raised): icon-only FAB, FAB stays visible while scrolling.
