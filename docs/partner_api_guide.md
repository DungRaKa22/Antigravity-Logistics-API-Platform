# 🔌 Hướng dẫn Tích hợp B2B API Đối Tác - Antigravity Express

Tài liệu này hướng dẫn cách kết nối và tích hợp hệ thống quản lý vận đơn và định tuyến thông minh của **Antigravity Express** vào ứng dụng hoặc website của đối tác B2B (ví dụ: các sàn thương mại điện tử, hệ thống ERP của doanh nghiệp).

---

## 🔑 1. Cơ Chế Xác Thực & API Key (Authentication)

Tất cả các cuộc gọi API B2B đều yêu cầu xác thực bằng **API Key**. 

### Cách lấy API Key:
1. Đăng nhập vào cổng **Merchant Console** của bạn.
2. Điều hướng tới phân hệ **"Tích Hợp B2B API"** ở thanh điều hướng bên trái.
3. Nhấn nút **"Cấp API Key"** (hoặc **"Cấp lại API Key mới"** nếu muốn thu hồi khóa cũ).
4. Hệ thống sẽ sinh một chuỗi khóa bảo mật 64 ký tự bắt đầu bằng tiền tố `AG_PARTNER_`.

### Cấu hình Header yêu cầu:
Trong mọi request gửi tới API đối tác, bạn phải đính kèm Header bắt buộc sau:
```http
X-API-Key: AG_PARTNER_C4B2E8D7A6F5E3D2... (Khóa của bạn)
Content-Type: application/json
```

---

## 📡 2. Danh Sách Các Endpoint API (API Endpoints)

### 2.1. Tính cước phí vận chuyển & Khoảng cách (Calculate Fee)
Endpoint này giúp đối tác ước tính trước quãng đường đi, trọng lượng tính cước (chargeable weight) và tổng cước phí (bao gồm phí vận chuyển và phí bảo hiểm) trước khi tạo đơn hàng.

*   **URL:** `/api/partner/calculate-fee`
*   **Method:** `POST`
*   **Body (JSON):**

| Trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `sender_address` | String | Có | Địa chỉ đầy đủ của người gửi/kho lấy hàng. |
| `receiver_address` | String | Có | Địa chỉ đầy đủ của người nhận hàng. |
| `weight_gram` | Integer | Có | Trọng lượng thực tế của gói hàng (gram). |
| `length_cm` | Integer | Không | Chiều dài gói hàng (cm) - Mặc định: 10. |
| `width_cm` | Integer | Không | Chiều rộng gói hàng (cm) - Mặc định: 10. |
| `height_cm` | Integer | Không | Chiều cao gói hàng (cm) - Mặc định: 10. |
| `declared_value` | Float | Không | Giá trị khai giá của hàng hóa (VNĐ) để tính bảo hiểm - Mặc định: 0. |

*   **Ví dụ Request Body:**
```json
{
  "sender_address": "75 Nguyễn Thái Học, Chí Linh, Hải Dương",
  "receiver_address": "20 Đống Đa, Hà Nội",
  "weight_gram": 1500,
  "length_cm": 25,
  "width_cm": 20,
  "height_cm": 15,
  "declared_value": 500000
}
```

