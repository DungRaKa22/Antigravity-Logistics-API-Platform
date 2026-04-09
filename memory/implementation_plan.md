# 📋 Kế hoạch triển khai chi tiết - Logistics API Platform

> Tài liệu mô tả chi tiết từng bước triển khai, thứ tự ưu tiên và phân chia công việc.

---

## Tổng quan timeline

```
Tuần 1-2  ████░░░░░░░░░░░░░░░░░░░░  Database & Setup
Tuần 3-5  ░░░░████████░░░░░░░░░░░░  Backend API Core
Tuần 6-7  ░░░░░░░░░░░░████░░░░░░░░  Client Web
Tuần 8-9  ░░░░░░░░░░░░░░░░████░░░░  Desktop App
Tuần 10-11 ░░░░░░░░░░░░░░░░░░░░████ Integration & Test
Tuần 12   ░░░░░░░░░░░░░░░░░░░░░░██ Docs & Deploy
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
│   │   ├── routes/
│   │   │   ├── auth.py      # API xác thực
│   │   │   ├── orders.py    # API đơn hàng
│   │   │   ├── shipping.py  # API tính phí
│   │   │   └── partners.py  # API đối tác
│   │   ├── services/        # Business logic
│   │   └── utils/           # Tiện ích
│   ├── requirements.txt
│   └── run.py
├── frontend/                # 🌐 Web Client (HTML/CSS/JS + Alpine.js)
│   ├── index.html           # Landing page + SPA entry point
│   ├── css/
│   │   ├── variables.css    # CSS Design tokens (colors, spacing, fonts)
│   │   ├── base.css         # Reset + base styles
│   │   ├── components.css   # Button, card, form, table styles
│   │   ├── layout.css       # Header, footer, nav, grid
│   │   └── pages.css        # Page-specific styles
│   ├── js/
│   │   ├── api.js           # Fetch API wrapper (base URL, headers, error handling)
│   │   ├── auth.js          # Login/Register logic + localStorage session
│   │   ├── router.js        # SPA-like page navigation (hash-based)
│   │   ├── app.js           # Alpine.js components + global state
│   │   └── utils.js         # Format tiền, ngày, validation helpers
│   └── pages/
│       ├── home.html        # Landing page content
│       ├── login.html       # Đăng nhập
│       ├── register.html    # Đăng ký
│       ├── calculator.html  # Tính phí vận chuyển
│       ├── create-order.html# Tạo đơn hàng
│       ├── tracking.html    # Tra cứu vận đơn
│       └── orders.html      # Lịch sử đơn hàng
├── desktop/                 # 🖥️ Java Swing App
│   └── src/
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

### 2.2 API Nghiệp vụ chính (Tuần 4)
```
Thứ tự ưu tiên:
1. POST /api/shipping/calculate   → Tính phí vận chuyển
2. POST /api/orders               → Tạo vận đơn mới
3. GET  /api/orders/{tracking}    → Tra cứu vận đơn
4. GET  /api/orders               → Danh sách đơn hàng (phân trang)
5. PUT  /api/orders/{id}/status   → Cập nhật trạng thái
```

### 2.3 API Mở rộng + Tài liệu (Tuần 5)
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

## PHASE 3: Client Web (Tuần 6-7)

### 3.1 Setup & Design System (Tuần 6 - Nửa đầu)
```
1. Tạo cấu trúc thư mục frontend/
2. Thêm Alpine.js qua CDN: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
3. Thêm Google Fonts (Inter) + Font Awesome qua CDN
4. Tạo CSS Design System:
   - variables.css: color palette, spacing, typography tokens
   - base.css: CSS reset + body defaults
   - components.css: button, card, input, table, badge, modal
   - layout.css: header, sidebar, footer, grid responsive
