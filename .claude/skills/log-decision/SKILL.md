---
name: log-decision
description: Append an implementation decision to docs/implementation-notes.md in the AGENTS.md format (Decision/Before/After/Reason/Alternatives Considered) and suggest an English Conventional Commits message. Use after making a technical decision, choosing a library, adding a workaround, accepting a trade-off, or deviating from a spec.
---

Ghi lại quyết định triển khai theo quy ước tại `AGENTS.md`. Skill này **chỉ ghi tài liệu**, không `git commit`.

## Khi nào dùng

Bắt buộc ghi khi có: quyết định kỹ thuật, chọn thư viện, workaround do hạn chế framework, khác đặc tả, chấp nhận trade-off, đưa vào giả định, bug fix đổi kiến trúc, hoặc code hiện tại buộc đổi hướng tiếp cận.

## Các bước

1. **Thu thập ngữ cảnh**: dùng `git diff`/`git status` và nội dung cuộc trao đổi để xác định quyết định. Nếu `$ARGUMENTS` có mô tả thì dùng làm gốc.
2. **Hỏi khi thiếu**: nếu Reason hoặc Alternatives Considered không suy ra được từ ngữ cảnh, hỏi người dùng (ưu tiên AskUserQuestion, multiple choice, có lựa chọn Recommended). Không tự bịa lý do.
3. **Đọc tối thiểu** (không `Read` nguyên file): đọc index `docs/implementation-notes.md` (nhỏ) để tránh ghi trùng, rồi `Read` ~40 dòng cuối của `docs/notes/YYYY-MM.md` (tháng hiện tại, dùng `offset`) để khớp văn phong. Nếu file tháng chưa có thì tạo mới với tiêu đề `# Implementation Notes — YYYY-MM`.
4. **Thêm mục mới vào cuối `docs/notes/YYYY-MM.md`** (không sửa các mục cũ), ngăn cách mục trước bằng dòng `---`:
   - Dùng ngày hôm nay `## YYYY-MM-DD`. Nếu mục `## <hôm nay>` đã tồn tại ở cuối file, vẫn thêm mục mới với heading ngày riêng, giống các mục trước.
   - Nhiều quyết định liên quan trong cùng một thay đổi thì gom thành danh sách đánh số trong một mục **Decision**.
   - Thay đổi nhỏ thuần style/CSS/copy (dưới ~10 dòng, không đổi kiến trúc) dùng **bản rút gọn**: chỉ Decision + Reason.
   - Thêm **một dòng** `- <tiêu đề mục>` vào đúng mục tháng trong index `docs/implementation-notes.md` (tạo mục `## YYYY-MM → [notes/YYYY-MM.md](notes/YYYY-MM.md)` nếu là tháng mới).
5. **Xác nhận** với người dùng đã cập nhật file nào (file tháng + index), và nhắc đường dẫn.
6. **Gợi ý commit message** tiếng Anh, một dòng, Conventional Commits (ví dụ `docs: record passkey login decisions`). Chỉ gợi ý; không chạy `git commit` nếu người dùng chưa yêu cầu. Không thêm trailer `Co-Authored-By`.

## Template

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

## Quy tắc

- Viết tiếng Việt; tên file, biến, thuật ngữ kỹ thuật giữ tiếng Anh.
- Tham chiếu file bằng đường dẫn tương đối trong backtick, ví dụ `src/app/services/passkey.service.ts`.
- Before/After phải cụ thể (tên file, hàm, hành vi), không viết chung chung.
- Không âm thầm đưa ra quyết định kiến trúc: quyết định chưa được người dùng xác nhận thì hỏi trước, rồi mới ghi.
- Nếu thay đổi không cần ghi tài liệu, nói rõ lý do thay vì tạo mục rỗng.
