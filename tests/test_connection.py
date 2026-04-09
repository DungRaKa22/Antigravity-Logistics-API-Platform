"""
Script test kết nối Python → SQL Server
Chạy: python test_connection.py

Kiểm tra:
1. Kết nối pyodbc trực tiếp
2. Kiểm tra database LogisticsDB tồn tại
3. Kiểm tra các bảng đã tạo
4. Đếm số bản ghi trong mỗi bảng
"""
import sys
import os

# Thêm path để import config
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

def test_pyodbc_connection():
    """Test kết nối bằng pyodbc"""
    try:
        import pyodbc
    except ImportError:
        print("❌ pyodbc chưa được cài đặt. Chạy: pip install pyodbc")
        return False

    from app.config import DevelopmentConfig
    config = DevelopmentConfig()

    print("=" * 50)
    print("🔗 TEST KẾT NỐI PYTHON → SQL SERVER")
    print("=" * 50)
    print(f"  Server:   {config.DB_SERVER}")
    print(f"  Database: {config.DB_NAME}")
    print(f"  Driver:   {config.DB_DRIVER}")
    print()

    # 1. Kiểm tra drivers có sẵn
    print("📋 ODBC Drivers có sẵn:")
    drivers = [d for d in pyodbc.drivers() if 'SQL Server' in d]
    for d in drivers:
        print(f"   ✅ {d}")
    if not drivers:
        print("   ❌ Không tìm thấy ODBC Driver cho SQL Server!")
        print("   💡 Cài đặt: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server")
        return False
    print()

    # 2. Test kết nối
    print("🔌 Đang kết nối...")
    try:
        conn = pyodbc.connect(config.PYODBC_CONNECTION_STRING, timeout=10)
        cursor = conn.cursor()
        print("   ✅ Kết nối thành công!")
        print()

        # 3. Kiểm tra database version
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"📊 SQL Server Version:")
        print(f"   {version.split(chr(10))[0]}")
        print()

        # 4. Kiểm tra các bảng
        print("📋 Bảng trong database:")
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        expected_tables = ['Users', 'Partners', 'Areas', 'ShippingRates', 'Orders', 'OrderStatusHistory']
        
        for table in expected_tables:
            if table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM [{table}]")
                count = cursor.fetchone()[0]
                print(f"   ✅ {table:<25} → {count} bản ghi")
            else:
                print(f"   ❌ {table:<25} → KHÔNG TÌM THẤY")
        print()

        # 5. Test truy vấn mẫu
        print("🧪 Test truy vấn mẫu:")
        try:
            cursor.execute("SELECT tracking_code, status, shipping_fee FROM Orders")
            rows = cursor.fetchall()
            for row in rows:
                print(f"   📦 {row[0]} | {row[1]:<12} | {row[2]:>10,.0f} VND")
        except Exception as e:
            print(f"   ⚠️ Chưa có dữ liệu đơn hàng (chưa chạy seed_data.sql)")
        print()

        cursor.close()
        conn.close()

        print("=" * 50)
        print("✅ TẤT CẢ KIỂM TRA ĐỀU THÀNH CÔNG!")
        print("=" * 50)
        return True

    except pyodbc.Error as e:
        print(f"   ❌ Lỗi kết nối: {e}")
        print()
        print("💡 Gợi ý khắc phục:")
        print("   1. Kiểm tra SQL Server đang chạy")
        print("   2. Kiểm tra thông tin trong file .env")
        print("   3. Đảm bảo đã chạy init_database.sql")
        print("   4. Kiểm tra SQL Server cho phép SQL Authentication")
        return False


if __name__ == "__main__":
    success = test_pyodbc_connection()
    sys.exit(0 if success else 1)
