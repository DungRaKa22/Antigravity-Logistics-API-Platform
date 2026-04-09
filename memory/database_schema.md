# 🗄️ Thiết kế Database Schema - Logistics API Platform

> Hệ quản trị: **SQL Server** | Encoding: UTF-8 | Collation: Vietnamese_CI_AS

---

## Sơ đồ quan hệ (ERD tóm tắt)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Users   │────<│   Orders     │>────│    Areas     │
└──────────┘     └──────┬───────┘     └──────────────┘
                        │
┌──────────┐     ┌──────┴───────┐     ┌──────────────┐
│ Partners │────<│ OrderHistory │     │ShippingRates │
└──────────┘     └──────────────┘     └──────────────┘
```

---

## Bảng 1: Users (Người dùng)

> Lưu thông tin tài khoản khách hàng và nhân viên.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | Mã người dùng |
| `full_name` | NVARCHAR(100) | NOT NULL | Họ tên |
| `email` | VARCHAR(150) | NOT NULL, UNIQUE | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã mã hóa |
| `phone` | VARCHAR(20) | NULL | Số điện thoại |
| `address` | NVARCHAR(500) | NULL | Địa chỉ |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'CUSTOMER' | Vai trò: CUSTOMER, STAFF, ADMIN |
| `api_key` | VARCHAR(64) | UNIQUE | API Key cho xác thực |
| `is_active` | BIT | DEFAULT 1 | Trạng thái hoạt động |
| `created_at` | DATETIME | DEFAULT GETDATE() | Ngày tạo |
| `updated_at` | DATETIME | DEFAULT GETDATE() | Ngày cập nhật |

```sql
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    api_key VARCHAR(64) UNIQUE,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

---

## Bảng 2: Partners (Đối tác)

> Lưu thông tin các hệ thống đối tác (sàn TMĐT) tích hợp API.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | Mã đối tác |
| `company_name` | NVARCHAR(200) | NOT NULL | Tên công ty/hệ thống |
| `contact_email` | VARCHAR(150) | NOT NULL, UNIQUE | Email liên hệ |
| `contact_phone` | VARCHAR(20) | NULL | SĐT liên hệ |
| `api_key` | VARCHAR(64) | NOT NULL, UNIQUE | API Key được cấp |
| `webhook_url` | VARCHAR(500) | NULL | URL callback khi cập nhật trạng thái |
| `is_active` | BIT | DEFAULT 1 | Trạng thái |
| `created_at` | DATETIME | DEFAULT GETDATE() | Ngày đăng ký |

```sql
CREATE TABLE Partners (
    id INT PRIMARY KEY IDENTITY(1,1),
    company_name NVARCHAR(200) NOT NULL,
    contact_email VARCHAR(150) NOT NULL UNIQUE,
    contact_phone VARCHAR(20) NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    webhook_url VARCHAR(500) NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
```

---

## Bảng 3: Areas (Khu vực)

> Danh mục khu vực giao hàng, dùng để tính phí cước.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | Mã khu vực |
| `area_name` | NVARCHAR(100) | NOT NULL | Tên khu vực |
| `province` | NVARCHAR(100) | NOT NULL | Tỉnh/Thành phố |
| `area_code` | VARCHAR(10) | UNIQUE | Mã vùng |
| `zone` | INT | NOT NULL | Vùng (1: Nội thành, 2: Ngoại thành, 3: Liên tỉnh) |

```sql
CREATE TABLE Areas (
    id INT PRIMARY KEY IDENTITY(1,1),
    area_name NVARCHAR(100) NOT NULL,
    province NVARCHAR(100) NOT NULL,
    area_code VARCHAR(10) UNIQUE,
    zone INT NOT NULL -- 1: Nội thành, 2: Ngoại thành, 3: Liên tỉnh
);
```

---

## Bảng 4: ShippingRates (Bảng giá cước)

