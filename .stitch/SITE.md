# Antigravity Express - Site Architecture & Roadmap

Dự án phát triển nền tảng logistics cao cấp phong cách tối giản Uber-Style.

- **Stitch Project ID**: `11745387759254129752`
- **Thiết kế chủ đạo**: Đen/Trắng, Nút Pill, Input Sharp, Canvas phẳng.

---

## 1. Phân hệ & Sitemap (Sitemap)

### 1.1. Phân hệ Public
- [x] **Trang chủ (`/`)**: Tra cứu cước phí thông minh với bản đồ Leaflet.
- [x] **Tra cứu vận đơn (`/tracking`)**: Theo dõi lộ trình động OSRM và Stepper trạng thái.
- [x] **Đăng nhập (`/login`)**: Giao diện đăng nhập.
- [x] **Đăng ký (`/register`)**: Đăng ký tài khoản khách hàng.

### 1.2. Phân hệ Khách hàng (Merchant Portal)
- [x] **Bảng điều khiển (`/merchant`)**: Hiển thị tổng quan đơn hàng, đối soát thực tế phong cách bento.
- [x] **Tạo vận đơn (`/merchant/order/new`)**: Nhập thông tin, xem lộ trình OSRM động.
- [x] **Quản lý đơn hàng (`/merchant/orders`)**: Tìm kiếm, phân trang và bộ lọc trạng thái thông minh.
- [x] **Sổ địa chỉ (`/merchant/addresses`)**: Quản lý địa chỉ liên hệ và lấy hàng thường dùng, đồng bộ CSDL.




---

## 2. Kế hoạch Phát triển Phân hệ Khách hàng (Roadmap)

1. **Bước 1 (Hiện tại)**: Thiết kế trang Bảng điều khiển (`/merchant`) hiển thị các số liệu nhanh trực quan (Tổng đơn, Tiền COD chờ thanh toán) bằng font chữ cực lớn, thiết kế dạng canvas trắng tối giản sang trọng.
2. **Bước 2**: Thiết kế trang Quản lý đơn hàng (`/merchant/orders`) hiển thị danh sách đơn dạng lưới hoặc danh sách thẻ bo góc 16px, trạng thái bọc trong các Chip màu xám đen sang trọng.
3. **Bước 3**: Thiết kế trang Sổ địa chỉ (`/merchant/addresses`) dạng danh sách card địa chỉ lấy/giao 2 cột gọn gàng.
