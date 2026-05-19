# 🎨 Yêu Cầu Giao Diện (Frontend Requirements) - React SPA

> Phong cách thiết kế: **Uber-Style Minimalist (Đen/Trắng tối giản, nút bo viên thuốc, input sắc cạnh 0px)**.

---

## 🧭 Cấu Trúc Tuyến Đường (Vite / React Router)

Hệ thống được cấu hình Single Page Application (SPA) qua các tuyến đường thực tế:

| Tuyến Đường (Path) | Đối Tượng | Mô Tả & Nghiệp Vụ |
|:---|:---|:---|
| `/` | Mọi đối tượng | Trang chủ giới thiệu, tra cứu hành trình nhanh và công cụ tính cước nhanh. |
| `/login` | Khách vãng lai | Đăng nhập hệ thống chia đôi màn hình (Split Screen) tích hợp Segmented Control chọn Vai trò. |
| `/register` | Khách vãng lai | Đăng ký tài khoản doanh nghiệp/chủ shop (`KHACHHANG`). |
| `/tracking` | Mọi đối tượng | Theo dõi chi tiết Timeline lịch trình đơn hàng thông qua tham số truy vấn `?code=AG-XXXXXX`. |
| `/merchant` | `KHACHHANG` | Dashboard quản lý đơn hàng: Tìm kiếm, lọc trạng thái, phân trang. |
| `/merchant/order/new` | `KHACHHANG` | Form tạo vận đơn lẻ tích hợp Combo Box địa chỉ gửi và ước tính phí OSRM thời gian thực. |
| `/merchant/addresses` | `KHACHHANG` | Danh bạ sổ địa chỉ: Quản lý địa chỉ nhận, nút đặt mặc định nhanh. |

---

## 🎨 Ngôn Ngữ Thiết Kế & Quy Chuẩn UI

1. **Bảng màu tương phản cực cao**:
   - Nền canvas chính: `Pure White #ffffff`
   - Nền phân tầng (Soft layout): `#efefef` hoặc `#f3f3f3`
   - Màu chữ chính & Nút hành động: `Pure Black #000000`
   - Màu chữ phụ (Mute labels): `#5e5e5e`
2. **Bo góc đặc thù**:
   - Ô nhập liệu (Input fields): **Sắc cạnh hoàn toàn (`rounded-none` / 0px radius)** trên nền xám nhạt `#efefef` không viền. Viền đen chỉ sáng lên phía dưới (bottom-border) khi focus.
   - Nút bấm (Buttons) và Segmented Tabs: **Bo viên thuốc tối đa (`rounded-full` / 9999px radius)** tạo điểm nhấn mềm mại, sang trọng.
3. **Hiệu ứng chuyển động (Transitions)**:
   - Các nút có hiệu ứng hover mượt mà (`duration-200`) và chuyển động co nhỏ nhẹ (`active:scale-95`) khi nhấn để cải thiện cảm giác bấm (tactile feedback).
   - Layout mở ra với hiệu ứng chuyển động mờ dần (`animate-fadeIn`).

---

## ⚙️ Trải Nghiệm Người Dùng (UX) Nổi Bật

### 1. Form Tạo Đơn Hàng Động (Dynamic Real-time Calculator)
- Hệ thống tự động lắng nghe thay đổi (lên tới 7 biến số): Địa chỉ gửi, Địa chỉ nhận, Khối lượng, Chiều dài, Chiều rộng, Chiều cao, Giá trị khai giá.
- Khi người dùng nhập đủ thông tin địa chỉ và kích thước ➡️ Gọi API `/api/orders/calculate` dưới nền để tự động quy đổi trọng lượng thể tích và hiển thị trực tiếp cước phí vận chuyển, phí bảo hiểm tức thì trước khi nhấn nút "Tạo vận đơn".

### 2. Quản Lý Địa Chỉ Mặc Định Hoàn Hảo
- Sổ địa chỉ cung cấp cờ đánh dấu **"MẶC ĐỊNH"** đen-trắng sang trọng.
- Người dùng chỉ cần click nút **"Đặt mặc định"** trên bất kỳ card địa chỉ nào để hoán đổi nhanh.
- Khi tạo đơn mới, địa chỉ mặc định được chọn sẵn trong Combo Box giúp rút ngắn thời gian thao tác.
- Checkbox **"Đặt địa chỉ này làm mặc định"** xuất hiện ngay trong Modal thêm địa chỉ mới để thao tác đồng bộ.
