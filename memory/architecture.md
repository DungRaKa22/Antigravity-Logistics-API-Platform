# 🏗️ Thiết kế kiến trúc hệ thống - Logistics API Platform

---

## Sơ đồ kiến trúc tổng thể (3-Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT / PRESENTATION TIER                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  🌐 Web App  │  │ 🖥️ Desktop  │  │  🔗 Partner Systems    │ │
│  │  (HTML/CSS/  │  │ (Java Swing) │  │  (3rd Party E-com)     │ │
│  │  JS+Alpine)  │  │              │  │                        │ │
│  │              │  │  Kết nối     │  │  Gọi RESTful API       │ │
│  │  Gọi API    │  │  trực tiếp   │  │  tự động (M2M)          │ │
│  │  qua Fetch  │  │  JDBC → DB   │  │                         │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                 │                       │              │
└─────────┼─────────────────┼───────────────────────┼──────────────┘
          │                 │                       │
          │  HTTP/JSON      │  JDBC                 │  HTTP/JSON
          │                 │                       │
┌─────────┼─────────────────┼───────────────────────┼──────────────┐
│         ▼                 │                       ▼              │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              🐍 SERVICE TIER - Python API               │     │
│  │                  (Flask / FastAPI)                       │     │
│  │                                                         │     │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │     │
│  │  │  Auth   │ │ Shipping │ │  Orders  │ │ Partners  │  │     │
│  │  │ Module  │ │ Calculator│ │  CRUD   │ │  Manager  │  │     │
│  │  └─────────┘ └──────────┘ └──────────┘ └───────────┘  │     │
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
                  │  ┌─────────────┐  │
                  │  │   Users     │  │
                  │  │   Orders    │  │
                  │  │   Areas     │  │
                  │  │   Rates     │  │
                  │  │   Partners  │  │
                  │  │   Logs      │  │
                  │  └─────────────┘  │
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
    → Tính phí vận chuyển
    → Tạo mã tracking (unique)
    → INSERT INTO Orders (SQL Server)
    → Return JSON response {tracking_code, fee, status}
    → Browser hiển thị kết quả
```

### Luồng 2: Nhân viên cập nhật trạng thái qua Desktop
```
Java Swing App
    → Nhân viên chọn đơn hàng trên JTable
    → Chọn trạng thái mới (ComboBox)
    → JDBC: UPDATE Orders SET status = ? WHERE id = ?
    → Refresh JTable
    → (Tùy chọn) Gọi API webhook/notification
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
| Web Client | Python API | Fetch API / AJAX | HTTP/JSON |
| Partner System | Python API | HTTP Client | HTTP/JSON |
| Python API | SQL Server | pyodbc / SQLAlchemy | TCP/SQL |
| Desktop App | SQL Server | JDBC | TCP/SQL |
| Desktop App | Python API | HttpURLConnection (tùy chọn) | HTTP/JSON |

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
| Role | Quyền |
|------|-------|
| `CUSTOMER` | Tạo đơn, tra cứu đơn của mình |
| `PARTNER` | Tạo đơn hàng loạt, tra cứu đơn của partner |
| `STAFF` | Xem/cập nhật tất cả đơn, quản lý bảng giá |
| `ADMIN` | Toàn quyền + quản lý users/partners |

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