> Quy tắc tính phí dựa trên vùng gửi - vùng nhận và trọng lượng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | Mã giá cước |
| `from_zone` | INT | NOT NULL | Vùng gửi |
| `to_zone` | INT | NOT NULL | Vùng nhận |
| `base_fee` | DECIMAL(12,2) | NOT NULL | Phí cơ bản (VND) |
| `weight_fee_per_kg` | DECIMAL(12,2) | NOT NULL | Phí theo kg (VND/kg) |
| `max_weight_kg` | DECIMAL(5,2) | DEFAULT 30 | Trọng lượng tối đa (kg) |
| `description` | NVARCHAR(200) | NULL | Ghi chú |
| `is_active` | BIT | DEFAULT 1 | Còn áp dụng |

```sql
CREATE TABLE ShippingRates (
    id INT PRIMARY KEY IDENTITY(1,1),
    from_zone INT NOT NULL,
    to_zone INT NOT NULL,
    base_fee DECIMAL(12,2) NOT NULL,
    weight_fee_per_kg DECIMAL(12,2) NOT NULL,
    max_weight_kg DECIMAL(5,2) DEFAULT 30,
    description NVARCHAR(200) NULL,
    is_active BIT DEFAULT 1
);
```

---

## Bảng 5: Orders (Đơn hàng / Vận đơn)

> Bảng chính lưu thông tin vận đơn.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | Mã đơn hàng |
| `tracking_code` | VARCHAR(20) | NOT NULL, UNIQUE | Mã vận đơn (VD: HL20260407001) |
| `user_id` | INT | FK → Users(id), NULL | Khách hàng tạo đơn |
| `partner_id` | INT | FK → Partners(id), NULL | Đối tác tạo đơn (nếu có) |
| `sender_name` | NVARCHAR(100) | NOT NULL | Tên người gửi |
| `sender_phone` | VARCHAR(20) | NOT NULL | SĐT người gửi |
| `sender_address` | NVARCHAR(500) | NOT NULL | Địa chỉ người gửi |
| `sender_area_id` | INT | FK → Areas(id) | Khu vực gửi |
| `receiver_name` | NVARCHAR(100) | NOT NULL | Tên người nhận |
| `receiver_phone` | VARCHAR(20) | NOT NULL | SĐT người nhận |
| `receiver_address` | NVARCHAR(500) | NOT NULL | Địa chỉ người nhận |
| `receiver_area_id` | INT | FK → Areas(id) | Khu vực nhận |
| `weight_kg` | DECIMAL(5,2) | NOT NULL | Trọng lượng (kg) |
| `item_description` | NVARCHAR(500) | NULL | Mô tả hàng hóa |
| `shipping_fee` | DECIMAL(12,2) | NOT NULL | Phí vận chuyển (VND) |
| `cod_amount` | DECIMAL(12,2) | DEFAULT 0 | Tiền thu hộ COD (VND) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | Trạng thái đơn |
| `notes` | NVARCHAR(500) | NULL | Ghi chú thêm |
| `created_at` | DATETIME | DEFAULT GETDATE() | Ngày tạo |
| `updated_at` | DATETIME | DEFAULT GETDATE() | Ngày cập nhật |

