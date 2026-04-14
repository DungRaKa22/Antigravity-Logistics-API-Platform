# 📋 Kế hoạch triển khai chi tiết - Logistics API Platform

> Tài liệu mô tả chi tiết từng bước triển khai, thứ tự ưu tiên và phân chia công việc.

---

## Tổng quan timeline

```
Tuần 1-2  ████░░░░░░░░░░░░░░░░  Database & Setup
Tuần 3-5  ░░░░████████░░░░░░░░  Backend API Core + OSRM
Tuần 6-8  ░░░░░░░░░░░░██████░░  Web App (Khách hàng + Quản lý)
Tuần 9-10 ░░░░░░░░░░░░░░░░░░██  Tích hợp & Kiểm thử
Tuần 11   ░░░░░░░░░░░░░░░░░░░█  Hoàn thiện & Báo cáo
```

---

## PHASE 1: Nền tảng & Database (Tuần 1-2)

### 1.1 Thiết lập môi trường phát triển
- **Python**: Cài đặt Python 3.11+, tạo virtual environment
- **SQL Server**: Cài đặt SQL Server (Express), SQL Server Management Studio
- **Java**: JDK 17+, IDE (IntelliJ / Eclipse / VS Code)
- **Git**: Khởi tạo repository, cấu trúc thư mục dự án

### 1.2 Cấu trúc thư mục dự án
```
hyperProject/
├── memory/                  # 📝 Tài liệu kế hoạch & tiến độ
├── backend/                 # 🐍 Python API Server
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py        # Cấu hình DB, Secret Key
│   │   ├── models.py        # ORM Models
│   ├── routes/
│   │   ├── auth.py      # API xác thực
│   │   ├── orders.py    # API đơn hàng
│   │   ├── shipping.py  # API tính phí (OSRM + Nominatim)
│   │   ├── partners.py  # API đối tác
│   │   └── admin.py     # API quản lý (dashboard, users, rates)
│   ├── services/        # Business logic
│   │   └── osrm_service.py  # OSRM + Nominatim client
│   └── utils/           # Tiện ích
│   ├── requirements.txt
│   └── run.py
├── frontend/                # 🌐 Web App (Khách hàng + Quản lý)
│   ├── index.html           # SPA entry point
│   ├── css/
│   │   ├── variables.css    # CSS Design tokens
│   │   ├── base.css         # Reset + base styles
│   │   ├── components.css   # Button, card, form, table, modal
│   │   ├── layout.css       # Header, sidebar, nav, grid
│   │   └── pages.css        # Page-specific styles
│   ├── js/
│   │   ├── api.js           # Fetch API wrapper
│   │   ├── auth.js          # Login/Register + phân quyền session
│   │   ├── router.js        # SPA hash-based navigation + route guard
│   │   ├── app.js           # Alpine.js components + global state
│   │   └── utils.js         # Format tiền, ngày, validation
│   └── pages/
│       ├── home.html            # Landing page
│       ├── login.html           # Đăng nhập (chung cho tất cả vai trò)
│       ├── register.html        # Đăng ký khách hàng
│       ├── calculator.html      # Tính phí vận chuyển
│       ├── create-order.html    # Tạo đơn hàng
│       ├── tracking.html        # Tra cứu vận đơn
│       ├── orders.html          # Lịch sử đơn hàng
│       ├── admin/               # 🔒 Trang quản lý (NHANVIEN + QUANTRI)
│       │   ├── dashboard.html   # Thống kê tổng quan
│       │   ├── orders.html      # Quản lý đơn hàng + cập nhật trạng thái
│       │   ├── rates.html       # Quản lý bảng giá cước
│       │   ├── users.html       # Quản lý người dùng (chỉ QUANTRI)
│       │   └── partners.html    # Quản lý đối tác (chỉ QUANTRI)
│       └── profile.html         # Thông tin cá nhân
├── database/                # 🗄️ SQL Scripts
│   ├── init_database.sql
│   ├── seed_data.sql
│   └── migrations/
├── docs/                    # 📖 Tài liệu API & Hướng dẫn
│   └── api_documentation.md
└── tests/                   # 🧪 Test scripts
```

### 1.3 Thiết kế Database
- Xem chi tiết tại [database_schema.md](./database_schema.md)
- Tạo file `init_database.sql` với đầy đủ bảng và ràng buộc
- Tạo file `seed_data.sql` với dữ liệu mẫu (khu vực, bảng giá cước)

---

## PHASE 2: Backend API Core (Tuần 3-5)

