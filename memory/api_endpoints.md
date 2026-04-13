# 🔌 Thiết kế API Endpoints - Logistics API Platform

> Base URL: `http://localhost:5000/api`  
> Format: JSON  
> Auth: API Key via Header `X-API-Key`

---

## Quy ước Response

### Thành công
```json
{
  "success": true,
  "message": "Mô tả kết quả",
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Lỗi
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "errors": ["Chi tiết lỗi 1", "Chi tiết lỗi 2"]
}
```

### HTTP Status Codes
| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa xác thực |
| 403 | Forbidden - Không có quyền |
| 404 | Not Found - Không tìm thấy |
| 500 | Server Error |

---

## 1. 🔐 Authentication APIs

### 1.1 Đăng ký tài khoản
```
POST /api/auth/register
```
**Body:**
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@email.com",
  "password": "matkhau123",
  "phone": "0912345678",
  "address": "Số 1, Hoàn Kiếm, Hà Nội"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@email.com",
    "api_key": "usr_a1b2c3d4e5f6..."
  }
}
```

### 1.2 Đăng nhập
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "nguyenvana@email.com",
  "password": "matkhau123"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "role": "CUSTOMER",
    "api_key": "usr_a1b2c3d4e5f6..."
  }
}
```

---

## 2. 📦 Shipping APIs

### 2.1 Tính phí vận chuyển
```
POST /api/shipping/calculate
Headers: X-API-Key: <api_key>
```
**Body (Cách 1 — theo địa chỉ, dùng OSRM):**
```json
{
  "diachi_gui": "Số 1, Hoàn Kiếm, Hà Nội",
  "diachi_nhan": "Số 50, TP Hải Dương, Hải Dương",
  "trong_luong_kg": 2.5
}
```
**Body (Cách 2 — theo khu vực, fallback):**
```json
{
  "ma_khuvuc_gui": 1,
  "ma_khuvuc_nhan": 14,
  "trong_luong_kg": 2.5
}
```
**Response (200) — Khi OSRM thành công:**
```json
{
  "success": true,
  "message": "Tính phí thành công (OSRM)",
  "data": {
    "khu_vuc_gui": "Quận Hoàn Kiếm, Hà Nội",
    "khu_vuc_nhan": "TP. Hải Dương, Hải Dương",
    "khoang_cach_km": 60.3,
    "trong_luong_kg": 2.5,
    "phi_co_ban": 15000,
    "phi_khoang_cach": 18090,
    "phi_trong_luong": 7500,
    "tong_phi": 40590,
    "phuong_thuc_tinh": "OSRM",
    "thoi_gian_du_kien": "1-2 ngày"
  }
}
```
**Response (200) — Khi fallback zone:**
```json
{
  "success": true,
  "message": "Tính phí thành công (Zone)",
  "data": {
    "khu_vuc_gui": "Quận Hoàn Kiếm, Hà Nội",
    "khu_vuc_nhan": "TP. Hải Dương, Hải Dương",
    "vung_gui": 1,
    "vung_nhan": 3,
    "trong_luong_kg": 2.5,
    "phi_co_ban": 30000,
    "phi_trong_luong": 12500,
    "tong_phi": 42500,
    "phuong_thuc_tinh": "ZONE",
    "thoi_gian_du_kien": "2-3 ngày"
  }
}
```

### 2.2 Lấy danh sách khu vực
```
GET /api/areas
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "area_name": "Quận Hoàn Kiếm", "province": "Hà Nội", "zone": 1 },
    { "id": 2, "area_name": "Quận Cầu Giấy", "province": "Hà Nội", "zone": 1 }
  ]
}
```

