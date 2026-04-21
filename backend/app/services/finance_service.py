from decimal import Decimal

def calculate_shipping_fee(distance_km: float, weight_gram: int) -> float:
    """
    Công thức tính cước vận chuyển.
    - Base: 15,000 VNĐ cho 3km đầu tiên.
    - Km tiếp theo: 3,000 VNĐ / km.
    - Phụ phí cân nặng: Mỗi 1kg vượt của 1kg đầu (1000g) cộng thêm 2,000 VNĐ.
    """
    fee = 15000.0

    # Phí theo quãng đường
    if distance_km > 3.0:
        extra_km = distance_km - 3.0
        fee += extra_km * 3000.0

    # Phụ phí khối lượng
    if weight_gram > 1000:
        extra_kg = (weight_gram - 1000) / 1000.0
        fee += extra_kg * 2000.0

    return round(fee, 2)

def calculate_final_payout(cod_amount: Decimal, shipping_fee: Decimal) -> Decimal:
    """
    Tính FinalPayout (Tiền Shop Thực Nhận).
    """
    # Ép kiểu an toàn (float sang Decimal nếu bị lệch)
    cod = Decimal(str(cod_amount))
    fee = Decimal(str(shipping_fee))
    return cod - fee
