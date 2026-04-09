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
| - | - | - | - | - |

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
