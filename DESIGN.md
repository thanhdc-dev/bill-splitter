---
name: Bill Splitter
description: Bạn cứ chill – bill tôi chia. Chia hóa đơn nhóm, tạo QR chuyển khoản.
colors:
  primary: "#1B6B72"
  primary-deep: "#123F44"
  primary-soft: "#E3EFEE"
  primary-dark-mode: "#6FBFC4"
  gold: "#B8722E"
  gold-deep: "#7A4A1D"
  gold-soft: "#F5E6D3"
  green: "#2F7D4F"
  green-soft: "#E1F0E5"
  momo-pink: "#d81b60"
  ink: "#1C1B1A"
  ink-soft: "#6E6862"
  paper: "#F7F3EC"
  surface: "#FFFFFF"
  surface-muted: "#F1ECE1"
  surface-strong: "#EAE3D5"
  paper-night: "#17140F"
  surface-night: "#211D17"
  ink-night: "#F3F0EA"
typography:
  body:
    fontFamily: "Inter, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label:
    fontFamily: "Inter, Helvetica Neue, sans-serif"
    fontWeight: 500
    letterSpacing: "0.3px"
  amount:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontWeight: 600
    fontFeature: "tabular-nums"
  account-number:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, monospace"
    fontWeight: 400
    fontFeature: "tabular-nums"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  touch-target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "44px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "44px"
  fab:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  receipt-ticket:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  receipt-ticket-stub:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    padding: "10px 14px"
---

# Design System: Bill Splitter

## Overview

**Creative North Star: "Cuống vé ở quán"**

Giao diện giống tờ hóa đơn giấy ở quán: nền giấy ấm, viền mảnh, cuống vé có notch tròn, số tiền in bằng font mono thẳng cột. Màu lấy từ tiền Việt Nam, teal như tờ 500k và vàng đồng như các tờ 10–20k, nên thân quen mà không màu mè. Mọi thứ được thiết kế cho một tay trên điện thoại ở bàn ăn: gọn, đọc nhanh, số tiền luôn là thứ rõ nhất.

Hệ thống phẳng và tin cậy. Chỗ nào có tiền thì chính xác và dễ đọc; chỗ nào cần thân mật thì để giọng chữ tiếng Việt lo, không dùng trang trí. Chế độ tối là "giấy tối" ấm (`#17140F`), không phải đen thuần hay xám lạnh.

**Key Characteristics:**
- Nền giấy ấm (`#F7F3EC`), card trắng viền mảnh 1px.
- Teal là giọng chính; vàng đồng chỉ cho một hành động chính mỗi màn hình.
- Số tiền và số tài khoản dùng IBM Plex Mono, tabular.
- Cuống vé có notch tròn làm chữ ký hình ảnh.
- Phẳng ở trạng thái nghỉ; bóng chỉ xuất hiện khi tương tác.

## Colors

Bảng màu ấm, lấy từ tiền Việt Nam: teal trầm, vàng đồng, xanh lá cho trạng thái, trên nền giấy kem.

### Primary
- **Teal tờ 500k** (`#1B6B72`): nút chính, FAB, cuống vé, tab đang chọn, focus. Trong dark mode, Material primary đổi thành **Teal sáng** (`#6FBFC4`) để chữ đọc được trên nền tối.
- **Teal đậm** (`#123F44`): chữ trên nền teal nhạt (badge, tùy chọn được chọn). Trong dark mode đảo thành `#9FDEE2`.
- **Teal nhạt** (`#E3EFEE`): nền hover, tùy chọn được chọn, vùng thả ảnh. Dark mode: `#1B3A3D`.

### Secondary
- **Vàng đồng** (`#B8722E`): chỉ cho CTA chính của màn hình (ví dụ "Lưu & chia sẻ"). Có `gold-deep` (`#7A4A1D`) và `gold-soft` (`#F5E6D3`) cho chữ và nền nhạt.

### Tertiary
- **Xanh lá** (`#2F7D4F`) trên **nền xanh nhạt** (`#E1F0E5`): chỉ cho trạng thái "đã thanh toán".
- **Hồng Momo** (`#d81b60`): màu thương hiệu của Momo, giữ nguyên là literal, không phải màu theme.

### Neutral
- **Mực** (`#1C1B1A`) chữ chính; **Mực nhạt** (`#6E6862`) chữ phụ.
- **Giấy** (`#F7F3EC`) nền trang; **Mặt card** (`#FFFFFF`); **Mặt trầm** (`#F1ECE1`) cho header bảng và form well; **Mặt đậm** (`#EAE3D5`).
- Dark: giấy tối `#17140F`, mặt `#211D17`, mực `#F3F0EA`.
- Viền: mực ở 16% (đường chính) và 8% (đường phụ).

### Named Rules
**The One Gold Rule.** Vàng đồng chỉ dùng cho đúng một hành động chính trên mỗi màn hình. Nút khác giữ teal. Độ hiếm của nó là điểm mấu chốt.

**The Fill-Not-Text Rule.** `--teal` (`#1B6B72`) được giữ nguyên ở dark mode vì nó là màu nền với chữ trắng (FAB, cuống vé). Không dùng nó làm màu chữ hoặc icon trên nền tối (đo thực tế chỉ đạt 2.71:1); dùng `primary-dark-mode` hoặc `teal-dark` đã đảo tông.

## Typography

**Display/Body Font:** Inter (kèm Helvetica Neue, sans-serif), self-host trong `src/fonts.css`
**Label/Mono Font:** IBM Plex Mono (kèm ui-monospace, Menlo)