```sql
CREATE TABLE Orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    tracking_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NULL FOREIGN KEY REFERENCES Users(id),
    partner_id INT NULL FOREIGN KEY REFERENCES Partners(id),
    sender_name NVARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address NVARCHAR(500) NOT NULL,
    sender_area_id INT FOREIGN KEY REFERENCES Areas(id),
    receiver_name NVARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_address NVARCHAR(500) NOT NULL,
    receiver_area_id INT FOREIGN KEY REFERENCES Areas(id),
    weight_kg DECIMAL(5,2) NOT NULL,
    item_description NVARCHAR(500) NULL,
    shipping_fee DECIMAL(12,2) NOT NULL,
    cod_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes NVARCHAR(500) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

---

## Bảng 6: OrderStatusHistory (Lịch sử trạng thái)

> Ghi lại timeline thay đổi trạng thái của mỗi đơn hàng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|--------------|-----------|-------|
| `id` | INT | PK, IDENTITY(1,1) | ID |
| `order_id` | INT | FK → Orders(id), NOT NULL | Đơn hàng |
| `old_status` | VARCHAR(20) | NULL | Trạng thái cũ |
| `new_status` | VARCHAR(20) | NOT NULL | Trạng thái mới |
| `changed_by` | INT | FK → Users(id), NULL | Người thay đổi |
| `note` | NVARCHAR(300) | NULL | Ghi chú |
| `changed_at` | DATETIME | DEFAULT GETDATE() | Thời điểm thay đổi |

```sql
CREATE TABLE OrderStatusHistory (
    id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL FOREIGN KEY REFERENCES Orders(id),
    old_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by INT NULL FOREIGN KEY REFERENCES Users(id),
    note NVARCHAR(300) NULL,
    changed_at DATETIME DEFAULT GETDATE()
);
```

---

## Trạng thái đơn hàng (Status Enum)

| Giá trị | Tên tiếng Việt | Mô tả |
|---------|---------------|-------|
| `PENDING` | Chờ lấy hàng | Đơn mới tạo, chờ shipper đến lấy |
| `PICKED_UP` | Đã lấy hàng | Shipper đã nhận hàng từ người gửi |
| `IN_TRANSIT` | Đang vận chuyển | Hàng đang trên đường giao |
| `DELIVERED` | Giao thành công | Đã giao đến người nhận |
| `CANCELLED` | Đã hủy | Đơn bị hủy |
| `RETURNED` | Hoàn trả | Giao không thành công, hoàn về người gửi |

---

## Dữ liệu mẫu (Seed Data)

### Areas
```sql
INSERT INTO Areas (area_name, province, area_code, zone) VALUES
(N'Quận Hoàn Kiếm', N'Hà Nội', 'HN01', 1),
(N'Quận Cầu Giấy', N'Hà Nội', 'HN02', 1),
(N'Huyện Đông Anh', N'Hà Nội', 'HN03', 2),
(N'Quận 1', N'TP. Hồ Chí Minh', 'HCM01', 1),
(N'Quận Thủ Đức', N'TP. Hồ Chí Minh', 'HCM02', 2),
(N'TP. Hải Dương', N'Hải Dương', 'HD01', 3),
(N'TP. Chí Linh', N'Hải Dương', 'HD02', 3),
(N'TP. Đà Nẵng', N'Đà Nẵng', 'DN01', 3);
```

### ShippingRates
```sql
INSERT INTO ShippingRates (from_zone, to_zone, base_fee, weight_fee_per_kg, description) VALUES
(1, 1, 15000, 3000, N'Nội thành → Nội thành'),
(1, 2, 20000, 4000, N'Nội thành → Ngoại thành'),
(1, 3, 30000, 5000, N'Nội thành → Liên tỉnh'),
(2, 1, 20000, 4000, N'Ngoại thành → Nội thành'),
(2, 2, 22000, 4500, N'Ngoại thành → Ngoại thành'),
(2, 3, 32000, 5500, N'Ngoại thành → Liên tỉnh'),
(3, 1, 30000, 5000, N'Liên tỉnh → Nội thành'),
(3, 2, 32000, 5500, N'Liên tỉnh → Ngoại thành'),
(3, 3, 35000, 6000, N'Liên tỉnh → Liên tỉnh');
```

---

## Công thức tính phí vận chuyển

```
shipping_fee = base_fee + (weight_kg × weight_fee_per_kg)
```

Ví dụ: Gửi 2.5 kg từ Nội thành → Liên tỉnh:
```
= 30,000 + (2.5 × 5,000) = 30,000 + 12,500 = 42,500 VND
```
