"""
Script seed dữ liệu PostgreSQL cho Antigravity Express
Chạy: python seed_postgres.py từ thư mục backend
"""
import os
import sys

# Thêm thư mục hiện tại vào sys.path để import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import TongKho, ChiNhanh, NguoiDung, GoiDichVu, SuperAdmin
from app.utils.security import hash_password

provinces = [
    {"code": "HN", "name": "Hà Nội", "lat": 21.0285, "lng": 105.8542, "region": "BAC"},
    {"code": "HP", "name": "Hải Phòng", "lat": 20.8449, "lng": 106.6881, "region": "BAC"},
    {"code": "HCM", "name": "TP. Hồ Chí Minh", "lat": 10.7769, "lng": 106.7009, "region": "NAM"},
    {"code": "DN", "name": "Đà Nẵng", "lat": 16.0544, "lng": 108.2022, "region": "TRUNG"},
    {"code": "CT", "name": "Cần Thơ", "lat": 10.0452, "lng": 105.7469, "region": "NAM"},
    {"code": "AG", "name": "An Giang", "lat": 10.3759, "lng": 105.4185, "region": "NAM"},
    {"code": "VT", "name": "Bà Rịa - Vũng Tàu", "lat": 10.4114, "lng": 107.1362, "region": "NAM"},
    {"code": "BG", "name": "Bắc Giang", "lat": 21.2731, "lng": 106.1946, "region": "BAC"},
    {"code": "BK", "name": "Bắc Kạn", "lat": 22.1471, "lng": 105.8372, "region": "BAC"},
    {"code": "BL", "name": "Bạc Liêu", "lat": 9.2940, "lng": 105.7244, "region": "NAM"},
    {"code": "BN", "name": "Bắc Ninh", "lat": 21.1861, "lng": 106.0763, "region": "BAC"},
    {"code": "BT", "name": "Bến Tre", "lat": 10.2401, "lng": 106.3735, "region": "NAM"},
    {"code": "BDI", "name": "Bình Định", "lat": 13.7830, "lng": 109.2194, "region": "TRUNG"},
    {"code": "BD", "name": "Bình Dương", "lat": 10.9804, "lng": 106.6519, "region": "NAM"},
    {"code": "BP", "name": "Bình Phước", "lat": 11.5312, "lng": 106.8837, "region": "NAM"},
    {"code": "BTH", "name": "Bình Thuận", "lat": 10.9322, "lng": 108.1009, "region": "TRUNG"},
    {"code": "CM", "name": "Cà Mau", "lat": 9.1769, "lng": 105.1524, "region": "NAM"},
    {"code": "CB", "name": "Cao Bằng", "lat": 22.6734, "lng": 106.2625, "region": "BAC"},
    {"code": "DL", "name": "Đắk Lắk", "lat": 12.6861, "lng": 108.0544, "region": "TRUNG"},
    {"code": "DNK", "name": "Đắk Nông", "lat": 12.0019, "lng": 107.6853, "region": "TRUNG"},
    {"code": "DB", "name": "Điện Biên", "lat": 21.3912, "lng": 103.0135, "region": "BAC"},
    {"code": "DNa", "name": "Đồng Nai", "lat": 10.9482, "lng": 106.8244, "region": "NAM"},
    {"code": "DT", "name": "Đồng Tháp", "lat": 10.4540, "lng": 105.6379, "region": "NAM"},
    {"code": "GL", "name": "Gia Lai", "lat": 13.9822, "lng": 107.9850, "region": "TRUNG"},
    {"code": "HG", "name": "Hà Giang", "lat": 22.8233, "lng": 104.9836, "region": "BAC"},
    {"code": "HNa", "name": "Hà Nam", "lat": 20.5463, "lng": 105.9125, "region": "BAC"},
    {"code": "HT", "name": "Hà Tĩnh", "lat": 18.3429, "lng": 105.9058, "region": "TRUNG"},
    {"code": "HD", "name": "Hải Dương", "lat": 20.9392, "lng": 106.3150, "region": "BAC"},
    {"code": "HGi", "name": "Hậu Giang", "lat": 9.7844, "lng": 105.4700, "region": "NAM"},
    {"code": "HB", "name": "Hòa Bình", "lat": 20.8172, "lng": 105.3377, "region": "BAC"},
    {"code": "HY", "name": "Hưng Yên", "lat": 20.6465, "lng": 106.0511, "region": "BAC"},
    {"code": "KH", "name": "Khánh Hòa", "lat": 12.2471, "lng": 109.1967, "region": "TRUNG"},
    {"code": "KG", "name": "Kiên Giang", "lat": 9.9614, "lng": 105.1017, "region": "NAM"},
    {"code": "KT", "name": "Kon Tum", "lat": 14.3541, "lng": 107.9942, "region": "TRUNG"},
    {"code": "LC", "name": "Lai Châu", "lat": 22.3959, "lng": 103.4682, "region": "BAC"},
    {"code": "LD", "name": "Lâm Đồng", "lat": 11.9404, "lng": 108.4583, "region": "TRUNG"},
    {"code": "LS", "name": "Lạng Sơn", "lat": 21.8481, "lng": 106.7617, "region": "BAC"},
    {"code": "LCa", "name": "Lào Cai", "lat": 22.4856, "lng": 103.9707, "region": "BAC"},
    {"code": "LA", "name": "Long An", "lat": 10.5332, "lng": 106.4137, "region": "NAM"},
    {"code": "ND", "name": "Nam Định", "lat": 20.4194, "lng": 106.1683, "region": "BAC"},
    {"code": "NA", "name": "Nghệ An", "lat": 18.6734, "lng": 105.6814, "region": "TRUNG"},
    {"code": "NB", "name": "Ninh Bình", "lat": 20.2519, "lng": 105.9747, "region": "BAC"},
    {"code": "NT", "name": "Ninh Thuận", "lat": 11.5646, "lng": 108.9882, "region": "TRUNG"},
    {"code": "PT", "name": "Phú Thọ", "lat": 21.3228, "lng": 105.4019, "region": "BAC"},
    {"code": "PY", "name": "Phú Yên", "lat": 13.0882, "lng": 109.3047, "region": "TRUNG"},
    {"code": "QB", "name": "Quảng Bình", "lat": 17.4739, "lng": 106.5963, "region": "TRUNG"},
    {"code": "QNa", "name": "Quảng Nam", "lat": 15.5673, "lng": 108.4815, "region": "TRUNG"},
    {"code": "QNg", "name": "Quảng Ngãi", "lat": 15.1200, "lng": 108.7900, "region": "TRUNG"},
    {"code": "QN", "name": "Quảng Ninh", "lat": 20.9502, "lng": 107.0734, "region": "BAC"},
    {"code": "QT", "name": "Quảng Trị", "lat": 16.8167, "lng": 107.1000, "region": "TRUNG"},
    {"code": "ST", "name": "Sóc Trăng", "lat": 9.6019, "lng": 105.9731, "region": "NAM"},
    {"code": "SL", "name": "Sơn La", "lat": 21.3283, "lng": 103.9119, "region": "BAC"},
    {"code": "TN", "name": "Tây Ninh", "lat": 11.3114, "lng": 106.1017, "region": "NAM"},
    {"code": "TB", "name": "Thái Bình", "lat": 20.4463, "lng": 106.3364, "region": "BAC"},
    {"code": "TNg", "name": "Thái Nguyên", "lat": 21.5939, "lng": 105.8442, "region": "BAC"},
    {"code": "TH", "name": "Thanh Hóa", "lat": 19.8075, "lng": 105.7764, "region": "TRUNG"},
    {"code": "TTH", "name": "Thừa Thiên Huế", "lat": 16.4633, "lng": 107.5905, "region": "TRUNG"},
    {"code": "TG", "name": "Tiền Giang", "lat": 10.3583, "lng": 106.3639, "region": "NAM"},
    {"code": "TV", "name": "Trà Vinh", "lat": 9.9344, "lng": 106.3342, "region": "NAM"},
    {"code": "TQ", "name": "Tuyên Quang", "lat": 21.8247, "lng": 105.2158, "region": "BAC"},
    {"code": "VL", "name": "Vĩnh Long", "lat": 10.2536, "lng": 105.9619, "region": "NAM"},
    {"code": "VP", "name": "Vĩnh Phúc", "lat": 21.3089, "lng": 105.6044, "region": "BAC"},
    {"code": "YB", "name": "Yên Bái", "lat": 21.7047, "lng": 104.9111, "region": "BAC"}
]

