"""
Logistics API Platform - Entry Point
Chạy: python run.py
"""
from app.config import DevelopmentConfig

from app import create_app
from app.extensions import socketio

app = create_app('default')

if __name__ == "__main__":
    print(f"[*] {DevelopmentConfig.APP_NAME} v{DevelopmentConfig.APP_VERSION}")
    print(f"[*] Database: {DevelopmentConfig.DB_NAME}")
    print(f"[*] Server: {DevelopmentConfig.DB_SERVER}")
    socketio.run(app, host="127.0.0.1", port=5000, debug=True, allow_unsafe_werkzeug=True)
