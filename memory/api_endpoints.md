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

### `GET /api/auth/profile`
* **Mục tiêu**: Lấy thông tin tài khoản hiện tại (bao gồm cả tài khoản thụ hưởng ngân hàng).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "fullname": "Cửa hàng Sneaker Hà Nội",
      "username": "shop_sneaker",
      "role": "KHACHHANG",
      "bank_account": "190333888999",
      "bank_name": "Techcombank",
      "bank_owner": "NGUYEN VAN SNEAKER"
    }
  }
  ```

### `PUT /api/auth/profile`
* **Mục tiêu**: Cập nhật thông tin cá nhân và ngân hàng thụ hưởng nhận lương/đối soát.
* **Request Body**:
  ```json
  {
    "fullname": "Cửa hàng Sneaker Hà Nội V2",
    "bank_account": "0071000123456",
    "bank_name": "Vietcombank",
    "bank_owner": "NGUYEN VAN SNEAKER"
  }
  ```

### `GET /api/auth/users` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Lấy danh sách tài khoản kèm thống kê hiệu năng Shipper theo Kỳ lương (tháng/năm).
* **Query Params**: `role` (ví dụ `NHANVIEN`), `month` (ví dụ `4`), `year` (ví dụ `2026`).
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 3,
        "username": "shipper_01",
        "fullname": "Bưu Tá Nguyễn Văn C",
        "role": "NHANVIEN",
        "daily_limit": 100,
        "notes": "Chuyên tuyến Cầu Giấy",
        "holding_orders_count": 2,
        "holding_orders": [
          {
            "order_id": "AG-10001",
            "status": "DANG_VAN_CHUYEN",
            "receiver_name": "Trần Văn A",
            "receiver_address": "10 Duy Tân, Hà Nội",
            "cod": 500000.0,
            "fee": 17400.0
          }
        ],
        "success_orders_count": 85,
        "failed_orders_count": 2,
        "daily_success": {
          "1": 4,
          "2": 3,
          "30": 2
        }
      }
    ]
  }
  ```

### `PUT /api/auth/users/<int:shipper_id>/shipper-config` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Thay đổi hạn mức giao hàng trong ngày và cập nhật ghi chú của bưu tá.
* **Request Body**:
  ```json
  {
    "daily_limit": 120,
    "notes": "Hỗ trợ thêm khu vực Ba Đình"
  }
  ```

---

## 2. 📘 SỔ ĐỊA CHỈ THÔNG MINH (Address Book)
*Yêu cầu Header:* `Authorization: Bearer <token>`

### `GET /api/address-book/`
* **Mục tiêu**: Lấy danh bạ địa chỉ của shop, tự động sắp xếp địa chỉ mặc định lên trên cùng.
* **Query Params**: `q` (Chuỗi tìm kiếm tên hoặc số điện thoại).

### `POST /api/address-book/`
* **Mục tiêu**: Thêm mới một địa chỉ và tự động xử lý trạng thái mặc định.

### `PUT /api/address-book/<id>/set-default`
* **Mục tiêu**: Thiết lập địa chỉ được chọn làm mặc định, tự động gỡ trạng thái mặc định của các địa chỉ cũ thuộc tài khoản.

### `DELETE /api/address-book/<id>`
* **Mục tiêu**: Xóa địa chỉ, tự động chuyển mặc định sang địa chỉ kế tiếp nếu vừa xóa địa chỉ mặc định cũ.

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

### `POST /api/orders/`
* **Mục tiêu**: Tạo vận đơn lẻ mới (Lưu bảng `DonHang` và tạo lịch sử hành trình ban đầu).

### `POST /api/orders/bulk-excel`
* **Mục tiêu**: Nhận tệp tin Excel, parse và nạp hàng loạt đơn hàng.

---

## 4. 🔍 HÀNH TRÌNH (Tracking & State Management)

### `GET /api/tracking/<order_id>`
* **Mục tiêu**: Public API tra cứu lịch trình hành trình vận đơn chi tiết (Không cần Token xác thực).

### `PUT /api/orders/<order_id>/status` (Chỉ dành cho `QUANTRI` hoặc `NHANVIEN`)
* **Mục tiêu**: Cập nhật trạng thái vận đơn. Tự động ghi nhận lịch sử và kích hoạt bảng đối soát COD (`DoiSoat`) nếu chuyển trạng thái sang `GIAO_THANH_CONG`.

