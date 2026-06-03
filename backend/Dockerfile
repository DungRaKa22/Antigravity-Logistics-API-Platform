FROM python:3.10-slim

# Cài đặt các gói phụ thuộc hệ thống và Driver ODBC của Microsoft cho SQL Server
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Sao chép và cài đặt các thư viện Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

# Sao chép mã nguồn ứng dụng vào container
COPY . .

# Định cấu hình cổng chạy động cho các đám mây (Render / Railway tự cấp cổng qua biến $PORT)
ENV PORT=5000
EXPOSE 5000

# Chạy ứng dụng Flask bằng Gunicorn Server tối ưu hiệu năng
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT \"run:app\""]
