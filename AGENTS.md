# AGENTS.md — Tài liệu hoá & Ghi chép quyết định

## Nguyên tắc chung

- Agent chịu trách nhiệm **vừa triển khai vừa ghi tài liệu** dự án.
- Mục tiêu: luôn ghi lại các quyết định triển khai thành tài liệu tại `docs/implementation-notes.md`.
- Không bao giờ **âm thầm** đưa ra quyết định kiến trúc — mọi quyết định phải để lại dấu vết kiểm toán (audit trail).

## Workflow khi phát triển

Mỗi lần thực hiện công việc phát triển, làm theo 3 bước:

1. **Triển khai** thay đổi được yêu cầu.
2. **Xác định** bất kỳ quyết định nào chưa được chỉ định rõ ràng → **đặt câu hỏi để người dùng xác nhận** trước khi bắt đầu thực hiện.
3. **Ghi lại** quyết định đó vào `docs/implementation-notes.md`.

## Khi nào BẮT BUỘC ghi tài liệu

- Quyết định kỹ thuật được đưa ra.
- Thư viện được lựa chọn.
- Hạn chế của framework yêu cầu một giải pháp thay thế (workaround).
- Cách triển khai khác với đặc tả kỹ thuật (specification).
- Một sự đánh đổi (trade-off) được chấp nhận.
- Một giả định được đưa vào.
- Sửa lỗi (bug fix) yêu cầu thay đổi kiến trúc.
- Mã nguồn hiện tại buộc phải sử dụng một hướng tiếp cận khác.

## Định dạng tài liệu

Bổ sung các mục vào `docs/implementation-notes.md` theo định dạng chuẩn:

```markdown
## YYYY-MM-DD

### Decision

Mô tả quyết định.

### Before

Mã nguồn trông như thế nào trước thay đổi.

### After

Mã nguồn trông như thế nào sau thay đổi.

### Reason

Tại sao quyết định này lại được đưa ra.

### Alternatives Considered

Các phương án khác đã được xem xét và đánh giá.
```

## Trước khi hoàn tất

Luôn kiểm tra và xác nhận:

- `docs/implementation-notes.md` đã được cập nhật chưa?
- Nếu chưa cập nhật, phải giải thích rõ tại sao không cần thay đổi tài liệu.
- Không bao giờ âm thầm đưa ra các quyết định kiến trúc.
- Luôn để lại dấu vết kiểm toán (audit trail).
