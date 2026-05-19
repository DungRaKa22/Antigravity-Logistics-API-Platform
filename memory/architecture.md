# 🏗️ Thiết kế kiến trúc hệ thống - Logistics API Platform

---

## Sơ đồ kiến trúc tổng thể (API-First Single Web)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / PRESENTATION TIER                   │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐│
│  │  🌐 Web App (SPA)          │  │  🔗 Partner Systems        ││
│  │  React + Vite + Tailwind    │  │  (Sàn TMĐT, 3rd Party)     ││
│  │                             │  │                            ││
│  │  👤 Guest: Tracking         │  │  Gọi RESTful API           ││
│  │  Store: AuthContext         │  │  M2M tự động.              ││
│  │  🏪 Merchant: Portal        │  │  Nhận Webhook              ││
│  │       (Sổ địa chỉ mặc định, │  │                            ││
│  │       Tạo đơn OSRM)         │  │                            ││
│  │  👨‍💼 Admin: Dispatch &      │  │                            ││
│  │       Reconciliation        │  │                            ││
│  └──────────┬──────────────────┘  └────────────┬───────────────┘│
│             │                                  │                │
└─────────────┼──────────────────────────────────┼────────────────┘
              │  HTTP/JSON (Axios)               │  HTTP/JSON
              │                                  │
┌─────────────┼──────────────────────────────────┼────────────────┐
│             ▼                                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              🐍 SERVICE TIER - Python API               │     │
│  │                      (Flask Web)                        │     │
│  │                                                         │     │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │     │
│  │  │  Auth   │ │ Address  │ │ Orders & │ │   Recon   │  │     │
│  │  │ Module  │ │ Book CRUD│ │ Tracking │ │ & Finance │  │     │
│  │  └─────────┘ └────┬─────┘ └──────────┘ └───────────┘  │     │
│  │                    │                                    │     │
│  │              ┌─────▼──────────────────────────────┐    │     │
│  │              │   🗺️ Dịch vụ Bản Đồ Số           │    │     │
│  │              │   • OSRM Router API                │    │     │
│  │              │   • Geocoding Nominatim (OSM)      │    │     │
│  │              └────────────────────────────────────┘    │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │           Middleware & Service Layer             │  │     │
│  │  │  • API Key Validation (B2B Header check)         │  │     │
│  │  │  • openpyxl Excel Parser (Bulk Upload)           │  │     │
│  │  │  • Webhook Trigger (Khi đổi Status)              │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│              SERVICE TIER │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  SQL Queries (SQLAlchemy ORM / PyODBC)
                            │
                  ┌─────────▼─────────┐
                  │                   │  
                  │   📦 DATA TIER    │
                  │   SQL Server 2022 │
                  │                   │
                  │  ┌──────────────┐  │
                  │  │7 Core Tables │  │
                  │  │- NguoiDung   │  │
                  │  │- SoDiaChi    │  │
                  │  │- GoiDichVu   │  │
                  │  │- DonHang     │  │
                  │  │- LichSu      │  │
                  │  │- DoiSoat     │  │
                  │  │- KhoaAPI     │  │
                  │  └──────────────┘  │
                  │                   │
                  └───────────────────┘
```

---

## Luồng dữ liệu mới (Nghiệp vụ cốt lõi)

### 1. Luồng Chủ Shop lập đơn hàng (Order Creation)
```
[Web App Portal]
  Người dùng chọn địa chỉ gửi nhanh từ Sổ địa chỉ (hoặc để mặc định).
  Nhập địa chỉ nhận ➡️ Hệ thống gọi API OSRM tính km và ước tính cước phí thời gian thực.
  Nhập trọng lượng và kích thước D-R-C ➡️ Quy đổi trọng lượng quy đổi và tính toán phụ phí.
  Bấm Tạo đơn ➡️ Gửi POST lên /api/orders/ ➡️ Lưu vào CSDL với mã vận đơn tự sinh (AG-XXXXXX).
```

### 2. Luồng Tính cước phí thông minh
```
Tính toán cước phí và phụ phí:
  TrongLuongQuyDoiGram = (D x R x C) / 5000
  TrongLuongTinhCuoc = max(TrongLuongGram, TrongLuongQuyDoiGram)
  GoiDichVu ➡️ Lấy GiaKhoiDiem và GiaMoiKm của dịch vụ được chọn (Standard/Express).
  KhoangCachKm ➡️ Lấy khoảng cách thực tế từ OSRM API (Fallback về 10.5 km nếu lỗi kết nối Nominatim).
  PhiVanChuyen = GiaKhoiDiem + (GiaMoiKm * (KhoangCachKm - 3.0)) + Phụ phí khối lượng (2,000đ cho mỗi 1kg vượt mức).
  PhiBaoHiem = GiaTriKhaiBao * 0.005 (nếu có khai báo giá trị).
```

### 3. Luồng Đối soát tài chính COD (Reconciliation)
```
Đơn hàng giao thành công [GIAO_THANH_CONG].
  ➡️ Hệ thống tự động kích hoạt tạo dòng đối soát DoiSoat ở trạng thái CHUA_THANH_TOAN.
  ➡️ ThucNhan = TienThuHoCOD - PhiVanChuyen - PhiBaoHiem.
  ➡️ Quản trị viên (Kế toán) bấm nút "Thanh toán đối soát" trên Admin Dashboard.
  ➡️ Bảng DoiSoat chuyển trạng thái sang DA_THANH_TOAN, ghi nhận ngày giờ xử lý thực tế.
```

---

## Giải pháp kỹ thuật

- **Ứng dụng Web Single Page App (SPA)**: Xây dựng bằng React + Vite, giao diện Uber-style tối giản đen-trắng, tối ưu hóa các linh kiện và state giúp giao diện tải siêu tốc.
- **Xác thực an toàn**: Sử dụng token JWT (JSON Web Tokens) cho phiên làm việc của người dùng trên Web, và API Key dài 64 ký tự an toàn cho các tác vụ kết nối B2B M2M của Đối tác.
- **Tích hợp bản đồ**: Kết hợp dịch vụ địa lý Nominatim Geocoding của OpenStreetMap và dịch vụ OSRM Router để lấy khoảng cách chính xác theo km đường đi thực tế. Có cơ chế fallback tự động để hệ thống không bao giờ bị nghẽn khi API công cộng bị giới hạn băng thông.
