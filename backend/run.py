"""
Logistics API Platform - Entry Point
Chạy: python run.py
"""
from app.config import DevelopmentConfig

from app import create_app
app = create_app('default')

if __name__ == "__main__":
    print(f"[*] {DevelopmentConfig.APP_NAME} v{DevelopmentConfig.APP_VERSION}")
    print(f"[*] Database: {DevelopmentConfig.DB_NAME}")
    print(f"[*] Server: {DevelopmentConfig.DB_SERVER}")
    app.run(host="127.0.0.1", port=5000, debug=True)
