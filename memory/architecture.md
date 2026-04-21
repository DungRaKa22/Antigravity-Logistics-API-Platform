# 🏗️ Thiết kế kiến trúc hệ thống - Logistics API Platform

---

## Sơ đồ kiến trúc tổng thể (API-First Single Web)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / PRESENTATION TIER                   │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐│
│  │  🌐 Web App (SPA)          │  │  🔗 Partner Systems        ││
│  │  HTML/CSS/JS + Alpine.js   │  │  (Sàn TMĐT, 3rd Party)     ││
│  │                             │  │                            ││
│  │  👤 Guest: Tracking & Giá   │  │  Gọi RESTful API           ││
│  │  🏪 Shop: Portal (Address  │  │  M2M tự động. Nhận WebHook ││
│  │       Book, Bulk Excel)     │  │                            ││
│  │  👨‍💼 Admin: Dispatch Board, │  │                            ││
│  │       Reconciliation (Đối   │  │                            ││
│  │       soát).                │  │                            ││
│  └──────────┬──────────────────┘  └────────────┬───────────────┘│
│             │                                  │                │
└─────────────┼──────────────────────────────────┼────────────────┘
              │  HTTP/JSON (Fetch API)            │  HTTP/JSON
              │                                  │
┌─────────────┼──────────────────────────────────┼────────────────┐
│             ▼                                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              🐍 SERVICE TIER - Python API               │     │
│  │                  (Flask / FastAPI)                       │     │
│  │                                                         │     │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │     │
│  │  │  Auth   │ │ Address  │ │ Orders & │ │   Recon   │  │     │
│  │  │ Module  │ │ Book CRUD│ │ Tracking │ │ & Finance │  │     │
│  │  └─────────┘ └────┬─────┘ └──────────┘ └───────────┘  │     │
│  │                    │                                    │     │
│  │              ┌─────▼──────────────────────────────┐    │     │
│  │              │   🗺️ Dịch vụ Bản Đồ Số           │    │     │
│  │              │   • OSRM / Google Maps             │    │     │
│  │              │   • Trả về Quãng đường (Distance)  │    │     │
│  │              └────────────────────────────────────┘    │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │           Middleware & Worker Layer              │  │     │
│  │  │  • API Key Validation                            │  │     │
│  │  │  • Excel Parser (Bulk Upload)                    │  │     │
│  │  │  • Webhook Trigger (Khi đổi Status)              │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│              SERVICE TIER │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  SQL Queries (pyodbc/SQLAlchemy)
                            │
                  ┌─────────▼─────────┐
                  │                   │  
                  │   📦 DATA TIER    │
                  │   SQL Server      │
                  │                   │
                  │  ┌──────────────┐  │
                  │  │ 6 Core Tables│  │
                  │  │ - Users      │  │
                  │  │ - AddressBook│  │
                  │  │ - Orders     │  │
                  │  │ - Tracking   │  │
                  │  │ - Recon      │  │
                  │  │ - ApiKeys    │  │
                  │  └──────────────┘  │
                  │                   │
                  └───────────────────┘
```

---

## Luồng dữ liệu mới (Nghiệp vụ cốt lõi)

### 1. Luồng Chủ Shop lập đơn hàng (Order Creation)
```
[Web App Portal]
  Nhập Tên khách -> Alpine.js Autocomplete search (API GET /address-book)
  Tự động điền SĐT, Tỉnh, Thành phố.
  Upload Excel -> API POST /orders/bulk-excel -> Insert N rows TO Orders.
```

### 2. Luồng Tính cước phí Thông minh
```
Dựa trên Master Data Địa Chỉ:
  -> Ném qua API OSRM / GG Maps.
  -> Trả về: 25.5 Km (DistanceKm).
  -> FeeDeducted = 25.5 * 3000 VNĐ.
  -> CodAmount (Khách tự nhập)
```

### 3. Luồng Dispatch (Điều phối) & State Timeline
```
Admin Dashboard (Dispatch Board)
  Lọc Grid 1000 đơn hàng. Chọn đơn AG-883921.
  Mở Modal: Bấm "Đã lấy hàng" (PICKED_UP).
  -> API Update Order [CurrentStatus].
  -> API Insert [TrackingHistory] ghi vết AdminID nào bấm, thời gian.
  -> API Trigger HTTP POST async sang webhook_url_cua_partner.
```

### 4. Luồng Kế Toán Đối Soát (Reconciliation)
```
Đơn hàng giao thành công [DELIVERED]. COD thu xong.
Kế toán bật màn hình Finance Recon.
Hệ thống tính: FinalPayout = CodAmount - ShippingFee.
Bấm nút "Tạo sao kê" -> Cập nhật bảng `Reconciliations` Status UNPAID -> PAID.
Chủ shop nhìn thấy bảng đối soát trên màn hình Merchant Portal.
```

## Giải pháp kỹ thuật

- **Trình bày (Web)**: Đừng quá thiết kế phức tạp. Alpine.js handle form và autocomplete.
- **Bảo mật & Auth**: Sử dụng `werkzeug.security` thay thế bcrypt. `PyJWT` quản lý phiên truy cập, và Token 64 kí tự cho B2B API Key.
- **Tiêu thụ Bản đồ**: OSRM cho tiết kiệm, kết hợp Nominatim geocoding. 
- **Upload Excel**: Client parse gửi JSON lên API, hoặc Upload trực tiếp MIME part Backend dùng `pandas`/`openpyxl` bóc tách dữ liệu vào Database.
- **Webhook**: Dùng `threading` cơ bản trên Python Flask để ném background request hoặc dùng `celery`/`Redis` nếu scale lớn.
