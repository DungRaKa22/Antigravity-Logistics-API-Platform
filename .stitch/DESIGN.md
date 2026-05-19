# Antigravity Express - Design System (Uber-Style)

Đây là file Design Tokens cho dự án Antigravity Express được trích xuất từ cấu hình thiết kế thực tế nhằm giữ vững tính nhất quán thị giác trên mọi màn hình được sinh bởi Stitch.

---

## 1. MÀU SẮC CHỦ ĐẠO (Colors)
- **Primary**: `#000000` (Đen tinh khiết)
- **On-Primary**: `#ffffff` (Chữ trên nền đen)
- **Ink**: `#000000` (Chữ tiêu đề)
- **Body**: `#5e5e5e` (Chữ nội dung xám đen)
- **Mute**: `#afafaf` (Chữ nhạt / Placeholder)
- **Canvas**: `#ffffff` (Nền chính trắng hoàn toàn)
- **Canvas-Soft**: `#efefef` (Nền xám nhạt cho Form Inputs)
- **Canvas-Softer**: `#f3f3f3` (Nền xám siêu nhạt)
- **Link**: `#0000ee` (Đường dẫn màu xanh)

## 2. KIỂU CHỮ (Typography)
- **Display Font**: `Inter, system-ui, sans-serif` (Kiểu chữ đậm, vuông vắn, to rõ)
- **Body Font**: `Inter, system-ui, sans-serif` (Dễ đọc)
- **Độ lớn tiêu đề**:
  - `display-xl`: 36px, Line-height: 44px, Font-weight: 700
  - `display-lg`: 32px, Line-height: 40px, Font-weight: 700
  - `display-md`: 24px, Line-height: 32px, Font-weight: 700
  - `body-md`: 16px, Line-height: 24px, Font-weight: 400

## 3. BO GÓC (Border Radius)
- **Nút bấm**: Nút Pill `999px` (Bo tròn tối đa hình viên thuốc)
- **Thẻ nội dung (Cards)**: Bo góc `16px` (Bán kính bo vừa phải)
- **Form Inputs**: Bo góc `0px` (Vuông cạnh hoàn toàn theo chuẩn Uber)

## 4. SHADOWS & BORDER
- **Không sử dụng bóng đổ** ngoại trừ Request Form Card đè trên bản đồ.
- Sử dụng đường kẻ mảnh `1px border-gray-200` để phân tách khu vực.

---

## 5. DESIGN SYSTEM NOTES FOR STITCH GENERATION (Dùng để copy vào Prompt)

```markdown
**DESIGN SYSTEM (UBER-INSPIRED MINIMALISM):**
- Layout is high contrast duotone black-and-white.
- Font family: 'Inter', system-ui, sans-serif. Title display fonts are bold and massive.
- Main background is #ffffff. Accent colors are deep black #000000.
- Every interactive CTA button is a pill-shaped capsule (border-radius: 999px).
- Main content cards have 16px border-radius.
- Inputs must be sharp-cornered (border-radius: 0px) with very light gray background #efefef.
- Strictly no drop shadows on standard sections; only light, fine borders (1px border-gray-200).
```