*   **Ví dụ Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "distance_km": 60.5,
    "chargeable_weight": 1500,
    "shipping_fee": 136000.0,
    "insurance_fee": 2500.0,
    "total_fee": 138500.0
  }
}
```

---

### 2.2. Tạo mới vận đơn tích hợp (Create Order)
Endpoint này cho phép đối tác tạo trực tiếp một vận đơn mới vào hệ thống của Antigravity Express.

*   **URL:** `/api/partner/create-order`
*   **Method:** `POST`
*   **Body (JSON):**

| Trường dữ liệu | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `sender_name` | String | Không | Tên hiển thị người gửi - Mặc định: Tên cửa hàng đối tác. |
| `sender_phone` | String | Có | Số điện thoại liên hệ người gửi. |
| `sender_address` | String | Có | Địa chỉ lấy hàng chi tiết. |
| `receiver_name` | String | Có | Họ và tên người nhận. |
| `receiver_phone` | String | Có | Số điện thoại người nhận. |
| `receiver_address` | String | Có | Địa chỉ giao hàng chi tiết. |
| `weight_gram` | Integer | Có | Trọng lượng gói hàng (gram). |
| `length_cm` | Integer | Không | Chiều dài gói hàng (cm). |
| `width_cm` | Integer | Không | Chiều rộng gói hàng (cm). |
| `height_cm` | Integer | Không | Chiều cao gói hàng (cm). |
| `description` | String | Không | Ghi chú mô tả hàng hóa. |
| `declared_value` | Float | Không | Giá trị khai giá hàng hóa (VNĐ). |
| `cod_amount` | Float | Không | Số tiền thu hộ COD (VNĐ) - Mặc định: 0. |
| `service_package_id` | Integer | Không | Gói dịch vụ: `1` (STANDARD) hoặc `2` (EXPRESS) - Mặc định: 1. |
| `inspection_policy` | String | Không | Chính sách xem hàng: `KHONG_XEM`, `XEM_KHONG_THU`, `THU_HANG` - Mặc định: `KHONG_XEM`. |
| `pickup_type` | String | Không | Hình thức gửi hàng: `TU_MANG_RA_BUU_CUC` hoặc `NHAN_VIEN_DEN_LAY` - Mặc định: `TU_MANG_RA_BUU_CUC`. |

*   **Ví dụ Request Body:**
```json
{
  "sender_name": "Sneaker World",
  "sender_phone": "0987654321",
  "sender_address": "75 Nguyễn Thái Học, Chí Linh, Hải Dương",
  "receiver_name": "Nguyễn Văn Nhận",
  "receiver_phone": "0912345678",
  "receiver_address": "20 Đống Đa, Hà Nội",
  "weight_gram": 1000,
  "description": "Giày Sneaker Nam Size 42",
  "declared_value": 450000,
  "cod_amount": 450000,
  "service_package_id": 1,
  "inspection_policy": "XEM_KHONG_THU",
  "pickup_type": "TU_MANG_RA_BUU_CUC"
}
```

*   **Ví dụ Response (211 Created):**
```json
{
  "success": true,
  "message": "Tạo đơn hàng B2B thành công",
  "data": {
    "order_id": "AG-875691",
    "shipping_fee": 136000.0,
    "insurance_fee": 2250.0,
    "total_fee": 138250.0,
    "routing": [
      "Hub Hải Dương (HD)",
      "Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)",
      "Hub Hà Nội (HN)"
    ]
  }
}
```

---

### 2.3. Tra cứu hành trình vận đơn (Track Order)
Endpoint này giúp đối tác tra cứu thời gian thực trạng thái của đơn hàng do chính mình tạo ra kèm theo toàn bộ timeline lịch sử cập nhật.

*   **URL:** `/api/partner/track-order/<order_id>`
*   **Method:** `GET`

*   **Ví dụ Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_id": "AG-875691",
    "status": "DANG_VAN_CHUYEN",
    "receiver_name": "Nguyễn Văn Nhận",
    "receiver_address": "20 Đống Đa, Hà Nội",
    "shipping_fee": 136000.0,
    "cod_amount": 450000.0,
    "created_at": "2026-06-03T17:00:12",
    "timeline": [
      {
        "status": "DANG_VAN_CHUYEN",
        "info": "Hàng đang được trung chuyển qua bưu cục Từ Sơn, Bắc Ninh",
        "time": "2026-06-03T18:15:30",
        "notes": null,
        "proof_url": null
      },
      {
        "status": "DA_LAY_HANG",
        "info": "Nhân viên lấy hàng đã nhận hàng tại bưu cục Hải Dương",
        "time": "2026-06-03T17:45:00",
        "notes": null,
        "proof_url": null
      },
      {
        "status": "CHO_LAY_HANG",
        "info": "Đơn hàng tạo qua B2B API thành công",
        "time": "2026-06-03T17:00:12",
        "notes": null,
        "proof_url": null
      }
    ]
  }
}
```

---

## 🛡️ 3. Mã Trạng Thái Đơn Hàng (Order Status Codes)

Trong phản hồi tra cứu hành trình, trạng thái `status` của đơn hàng sẽ là một trong các giá trị chuẩn sau:

*   `CHO_LAY_HANG`: Cửa hàng đã lập đơn thành công, chờ shipper qua lấy hàng hoặc shop mang ra bưu cục.
*   `DA_LAY_HANG`: Shipper đã tiếp nhận hàng hóa từ người gửi.
*   `DANG_VAN_CHUYEN`: Đơn hàng đang được luân chuyển giữa các bưu cục (Hub) hoặc tổng kho trung chuyển.
*   `CHO_GIAO_HANG`: Hàng đã cập bến bưu cục phát, đang phân công cho shipper đi giao chặng cuối.
*   `DANG_GIAO_HANG`: Shipper đang đi giao hàng đến người nhận.
*   `GIAO_THANH_CONG`: Giao hàng thành công, người nhận đã ký tên xác nhận và nhận hàng.
*   `GIAO_THAT_BAI`: Giao hàng thất bại (có kèm lý do ghi chú từ shipper).
*   `CHO_THANH_TOAN`: (Chỉ áp dụng với đơn không COD tạo bởi khách lẻ) Chờ thanh toán trực tuyến qua cổng VietQR/Momo.
