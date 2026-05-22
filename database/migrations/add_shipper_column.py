import os
import sys
from sqlalchemy import text

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app import create_app
from app.extensions import db

def run_migration():
    app = create_app('default')
    with app.app_context():
        print("[*] Connecting to database...")
        conn = db.engine.connect()
        
        print("[*] Checking DonHang table columns...")
        # Check if MaNhanVienGiao column exists
        check_column_sql = """
            SELECT 1 FROM sys.columns 
            WHERE object_id = OBJECT_ID('DonHang') AND name = 'MaNhanVienGiao'
        """
        col_exists = conn.execute(text(check_column_sql)).fetchone()
        if not col_exists:
            print("[*] MaNhanVienGiao column not found in DonHang table. Adding it...")
            conn.execute(text("ALTER TABLE DonHang ADD MaNhanVienGiao INT NULL"))
            conn.execute(text("""
                ALTER TABLE DonHang 
                ADD CONSTRAINT FK_DonHang_NhanVienGiao FOREIGN KEY (MaNhanVienGiao) REFERENCES NguoiDung(MaNguoiDung)
            """))
            conn.commit()
            print("[+] Successfully added MaNhanVienGiao column and foreign key to DonHang table.")
        else:
            print("[+] MaNhanVienGiao column already exists in DonHang table.")
            
        print("[*] Database migration finished successfully!")
        conn.close()

if __name__ == "__main__":
    run_migration()
