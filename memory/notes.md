# 📝 Ghi chú & Vấn đề phát sinh - Logistics API Platform

> File ghi chú nhanh trong quá trình phát triển. Ghi lại các vấn đề, giải pháp, ý tưởng mới.

---

## Ghi chú chung

- **2026-04-07**: Khởi tạo dự án, đọc và phân tích tài liệu đề cương đồ án
- Framework Python: Cân nhắc giữa Flask (đơn giản) và FastAPI (hiện đại, tự gen docs)
- **2026-04-09**: Quyết định bổ sung **Alpine.js** cho frontend web
  - Giữ đúng tinh thần HTML/CSS/JS thuần của đề cương
  - Alpine.js chỉ là thư viện nhẹ (~15KB), dùng qua CDN, không cần build
  - Bổ sung Google Fonts (Inter) + Font Awesome cho UI đẹp hơn

---

## Vấn đề phát sinh & Giải pháp

| # | Ngày | Vấn đề | Giải pháp | Trạng thái |
|---|------|--------|-----------|-----------|
| 1 | 2026-04-09 | Filtered indexes (WHERE clause) gây lỗi `QUOTED_IDENTIFIER` khi INSERT | Tạo lại indexes không dùng WHERE filter | ✅ Đã sửa |
| 2 | 2026-04-09 | Python print emoji gây lỗi `UnicodeEncodeError` trên Windows console | Set `PYTHONIOENCODING=utf-8` trước khi chạy | ✅ Đã sửa |
| 3 | 2026-04-09 | Java JDBC `integratedSecurity` cần file `mssql-jdbc_auth` DLL | Thêm `-Djava.library.path=...\auth\x64` khi chạy | ✅ Đã sửa |
| 4 | 2026-04-09 | Git push lần đầu bị timeout HTTP 408 | Push lại lần 2 thành công | ✅ Đã sửa |

---

## Ý tưởng bổ sung (Backlog)

- [ ] Thêm notification (email/SMS) khi đơn hàng thay đổi trạng thái
- [ ] Export đơn hàng ra Excel
- [ ] Thống kê biểu đồ doanh thu trên Desktop
- [ ] Rate limiting cho API để chống abuse
- [ ] API versioning (v1, v2)

---

## Tài liệu tham khảo

- [Flask Documentation](https://flask.palletsprojects.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [RESTful API Design Best Practices](https://restfulapi.net/)
- [SQL Server Documentation](https://learn.microsoft.com/en-us/sql/sql-server/)
- [Java Swing Tutorial](https://docs.oracle.com/javase/tutorial/uiswing/)
- [Alpine.js Documentation](https://alpinejs.dev/)

---

## Thông tin Repository

| Mục | Giá trị |
|-----|---------|
| GitHub URL | https://github.com/DungRaKa22/Antigravity-Logistics-API-Platform |
| Branch chính | `main` |
| Visibility | Private |
| Commits | 3+ (init, remove .docx, Việt hóa SQL) |

---

## Quyết định kỹ thuật (Technical Decisions)

| # | Quyết định | Lý do | Ngày |
|---|-----------|-------|------|
| 1 | Dùng SQL Server | Yêu cầu đề cương, phù hợp môi trường học thuật | 2026-04-07 |
| 2 | API-First Architecture | Cho phép đa nền tảng client kết nối | 2026-04-07 |
| 3 | HTML/CSS/JS thuần (không framework nặng) | Yêu cầu đề cương, tập trung vào kiến thức nền | 2026-04-07 |
| 4 | Java Swing cho Desktop | Yêu cầu đề cương, phù hợp với sinh viên CNPM | 2026-04-07 |
| 5 | Bổ sung **Alpine.js** cho frontend | Nhẹ (~15KB CDN), reactivity tốt, không cần build, giữ tinh thần JS thuần | 2026-04-09 |
| 6 | Google Fonts (Inter) + Font Awesome | Typography & icon hiện đại, chuyên nghiệp, dùng qua CDN | 2026-04-09 |
| 7 | SPA-like hash routing (tự viết) | Điều hướng trang không reload, UX mượt, không cần thư viện router | 2026-04-09 |
| 8 | CSS Design System (Variables) | Quản lý theme/color/spacing tập trung, dễ maintain, responsive | 2026-04-09 |
| 9 | Windows Authentication cho SQL Server | Máy dev dùng Windows Auth (không cần sa password) | 2026-04-09 |
| 10 | GitHub private repo | Quản lý source code, backup, collaboration | 2026-04-09 |
| 11 | **Việt hóa SQL hoàn toàn** | Tên bảng/cột/trạng thái/vai trò bằng tiếng Việt không dấu, dễ hiểu cho đề tài VN | 2026-04-10 |
| 12 | **OSRM + Nominatim** cho tính cước | Tính phí theo khoảng cách thực tế (km), miễn phí, open source, hybrid fallback zone | 2026-04-13 |

### Bảng ánh xạ tên (Cũ → Mới)

| Tên cũ (English) | Tên mới (Việt hóa) |
|---|---|
| `Users` | `NguoiDung` |
| `Partners` | `DoiTac` |
| `Areas` | `KhuVuc` |
| `ShippingRates` | `BangGia` |
| `Orders` | `DonHang` |
| `OrderStatusHistory` | `LichSu_TrangThai` |

| Trạng thái cũ | Trạng thái mới |
|---|---|
| `PENDING` | `CHO_LAY_HANG` |
| `PICKED_UP` | `DA_LAY_HANG` |
| `IN_TRANSIT` | `DANG_VAN_CHUYEN` |
| `DELIVERED` | `GIAO_THANH_CONG` |
| `CANCELLED` | `DA_HUY` |
| `RETURNED` | `HOAN_TRA` |

| Vai trò cũ | Vai trò mới |
|---|---|
| `CUSTOMER` | `KHACHHANG` |
| `STAFF` | `NHANVIEN` |
| `ADMIN` | `QUANTRI` |

