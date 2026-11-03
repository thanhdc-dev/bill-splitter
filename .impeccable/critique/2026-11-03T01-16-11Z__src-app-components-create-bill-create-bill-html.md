---
target: create-bill
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:2cec200ee9c104ea6b100f956917af6ff593fdcd46890e47cfe51521dd60f7b5"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-03T01-16-11Z
slug: src-app-components-create-bill-create-bill-html
closed: true
---
# Critique: create-bill

Method: dual-agent (A + B). Score 24/40 (Acceptable).

Priority issues:
- [P1] FAB label/icon mismatch ("share" icon, actually save + login). create-bill.html:74-79, ts:162-170. -> clarify
- [P1] Draft wiped on revisit via resetBill() (ts:129-131); cancel login clears storage (ts:175). -> harden
- [P1] Dark-mode contrast: #1b6b72 on #211d17 = 2.71:1 (Ngan hang tab label); white on #c98a42 = 2.92:1 (FAB glyph). -> colorize
- [P2] Mobile clutter (dropzone for guests, bank form before result), no running total. -> distill
- [P2] Input zone is stock Material; ticket identity only in result. -> shape, typeset

Minor: PWA banner overlaps form; NG0955 duplicate bank track key 970422; hover scale lacks reduced-motion override; 40px tap targets; h2 inside tab labels.
Detector: design-system-color x1 (html); URL scan 6 warnings (low-contrast 1, overused-font 1 [false positive], nested-cards 5 [mostly Material structure]).
