# 🔌 Thiết kế API Endpoints - Logistics API Platform

> Base URL: `http://localhost:5000/api`  
> Định dạng truyền nhận: **JSON**

---

## 1. 🔐 NGUOIDUNG / AUTH (Xác Thực Đa Phân Quyền)

### `POST /api/auth/register`
* **Mục tiêu**: Đăng ký tài khoản Khách hàng mới (`KHACHHANG`).
* **Request Body**:
  ```json
  {
    "username": "shop_sneaker",
    "password": "your_secure_password",
    "fullname": "Cửa hàng Sneaker Hà Nội"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công"
  }
  ```

### `POST /api/auth/login`
* **Mục tiêu**: Đăng nhập hệ thống, trả về Token JWT và thông tin vai trò.
* **Request Body**:
  ```json
  {
    "username": "shop_sneaker",
    "password": "your_secure_password"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "role": "KHACHHANG",
      "fullname": "Cửa hàng Sneaker Hà Nội"
    }
  }
  ```

---

## 2. 📘 SỔ ĐỊA CHỈ THÔNG MINH (Address Book)
*Yêu cầu Header:* `Authorization: Bearer <token>`

### `GET /api/address-book/`
* **Mục tiêu**: Lấy danh bạ địa chỉ của shop, tự động sắp xếp địa chỉ mặc định lên trên cùng.
* **Query Params**: `q` (Chuỗi tìm kiếm tên hoặc số điện thoại).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "name": "Nguyễn Văn A",
        "phone": "0987654321",
        "address": "Số 1 Trần Duy Hưng, Cầu Giấy, Hà Nội",
        "lat": 21.0065,
        "lng": 105.7989,
        "isDefault": true
      }
    ]
  }
  ```

### `POST /api/address-book/`
* **Mục tiêu**: Thêm mới một địa chỉ và tự động xử lý trạng thái mặc định.
* **Request Body**:
  ```json
  {
    "name": "Nguyễn Văn B",
    "phone": "0912345678",
    "address": "Số 10 Lê Lợi, Quận 1, TP. HCM",
    "lat": 10.7769,
    "lng": 106.7009,
    "isDefault": false
  }
  ```

### `PUT /api/address-book/<id>/set-default`
* **Mục tiêu**: Thiết lập địa chỉ được chọn làm mặc định, tự động gỡ trạng thái mặc định của các địa chỉ cũ thuộc tài khoản.

### `DELETE /api/address-book/<id>`
* **Mục tiêu**: Xóa địa chỉ, tự động chuyển mặc định sang địa chỉ tiếp theo nếu vừa xóa địa chỉ mặc định cũ.

---

## 3. 📦 ĐƠN HÀNG (Order Management & OSRM)

### `POST /api/orders/calculate`
* **Mục tiêu**: Tính toán khoảng cách (OSRM) và ước lượng cước phí vận chuyển + phí bảo hiểm.
* **Request Body**:
  ```json
  {
    "sender_address": "Cầu Giấy, Hà Nội",
    "receiver_address": "Hoàn Kiếm, Hà Nội",
    "weight_gram": 1200,
    "length_cm": 15,
    "width_cm": 20,
    "height_cm": 10,
    "declared_value": 2000000
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "distance_km": 5.4,
      "chargeable_weight": 1200,
      "shipping_fee": 24200.0,
      "insurance_fee": 10000.0
    }
  }
  ```

### `POST /api/orders/`
* **Mục tiêu**: Tạo vận đơn lẻ mới (Lưu bảng `DonHang` và tạo lịch sử hành trình ban đầu).
* **Request Body**:
  ```json
  {
    "receiver_name": "Nguyễn Văn C",
    "receiver_phone": "0934567890",
    "receiver_address": "Hai Bà Trưng, Hà Nội",
    "sender_address": "Cầu Giấy, Hà Nội",
    "weight_gram": 800,
    "length_cm": 10,
    "width_cm": 10,
    "height_cm": 10,
    "service_package_id": 1,
    "description": "Quần áo thời trang",
    "cod_amount": 500000,
    "declared_value": 500000,
    "pickup_type": "TU_MANG_RA_BUU_CUC",
    "inspection_policy": "XEM_KHONG_THU"
  }
  ```

### `POST /api/orders/bulk-excel`
* **Mục tiêu**: Nhận tệp tin Excel, parse và nạp hàng loạt đơn hàng.

---

## 4. 🔍 HÀNH TRÌNH (Tracking & State Management)

### `GET /api/tracking/<order_id>`
* **Mục tiêu**: Public API tra cứu lịch trình hành trình vận đơn chi tiết (Không cần Token xác thực).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "order_id": "AG-123456",
      "current_status": "CHO_LAY_HANG",
      "created_at": "2026-05-19T22:34:00",
      "timeline": [
        {
          "status": "CHO_LAY_HANG",
          "info": "Đơn hàng khởi tạo thành công",
          "time": "2026-05-19T22:34:00"
        }
      ]
    }
  }
  ```

### `PUT /api/orders/<order_id>/status` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Cập nhật trạng thái vận đơn. Tự động ghi nhận lịch sử và kích hoạt bảng đối soát COD (`DoiSoat`) nếu chuyển trạng thái sang `GIAO_THANH_CONG`.

---

## 5. 💰 TÀI CHÍNH & ĐỐI SOÁT (Reconciliations)

### `GET /api/reconciliations/`
* **Mục tiêu**: Lọc danh sách sao kê đối soát tài chính thu chi COD.

### `PUT /api/reconciliations/<id>/pay` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Kế toán duyệt và chi trả tiền COD, đổi trạng thái sang `DA_THANH_TOAN`.

---

## 6. 🤝 ĐỐI TÁC B2B (REST Keys)

### `POST /api/partner/keys` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Tạo API Key cho đối tác B2B (Header `X-API-Key`).
