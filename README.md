# 📦 Antigravity Express - Logistics API Platform

> **Nền tảng Quản lý Vận chuyển & Đối soát Tài chính API-First Tích hợp Bản đồ Số Thời gian thực**
> 
> Được xây dựng với kiến trúc 3 lớp (3-Tier Architecture) hiện đại, sở hữu giao diện **Premium Dark-Neon Glassmorphism** sang trọng và cơ chế phân quyền RBAC chặt chẽ cho 3 nhóm đối tượng (Khách hàng, Nhân viên/Shipper, Quản trị viên).

---

## 🧭 Cấu Trúc Hệ Thống (Directory Structure)

Thư mục dự án được tổ chức khoa học, tách biệt hoàn toàn giữa Tầng giao diện (Frontend) và Tầng xử lý nghiệp vụ/dữ liệu (Backend):

```text
hyperProject/
├── backend/               # Flask RESTful API Backend
│   ├── app/               # Logic ứng dụng (Routes, Models, Services)
│   ├── requirements.txt   # Danh sách thư viện Python cần thiết
│   └── run.py             # Điểm chạy máy chủ backend (Port 5000)
├── frontend/              # React SPA Frontend (Vite)
│   ├── src/               # Mã nguồn React (Pages, Components, Context)
│   ├── package.json       # Scripts chạy & Dependencies của React (gồm xlsx SheetJS)
│   └── vite.config.js     # Cấu hình đóng gói Vite
├── database/              # Chứa kịch bản SQL khởi tạo cơ sở dữ liệu
├── memory/                # Hệ thống tệp tài liệu lưu giữ bộ nhớ kỹ thuật
└── README.md              # Tài liệu hướng dẫn sử dụng và chạy hệ thống (File này)
```

---

## 🛠️ Công Nghệ & Công Cụ Sử Dụng (Tech Stack)

Để chạy được hệ thống, máy tính của bạn cần cài đặt các nền tảng sau:

### 1. Hệ quản trị Cơ sở Dữ liệu
*   **Microsoft SQL Server 2022** (Developer hoặc Express Edition).
*   **SQLite** (Tự động kích hoạt làm cơ chế dự phòng - Fallback Database nếu không tìm thấy SQL Server).
*   *Yêu cầu kết nối:* Trình điều khiển kết nối **ODBC Driver 17/18 for SQL Server**.

### 2. Backend & Xử lý Dữ liệu
*   **Python 3.11+** (Đã kiểm thử mượt mà trên Python 3.13.6).
*   **Flask Framework** (RESTful API).
*   **SQLAlchemy ORM** (Ánh xạ các bảng cơ sở dữ liệu Việt hóa).
*   **openpyxl** (Thư viện xử lý Excel phục vụ lên đơn hàng loạt ở Backend).
*   **PyJWT** (Cấp phát mã Token JWT bảo mật).

### 3. Frontend & Giao diện
*   **Node.js v18+ hoặc v20+** (Công cụ quản lý npm).
*   **React 19 / Vite 8** (Xây dựng Single Page Application).
*   **Tailwind CSS v4** (Hệ thống thiết kế CSS-first hiện đại).
*   **SheetJS (xlsx)** (Thư viện xuất báo cáo Excel `.xlsx` chuyên nghiệp ở Client-side).
*   **Lucide React** (Bộ thư viện biểu tượng vector tinh tế).
*   **Axios** (Đóng gói API Wrapper & Token Interceptor).

---

## ⚙️ Hướng Dẫn Cài Đặt Chi Tiết (Installation Guide)

> [!IMPORTANT]
> Hãy thực hiện cài đặt theo đúng thứ tự: **Khởi tạo Database ➡️ Thiết lập Backend ➡️ Khởi động Frontend**.

### Bước 1: Khởi Tạo Cơ Sở Dữ Liệu (Database Setup)

