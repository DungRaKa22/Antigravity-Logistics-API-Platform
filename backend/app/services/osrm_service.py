import requests
import time

def geocode_address(address: str):
    """
    Sử dụng Nominatim (OpenStreetMap) để lấy Tọa độ từ địa chỉ dạng văn bản.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': address,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'Logistics-API-Platform/1.0' # Quan trọng, Nominatim đòi hỏi header
    }
    try:
        # Nominatim giới hạn tốc độ 1 request/giây
        time.sleep(1)
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Lỗi Geocode: {e}")
    return None, None

def calculate_osrm_distance(lat1: float, lon1: float, lat2: float, lon2: float):
    """
    Geocode -> Tọa độ -> Tính quãng đường bằng OSRM.
    Trả về số Km (mặc định OSRM trả mét).
    """
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 'Ok' and len(data.get('routes', [])) > 0:
                distance_meters = data['routes'][0]['distance']
                return round(distance_meters / 1000.0, 2)
    except Exception as e:
        print(f"Lỗi OSRM: {e}")
    return None

def get_smart_distance(addr_gui: str, addr_nhan: str, lat_gui=None, lon_gui=None, lat_nhan=None, lon_nhan=None):
    """
    Hàm tổng hợp. Ưu tiên tọa độ truyền vào (từ Sổ địa chỉ), nếu không có thì geocode text.
    Nếu không tính được về fallback 10km.
    """
    # 1. Tìm Lat/Lon Điểm Gửi
    if not lat_gui or not lon_gui:
        lat_gui, lon_gui = geocode_address(addr_gui)

    # 2. Tìm Lat/Lon Điểm Nhận
    if not lat_nhan or not lon_nhan:
        lat_nhan, lon_nhan = geocode_address(addr_nhan)

    # 3. Chạy OSRM
    if lat_gui and lon_gui and lat_nhan and lon_nhan:
        dist = calculate_osrm_distance(lat_gui, lon_gui, lat_nhan, lon_nhan)
        if dist is not None:
            return float(dist)
            
    # Fallback giả định nếu API OSM/OSRM rớt
    return 10.5