### 2.3 Lấy bảng giá cước
```
GET /api/rates
```
**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "from_zone": 1,
      "to_zone": 1,
      "base_fee": 15000,
      "weight_fee_per_kg": 3000,
      "description": "Nội thành → Nội thành"
    }
  ]
}
```

---

## 3. 📋 Order APIs

### 3.1 Tạo đơn hàng mới
```
POST /api/orders
Headers: X-API-Key: <api_key>
```
**Body:**
```json
{
  "sender_name": "Nguyễn Văn A",
  "sender_phone": "0912345678",
  "sender_address": "Số 1, Hoàn Kiếm, Hà Nội",
  "sender_area_id": 1,
  "receiver_name": "Trần Thị B",
  "receiver_phone": "0987654321",
  "receiver_address": "Số 50, TP Hải Dương",
  "receiver_area_id": 6,
  "weight_kg": 2.5,
  "item_description": "Sách giáo khoa",
  "cod_amount": 150000,
  "notes": "Gọi trước khi giao"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "id": 1,
    "tracking_code": "HL20260407001",
    "shipping_fee": 42500,
    "cod_amount": 150000,
    "status": "PENDING",
    "created_at": "2026-04-07T08:30:00"
  }
}
```

### 3.2 Tra cứu vận đơn theo tracking code
```
GET /api/orders/track/{tracking_code}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "tracking_code": "HL20260407001",
    "sender_name": "Nguyễn Văn A",
    "receiver_name": "Trần Thị B",
    "status": "IN_TRANSIT",
    "shipping_fee": 42500,
    "created_at": "2026-04-07T08:30:00",
    "status_history": [
      { "status": "PENDING", "note": "Đơn hàng mới tạo", "changed_at": "2026-04-07T08:30:00" },
      { "status": "PICKED_UP", "note": "Đã lấy hàng", "changed_at": "2026-04-07T10:00:00" },
      { "status": "IN_TRANSIT", "note": "Đang vận chuyển đến Hải Dương", "changed_at": "2026-04-07T14:00:00" }
    ]
  }
}
```

### 3.3 Danh sách đơn hàng (có phân trang)
```
GET /api/orders?page=1&per_page=20&status=PENDING
Headers: X-API-Key: <api_key>
```
**Query Parameters:**
| Param | Mô tả | Mặc định |
|-------|--------|----------|
| `page` | Trang hiện tại | 1 |
| `per_page` | Số đơn/trang | 20 |
| `status` | Lọc theo trạng thái | (tất cả) |
| `search` | Tìm theo tracking/tên | (không) |

**Response (200):**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 3.4 Chi tiết đơn hàng
```
GET /api/orders/{id}
Headers: X-API-Key: <api_key>
```

### 3.5 Cập nhật trạng thái đơn hàng
```
PUT /api/orders/{id}/status
Headers: X-API-Key: <api_key>  (yêu cầu role: STAFF/ADMIN)
```
**Body:**
```json
{
  "status": "IN_TRANSIT",
  "note": "Đang vận chuyển đến kho Hải Dương"
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái thành công",
  "data": {
    "id": 1,
    "tracking_code": "HL20260407001",
    "old_status": "PICKED_UP",
    "new_status": "IN_TRANSIT"
  }
}
```

---

## 4. 🤝 Partner APIs

### 4.1 Đăng ký đối tác
```
POST /api/partners/register
```
**Body:**
```json
{
  "company_name": "Shop ABC - Sàn TMĐT",
  "contact_email": "api@shopabc.com",
  "contact_phone": "0901234567",
  "webhook_url": "https://shopabc.com/webhook/shipping"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Đăng ký đối tác thành công",
  "data": {
    "id": 1,
    "company_name": "Shop ABC - Sàn TMĐT",
    "api_key": "ptn_x1y2z3a4b5c6..."
  }
}
```

### 4.2 Tạo đơn hàng loạt (cho đối tác)
```
POST /api/partners/orders/bulk
Headers: X-API-Key: <partner_api_key>
```
**Body:**
```json
{
  "orders": [
    {
      "sender_name": "Kho Shop ABC",
      "sender_phone": "0901234567",
      "sender_address": "Kho hàng ABC, Cầu Giấy, HN",
      "sender_area_id": 2,
      "receiver_name": "Lê Văn C",
      "receiver_phone": "0933333333",
      "receiver_address": "Số 20, TP Hải Dương",
      "receiver_area_id": 6,
      "weight_kg": 1.0,
      "item_description": "Áo thun size L",
      "cod_amount": 250000
    },
    { ... },
    { ... }
  ]
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Đã tạo 3/3 đơn hàng",
  "data": {
    "total_submitted": 3,
    "total_success": 3,
    "total_failed": 0,
    "orders": [
      { "tracking_code": "HL20260407002", "status": "PENDING", "shipping_fee": 35000 },
      { "tracking_code": "HL20260407003", "status": "PENDING", "shipping_fee": 42500 },
      { "tracking_code": "HL20260407004", "status": "PENDING", "shipping_fee": 28000 }
    ]
  }
}
```

---

## 5. 📊 Dashboard APIs (Staff/Admin)

### 5.1 Thống kê tổng quan
```
GET /api/dashboard/stats
Headers: X-API-Key: <staff_api_key>
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_orders": 1250,
    "orders_today": 45,
    "by_status": {
      "PENDING": 23,
      "PICKED_UP": 12,
      "IN_TRANSIT": 89,
      "DELIVERED": 1100,
      "CANCELLED": 20,
      "RETURNED": 6
    },
    "total_revenue": 52500000,
    "revenue_today": 1890000
  }
}
```

---

## 6. ❤️ Health Check

### 6.1 Kiểm tra server
```
GET /api/health
```
**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected",
    "uptime": "2h 30m"
  }
}
```
