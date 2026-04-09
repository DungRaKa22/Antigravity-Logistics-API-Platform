"""
Logistics API Platform - Entry Point
Chạy: python run.py
"""
from app.config import DevelopmentConfig

# TODO: Sẽ import Flask app ở Phase 2
# from app import create_app
# app = create_app(DevelopmentConfig)

if __name__ == "__main__":
    print(f"🚀 {DevelopmentConfig.APP_NAME} v{DevelopmentConfig.APP_VERSION}")
    print(f"📦 Database: {DevelopmentConfig.DB_NAME}")
    print(f"🔗 Server: {DevelopmentConfig.DB_SERVER}")
    # app.run(host="0.0.0.0", port=5000, debug=True)