5. Tạo router.js: SPA hash-based navigation (#/home, #/login, #/orders...)
```

### 3.2 Xây dựng các trang (Tuần 6 - Nửa sau)
```
Trang cần xây dựng:
1. Landing Page         → Giới thiệu dịch vụ, CTA đăng ký
2. Đăng ký / Đăng nhập  → Form auth + validation (Alpine.js x-data)
3. Tính phí vận chuyển   → Form chọn khu vực + trọng lượng → Kết quả realtime
4. Tạo đơn hàng         → Form đầy đủ (Alpine.js two-way binding)
5. Tra cứu vận đơn      → Nhập mã tracking → Timeline trạng thái (x-for loop)
6. Lịch sử đơn hàng     → Bảng dữ liệu + bộ lọc + phân trang
```

### 3.3 Kết nối API & Hoàn thiện (Tuần 7)
```
1. Viết module api.js:
   - Base URL config
   - Auto-attach X-API-Key header
   - Response/error handling thống nhất
   - Loading state management
2. Viết module auth.js:
   - Login/Register/Logout
   - Lưu API Key vào localStorage
   - Auto-redirect khi chưa đăng nhập
3. Kết nối từng trang với endpoint tương ứng
4. Xử lý UX: loading spinner, toast notification, error display
5. Responsive design cho mobile (CSS media queries)
6. Test end-to-end: Web → API → Database
```

### 3.4 Kỹ thuật Frontend
- **HTML/CSS/JS thuần + Alpine.js** (~15KB, CDN, không cần build tool)
- **Alpine.js** cung cấp:
  - `x-data` — khai báo reactive state cho component
  - `x-bind` / `x-on` — binding attributes & events
  - `x-show` / `x-if` — toggle hiển thị (loading, error states)
  - `x-for` — render danh sách (đơn hàng, khu vực, ...)
  - `x-effect` / `$watch` — side effects khi data thay đổi
  - `Alpine.store()` — global state management (auth, theme)
- **Fetch API** để gọi RESTful endpoints
- **LocalStorage** lưu API Key / session phía client
- **CSS Design System**: Variables + Flexbox/Grid, responsive mobile-first
- **SPA-like routing**: Hash-based (`#/page`) navigation, không tải lại trang
- **Google Fonts** (Inter) + **Font Awesome** icons qua CDN
- **Không cần Node.js** — chỉ cần mở Live Server từ VS Code là chạy

---

## PHASE 4: Desktop App (Tuần 8-9)

### 4.1 Thiết kế giao diện Swing (Tuần 8)
```
Màn hình cần xây dựng:
1. Login Form           → Đăng nhập nhân viên
2. Dashboard            → Thống kê tổng quan (đếm đơn theo trạng thái)
3. Order List (JTable)  → Danh sách đơn hàng + bộ lọc
4. Order Detail         → Chi tiết 1 đơn hàng
5. Update Status        → Form cập nhật trạng thái
6. Rate Management      → Quản lý bảng giá cước
```

### 4.2 Kết nối Database (Tuần 9)
```
1. JDBC Connection Pool đến SQL Server
2. DAO Pattern: OrderDAO, UserDAO, RateDAO
3. Implement CRUD operations
4. Xử lý concurrent access
5. Test toàn bộ chức năng
```

### 4.3 Kỹ thuật Desktop
- **Java Swing** components: JFrame, JPanel, JTable, JButton, JTextField
- **JDBC** kết nối trực tiếp SQL Server (driver: `mssql-jdbc`)
- **MVC Pattern**: Tách Model - View - Controller
- **DAO Pattern**: Data Access Object cho từng entity

---

## PHASE 5: Tích hợp & Kiểm thử (Tuần 10-11)

### 5.1 Kiểm thử tích hợp
```
Kịch bản test:
1. Khách hàng tạo đơn trên Web → Nhân viên thấy trên Desktop
2. Nhân viên cập nhật trạng thái → Khách tra cứu thấy trạng thái mới
3. Đối tác gọi API tạo 10 đơn → Nhân viên xử lý trên Desktop
4. Tất cả dữ liệu đồng bộ chính xác trên 3 kênh
```

### 5.2 Kiểm thử bảo mật cơ bản
```
1. API không truy cập được khi thiếu API Key
2. SQL Injection test trên form input
3. XSS test trên web
4. Validation đầu vào trên tất cả endpoints
```

---

## PHASE 6: Hoàn thiện (Tuần 12)

### 6.1 Tài liệu
```
1. Báo cáo đồ án (Word)
2. Tài liệu API (Swagger/Markdown)
3. Hướng dẫn cài đặt (README)
4. Slide thuyết trình
5. Video demo
```

### 6.2 Đóng gói
```
1. Clean code + comment
2. Export database script
3. Đóng gói Desktop App thành JAR
4. Tạo file .env.example
5. Push lên Git repository
```

---

## Rủi ro và giải pháp

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| Kết nối SQL Server từ Python gặp lỗi driver | 🟡 Trung bình | Chuẩn bị cả pyodbc và pymssql làm backup |
| CORS lỗi khi Web gọi API | 🟢 Thấp | Cấu hình Flask-CORS ngay từ đầu |
| Java Swing UI không đẹp | 🟡 Trung bình | Sử dụng FlatLaf Look & Feel |
| Thời gian không đủ | 🔴 Cao | Ưu tiên Backend API → Web → Desktop, cắt giảm tính năng phụ |
| Xung đột dữ liệu đồng thời | 🟡 Trung bình | Sử dụng Transaction + Optimistic Locking |
