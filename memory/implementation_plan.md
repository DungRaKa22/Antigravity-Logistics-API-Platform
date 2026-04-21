# 📋 Kế hoạch triển khai chi tiết - Logistics API Platform

> Tài liệu mô tả chi tiết từng bước triển khai theo Database 6 bảng cốt lõi và mục tiêu kinh doanh.

---

## PHASE 1: Nền tảng & Database (Tuần 1-2) [HOÀN THÀNH]
- [x] Cài đặt Python 3.11+, SQL Server.
- [x] Thiết kế 6 Bảng Cốt lõi: Users, AddressBook, Orders, TrackingHistory, Reconciliations, ApiKeys.
- [x] Lưu trữ logic Database vào `init_database.sql`.

---

## PHASE 2: Backend API Core (Tuần 3-5) [HOÀN THÀNH]

### Ưu tiên 1: Auth & User Module
- [x] `POST /api/auth/login` (Trả về JWT or Auth Session, lưu Role: SHOP/ADMIN/PARTNER).
- [x] `GET /api/address-book` (Sổ địa chỉ thông minh, auto-complete phục vụ làm đơn lẻ).
- [x] `POST /api/address-book` (Thêm địa chỉ).

### Ưu tiên 2: Orders & OSRM (Trái tim hệ thống)
- [x] Tích hợp OSRM/Map API: nhận `Address` -> Tọa Độ -> Tính DistanceKm -> ShippingFee.
- [x] `POST /api/orders` (Tạo đơn lẻ, sinh OrderID AG-XXXXXX).
- [x] `POST /api/orders/bulk-excel` (API parse Upload Excel tạo lô đơn hàng loạt, validate Excel file).
- [x] `GET /api/orders` (Bảng điều phối trung tâm. Có Query params: status, date, text).

### Ưu tiên 3: Tracking & State Management
- [x] `GET /api/tracking/{order_id}` (Truy vấn TrackingHistory ra chain timeline phục vụ khách không cần login).
- [x] `PUT /api/orders/{id}/status` (Chuyển trạng thái PENDING -> PICKED_UP -> vv):
  - ⚡ **Logic ngầm**: Insert vào bảng `TrackingHistory` dòng log (Ai [AdminID] bấm, lúc nào, Location Info).
  - ⚡ **Webhook trigger**: Gửi Async background job post payload vào webhook_url của Partner nếu User tạo là PARTNER.

### Ưu tiên 4: Reconciliations & Partners
- [x] `GET /api/reconciliations/shop` (Xem bảng dòng tiền đối soát).
- [x] `POST /api/reconciliations/pay` (Kế toán Admin bấm nút duyệt trả tiền thu hộ COD. Chuyển ReconStatus -> PAID).
- [x] `POST /api/partners/apikey` (Gen Token vào bảng ApiKeys).

---

## PHASE 3: Web App Toàn Diện (Tuần 6-8)

Sử dụng HTML/CSS/JS thuần + Alpine.js. Một UI duy nhất nhưng rẽ nhánh Role Guard.

### 1. Vùng Public (Guest)
- Hero Tracking Dashboard tại Trang Chủ.
- Component Ước tính Cước phí thông minh.

### 2. Merchant Portal (Role: SHOP)
- Layout có Sidebar Quản lý.
- Trang Sổ địa chỉ (Smart Address Book).
- Trang Lên Cũ / Mới Đơn Hàng (Sử dụng AutoComplete sổ địa chỉ).
- Nút "Upload Excel" kèm Template mẫu .xlsx download.
- Dashboard Quản lý Đơn hàng (Filter trạng thái).
- Bảng điều khiển Đối soát (Dòng tiền shop thực nhận).

### 3. Admin Web Dashboard (Role: ADMIN)
- Bảng điều phối trung tâm (Nhìn thấy ALL Nguồn: API và Web).
- Component lưới Quản lý Vòng đời (Action: Chuyển Trạng Thái).
- Tool Quản lý Kế toán: List các đơn cần chuyển khoản (ReconStatus=UNPAID), Nút Duyệt tiền (Approve PAID).
- Trang quản trị cấu hình (Duyệt Partner, cấp API Key).

---

## PHASE 4 & 5: Tích hợp, Test và Báo Cáo (Tuần 9-11)
- Verify nghiệp vụ OSRM xử lý km đúng chuẩn. Nhận dạng các Address xa xôi tự fallback.
- Auto-testing các workflow chính.
- Báo cáo đồ án, PPT slide và docs public.