### 2.1 Khởi tạo dự án Python (Tuần 3)
```
Thứ tự ưu tiên:
1. Setup Flask/FastAPI project + cấu hình kết nối SQL Server
2. Tạo models (ORM mapping với database)
3. API Health Check: GET /api/health
4. Module xác thực: API Key validation middleware
```

### 2.2 Tích hợp OSRM + Nominatim (Tuần 4)
```
Thứ tự ưu tiên:
1. Tạo module osrm_service.py:
   - nominatim_geocode(địa_chỉ) → {lat, lng}
   - osrm_route(lat1, lng1, lat2, lng2) → {khoảng_cách_km, thời_gian_phut}
   - tinh_phi_van_chuyen(dia_chi_gui, dia_chi_nhan, trong_luong) → {phi, km}
2. Cấu hình URL các dịch vụ:
   - Nominatim: https://nominatim.openstreetmap.org/search
   - OSRM:      https://router.project-osrm.org/route/v1/driving/
3. Xử lý fallback: OSRM lỗi → dùng bảng giá zone (BangGia)
4. Cache kết quả geocoding để giảm API calls
```

### 2.3 API Nghiệp vụ chính (Tuần 4-5)
```
Thứ tự ưu tiên:
1. POST /api/shipping/calculate   → Tính phí vận chuyển (OSRM + fallback zone)
2. POST /api/orders               → Tạo vận đơn mới
3. GET  /api/orders/{tracking}    → Tra cứu vận đơn
4. GET  /api/orders               → Danh sách đơn hàng (phân trang)
5. PUT  /api/orders/{id}/status   → Cập nhật trạng thái
```

### 2.4 API Mở rộng + Tài liệu (Tuần 5)
```
1. POST /api/partners/register    → Đăng ký đối tác
2. GET  /api/partners/api-key     → Lấy/Refresh API Key
3. GET  /api/areas                → Danh sách khu vực
4. GET  /api/rates                → Bảng giá cước
5. Viết tài liệu Swagger / Markdown
6. Test toàn bộ API bằng Postman
```

### 2.4 Chi tiết kỹ thuật Backend
- **Framework**: Flask (đơn giản, phù hợp đồ án) hoặc FastAPI (hiện đại, auto docs)
- **ORM**: SQLAlchemy hoặc pyodbc (kết nối SQL Server)
- **Auth**: API Key gửi qua Header `X-API-Key`
- **Response Format**:
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": { ... },
  "errors": null
}
```
- **Error Format**:
```json
{
  "success": false,
  "message": "Lỗi xác thực",
  "data": null,
  "errors": ["API Key không hợp lệ"]
}
```

---

## PHASE 3: Web App toàn diện (Tuần 6-8)

> **Gộp quản lý vào Web** — không còn Desktop Java.
> Một trang web duy nhất phục vụ cả 3 vai trò: KHACHHANG, NHANVIEN, QUANTRI.

### 3.1 Setup & Design System (Tuần 6 - Nửa đầu)
```
1. Tạo cấu trúc thư mục frontend/
2. Thêm Alpine.js qua CDN
3. Thêm Google Fonts (Inter) + Font Awesome qua CDN
4. Tạo CSS Design System:
   - variables.css: color palette, spacing, typography tokens
   - base.css: CSS reset + body defaults
   - components.css: button, card, input, table, badge, modal, sidebar
   - layout.css: header, sidebar, footer, grid responsive
5. Tạo router.js: SPA hash-based navigation + route guard theo vai trò
```

### 3.2 Trang khách hàng (Tuần 6 - Nửa sau)
```
Trang công khai + khách hàng:
1. Landing Page         → Giới thiệu dịch vụ, CTA đăng ký
2. Đăng ký / Đăng nhập  → Form chung cho tất cả vai trò
3. Tính phí vận chuyển   → OSRM + fallback zone, kết quả realtime
4. Tạo đơn hàng         → Form đầy đủ + validation
5. Tra cứu vận đơn      → Nhập mã tracking → Timeline trạng thái
6. Lịch sử đơn hàng     → Bảng + bộ lọc + phân trang
7. Thông tin cá nhân    → Xem/sửa profile
```

### 3.3 Trang quản lý — Nhân viên + Quản trị viên (Tuần 7)
```
Trang quản lý (cần đăng nhập vai trò NHANVIEN hoặc QUANTRI):
1. Dashboard            → Thống kê tổng quan (đếm đơn theo trạng thái, biểu đồ)
2. Quản lý đơn hàng    → Xem tất cả đơn, lọc, tìm kiếm, cập nhật trạng thái
3. Quản lý bảng giá   → CRUD bảng giá cước (BangGia)
4. Quản lý người dùng → Xem/khóa/sửa tài khoản (chỉ QUANTRI)
5. Quản lý đối tác    → Xem/tạo/khóa đối tác + API Key (chỉ QUANTRI)
```

### 3.4 Phân quyền giao diện (Role-based UI)
```
Đăng nhập → API trả về vai_tro → Lưu vào localStorage
  │
  ├─ KHACHHANG  → Thấy: Landing, Calculator, Create Order, Tracking, My Orders
  ├─ NHANVIEN   → Thấy: Dashboard, Tất cả đơn hàng, Bảng giá cước
  └─ QUANTRI    → Thấy: Dashboard, Đơn hàng, Giá cước, Người dùng, Đối tác

