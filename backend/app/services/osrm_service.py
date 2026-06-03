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
