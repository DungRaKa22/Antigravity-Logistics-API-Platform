# 🔌 Thiết kế API Endpoints - Logistics API Platform

> Base URL: `http://localhost:5000/api`  
> Format: JSON  
> Phiên bản refactor theo cấu trúc 6 bảng cốt lõi mới.

---

## 1. 🔐 NGUOIDUNG / AUTH (Shop, Admin, Partner)
- `POST /api/auth/register`: Đăng ký Merchant (Role auto = SHOP).
- `POST /api/auth/login`: Xác thực và trả về Token/Session (Có kèm Role để Frontend tự điều hướng UI).
- `GET /api/me`: Lấy thông tin user hiện tại.

---

## 2. 📘 SỔ ĐỊA CHỈ THÔNG MINH (Address Book)
- `GET /api/address-book`: Trả danh sách sổ địa chỉ của User `SHOP` (Tìm kiếm query q=tên để làm Autocomplete trên Web).
- `POST /api/address-book`: Lưu một người nhận quen thuộc vào DB.
- `DELETE /api/address-book/{id}`: Xóa danh bạ.

---

## 3. 📦 ĐƠN HÀNG (Order Management & OSRM)
- `POST /api/shipping/calculate`: Ném Text Đi/Đến, API gọi Bản đồ ra số KM -> Tính giá. Trả về Fee mô phỏng.
- `POST /api/orders`: Tạo một đơn lẻ (Lưu vào bảng `Orders`). Auto-Gen mã AG-XXXXX.
- `POST /api/orders/bulk-excel`: Endpoint nhận file `Multipart/form-data`, Backend parse `.xlsx`, Validate, lưu hàng loạt vào kho `Orders`.
- `GET /api/orders`: Dispatch Board (List đơn hàng). Admin lấy toàn bộ, Shop lấy của Shop. Có phân trang, sort, filter theo Status.

---

## 4. 🔍 HÀNH TRÌNH (Tracking & State Management)
- `GET /api/tracking/hero/{order_id}`: API public ở trang chủ. Check đơn hàng mà không cần JWT. Trả về chuỗi `TrackingHistory`.
- `PUT /api/orders/{id}/status`: (ADMIN Only) Chuyển state. 
  - Lưu vào `TrackingHistory`.
  - Check nếu Sender là PARTNER -> Trigger gọi Webhook gửi Notification.

---

## 5. 💰 TÀI CHÍNH (Reconciliations)
- `GET /api/reconciliations`: Danh sách đối soát của Shop, hoặc Admin nhìn tổng. Tiền thu thực tế, tiền ship bị cấn trừ, tiền Shop thực nhận.
- `PUT /api/reconciliations/{id}/pay`: Phân hệ quản lý (Kế toán) bấm nút xác nhận trả tiền (UNPAID -> PAID).

---

## 6. 🤝 ĐỐI TÁC (API Keys B2B)
- `GET /api/admin/partners`: Quản lý các Developer/Partner.
- `POST /api/admin/keys`: Admin sinh 1 chuỗi 64 ký tự `ApiKeyString` cấp cho 1 User Role = PARTNER.
- `POST /api/partner/orders`: Endpoint B2B đặc thù yêu cầu header `X-API-Key` thay vì Bearer Auth. Đối tác dùng gọi để đẩy hàng loạt dữ liệu dạng JSON.
