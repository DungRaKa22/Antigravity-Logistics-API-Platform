# 🏗️ Thiết kế kiến trúc hệ thống - Logistics API Platform

---

## Sơ đồ kiến trúc tổng thể (2-Tier Web)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / PRESENTATION TIER                   │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐│
│  │  🌐 Web App (SPA)          │  │  🔗 Partner Systems        ││
│  │  HTML/CSS/JS + Alpine.js   │  │  (Sàn TMĐT, 3rd Party)     ││
│  │                             │  │                            ││
│  │  👤 Khách hàng:             │  │  Gọi RESTful API           ││
│  │     Tạo đơn, tra cứu, TT  │  │  tự động (M2M)             ││
│  │  👨‍💼 Nhân viên:             │  │                            ││
│  │     Dashboard, QL đơn hàng │  │                            ││
│  │  🔑 Quản trị viên:         │  │                            ││
│  │     Toàn quyền + QL users  │  │                            ││
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
│  │  │  Auth   │ │ Shipping │ │  Orders  │ │ Partners  │  │     │
│  │  │ Module  │ │ Calculator│ │  CRUD   │ │  Manager  │  │     │
│  │  └─────────┘ └────┬─────┘ └──────────┘ └───────────┘  │     │
│  │                    │                                    │     │
│  │              ┌─────▼──────────────────────────────┐    │     │
│  │              │   🗺️ Dịch vụ Bên ngoài (External) │    │     │
│  │              │   • Nominatim (Geocoding)          │    │     │
│  │              │   • OSRM (Routing / Khoảng cách)   │    │     │
│  │              └────────────────────────────────────┘    │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │           Middleware Layer                        │  │     │
│  │  │  • API Key Validation                            │  │     │
│  │  │  • Request Logging                               │  │     │
│  │  │  • Error Handling                                │  │     │
│  │  │  • CORS Configuration                            │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│              SERVICE TIER │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  SQL Queries (pyodbc/SQLAlchemy)
                            │
                  ┌─────────▼─────────┐
                  │                    │  ◄── JDBC (Java Desktop)
                  │   📦 DATA TIER    │
                  │   SQL Server      │
                  │                   │
                  │  ┌──────────────┐  │
                  │  │ NguoiDung    │  │
                  │  │ DonHang      │  │
                  │  │ KhuVuc       │  │
                  │  │ BangGia      │  │
                  │  │ DoiTac       │  │
                  │  │ LichSu_TT   │  │
                  │  └──────────────┘  │
                  │                   │
                  └───────────────────┘
```

---

## Luồng dữ liệu chi tiết

### Luồng 1: Khách hàng tạo đơn qua Web
```
Browser (JS Fetch)
    → POST /api/orders (JSON body + API Key header)
    → Python API nhận request
    → Validate API Key
    → Validate dữ liệu đầu vào
    → Tính phí vận chuyển (OSRM + Nominatim)
    → Tạo mã tracking (unique)
    → INSERT INTO DonHang (SQL Server)
    → Return JSON response {ma_van_don, phi, trang_thai}
    → Browser hiển thị kết quả
```

### Luồng tính phí vận chuyển thông minh (OSRM)
```
Địa chỉ gửi + Địa chỉ nhận
    │
    ▼
┌──────────────┐
│  Nominatim   │── Geocoding: Địa chỉ → Tọa độ (lat/lng)
└──────┬───────┘
       ▼
┌──────────────┐
│    OSRM      │── Routing: Tọa độ A → Tọa độ B → Khoảng cách (km)
└──────┬───────┘
       ▼
┌──────────────────────────────────────┐
│          CÔNG THỨC TÍNH CƯỚC        │
│                                      │
│  phi = phi_co_ban                   │
│      + (khoang_cach_km × phi_moi_km)│
│      + (trong_luong_kg × phi_theo_kg)│
│                                      │
│  Fallback: Nếu OSRM lỗi → dùng     │
│  bảng giá zone (BangGia)            │
└──────────────────────────────────────┘
```

### Luồng 2: Nhân viên cập nhật trạng thái qua Web Admin
```
Web Admin (trang quản lý)
    → Nhân viên đăng nhập (vai_tro = NHANVIEN)
    → Vào trang admin/orders.html → Xem danh sách đơn
    → Chọn đơn → Chọn trạng thái mới
    → Fetch: PUT /api/orders/{id}/status
    → API cập nhật DB + thêm lịch sử
    → Refresh danh sách đơn hàng
