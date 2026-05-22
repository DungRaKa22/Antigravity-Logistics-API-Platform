import os
import sys
from sqlalchemy import text

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app import create_app
from app.extensions import db

def run_migration():
    app = create_app('default')
    with app.app_context():
        print("[*] Connecting to database...")
        conn = db.engine.connect()
        
        # 1. Update NguoiDung check constraint for VaiTro
        print("[*] Checking NguoiDung.VaiTro check constraints...")
        # Query to find check constraint name on NguoiDung.VaiTro
        find_constraint_sql = """
            SELECT cc.name 
            FROM sys.check_constraints cc
            INNER JOIN sys.columns c ON cc.parent_column_id = c.column_id AND cc.parent_object_id = c.object_id
            INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
            WHERE t.name = 'NguoiDung' AND c.name = 'VaiTro'
        """
        result = conn.execute(text(find_constraint_sql)).fetchall()
        for row in result:
            constraint_name = row[0]
            print(f"[*] Found check constraint: {constraint_name}. Dropping it...")
            conn.execute(text(f"ALTER TABLE NguoiDung DROP CONSTRAINT {constraint_name}"))
            conn.commit()
            print(f"[+] Dropped constraint: {constraint_name}")
            
        # Add new check constraint allowing KHACHHANG, QUANTRI, DOITAC, NHANVIEN
        print("[*] Adding new check constraint for VaiTro...")
        try:
            conn.execute(text("""
                ALTER TABLE NguoiDung 
                ADD CONSTRAINT CK_NguoiDung_VaiTro 
                CHECK (VaiTro IN ('KHACHHANG', 'QUANTRI', 'DOITAC', 'NHANVIEN'))
            """))
            conn.commit()
            print("[+] Successfully added CK_NguoiDung_VaiTro check constraint.")
        except Exception as e:
            print(f"[!] Warning adding CK_NguoiDung_VaiTro: {e} (It might already exist)")

        # 2. Create HoaDonDoiSoat table
        print("[*] Creating HoaDonDoiSoat table if not exists...")
        create_hoadon_sql = """
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HoaDonDoiSoat')
            BEGIN
                CREATE TABLE HoaDonDoiSoat (
                    MaHoaDon VARCHAR(50) PRIMARY KEY,
                    MaKhachHang INT NOT NULL,
                    TongCOD DECIMAL(18, 2) NOT NULL,
                    TongPhiVanChuyen DECIMAL(18, 2) NOT NULL,
                    TongThucNhan DECIMAL(18, 2) NOT NULL,
                    TrangThaiThanhToan VARCHAR(50) NOT NULL CHECK (TrangThaiThanhToan IN ('CHUA_THANH_TOAN', 'DA_THANH_TOAN')),
                    NgayTao DATETIME DEFAULT GETDATE(),
                    NgayThanhToan DATETIME,
                    CONSTRAINT FK_HoaDonDoiSoat_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES NguoiDung(MaNguoiDung)
                );
                PRINT '[+] Created table HoaDonDoiSoat';
            END
        """
        conn.execute(text(create_hoadon_sql))
        conn.commit()
        print("[+] HoaDonDoiSoat table check complete.")

        # 3. Add MaHoaDon column and FK to DoiSoat table
        print("[*] Checking DoiSoat table columns...")
        # Check if MaHoaDon column exists
        check_column_sql = """
            SELECT 1 FROM sys.columns 
            WHERE object_id = OBJECT_ID('DoiSoat') AND name = 'MaHoaDon'
        """
        col_exists = conn.execute(text(check_column_sql)).fetchone()
        if not col_exists:
            print("[*] MaHoaDon column not found in DoiSoat table. Adding it...")
            conn.execute(text("ALTER TABLE DoiSoat ADD MaHoaDon VARCHAR(50) NULL"))
            conn.execute(text("""
                ALTER TABLE DoiSoat 
                ADD CONSTRAINT FK_DoiSoat_HoaDon FOREIGN KEY (MaHoaDon) REFERENCES HoaDonDoiSoat(MaHoaDon)
            """))
            conn.commit()
            print("[+] Successfully added MaHoaDon column and foreign key to DoiSoat table.")
        else:
            print("[+] MaHoaDon column already exists in DoiSoat table.")
            
        print("[*] Database migration finished successfully!")
        conn.close()

if __name__ == "__main__":
    run_migration()