def seed_database():
    app = create_app('default')
    
    print("[*] Đang khởi tạo kết nối CSDL và App Context...")
    with app.app_context():
        # Xóa tất cả các bảng cũ và khởi tạo bảng mới
        print("[*] Đang xóa và tạo lại toàn bộ các bảng trong PostgreSQL...")
        db.drop_all()
        db.create_all()
        print("[+] Tạo các bảng CSDL PostgreSQL thành công!")

        # 1. Gói Dịch Vụ
        print("[*] Đang tạo dữ liệu Gói Dịch Vụ mẫu...")
        goi_standard = GoiDichVu(MaGoi=1, TenGoi="STANDARD", GiaKhoiDiem=15000.00, GiaMoiKm=2000.00)
        goi_express = GoiDichVu(MaGoi=2, TenGoi="EXPRESS", GiaKhoiDiem=30000.00, GiaMoiKm=4000.00)
        db.session.add_all([goi_standard, goi_express])
        db.session.commit()

        # 2. Tổng Kho Vùng Miền
        print("[*] Đang tạo dữ liệu 3 Tổng kho chính...")
        kho_bac = TongKho(
            MaTongKho=1,
            TenTongKho="Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)",
            VungMien="BAC",
            DiaChi="Khu công nghiệp VSIP Từ Sơn, Bắc Ninh",
            ViDo=21.115500,
            KinhDo=105.996400
        )
        kho_trung = TongKho(
            MaTongKho=2,
            TenTongKho="Kho Trung Chuyển Miền Trung (An Tây, Quảng Ngãi)",
            VungMien="TRUNG",
            DiaChi="KCN Tịnh Phong, Sơn Tịnh, Quảng Ngãi",
            ViDo=15.120500,
            KinhDo=108.792500
        )
        kho_nam = TongKho(
            MaTongKho=3,
            TenTongKho="Kho Trung Chuyển Miền Nam (Bình Hòa, TP.HCM)",
            VungMien="NAM",
            DiaChi="Đường số 4, Phường Bình Hòa, Thuận An, Bình Dương",
            ViDo=10.932500,
            KinhDo=106.721500
        )
        db.session.add_all([kho_bac, kho_trung, kho_nam])
        db.session.commit()

        # 3. Chi Nhánh Vệ Tinh (Hub con) cho 63 tỉnh thành Việt Nam
        print("[*] Đang tạo dữ liệu 63 Chi nhánh (Hub) bưu cục...")
        chi_nhanh_map = {}
        for idx, p in enumerate(provinces, start=1):
            tong_kho_id = 1
            if p["region"] == "TRUNG":
                tong_kho_id = 2
            elif p["region"] == "NAM":
                tong_kho_id = 3
                
            cn = ChiNhanh(
                MaChiNhanh=idx,
                TenChiNhanh=f"Hub {p['name']} ({p['code']})",
                DiaChi=f"Trung tâm bưu chính tỉnh/thành {p['name']}",
                ViDo=p["lat"],
                KinhDo=p["lng"],
                MaTongKhoLienKet=tong_kho_id
            )
            db.session.add(cn)
            chi_nhanh_map[p["code"]] = {
                "branch_id": idx,
                "tong_kho_id": tong_kho_id,
                "name": p["name"]
            }
        db.session.commit()
        print(f"[+] Tạo thành công 63 Chi nhánh!")

        # 4. Tài Khoản Người Dùng hệ thống
        print("[*] Đang tạo dữ liệu Tài khoản Người dùng & Nhân sự phân quyền...")
        
        # Super Admin (Tài khoản duy nhất không xóa thay mới)
        u_superadmin = SuperAdmin(
            TenDangNhap="superadmin",
            MatKhau=hash_password("super123"),
            HoTen="Đặng Tiến Dũng (SUPER ADMIN)"
        )
        db.session.add(u_superadmin)

        # Tài khoản Shop, Khách Lẻ, CSKH mẫu
        u_shop = NguoiDung(
            TenDangNhap="shop1",
            MatKhau=hash_password("shop123"),
            HoTen="Sneaker World (Cửa Hàng Đối Tác)",
            VaiTro="KHACHHANG",
            MaChiNhanh=1  # Hà Nội
        )
        u_khach_le = NguoiDung(
            TenDangNhap="khach_le",
            MatKhau=hash_password("khachle123"),
            HoTen="Khách Hàng Cá Nhân (Vãng Lai)",
            VaiTro="KHACHHANG",
            MaChiNhanh=1  # Hà Nội
        )
        u_cskh = NguoiDung(
            TenDangNhap="cskh1",
            MatKhau=hash_password("cskh123"),
            HoTen="Nguyễn Hồng Nhung (CSKH)",
            VaiTro="CSKH"
        )
        db.session.add_all([u_shop, u_khach_le, u_cskh])

        # Sinh 5 tài khoản nhân sự cho mỗi chi nhánh
        print("[*] Sinh 5 tài khoản nhân sự cho 63 Chi nhánh...")
        for code, info in chi_nhanh_map.items():
            branch_id = info["branch_id"]
            tong_kho_id = info["tong_kho_id"]
            name = info["name"]

            # Quản lý (ADMIN)
            u_admin = NguoiDung(
                TenDangNhap=f"Quanly-{code}",
                MatKhau=hash_password("quanly123"),
                HoTen=f"Quản Lý {name}",
                VaiTro="ADMIN",
                MaChiNhanh=branch_id
            )
            # Kế toán (KETOAN)
            u_ketoan = NguoiDung(
                TenDangNhap=f"Ketoan-{code}",
                MatKhau=hash_password("ketoan123"),
                HoTen=f"Kế Toán {name}",
                VaiTro="KETOAN",
                MaChiNhanh=branch_id,
                LuongCoBan=8500000.00
            )
            # HR (HR)
            u_hr = NguoiDung(
                TenDangNhap=f"Hr-{code}",
                MatKhau=hash_password("hr123"),
                HoTen=f"Nhân Sự {name}",
                VaiTro="HR",
                MaChiNhanh=branch_id
            )
            # Bưu tá (SHIPPER)
            u_shipper = NguoiDung(
                TenDangNhap=f"Shipper-{code}",
                MatKhau=hash_password("shipper123"),
                HoTen=f"Bưu Tá {name}",
                VaiTro="SHIPPER",
                MaChiNhanh=branch_id,
                GioiHanDonNgay=100,
                LuongCoBan=5000000.00
            )
            # Nhân viên kho (KHO)
            u_kho = NguoiDung(
                TenDangNhap=f"Kho-{code}",
                MatKhau=hash_password("kho123"),
                HoTen=f"Nhân Viên Kho {name}",
                VaiTro="KHO",
                MaChiNhanh=branch_id,
                MaTongKho=tong_kho_id
            )
            
            db.session.add_all([u_admin, u_ketoan, u_hr, u_shipper, u_kho])

        db.session.commit()
        print("[+] Khởi tạo dữ liệu cơ sở CSDL PostgreSQL thành công tốt đẹp!")

if __name__ == "__main__":
    seed_database()
