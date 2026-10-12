# AGENTS.md — Tài liệu hoá & Ghi chép quyết định

## Nguyên tắc chung

- Agent chịu trách nhiệm **vừa triển khai vừa ghi tài liệu** dự án.
- Mục tiêu: luôn ghi lại các quyết định triển khai thành tài liệu. `docs/implementation-notes.md` chỉ là **mục lục (index)**; nội dung chi tiết nằm ở `docs/notes/YYYY-MM.md` (một file mỗi tháng).
- **Tiết kiệm token:** không `Read` nguyên file notes. Đọc index trước, rồi `Grep '^## '` trong file tháng liên quan và `Read` với `offset`/`limit`.
- Không bao giờ **âm thầm** đưa ra quyết định kiến trúc — mọi quyết định phải để lại dấu vết kiểm toán (audit trail).

## Workflow khi phát triển

Mỗi lần thực hiện công việc phát triển, làm theo 3 bước:

1. **Triển khai** thay đổi được yêu cầu.
2. **Xác định** bất kỳ quyết định nào chưa được chỉ định rõ ràng → **đặt câu hỏi để người dùng xác nhận** trước khi bắt đầu thực hiện.
3. **Ghi lại** quyết định đó vào `docs/notes/YYYY-MM.md` của tháng hiện tại (thêm vào cuối file) và thêm **một dòng** tiêu đề vào mục tháng tương ứng trong `docs/implementation-notes.md` (index). Tạo file tháng mới nếu chưa có.

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

Bổ sung các mục vào `docs/notes/YYYY-MM.md` theo định dạng chuẩn:

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

### Bản rút gọn (thay đổi nhỏ)

Áp dụng khi thay đổi thuần **style/CSS/copy**, không đổi kiến trúc, không thêm thư viện, và dưới ~10 dòng. Chỉ cần hai mục **Decision** và **Reason** (bỏ Before/After/Alternatives Considered), tối đa ~10 dòng. Nếu còn nghi ngờ thì dùng định dạng đầy đủ.

## Trước khi hoàn tất

Luôn kiểm tra và xác nhận:

- `docs/notes/YYYY-MM.md` và index `docs/implementation-notes.md` đã được cập nhật chưa?
- Nếu chưa cập nhật, phải giải thích rõ tại sao không cần thay đổi tài liệu.
- Không bao giờ âm thầm đưa ra các quyết định kiến trúc.
- Luôn để lại dấu vết kiểm toán (audit trail).

## Gợi ý commit message

- Sau khi hoàn thành mỗi công việc được giao, **luôn gợi ý** một commit message bằng **tiếng Anh**, ngắn gọn (một dòng, theo Conventional Commits). Ví dụ: `feat: add expense split by percentage`.
- Chỉ **gợi ý**, **không** tự `git commit` nếu người dùng chưa yêu cầu.
