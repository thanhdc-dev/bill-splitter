---
target: create-bill
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
target_fingerprint: "sha256:2ba9ff1f9fb25e836bb269c66d9fb54ab562d72fa6845b1f7755a5a0aa462212"
target_path: "C:\\Users\\PC\\dev\\personal\\bill-splitter\\src\\app\\components\\create-bill\\create-bill.html"
timestamp: 2026-11-03T10-25-35Z
slug: src-app-components-create-bill-create-bill-html
---
# Critique 2: create-bill

Method: dual-agent (A + B). Score 19/40 (Poor). Not like-for-like with run 1 (24/40): A read child components and used filled-state screenshots this time.

Priority issues:
- [P1] "/người" label wrong for fractional portions (result-display.html:37-39, ts:73). -> clarify
- [P1] Default participation 0, no equal split; red warning without action. -> shape, onboard
- [P1] Mobile: add-expense row stacks 3 rows, FAB covers rows. -> layout
- [P2] Inverted hierarchy: bank + upload open before total; empty bank select without placeholder. -> distill
- [P2] A11y names: "Xoá khoản mục" lacks item name (expense-form.html:56), unnamed checkbox at 1280, h2 inside tabs. -> harden

False positives checked: remove icon contrast (disabled state), quantity-input focus (wrapper border changes), 24px inputs.
