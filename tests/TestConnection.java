/*
 * Logistics API Platform - Test kết nối Java → SQL Server
 * Compile: javac -cp mssql-jdbc-12.8.1.jre11.jar TestConnection.java
 * Run:     java -cp ".;mssql-jdbc-12.8.1.jre11.jar" TestConnection
 */

import java.sql.*;

public class TestConnection {
    
    // Cấu hình kết nối - điều chỉnh theo môi trường
    private static final String SERVER = "localhost";
    private static final String DATABASE = "LogisticsDB";
    private static final String USERNAME = "sa";
    private static final String PASSWORD = "YourStrongPassword123!";
    
    private static final String CONNECTION_URL = String.format(
        "jdbc:sqlserver://%s:1433;databaseName=%s;user=%s;password=%s;encrypt=true;trustServerCertificate=true;",
        SERVER, DATABASE, USERNAME, PASSWORD
    );

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("🔗 TEST KẾT NỐI JAVA → SQL SERVER");
        System.out.println("==================================================");
        System.out.printf("  Server:   %s%n", SERVER);
        System.out.printf("  Database: %s%n", DATABASE);
        System.out.println();

        try {
            // 1. Load JDBC Driver
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            System.out.println("✅ JDBC Driver loaded thành công");

            // 2. Kết nối
            System.out.println("🔌 Đang kết nối...");
            Connection conn = DriverManager.getConnection(CONNECTION_URL);
            System.out.println("✅ Kết nối thành công!");
            System.out.println();

            // 3. Kiểm tra phiên bản
            DatabaseMetaData metaData = conn.getMetaData();
            System.out.printf("📊 SQL Server: %s %s%n", 
                metaData.getDatabaseProductName(),
                metaData.getDatabaseProductVersion().split("\n")[0]);
            System.out.println();

            // 4. Kiểm tra các bảng
            System.out.println("📋 Bảng trong database:");
            String[] tableNames = {"Users", "Partners", "Areas", "ShippingRates", "Orders", "OrderStatusHistory"};
            
            Statement stmt = conn.createStatement();
            for (String table : tableNames) {
                try {
                    ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM [" + table + "]");
                    rs.next();
                    int count = rs.getInt(1);
                    System.out.printf("   ✅ %-25s → %d bản ghi%n", table, count);
                    rs.close();
                } catch (SQLException e) {
                    System.out.printf("   ❌ %-25s → KHÔNG TÌM THẤY%n", table);
                }
            }
            System.out.println();

            // 5. Test truy vấn
            System.out.println("🧪 Test truy vấn mẫu:");
            try {
                ResultSet rs = stmt.executeQuery(
                    "SELECT tracking_code, status, shipping_fee FROM Orders"
                );
                while (rs.next()) {
                    System.out.printf("   📦 %s | %-12s | %,.0f VND%n",
                        rs.getString("tracking_code"),
                        rs.getString("status"),
                        rs.getDouble("shipping_fee"));
                }
                rs.close();
            } catch (SQLException e) {
                System.out.println("   ⚠️ Chưa có dữ liệu (chưa chạy seed_data.sql)");
            }
            System.out.println();

            stmt.close();
            conn.close();

            System.out.println("==================================================");
            System.out.println("✅ TẤT CẢ KIỂM TRA ĐỀU THÀNH CÔNG!");
            System.out.println("==================================================");

        } catch (ClassNotFoundException e) {
            System.out.println("❌ JDBC Driver không tìm thấy!");
            System.out.println("💡 Tải driver: https://learn.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server");
        } catch (SQLException e) {
            System.out.println("❌ Lỗi kết nối: " + e.getMessage());
            System.out.println();
            System.out.println("💡 Gợi ý khắc phục:");
            System.out.println("   1. Kiểm tra SQL Server đang chạy");
            System.out.println("   2. Kiểm tra thông tin kết nối trong code");
            System.out.println("   3. Đảm bảo đã chạy init_database.sql");
            System.out.println("   4. Kiểm tra TCP/IP protocol đã bật trong SQL Server Configuration Manager");
        }
    }
}
