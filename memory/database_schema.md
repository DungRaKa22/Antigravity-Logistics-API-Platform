# 🗄️ Cấu trúc Database (6 Bảng Cốt Lõi) - Logistics API Platform

> Phiên bản tinh gọn và tối ưu hóa hệ thống vận chuyển với 6 bảng cốt lõi (Table Schema).

---

## 1. Bảng `Users` (Quản lý Tài khoản Đa phân quyền)
Lưu trữ toàn bộ người dùng kết hợp phân quyền qua cột Role.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `UserID` | INT | PK | Tự tăng | Mã định danh duy nhất |
| `Username` | VARCHAR(100) | | UNIQUE, NOT NULL | Tên đăng nhập (SĐT/Email) |
| `PasswordHash` | VARCHAR(255) | | NOT NULL | Mật khẩu mã hóa |
| `FullName` | NVARCHAR(255) | | NOT NULL | Họ tên / Tên doanh nghiệp đối tác |
| `Role` | VARCHAR(20) | | IN ('SHOP', 'ADMIN', 'PARTNER')| Vai trò |
| `CreatedAt` | DATETIME | | DEFAULT GETDATE() | Ngày tạo |

---

## 2. Bảng `AddressBook` (Sổ địa chỉ thông minh)
Gợi ý địa chỉ cho chủ shop khi lên đơn.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `AddressID` | INT | PK | Tự tăng | Mã sổ địa chỉ |
| `UserID` | INT | FK | REFERENCES Users(UserID) | Của shop nào |
| `ContactName` | NVARCHAR(255) | | NOT NULL | Tên người nhận |
| `ContactPhone` | VARCHAR(20) | | NOT NULL | SDT người nhận |
| `FullAddress` | NVARCHAR(500) | | NOT NULL | Số nhà, Phường, Quận, Tỉnh... |
| `Latitude` | DECIMAL(10,6) | | NULL | Vĩ độ |
| `Longitude` | DECIMAL(10,6) | | NULL | Kinh độ |

---

## 3. Bảng `Orders` (Quản lý Vận đơn)
Bảng cốt lõi, lưu trữ kiện hàng.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `OrderID` | VARCHAR(50) | PK | | Mã giao dịch tự parse (Vd: AG-883921) |
| `Sender_UserID`| INT | FK | REFERENCES Users(UserID) | Người tạo đơn |
| `ReceiverName` | NVARCHAR(255) | | NOT NULL | Tên người nhận |
| `ReceiverPhone`| VARCHAR(20) | | NOT NULL | SĐT Nhận |
| `ReceiverAddress`| NVARCHAR(500)| | NOT NULL | Địa chỉ người nhận đầy đủ |
| `WeightGram` | INT | | NOT NULL | Khối lượng (gram) |
| `DistanceKm` | DECIMAL(10,2) | | NULL | Số km (từ API Map) |
| `ShippingFee` | DECIMAL(18,2) | | NOT NULL | Khối lượng * Khoảng cách |
| `CodAmount` | DECIMAL(18,2) | | DEFAULT 0 | Tiền thu hộ |
| `CurrentStatus`| VARCHAR(50) | | IN ('PENDING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'RETURNED') | Trạng thái |
| `CreatedAt` | DATETIME | | DEFAULT GETDATE() | Ngày tạo |

---

## 4. Bảng `TrackingHistory` (Lịch sử Hành trình)
Hệ thống tracking realtime.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `HistoryID` | INT | PK | Tự tăng | Mã tracking |
| `OrderID` | VARCHAR(50) | FK | REFERENCES Orders(OrderID)| Cho vận đơn nào |
| `StatusCode` | VARCHAR(50) | | IN ('PENDING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'RETURNED') | Mã trạng thái |
| `LocationInfo` | NVARCHAR(500) | | NULL | Ghi chú vị trí bưu cục... |
| `UpdatedBy_AdminID`| INT | FK | REFERENCES Users(UserID)| Nhân viên Admin cập nhật |
| `Timestamp` | DATETIME | | DEFAULT GETDATE() | Mốc thời gian |

---

## 5. Bảng `Reconciliations` (Đối soát Tài chính COD)
Bảng kế toán dòng tiền.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `ReconID` | INT | PK | Tự tăng | Mã đối soát |
| `OrderID` | VARCHAR(50) | FK | UNIQUE, REFERENCES Orders | Cho mã đơn nào |
| `Shop_UserID` | INT | FK | REFERENCES Users(UserID) | Thuộc về shop nào |
| `TotalCollected`| DECIMAL(18,2) | | NOT NULL | Tổng thu của khách mua |
| `FeeDeducted` | DECIMAL(18,2) | | NOT NULL | Cước phí bị trừ đi |
| `FinalPayout` | DECIMAL(18,2) | | NOT NULL | Thực nhận của Shop |
| `ReconStatus` | VARCHAR(50) | | IN ('UNPAID', 'PAID') | Trạng thái trả tiền |
| `CreatedAt` | DATETIME | | DEFAULT GETDATE() | Ngày tạo đối soát |
| `ProcessedAt` | DATETIME | | NULL | Ngày thanh toán |

---

## 6. Bảng `ApiKeys` (Quản lý Đối tác B2B)
Bảo mật hệ thống mở API.

| Cột | Kiểu dữ liệu | Khóa | Ràng buộc | Mô tả |
|-----|-------------|------|-----------|-------|
| `KeyID` | INT | PK | Tự tăng | |
| `Partner_UserID`| INT | FK | REFERENCES Users(UserID) | Đối tác sở hữu chi tiết |
| `ApiKeyString` | VARCHAR(64) | | UNIQUE, NOT NULL | Chuỗi token bảo mật |
| `IsActive` | BIT | | DEFAULT 1 | Bật/tắt truy cập |
| `CreatedAt` | DATETIME | | DEFAULT GETDATE() | Ngày sinh token |