Hệ thống sử dụng **8 bảng nghiệp vụ cốt lõi đã được Việt hóa hoàn toàn** nhằm đảm bảo tính tối ưu trong lưu trữ và truy vấn:
1. `NguoiDung`: Lưu trữ tài khoản, thông tin ngân hàng và vai trò (RBAC), hạn ngạch giao hàng của Shipper.
2. `SoDiaChi`: Danh bạ địa chỉ của các khách hàng (hỗ trợ cờ `LaMacDinh`).
3. `GoiDichVu`: Định cấu hình giá cước cơ sở (Standard/Express).
4. `DonHang`: Quản lý vận đơn, khối lượng thể tích, phí bảo hiểm, COD, Shipper giao hàng.
5. `LichSu_TrangThai`: Ghi vết chi tiết hành trình vận chuyển và lý do thất bại.
6. `DoiSoat`: Quản lý các giao dịch đối soát tài chính COD và phí ship của từng đơn.
7. `HoaDonDoiSoat`: Gom các giao dịch đối soát thành hóa đơn định kỳ để thanh toán đồng loạt.
8. `KhoaAPI`: Cấp phát API Key dài 64 ký tự cho Đối tác tích hợp B2B.

**Thao tác khởi tạo:**
1. Mở phần mềm quản lý **SQL Server Management Studio (SSMS)**.
2. Kết nối vào máy chủ SQL Server của bạn.
3. Tạo cơ sở dữ liệu mới tên là `LogisticsDB`.
4. Tìm và thực thi các tệp tin SQL trong thư mục [database/](file:///c:/Documents/dev/hyperProject/database):
   * Chạy file khởi tạo cấu trúc bảng: `init_database.sql`
   * Chạy file nạp dữ liệu mẫu cấu hình dịch vụ & tài khoản: `seed_data.sql`

---

### Bước 2: Thiết Lập & Chạy Backend API

1. Mở cửa sổ **PowerShell** hoặc **Command Prompt** tại thư mục `backend/`:
   ```powershell
   cd backend
   ```
2. Khởi tạo môi trường ảo Python (Virtual Environment) để cô lập thư viện:
   ```powershell
   python -m venv venv
   ```
3. Kích hoạt môi trường ảo:
   * **Trên Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Trên Windows (Command Prompt):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
4. Cài đặt các thư viện phụ thuộc từ tệp tin `requirements.txt`:
   ```powershell
   pip install -r requirements.txt
   ```
5. Sao chép tệp tin cấu hình môi trường gốc:
   * Copy file `.env.example` ở ngoài thư mục gốc và dán vào thư mục `backend/` dưới tên `.env`.
   * Mở file `backend/.env` và cập nhật thông tin kết nối SQL Server (Tài khoản, Mật khẩu, Driver) tương ứng với máy của bạn.
6. Khởi chạy máy chủ Backend Flask:
   ```powershell
   python run.py
   ```
   > [!NOTE]
   > Mặc định Backend sẽ chạy tại địa chỉ `http://127.0.0.1:5000`. Khi khởi chạy thành công, cửa sổ terminal sẽ hiển thị log kiểm tra kết nối CSQL. Nếu SQL Server không có sẵn, hệ thống sẽ tự động sinh tệp tin `LogisticsDB.db` (SQLite) tại chỗ để chạy thử nghiệm độc lập.

---

### Bước 3: Thiết Lập & Chạy Frontend Web App

1. Mở một tab terminal mới và chuyển hướng đến thư mục `frontend/`:
   ```powershell
   cd frontend
   ```
2. Cài đặt toàn bộ gói thư viện node_modules:
   ```powershell
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Development Server):
   ```powershell
   npm run dev
   ```
4. Mở trình duyệt và truy cập liên kết: **`http://localhost:5173`** để bắt đầu trải nghiệm ứng dụng.

---

## 🎨 Trải Nghiệm Giao Diện Premium Dark-Neon Glassmorphism

Giao diện của Antigravity Express được thiết kế tỉ mỉ nhằm đem lại trải nghiệm tinh tế nhất:

*   **Dark-Neon Glassmorphic:** Sử dụng tông màu tối sâu thẳm kết hợp hiệu ứng kính mờ (glassmorphism) sang trọng, điểm phát quang neon nổi bật, viền màu lục emerald (thành công) và hồng rose (thất bại).
*   **Trang đăng nhập/Đăng ký cách ly thông minh:** Thiết kế dạng Card bo tròn (`rounded-2xl`) trôi nổi trên nền lưới điểm tròn (`radial-gradient`) xám đen sâu thẳm. Thanh Navbar và khoảng đệm được ẩn tự động trên các trang này để chống đè chữ tuyệt đối khi zoom phóng lớn, có tích hợp nút Quay lại (Back button) thanh lịch.
*   **Tem vận đơn A6 tự sinh mã vạch:** Lên đơn xong có thể in ngay tem nhãn A6 chuẩn e-commerce nhúng mã vạch Code128 trực quan bằng SVG, có CSS `@media print` tối ưu hóa chỉ in tem.
*   **Cổng di động cho Shipper (`/staff`):** Cung cấp giao diện tối ưu dọc cho điện thoại, tích hợp thanh BottomNavBar dễ dàng thao tác bằng một ngón tay. Shipper cập nhật trạng thái đơn hàng (kèm lý do nếu thất bại), quản lý thông tin cá nhân và thiết lập tài khoản ngân hàng nhận lương ngay trên máy điện thoại.
*   **Tính cước thông minh thời gian thực:** Lên đơn hàng lẻ với công nghệ OSRM tự động đo khoảng cách km và Nominatim phân tích địa chỉ. Tự động quy đổi khối lượng theo kích thước thể tích `(D x R x C) / 5000` và tính phí bảo hiểm 0.5% tức thì khi gõ phím.
*   **Báo cáo lương Excel chuyên nghiệp (.xlsx):** Admin và Kế toán xuất trực tiếp báo cáo lương của Shipper theo đơn giá 3.000đ/đơn hoàn thành. File xuất định dạng chuẩn `.xlsx` có thiết lập độ rộng cột tối ưu và tương thích font tiếng Việt UTF-8.

---

## 📚 Hệ Thống Tài Liệu Kỹ Thuật (Project Memory)

Bạn có thể tìm hiểu sâu hơn các khía cạnh kỹ thuật chi tiết của hệ thống qua các tài liệu cấu trúc trong thư mục `memory/`:

*   **Tổng quan thiết kế:** [architecture.md (Kiến trúc & Luồng dữ liệu)](file:///c:/Documents/dev/hyperProject/memory/architecture.md)
*   **Nghiệp vụ chi tiết:** [goals.md (Tiêu chí nghiệm thu tính năng)](file:///c:/Documents/dev/hyperProject/memory/goals.md)
*   **Thiết kế Dữ liệu:** [database_schema.md (Chi tiết 8 bảng Việt hóa)](file:///c:/Documents/dev/hyperProject/memory/database_schema.md)
*   **Đầu nối dịch vụ:** [api_endpoints.md (Danh sách RESTful API)](file:///c:/Documents/dev/hyperProject/memory/api_endpoints.md)
*   **Kế hoạch phát triển:** [implementation_plan.md (Nhật ký chặng hành trình)](file:///c:/Documents/dev/hyperProject/memory/implementation_plan.md)
*   **Ghi chú vận hành:** [notes.md (Cơ chế fallback & bảo trì hệ thống)](file:///c:/Documents/dev/hyperProject/memory/notes.md)
*   **Nhật ký cập nhật:** [progress.md (Tiến trình nghiệm thu 100% Phase)](file:///c:/Documents/dev/hyperProject/memory/progress.md)
*   **Trang chủ Memory:** [README.md (Tóm tắt tài liệu bộ nhớ)](file:///c:/Documents/dev/hyperProject/memory/README.md)

---

> **Antigravity Express** - Vận chuyển không trọng lực, kết nối dòng chảy tương lai.

