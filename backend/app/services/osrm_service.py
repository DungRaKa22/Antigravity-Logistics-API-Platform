import requests
import time
import math

# Bộ nhớ đệm in-memory tránh gọi trùng lặp API Nominatim/OSRM làm nghẽn cổ chai
_geocode_cache = {}
_osrm_cache = {}

def calculate_haversine_helper(lat1, lon1, lat2, lon2):
    """
    Tính khoảng cách đường chim bay giữa 2 tọa độ (Haversine Formula).
    Trả về số Km. Luôn hoạt động offline và phản hồi tức thời (<1ms).
    """
    try:
        R = 6371.0  # Bán kính Trái đất tính bằng km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception as e:
        print(f"Lỗi Haversine helper: {e}")
        return 10.0

def geocode_address(address: str):
    """
    Sử dụng Nominatim (OpenStreetMap) để lấy Tọa độ từ địa chỉ dạng văn bản.
    Đã được tối ưu hóa bằng bộ nhớ đệm in-memory.
    """
    if not address or not isinstance(address, str):
        return None, None
        
    # Chuẩn hóa chuỗi địa chỉ để làm khóa cache
    clean_addr = " ".join(address.strip().lower().split())
    if not clean_addr:
        return None, None
        
    if clean_addr in _geocode_cache:
        return _geocode_cache[clean_addr]

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': address,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'Logistics-API-Platform/1.0'
    }
    try:
        # Giới hạn Nominatim: Chỉ sleep khi thực sự gọi API ngoài
        time.sleep(1)
        response = requests.get(url, params=params, headers=headers, timeout=2.0)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                res = (float(data[0]['lat']), float(data[0]['lon']))
                _geocode_cache[clean_addr] = res
                return res
    except Exception as e:
        print(f"Lỗi Geocode: {e}")
        
    return None, None

def calculate_osrm_distance(lat1: float, lon1: float, lat2: float, lon2: float):
    """
    Tính quãng đường di chuyển thực tế bằng OSRM.
    Đã được tối ưu hóa bằng cache tọa độ (độ phân giải ~11m) và fallback Haversine tức thì nếu OSRM lỗi hoặc timeout.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
        
    try:
        lat1_f, lon1_f, lat2_f, lon2_f = float(lat1), float(lon1), float(lat2), float(lon2)
    except Exception as e:
        print(f"Lỗi định dạng tọa độ: {e}")
        return None

    # Tạo khóa cache làm tròn đến 4 chữ số thập phân
    key = (round(lat1_f, 4), round(lon1_f, 4), round(lat2_f, 4), round(lon2_f, 4))
    if key in _osrm_cache:
        return _osrm_cache[key]

    url = f"http://router.project-osrm.org/route/v1/driving/{lon1_f},{lat1_f};{lon2_f},{lat2_f}?overview=false"
    try:
        # Sử dụng timeout ngắn (1.0s) để tránh treo nghẽn request khi server OSRM quá tải
        response = requests.get(url, timeout=1.0)
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 'Ok' and len(data.get('routes', [])) > 0:
                distance_meters = data['routes'][0]['distance']
                dist_km = round(distance_meters / 1000.0, 2)
                _osrm_cache[key] = dist_km
                return dist_km
    except Exception as e:
        print(f"Lỗi OSRM (Sử dụng Haversine fallback): {e}")

    # Fallback: Tính bằng Haversine * 1.25 (hệ số vòng vèo trung bình của đường bộ Việt Nam)
    fallback_dist = round(calculate_haversine_helper(lat1_f, lon1_f, lat2_f, lon2_f) * 1.25, 2)
    _osrm_cache[key] = fallback_dist
    return fallback_dist

def get_smart_distance(addr_gui: str, addr_nhan: str, lat_gui=None, lon_gui=None, lat_nhan=None, lon_nhan=None):
    """
    Hàm tổng hợp tính khoảng cách. Ưu tiên tọa độ truyền vào, tự động geocode nếu khuyết thiếu.
    """
    # 1. Tìm Lat/Lon Điểm Gửi
    if not lat_gui or not lon_gui:
        lat_gui, lon_gui = geocode_address(addr_gui)

    # 2. Tìm Lat/Lon Điểm Nhận
    if not lat_nhan or not lon_nhan:
        lat_nhan, lon_nhan = geocode_address(addr_nhan)

    # 3. Tính toán khoảng cách di chuyển
    if lat_gui and lon_gui and lat_nhan and lon_nhan:
        dist = calculate_osrm_distance(lat_gui, lon_gui, lat_nhan, lon_nhan)
        if dist is not None:
            return float(dist)
            
    return 10.5


def optimize_multistop_path(sender_address: str, receiver_addresses: list, sender_coords: tuple = None, receiver_coords: list = None):
    """
    Tối ưu hóa lộ trình đa điểm (Nearest Neighbor).
    Trả về danh sách địa chỉ nhận đã được sắp xếp tối ưu kèm khoảng cách từng chặng.
    """
    # 1. Geocode sender
    if sender_coords and sender_coords[0] is not None and sender_coords[1] is not None:
        lat_gui, lon_gui = sender_coords
    else:
        lat_gui, lon_gui = geocode_address(sender_address)
        
    if not lat_gui or not lon_gui:
        # Fallback if geocoding fails
        return list(range(len(receiver_addresses))), [10.5] + [5.0] * (len(receiver_addresses) - 1)

    # 2. Geocode all receivers
    coords = []
    for idx, addr in enumerate(receiver_addresses):
        r_lat, r_lon = None, None
        if receiver_coords and idx < len(receiver_coords) and receiver_coords[idx] and receiver_coords[idx][0] is not None and receiver_coords[idx][1] is not None:
            r_lat, r_lon = receiver_coords[idx]
        
        if r_lat is None or r_lon is None:
            r_lat, r_lon = geocode_address(addr)
            
        coords.append((idx, r_lat, r_lon))

    # Nearest Neighbor routing
    unvisited = list(coords)
    curr_lat, curr_lon = lat_gui, lon_gui
    optimized_indices = []
    distances = []

    while unvisited:
        # Tìm điểm nhận chưa đi qua gần nhất (khoảng cách Euclid sơ bộ)
        best_idx = 0
        best_dist = float('inf')
        
        for i, (idx, lat, lon) in enumerate(unvisited):
            if lat is not None and lon is not None and curr_lat is not None and curr_lon is not None:
                dist = ((lat - curr_lat) ** 2 + (lon - curr_lon) ** 2) ** 0.5
            else:
                dist = 9999.0
            
            if dist < best_dist:
                best_dist = dist
                best_idx = i
        
        # Chọn điểm đó
        chosen_idx, chosen_lat, chosen_lon = unvisited.pop(best_idx)
        
        # Tính khoảng cách OSRM thực tế từ điểm hiện tại tới điểm nhận được chọn
        leg_dist = get_smart_distance("", "", lat_gui=curr_lat, lon_gui=curr_lon, lat_nhan=chosen_lat, lon_nhan=chosen_lon)
        distances.append(leg_dist)
        
        # Cập nhật vị trí hiện tại
        if chosen_lat is not None and chosen_lon is not None:
            curr_lat, curr_lon = chosen_lat, chosen_lon
        optimized_indices.append(chosen_idx)

    return optimized_indices, distances