---

## 5. 💰 TÀI CHÍNH & ĐỐI SOÁT (Reconciliations)

### `GET /api/reconciliations/invoices`
* **Mục tiêu**: Lấy danh sách các Hóa đơn đối soát gộp đã tạo kèm mảng các đơn hàng chi tiết nằm bên trong hóa đơn đó. Hỗ trợ phân biệt Đơn COD và Đơn 0đ trên UI.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "invoice_id": "INV-1716388902",
        "merchant_name": "Cửa hàng Giày Sneaker X",
        "total_cod": 1500000.0,
        "total_shipping": 54000.0,
        "net_payout": 1446000.0,
        "status": "CHUA_THANH_TOAN",
        "created_at": "2026-05-22T21:40:02",
        "orders": [
          {
            "order_id": "AG-10001",
            "type": "COD",
            "cod": 500000.0,
            "shipping_fee": 18000.0,
            "insurance_fee": 2500.0,
            "net_impact": 479500.0
          },
          {
            "order_id": "AG-10002",
            "type": "PREPAID_0D",
            "cod": 0.0,
            "shipping_fee": 15000.0,
            "insurance_fee": 0.0,
            "net_impact": -15000.0
          }
        ]
      }
    ]
  }
  ```

### `POST /api/reconciliations/invoices/create` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Tạo mới Hóa đơn đối soát gộp chứa danh sách các đơn hàng ở trạng thái `GIAO_THANH_CONG` chưa được thanh toán đối soát của Merchant.

### `PUT /api/reconciliations/invoices/<id>/pay` (Chỉ dành cho `QUANTRI`)
* **Mục tiêu**: Kế toán duyệt và chi trả tiền đối soát gộp, chuyển trạng thái hóa đơn sang `DA_THANH_TOAN`.

---

## 6. 🤝 ĐỐI TÁC B2B (REST Keys & APIs)

### `POST /api/partner/keys` (Chỉ dành cho `ADMIN`/`HR`)
* **Mục tiêu**: Tạo API Key thủ công cho đối tác.
* **Request Body**:
  ```json
  { "partner_id": 12 }
  ```
* **Response (200 OK)**:
  ```json
  { "success": true, "message": "Cấp API Key thành công", "data": { "api_key": "AG_PARTNER_..." } }
  ```

### `GET /api/partner/keys/merchant` (Yêu cầu JWT)
* **Mục tiêu**: Lấy API Key hiện tại của Merchant đang đăng nhập.

### `POST /api/partner/keys/merchant` (Yêu cầu JWT)
* **Mục tiêu**: Cấp lại / đổi mới API Key cho Merchant đang đăng nhập.

### `POST /api/partner/calculate-fee` (Yêu cầu Header `X-API-Key`)
* **Mục tiêu**: B2B API đối tác tính cước phí vận chuyển và bảo hiểm tự động.
* **Request Body**:
  ```json
  {
    "sender_address": "Cầu Giấy, Hà Nội",
    "receiver_address": "Hoàn Kiếm, Hà Nội",
    "weight_gram": 1000,
    "length_cm": 10,
    "width_cm": 15,
    "height_cm": 5,
    "declared_value": 500000
  }
  ```

### `POST /api/partner/create-order` (Yêu cầu Header `X-API-Key`)
* **Mục tiêu**: Đối tác tạo đơn hàng tự động thông qua M2M API Key.
* **Request Body**:
  ```json
  {
    "sender_address": "Cầu Giấy, Hà Nội",
    "receiver_address": "Hoàn Kiếm, Hà Nội",
    "sender_name": "Shop Sneaker B2B",
    "sender_phone": "0987654321",
    "receiver_name": "Nguyễn Văn Nhận",
    "receiver_phone": "0123456789",
    "weight_gram": 1000,
    "length_cm": 10,
    "width_cm": 15,
    "height_cm": 5,
    "declared_value": 500000,
    "cod_amount": 500000,
    "service_package_id": 1,
    "description": "Giày Sneaker B2B"
  }
  ```

### `GET /api/partner/track-order/<order_id>` (Yêu cầu Header `X-API-Key`)
* **Mục tiêu**: Đối tác B2B tra cứu trạng thái hành trình chi tiết của đơn hàng thuộc sở hữu của mình.

