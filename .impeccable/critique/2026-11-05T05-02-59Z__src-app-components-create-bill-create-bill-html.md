---
target: create-bill
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:2ba9ff1f9fb25e836bb269c66d9fb54ab562d72fa6845b1f7755a5a0aa462212"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-05T05-02-59Z
slug: src-app-components-create-bill-create-bill-html
---
# Critique 4: create-bill

Method: dual-agent (A + B). Score 26/40 (Acceptable). No P0/P1. Not like-for-like with earlier runs (A did not read .ts/.scss).

Priority issues:
- [P2] Mobile IA order: bank/Momo form and image upload sit between inputs and the result; upload shown to guests who cannot upload. -> distill
- [P2] Per-person amount sits at the card footer, not visible while adjusting portions. -> layout
- [P2] FAB covers right-aligned amounts mid-scroll (end of page is clear). -> layout
- [P2] Weak keyboard focus on Ngan hang/Momo tabs and the auto-split toggle (only 12% state layer). -> polish
- [P2] QR failure state: broken image, no error/retry. -> harden

Minor: "1.5" vs "1,5 suat" decimal mismatch; "0 nguoi an chung" copy; 10px floating labels; truncated bank names; QR backend not running in test env.
False positives: design-system-color, nested-cards, overused-font, inner checkbox/toggle sizes, seeded members at "empty" state (draft restore).
