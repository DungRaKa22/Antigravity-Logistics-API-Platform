# 📦 Antigravity Express - Enterprise Logistics & Finance API Platform

> **Hệ thống Quản lý Vận đơn, Định tuyến Thông minh & Đối soát COD Tự động quy mô Doanh nghiệp**
> 
> Được thiết kế theo kiến trúc 3 lớp (3-Tier Architecture) hiện đại, sở hữu giao diện **Premium Dark-Neon Glassmorphism** tối tân và cơ chế phân quyền RBAC chặt chẽ cho **8 nhóm vai trò nghiệp vụ** (Chủ shop, Khách cá nhân, CSKH, Kế toán, HR, Quản lý kho, Shipper, Super Admin).

---

## 🧭 Cấu Trúc Hệ Thống (Directory Structure)

Thư mục dự án được tổ chức khoa học, tách biệt hoàn toàn giữa Tầng giao diện (Frontend React) và Tầng xử lý nghiệp vụ/dữ liệu (Backend Flask):

```text
hyperProject/
├── backend/               # Flask RESTful API & WebSocket Backend
│   ├── app/               # Logic ứng dụng (Routes, Models, Sockets, Services)
│   │   ├── routes/        # Phân hệ API blueprints (Auth, Order, Chat, Tracking, Payment...)
│   │   ├── models.py      # Định nghĩa cấu trúc 14 bảng PostgreSQL (SQLAlchemy ORM)
│   │   └── sockets.py     # Xử lý sự kiện WebSocket thời gian thực (Flask-SocketIO)
│   ├── requirements.txt   # Thư viện Python (psycopg2-binary, Flask-SocketIO, openpyxl...)
│   └── run.py             # Cổng khởi chạy máy chủ backend (Port 5000)
├── frontend/              # React SPA Frontend (Vite)
│   ├── src/               
│   │   ├── components/    # Cấu phần giao diện tái sử dụng (QuantumGuide, Layouts...)
│   │   ├── pages/         # Các phân hệ Dashboard (Admin, Merchant, Staff, Tracking, Home...)
│   │   ├── services/      # Axios API Wrapper & Token Interceptor
│   │   └── index.css      # Hệ thống CSS Design System kính mờ chàm neon
│   ├── package.json       # Scripts chạy & Dependencies (SheetJS, Leaflet, Socket.io...)
│   └── vite.config.js     # Đóng gói và biên dịch siêu tốc Vite
├── memory/                # Hệ thống tệp tài liệu lưu giữ bộ nhớ kỹ thuật
└── README.md              # Hướng dẫn chạy và tài liệu vận hành (File này)
```

---

## 🛠️ Công Nghệ & Công Cụ Sử Dụng (Tech Stack)

Để chạy được hệ thống, máy tính của bạn cần cài đặt các nền tảng sau:

### 1. Cơ sở Dữ liệu (Database)
*   **PostgreSQL 15+** (Primary DB tối ưu cho điện toán đám mây Render/Railway).
*   *Thông số kết nối mặc định:* Database `LogisticsDB`, User `postgres`, Password `Dung@48691412`.

### 2. Tầng Nghiệp Vụ Backend
*   **Python 3.11+** (Đã kiểm thử mượt mà trên Python 3.13.6).
*   **Flask Framework** (RESTful API) & **Flask-SocketIO** (WebSocket chat trực tuyến).
*   **SQLAlchemy ORM** (Ánh xạ PostgreSQL schema hoàn toàn Việt hóa).
*   **openpyxl** (Phục vụ nhập đơn hàng loạt ở Backend).
*   **PyJWT** (Cấp phát Token JWT an toàn phân quyền).

### 3. Tầng Giao Diện Frontend
*   **React 19 / Vite 8** (Single Page Application).
*   **Tailwind CSS v4** (Hệ thống thiết kế CSS-first hiện đại).
*   **SheetJS (xlsx)** (Xuất báo cáo tài chính Kế toán `.xlsx` chuyên dụng ở Client-side).
*   **Leaflet Maps** (Bản đồ số định vị OSRM và vẽ segmented line lộ trình shipper).
*   **Socket.io-client** (Kết nối chat trực tuyến CSKH hai chiều).

---

## 🚀 Các Tính Năng Đột Phá Đã Triển Khai (Phase 6 Premium Aesthetics)

