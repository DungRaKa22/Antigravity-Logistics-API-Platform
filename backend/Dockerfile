FROM python:3.10-slim

# Cài đặt các gói phụ thuộc hệ thống tối thiểu (nếu cần)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# Sao chép và cài đặt các thư viện Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn==21.2.0

# Sao chép mã nguồn ứng dụng vào container
COPY . .

# Định cấu hình cổng chạy động cho các đám mây (Render / Railway tự cấp cổng qua biến $PORT)
ENV PORT=5000
EXPOSE 5000

# Chạy ứng dụng Flask bằng Gunicorn Server với worker eventlet chuyên dụng cho Flask-SocketIO (chống rớt kết nối và tiết kiệm RAM)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT --workers 1 --worker-class eventlet --timeout 120 --keep-alive 5 \"run:app\""]
