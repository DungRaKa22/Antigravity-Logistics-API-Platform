"""
Cấu hình ứng dụng - Logistics API Platform
Đọc từ biến môi trường hoặc file .env
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Cấu hình chung"""
    # App
    APP_NAME = "Logistics API Platform"
    APP_VERSION = "1.0.0"
    DEBUG = False

    # SQL Server Connection
    DB_SERVER = os.getenv("DB_SERVER", "localhost")
    DB_NAME = os.getenv("DB_NAME", "LogisticsDB")
    DB_USERNAME = os.getenv("DB_USERNAME", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    # True = Windows Authentication, False = SQL Authentication
    USE_WINDOWS_AUTH = os.getenv("USE_WINDOWS_AUTH", "true").lower() == "true"

    @property
    def DATABASE_URL(self):
        if self.USE_WINDOWS_AUTH:
            return (
                f"mssql+pyodbc://@{self.DB_SERVER}/{self.DB_NAME}"
                f"?driver={self.DB_DRIVER.replace(' ', '+')}"
                f"&Trusted_Connection=yes"
                f"&TrustServerCertificate=yes"
            )
        return (
            f"mssql+pyodbc://{self.DB_USERNAME}:{self.DB_PASSWORD}"
            f"@{self.DB_SERVER}/{self.DB_NAME}"
            f"?driver={self.DB_DRIVER.replace(' ', '+')}"
        )

    @property
    def PYODBC_CONNECTION_STRING(self):
        if self.USE_WINDOWS_AUTH:
            return (
                f"DRIVER={{{self.DB_DRIVER}}};"
                f"SERVER={self.DB_SERVER};"
                f"DATABASE={self.DB_NAME};"
                f"Trusted_Connection=yes;"
                f"TrustServerCertificate=yes;"
            )
        return (
            f"DRIVER={{{self.DB_DRIVER}}};"
            f"SERVER={self.DB_SERVER};"
            f"DATABASE={self.DB_NAME};"
            f"UID={self.DB_USERNAME};"
            f"PWD={self.DB_PASSWORD};"
            f"TrustServerCertificate=yes;"
        )

    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    API_KEY_LENGTH = 32

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")


class DevelopmentConfig(Config):
    """Cấu hình cho môi trường phát triển"""
    DEBUG = True


class ProductionConfig(Config):
    """Cấu hình cho môi trường production"""
    DEBUG = False


# Mapping tên cấu hình
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