1.  **Mô Phỏng Hộp Hàng 3D CSS Tương Tác (True 3D Volumetric Box):** Tích hợp khối hộp lập thể `preserve-3d` lơ lửng, tự động xoay 360 độ neon tại trang chủ. Người dùng có thể kéo 3 thanh trượt **Dài - Rộng - Cao** để co giãn hộp 3D và tự tính cước phí + volumetric weight tức thời.
2.  **Quantum Guide Trực Tuyến & Live Chat Handover:** Trợ lý ảo hỗ trợ cây quyết định đa chặng, tích hợp ô nhập mã vận đơn để **vẽ Timeline hành trình phát sáng neon trực tiếp trong bong bóng chat**. Hỗ trợ nút *"Gặp nhân viên CSKH"* tự động tạo ticket và kết nối Socket.io chuyển tiếp chat trực tiếp tới tổng đài viên Admin.
3.  **Shipper Touch Signature Canvas:** Phân hệ bưu tá di động tối neon [StaffDashboard.jsx](file:///c:/Documents/dev/hyperProject/frontend/src/pages/StaffDashboard.jsx) tích hợp bảng vẽ canvas điện tử cho khách hàng ký tên bằng tay/chuột chặng cuối khi giao thành công.
4.  **Proof Photo Camera Simulator:** Shipper kích hoạt chụp ảnh bằng chứng giao hàng thành công/thất bại thực địa chặng cuối và đồng bộ hóa vết lưu trữ vào PostgreSQL.
5.  **Nominatim Rate-Limit Sleep Protection:** Áp dụng trễ `1200ms` giữa các yêu cầu geocoding Nominatim địa chỉ gửi/nhận giúp bản đồ Leaflet không bao giờ bị trống hoặc bị chặn từ chối dịch vụ.

---

## ⚙️ Hướng Dẫn Cài Đặt Chi Tiết (Installation Guide)

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu PostgreSQL

1.  Mở **pgAdmin 4** hoặc kịch bản lệnh dòng lệnh psql.
2.  Tạo cơ sở dữ liệu mới mang tên `LogisticsDB`:
    ```sql
    CREATE DATABASE "LogisticsDB";
    ```
3.  Kết nối vào cơ sở dữ liệu `LogisticsDB` và thực thi script khởi tạo cấu trúc bảng và dữ liệu mẫu có sẵn trong dự án:
    *   Thao tác qua backend script tự động:
        ```bash
        cd backend
        python seed_postgres.py
        ```
    *(Script này tự động tạo cấu trúc 14 bảng Việt hóa và nạp dữ liệu mẫu các bưu cục, tài khoản thử nghiệm).*

---

### Bước 2: Thiết Lập & Chạy Backend API
1.  Mở thư mục `backend/` trong PowerShell/Terminal:
    ```bash
    cd backend
    ```
2.  Khởi tạo môi trường ảo Python và kích hoạt:
    *   **Windows:**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
3.  Cài đặt các thư viện phụ thuộc:
    ```bash
    pip install -r requirements.txt
    ```
4.  Khởi chạy máy chủ API & WebSockets (Port 5000):
    ```bash
    python run.py
    ```

---

### Bước 3: Khởi Động Frontend Web App
1.  Mở thư mục `frontend/` trong một cửa sổ Terminal mới:
    ```bash
    cd frontend
    ```
2.  Cài đặt các gói Node.js:
    ```bash
    npm install
    ```
3.  Khởi chạy máy chủ phát triển Vite (Port 5173):
    ```bash
    npm run dev
    ```
4.  Truy cập hệ thống tại trình duyệt: [http://localhost:5173](http://localhost:5173).

---

## 🔑 Thông Tin Tài Khoản Thử Nghiệm (RBAC Mẫu 63 Tỉnh Thành)

Để đăng nhập chạy thử nghiệm, bạn sử dụng các tài khoản có sẵn đã được seeding tự động theo cấu trúc chuẩn hóa:

### 1. Tài Khoản Quản Trị & Khách Hàng Chung

| Tài khoản (Username) | Mật khẩu (Password) | Vai trò hệ thống (Role) | Họ và Tên / Đơn vị | Nơi làm việc / Chi nhánh | Tính năng kiểm thử chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **superadmin** | `super123` | **SUPER_ADMIN** | Đặng Tiến Dũng | Tổng công ty (Đăng nhập cổng Super Admin) | Bento Grid doanh thu toàn quốc, xem bản đồ bưu cục OSRM, theo dõi danh sách bưu tá. |
| **shop1** | `shop123` | **KHACHHANG (Merchant)** | Sneaker World | Hub Hà Nội (Đăng nhập cổng Thường) | Lập đơn OSRM (3D Box co giãn), in tem nhãn A6 SPX, nạp Excel hàng loạt, xem ví đối soát COD, chat Quantum Guide. |
| **khach_le** | `khachle123` | **KHACHHANG (Guest)** | Khách Cá Nhân | Hub Hà Nội (Đăng nhập cổng Thường) | Tạo đơn hàng lẻ B2C trực tiếp, tính cước phí. |
| **cskh1** | `cskh123` | **CSKH (Support Desk)** | Nguyễn Hồng Nhung | Trung tâm CSKH (Đăng nhập cổng Thường) | Quầy chat hai chiều Socket.io (Double-Pane) tiếp nhận khiếu nại, chat Quantum Guide handover. |

---

### 2. Hệ Thống Tài Khoản 63 Tỉnh Thành Toàn Quốc

Hệ thống tự động sinh 5 tài khoản nhân viên cho **từng tỉnh/thành phố trong số 63 tỉnh thành Việt Nam**. Cú pháp đăng nhập và mật khẩu như sau:

*   **Tên Đăng Nhập:** `[RolePrefix]-[MãTỉnhThành]`
*   **Mật Khẩu:** `[role_prefix_lowercase]123`

#### Ví dụ cho Hub Hà Nội (Mã: `HN`):
- **Quản lý bưu cục (ADMIN):** `Quanly-HN` / Mật khẩu: `quanly123`
- **Kế toán bưu cục (KETOAN):** `Ketoan-HN` / Mật khẩu: `ketoan123`
- **Nhân sự bưu cục (HR):** `Hr-HN` / Mật khẩu: `hr123`
- **Bưu tá bưu cục (SHIPPER):** `Shipper-HN` / Mật khẩu: `shipper123`
- **Nhân viên kho bưu cục (KHO):** `Kho-HN` / Mật khẩu: `kho123`

#### Ví dụ cho Hub TP. Hồ Chí Minh (Mã: `HCM`):
- **Quản lý bưu cục (ADMIN):** `Quanly-HCM` / Mật khẩu: `quanly123`
- **Bưu tá bưu cục (SHIPPER):** `Shipper-HCM` / Mật khẩu: `shipper123`

#### Ví dụ cho các tỉnh thành khác (Mã tương ứng như: `HP` - Hải Phòng, `DN` - Đà Nẵng, `CT` - Cần Thơ, `BN` - Bắc Ninh, ...):
Sử dụng mã viết tắt của tỉnh tương ứng (e.g. `Quanly-HP`, `Shipper-DN`, `Ketoan-CT`, ...).

---

## 🌐 Hướng Dẫn Triển Khai (Deployment Guide)

Hệ thống hỗ trợ triển khai linh hoạt qua hai phương án chính:

### Phương Án A: Triển khai VPS với Docker Compose (Khuyên dùng cho Production)
Đóng gói toàn bộ hệ thống (PostgreSQL, Backend Flask, Frontend React & Nginx Reverse Proxy) trong 1 câu lệnh duy nhất:
1. Chuẩn bị file `.env` ở thư mục gốc chứa các khóa mật khẩu.
2. Chạy lệnh: `docker compose up -d --build`
3. Khởi tạo dữ liệu: `docker compose exec backend python seed_postgres.py`

*Xem chi tiết hướng dẫn thiết lập SSL HTTPS bằng Certbot tại [docs/deployment_guide.md](file:///c:/Documents/dev/hyperProject/docs/deployment_guide.md).*

### Phương Án B: Triển khai Đám mây độc lập (Cloud PaaS)
- **Frontend:** Deploy lên **Vercel** hoặc **Netlify** (sử dụng cấu hình chuyển tiếp [vercel.json](file:///c:/Documents/dev/hyperProject/frontend/vercel.json) sẵn có).
- **Backend:** Deploy lên **Render.com** (sử dụng [Dockerfile](file:///c:/Documents/dev/hyperProject/backend/Dockerfile) tự động đóng gói môi trường của backend).
- **Database:** Sử dụng Managed PostgreSQL trên **Supabase** hoặc **Neon.tech**.

---

## 🔌 Hướng Dẫn Tích Hợp B2B API (Partner API Integration)

Antigravity Express cung cấp cổng API tích hợp chuẩn hóa dành cho các đối tác B2B (E-commerce, ERP) để:
*   Tính cước phí & Khoảng cách động: `/api/partner/calculate-fee` (POST)
*   Tạo vận đơn trực tiếp qua API: `/api/partner/create-order` (POST)
*   Tra cứu hành trình & Chữ ký của shipper: `/api/partner/track-order/<order_id>` (GET)

*Để xem tài liệu kỹ thuật chi tiết về tham số đầu vào/ra và cấu hình Header `X-API-Key`, vui lòng truy cập [docs/partner_api_guide.md](file:///c:/Documents/dev/hyperProject/docs/partner_api_guide.md).*

---

Hệ thống đã được thiết lập, kiểm thử ổn định 100% trên môi trường cục bộ (Local) và sẵn sàng deploy!