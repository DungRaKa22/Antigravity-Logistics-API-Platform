# 🚀 Cẩm Nang Triển Khai (Deployment Guide) - Antigravity Logistics Platform

Dự án **Antigravity Express - Logistics Platform** có thể triển khai dễ dàng thông qua hai phương án: **Docker Compose** trên VPS hoặc **PaaS** (Vercel/Render).

---

## 🗺️ Bản Đồ Kiến Trúc Triển Khai (Deployment Architecture)

```mermaid
graph TD
    User([Khách hàng / Admin / Shipper]) -->|Truy cập HTTPS| FE[React Frontend - Nginx Container / Vercel]
    FE -->|Proxy /api| BE[Flask Python Backend - Gunicorn Container / Render]
    BE -->|SQL Connection| DB[(Database SQL - PostgreSQL Container / Supabase)]
```

---

## 🐳 Phương Án 1: Triển Khai Trên VPS Bằng Docker Compose (Khuyên Dùng)

Phương án này đóng gói toàn bộ Frontend, Backend, và Database vào các container riêng biệt. Nginx trong Frontend container đóng vai trò làm Reverse Proxy phân phối mã nguồn tĩnh React và định tuyến `/api` và WebSockets (`/socket.io`) tới Backend.

### 1. Chuẩn bị trên VPS (Ubuntu 20.04/22.04/24.04 LTS)
Cài đặt Docker và Docker Compose (nếu chưa có):
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

### 2. Cấu hình Biến môi trường (.env)
Tạo file `.env` tại thư mục gốc dự án trên VPS:
```env
DB_NAME=LogisticsDB
DB_USERNAME=sa
DB_PASSWORD=your_strong_db_password_here
SECRET_KEY=generate_a_random_jwt_secret_key_here
```

### 3. Vận hành Docker Compose
Khởi chạy hệ thống ở chế độ chạy ngầm (detached mode):
```bash
docker compose up -d --build
```
Lệnh này sẽ:
1. Tạo database PostgreSQL khởi chạy thành công.
2. Build Dockerfile của Backend Flask, cài đặt driver SQL và chạy Gunicorn trên cổng 5000 (nội bộ).
3. Build Dockerfile của Frontend React (truyền `/` làm API URL), đóng gói vào Nginx phục vụ trên cổng 80.

### 4. Khởi tạo dữ liệu ban đầu (Seeding Database)
Chạy lệnh seed dữ liệu PostgreSQL (chỉ cần chạy 1 lần duy nhất khi thiết lập mới):
```bash
docker compose exec backend python seed_postgres.py
```

### 5. Cấu hình HTTPS (SSL) bằng Certbot trên VPS Host
Để cấu hình bảo mật SSL (HTTPS), cài đặt Nginx trên VPS host để reverse proxy cổng 80/443 vào Docker container (cổng 80):
1. **Cài đặt Nginx và Certbot:**
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. **Cấu hình Nginx Host (`/etc/nginx/sites-available/antigravity`):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:80; # Chuyển tiếp tới frontend container
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
       }
   }
   ```
3. **Kích hoạt cấu hình và lấy chứng chỉ SSL:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/antigravity /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🌟 Phương Án 2: Triển Khai Trên PaaS Đám Mây Độc Lập (Vercel + Render + Neon)

Phù hợp cho chạy thử nghiệm Demo nhanh và tự động CI/CD khi push code lên GitHub.

### 1. Database (PostgreSQL Managed)
*   **Nền tảng**: [Neon.tech](https://neon.tech/) hoặc [Supabase](https://supabase.com/).
*   **Các bước:**
    1. Khởi tạo 1 project PostgreSQL mới.
    2. Sao chép chuỗi kết nối (Connection String) dạng: `postgresql://user:password@ep-host.neon.tech/neondb?sslmode=require`.

### 2. Backend (Flask Python)
*   **Nền tảng**: [Render.com](https://render.com/).
*   **Các bước:**
    1. Tạo một **Web Service** mới trên Render, kết nối tới Repository GitHub chứa dự án.
    2. Chọn **Root Directory** là `backend`.
    3. Chọn **Environment** là `Docker` (Render sẽ tự động dùng [backend/Dockerfile](file:///c:/Documents/dev/hyperProject/backend/Dockerfile) để build).
    4. Cấu hình biến môi trường (Environment Variables):
       * `DATABASE_URL`: Dán chuỗi kết nối PostgreSQL lấy từ bước 1.
       * `SECRET_KEY`: Khóa bảo mật JWT ngẫu nhiên.
    5. Render sẽ tự cấp một domain HTTPS dạng `https://antigravity-backend.onrender.com`.

### 3. Frontend (React Vite)
*   **Nền tảng**: [Vercel](https://vercel.com/) hoặc [Netlify](https://netlify.com/).
*   **Các bước:**
    1. Tạo một dự án mới trên Vercel, chọn thư mục gốc là `frontend`.
    2. Cấu hình thông số Build:
       * **Build Command**: `npm run build`
       * **Output Directory**: `dist`
    3. Thêm biến môi trường:
       * `VITE_API_URL`: Domain của Backend Render (VD: `https://antigravity-backend.onrender.com`).
    4. Vercel tự động deploy và cấp domain HTTPS tĩnh dạng `https://antigravity.vercel.app`.