Router guard: Nếu truy cập route không đủ quyền → redirect về trang chủ
```

### 3.5 Kết nối API & Hoàn thiện (Tuần 8)
```
1. Viết module api.js:
   - Base URL config
   - Auto-attach X-API-Key header
   - Response/error handling thống nhất
   - Loading state management
2. Viết module auth.js:
   - Login/Register/Logout
   - Lưu API Key + vai_tro vào localStorage
   - Route guard theo vai trò
   - Auto-redirect khi chưa đăng nhập / không đủ quyền
3. Kết nối từng trang với endpoint tương ứng
4. Xử lý UX: loading spinner, toast notification, error display
5. Responsive design cho mobile (CSS media queries)
6. Test end-to-end: Web → API → Database
```

### 3.6 Kỹ thuật Frontend
- **HTML/CSS/JS thuần + Alpine.js** (~15KB, CDN, không cần build tool)
- **Alpine.js** cung cấp:
  - `x-data` — reactive state cho component
  - `x-bind` / `x-on` — binding attributes & events
  - `x-show` / `x-if` — toggle hiển thị (loading, role-based)
  - `x-for` — render danh sách
  - `Alpine.store()` — global state (auth, theme, sidebar)
- **Fetch API** để gọi RESTful endpoints
- **LocalStorage** lưu API Key + vai_tro phía client
- **CSS Design System**: Variables + Flexbox/Grid, responsive mobile-first
- **SPA-like routing + Route Guard**: Hash-based navigation, phân quyền theo vai trò
- **Google Fonts** (Inter) + **Font Awesome** icons qua CDN
- **Sidebar admin** cho trang quản lý, ẩn khi là khách hàng

---

## PHASE 4: Tích hợp & Kiểm thử (Tuần 9-10)

### 4.1 Kiểm thử tích hợp
```
Kịch bản test:
1. Khách hàng tạo đơn trên Web → Nhân viên thấy trên trang quản lý
2. Nhân viên cập nhật trạng thái → Khách tra cứu thấy trạng thái mới
3. Đối tác gọi API tạo 10 đơn → Nhân viên xử lý trên trang quản lý
4. Phân quyền: KHACHHANG không truy cập được trang admin
5. Route guard hoạt động chính xác
```

### 4.2 Kiểm thử bảo mật cơ bản
```
1. API không truy cập được khi thiếu API Key
2. SQL Injection test trên form input
3. XSS test trên web
4. Phân quyền API: nhân viên không xóa được user, khách không cập nhật đơn người khác
5. Validation đầu vào trên tất cả endpoints
```

---

## PHASE 5: Hoàn thiện (Tuần 11)

### 5.1 Tài liệu
```
1. Báo cáo đồ án (Word)
2. Tài liệu API (Swagger/Markdown)
3. Hướng dẫn cài đặt (README)
4. Slide thuyết trình
5. Video demo
```

### 5.2 Đóng gói
```
1. Clean code + comment
2. Export database script
3. Tạo file .env.example
4. Push lên Git repository
```

---

## Rủi ro và giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Kết nối SQL Server từ Python gặp lỗi driver | 🟡 Trung bình | Chuẩn bị cả pyodbc và pymssql làm backup |
| CORS lỗi khi Web gọi API | 🟢 Thấp | Cấu hình Flask-CORS ngay từ đầu |
| Thời gian không đủ | 🔴 Cao | Ưu tiên Backend API → Web, cắt giảm tính năng phụ |
| Phân quyền UI bị bypass | 🟡 Trung bình | Kiểm tra quyền cả phía client (route guard) và server (API middleware) |
| OSRM/Nominatim demo server chậm hoặc lỗi | 🟡 Trung bình | Fallback về bảng giá zone (BangGia), cache kết quả |
| Geocoding sai vị trí cho địa chỉ Việt Nam | 🟡 Trung bình | Cho chọn khu vực từ danh sách + gợi ý địa chỉ |