**Character:** Inter trung tính, dễ đọc tiếng Việt có dấu; IBM Plex Mono chỉ xuất hiện ở dữ liệu số, như con số in trên hóa đơn.

### Hierarchy
- **Body** (400, 0.875rem): nội dung chung; 0.875rem là sàn tối thiểu cho nội dung, riêng nhãn ngày-tháng được phép 12px.
- **Label** (500, letter-spacing 0.3px): chữ trên nút, không viết hoa toàn bộ.
- **Amount** (IBM Plex Mono 600, tabular): mọi số tiền và số lượng; biến thể `--table` căn phải để so sánh theo cột.
- **Account number** (IBM Plex Mono 400, tabular): số tài khoản và số điện thoại, không đậm để khỏi nhầm với số tiền.

### Named Rules
**The Mono-For-Numbers Rule.** Mono chỉ dành cho số tiền, số lượng, số tài khoản. Không dùng cho nhãn hay chữ thường.

## Layout

Mobile là chủ đạo, dùng một tay. Trên màn hình dưới 768px, trang tạo bill chuyển sang nhóm tab; từ 768px trở lên là bố cục hai cột với container tối đa 1280px (trang danh sách và ngân hàng tối đa 800px). Breakpoint đang dùng: 480px, 600px, 767/768px. Bảng thành viên rộng tối thiểu 600px và cuộn ngang với cột tên dính trái, kèm bố cục thẻ riêng cho mobile. Vùng chạm tối thiểu 44px (`--touch-target`); nút icon Material có vùng chạm 48px riêng.

## Elevation & Depth

Phẳng ở trạng thái nghỉ, phân tách bằng viền mảnh và tông nền thay vì bóng. Bóng chỉ lên khi tương tác: card chuyển từ `shadow-sm` sang `shadow-md` khi hover. Ở dark mode bóng đậm hơn vì ít tương phản với nền.

### Shadow Vocabulary
- **Nghỉ** (`0 1px 2px 0 rgba(0,0,0,0.05)`): card, FAB.
- **Hover** (`0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)`): card khi hover, dialog.
- **Nổi** (`0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)`): lớp nổi lớn.

### Named Rules
**The Flat-By-Default Rule.** Bề mặt phẳng khi nghỉ. Bóng là phản hồi cho trạng thái, không phải trang trí.

## Shapes

Góc bo vừa phải, thân thiện: nút và field 8px, cuống vé 12px, card/dialog/FAB 16px (FAB bo góc, không tròn hẳn). Viền 1px ở mọi card. Chữ ký hình học là cuống vé: hai notch tròn 14px tại điểm nối giữa stub và thân, vẽ bằng màu nền phía sau (`--notch-bg`), nên nơi đặt cuống vé trên nền khác phải ghi đè biến này.

## Components

### Buttons
- **Shape:** bo 8px, cao 44px.
- **Primary:** nền teal, chữ trắng, chữ 500 có tracking 0.3px.
- **Gold:** nền vàng đồng, chữ trắng; chỉ cho CTA chính của màn hình.
- **Hover / Focus:** focus-visible có viền 2px rõ ràng; trạng thái nguy hiểm (`warn`) dùng đỏ error của Material.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** mặt trắng (`#FFFFFF`), dark `#211D17`.
- **Shadow Strategy:** xem Elevation; hover nâng nhẹ.
- **Border:** 1px `--border-color`.

### Inputs / Fields
- **Style:** form-field outline của Material, bo 8px.
- **Focus:** viền chuyển sang primary.

### Cuống vé (Receipt Ticket)
Thành phần đặc trưng: item danh sách hóa đơn, member-card, kết quả chia tiền. Stub teal chứa số/biểu tượng với chữ trắng, thân trắng viền mảnh, hai notch ở điểm nối.

### Navigation
Tab Material ở mobile; thanh tiêu đề có nút đổi theme (Sáng/Tối/Theo hệ thống), cài đặt, đăng nhập.

## Do's and Don'ts

### Do:
- **Do** dùng `mono-amount` (Plex Mono 600, tabular) cho mọi số tiền.
- **Do** giữ vàng đồng cho một CTA chính mỗi màn hình.
- **Do** giữ vùng chạm ≥ 44px và contrast chữ ≥ 4.5:1 (icon và thành phần UI ≥ 3:1) ở cả hai theme.
- **Do** đặt `--notch-bg` cho đúng màu nền khi đặt cuống vé trong card hoặc dialog.
- **Do** viết nhãn cho screen reader bằng tiếng Việt, và bỏ `aria-label` nếu nút đã có chữ hiển thị.

### Don't:
- **Don't** dùng `--teal` làm màu chữ hoặc icon trên nền tối (2.71:1); dùng bản đã đảo tông.
- **Don't** dùng viền màu một cạnh dày hơn 1px (side-stripe) trên card hay list item.
- **Don't** dùng easing bounce; dùng ease-out (`cubic-bezier(0.25, 1, 0.5, 1)`).
- **Don't** viết `transition: all`; liệt kê thuộc tính cụ thể.
- **Don't** dùng mono cho nhãn hoặc chữ thường.
- **Don't** thêm shadow nặng khi nghỉ.

<!-- Ghi chú: contrast của tab đang chọn "Ngân hàng" và icon `receipt`/`account_balance` ở dark mode (2.71:1) và icon share trên FAB gold (2.92:1) là lỗi đã biết, chưa sửa tại thời điểm viết file này. -->
