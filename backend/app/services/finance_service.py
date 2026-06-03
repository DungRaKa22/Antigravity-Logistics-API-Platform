from decimal import Decimal
import math

def calculate_shipping_fee(distance_km: float, weight_gram: int, length: int = 0, width: int = 0, height: int = 0) -> float:
    """
    Thuật toán tính cước bản địa nâng cấp của Antigravity Express theo mô hình Viettel Post.
    
    1. Luật miễn cồng kềnh: Nếu tổng kích thước 3 chiều L + W + H < 100cm,
       vô hiệu hóa cước thể tích (đặt bằng 0), chỉ tính theo trọng lượng tịnh thực tế.
    2. Cước thể tích quy đổi: Wv = (L * W * H) / 5 (đơn vị: Gram).
    3. Luật làm tròn khối lượng: Nếu trọng lượng tính cước >= 2kg (2000g),
       làm tròn lên mốc 0.5kg (500g) tiếp theo. Dưới 2kg giữ nguyên.
    4. Phân khu biểu phí địa lý (Nội tỉnh <= 30km, Nội miền <= 300km, Liên miền > 300km).
    """
    # 1. Tính khối lượng quy đổi thể tích nếu không được miễn cồng kềnh
    volumetric_weight = 0
    if (length + width + height) >= 100:
        volumetric_weight = int((length * width * height) / 5) # quy đổi ra gram
        
    chargeable_weight = max(weight_gram, volumetric_weight)

    # 2. Áp dụng luật làm tròn khối lượng cho mốc từ 2kg trở lên
    if chargeable_weight >= 2000:
        chargeable_kg = chargeable_weight / 1000.0
        rounded_kg = math.ceil(chargeable_kg * 2) / 2.0
        chargeable_weight = int(rounded_kg * 1000)

    # 3. Phân vùng địa lý dựa trên khoảng cách km thực tế
    if distance_km <= 30.0:
        region = 'NOI_TINH'
    elif distance_km <= 300.0:
        region = 'NOI_MIEN'
    else:
        region = 'LIEN_MIEN'

    # 4. Áp dụng biểu phí theo phân vùng và mốc cân nặng
    fee = 15000.0
    
    if region == 'NOI_TINH':
        if chargeable_weight < 2000:
            fee = 15000.0
        elif chargeable_weight <= 15000:
            extra_half_kg = math.ceil((chargeable_weight - 2000) / 500.0)
            fee = 15000.0 + (extra_half_kg * 2500.0)
        else: # > 15kg
            extra_kg = math.ceil((chargeable_weight - 15000) / 1000.0)
            fee = 76000.0 + (extra_kg * 5000.0)
            
    elif region == 'NOI_MIEN':
        if chargeable_weight < 2000:
            fee = 22000.0
        elif chargeable_weight <= 15000:
            extra_half_kg = math.ceil((chargeable_weight - 2000) / 500.0)
            fee = 22000.0 + (extra_half_kg * 3500.0)
        else: # > 15kg
            extra_kg = math.ceil((chargeable_weight - 15000) / 1000.0)
            fee = 95000.0 + (extra_kg * 5000.0)
            
    else: # LIEN_MIEN
        if chargeable_weight < 1000:
            fee = 14000.0
        elif chargeable_weight < 2000:
            fee = 17000.0
        elif chargeable_weight < 3000:
            fee = 21000.0
        elif chargeable_weight < 4000:
            fee = 25000.0
        elif chargeable_weight <= 15000:
            extra_kg = math.ceil((chargeable_weight - 4000) / 1000.0)
            fee = 25000.0 + (extra_kg * 4000.0)
        else: # > 15kg
            extra_kg = math.ceil((chargeable_weight - 15000) / 1000.0)
            fee = 117000.0 + (extra_kg * 5000.0)

    return round(fee, 2)

def calculate_final_payout(cod_amount: Decimal, shipping_fee: Decimal) -> Decimal:
    """
    Tính FinalPayout (Tiền Shop Thực Nhận).
    """
    cod = Decimal(str(cod_amount))
    fee = Decimal(str(shipping_fee))
    return cod - fee

def calculate_insurance_fee(declared_value: float) -> float:
    """
    Tính phí bảo hiểm khai giá.
    - Dưới 1.000.000 VNĐ: Miễn phí bảo hiểm.
    - Từ 1.000.000 VNĐ trở lên: Phí bằng 0.5% giá trị khai báo.
    """
    val = float(declared_value)
    if val < 1000000.0:
        return 0.0
    return round(val * 0.005, 2)

def calculate_volumetric_weight(length: int, width: int, height: int) -> int:
    """
    Tính trọng lượng quy đổi thể tích theo đơn vị Gram.
    L*W*H / 5000 kg = L*W*H / 5 gram.
    """
    return int((length * width * height) / 5)