```

### Luồng 3: Đối tác tích hợp tự động
```
Partner Server (HTTP Client)
    → POST /api/orders (JSON body + Partner API Key)
    → Python API xác thực Partner
    → Xử lý nghiệp vụ (giống Luồng 1)
    → Return JSON response
    → Partner xử lý response tự động
```

### Luồng 4: Tra cứu vận đơn
```
Bất kỳ Client nào
    → GET /api/orders/{tracking_code}
    → Python API query database
    → Return JSON {order_info, status_history}
    → Client hiển thị timeline trạng thái
```

---

## Giao tiếp giữa các thành phần

| Từ | Đến | Phương thức | Giao thức |
|----|-----|------------|-----------|
| Web App (Khách) | Python API | Fetch API | HTTP/JSON |
| Web App (Admin) | Python API | Fetch API | HTTP/JSON |
| Partner System | Python API | HTTP Client | HTTP/JSON |
| Python API | SQL Server | pyodbc / SQLAlchemy | TCP/SQL |
| Python API | OSRM/Nominatim | requests | HTTP/JSON |

---

## Bảo mật

### Cơ chế xác thực API
```
Client gửi request:
┌──────────────────────────────────┐
│  POST /api/orders                │
│  Headers:                        │
│    Content-Type: application/json│
│    X-API-Key: abc123xyz          │
│  Body:                           │
│    { "sender": "...", ... }      │
└──────────────────────────────────┘
            │
            ▼
Server kiểm tra:
┌──────────────────────────────────┐
│  1. X-API-Key có tồn tại?       │
│     → Không → 401 Unauthorized   │
│  2. API Key có hợp lệ (trong DB)?│
│     → Không → 403 Forbidden      │
│  3. API Key có quyền truy cập?  │
│     → Không → 403 Forbidden      │
│  4. Hợp lệ → Xử lý request     │
└──────────────────────────────────┘
```

### Phân quyền
| Vai trò | Quyền |
|---------|-------|
| `KHACHHANG` | Tạo đơn, tra cứu đơn của mình |
| Đối tác (DoiTac) | Tạo đơn hàng loạt, tra cứu đơn của đối tác |
| `NHANVIEN` | Xem/cập nhật tất cả đơn, quản lý bảng giá |
| `QUANTRI` | Toàn quyền + quản lý người dùng/đối tác |

---

## Công nghệ Frontend Web

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|--------|
| Cấu trúc | HTML5 Semantic | Các thẻ `<header>`, `<main>`, `<section>`, `<nav>` |
| Styling | CSS thuần (Variables + Flexbox/Grid) | Design system tự tạo, responsive mobile-first |
| Logic | JavaScript ES6+ | Fetch API gọi REST endpoints |
| Reactivity | **Alpine.js** (CDN, ~15KB) | Data binding, show/hide, loops — không cần build step |
| Typography | Google Fonts (Inter) | Font hiện đại, dễ đọc |
| Icons | Font Awesome / Lucide Icons | Icon set phong phú |
| Dev Server | Live Server (VS Code extension) | Hot reload khi phát triển |

### Tại sao chọn Alpine.js?
- ✅ Siêu nhẹ (~15KB), chỉ cần 1 dòng `<script>` từ CDN
- ✅ Không cần Node.js, webpack, hay bất kỳ build tool nào
- ✅ Giữ đúng bản chất HTML/CSS/JS thuần — giảng viên vẫn nhìn thấy HTML
- ✅ Cung cấp reactivity (x-data, x-bind, x-on, x-show, x-for) giúp code sạch hơn
- ✅ Hoàn hảo cho SPA-like navigation không tải lại trang
- ✅ Dễ học, cú pháp trực quan, tài liệu tốt
