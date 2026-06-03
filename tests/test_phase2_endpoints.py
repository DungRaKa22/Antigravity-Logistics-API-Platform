"""
Integration Test Script for Phase 2: RBAC, 5-Point Routing, and B2B Partner API
Run: .\venv\Scripts\python.exe tests/test_phase2_endpoints.py
"""
import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app
from app.extensions import db
from app.models import NguoiDung, DonHang, LichSu_TrangThai, KhoaAPI

def run_tests():
    print("=" * 70)
    print("🧪 RUNNING INTEGRATION TESTS FOR PHASE 2")
    print("=" * 70)

    app = create_app('default')
    client = app.test_client()

    with app.app_context():
        # Find partner user 'shop1' and admin 'admin'
        admin_user = NguoiDung.query.filter_by(TenDangNhap="admin").first()
        shop_user = NguoiDung.query.filter_by(TenDangNhap="shop1").first()

        if not admin_user or not shop_user:
            print("❌ Failure: Seed data missing. Please run seed_postgres.py first.")
            return False

        print(f"✅ Found Admin user: {admin_user.HoTen} (ID: {admin_user.MaNguoiDung})")
        print(f"✅ Found Shop user: {shop_user.HoTen} (ID: {shop_user.MaNguoiDung})")

        # ----------------------------------------------------
        # Test 1: Admin Login and JWT generation
        # ----------------------------------------------------
        print("\n🔑 Test 1: Authenticating as Admin...")
        login_res = client.post('/api/auth/login', json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_res.status_code != 200:
            print(f"❌ Login failed! Status: {login_res.status_code}")
            return False
            
        login_data = json.loads(login_res.data.decode('utf-8'))
        token = login_data['data']['token']
        print(f"✅ Login successful! JWT Token acquired: {token[:20]}...")

        # ----------------------------------------------------
        # Test 2: Generate B2B API Key via admin endpoint
        # ----------------------------------------------------
        print("\n🔑 Test 2: Generating B2B API Key for shop1...")
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        key_res = client.post('/api/partner/keys', headers=headers, json={
            "partner_id": shop_user.MaNguoiDung
        })
        
        if key_res.status_code != 200:
            print(f"❌ Key generation failed! Status: {key_res.status_code}")
            print(key_res.data.decode('utf-8'))
            return False
            
        key_data = json.loads(key_res.data.decode('utf-8'))
        api_key = key_data['data']['api_key']
        print(f"✅ API Key successfully generated: {api_key}")

        # ----------------------------------------------------
        # Test 3: B2B Calculate Fee with nearest branch and 5-point routing
        # ----------------------------------------------------
        print("\n💰 Test 3: Programmatic Fee Calculation...")
        partner_headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
        
        # Test route: Hanoi to Saigon
        calc_res = client.post('/api/partner/calculate-fee', headers=partner_headers, json={
            "sender_address": "12 Phố Tràng Tiền, Tràng Tiền, Hoàn Kiếm, Hà Nội",
            "receiver_address": "2 Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            "weight_gram": 1500,
            "length_cm": 20,
            "width_cm": 15,
            "height_cm": 10,
            "declared_value": 500000
        })
        
        if calc_res.status_code != 200:
            print(f"❌ Fee calculation failed! Status: {calc_res.status_code}")
            print(calc_res.data.decode('utf-8'))
            return False
            
        calc_data = json.loads(calc_res.data.decode('utf-8'))
        fee_info = calc_data['data']
        print(f"✅ Calculation successful!")
        print(f"   - Estimated Distance: {fee_info['distance_km']:.2f} km")
        print(f"   - Volumetric / Chargeable weight: {fee_info['chargeable_weight']} grams")
        print(f"   - Base Shipping Fee: {fee_info['shipping_fee']:,.0f} VND")
        print(f"   - Insurance Fee: {fee_info['insurance_fee']:,.0f} VND")
        print(f"   - Total Fee: {fee_info['total_fee']:,.0f} VND")

        # ----------------------------------------------------
        # Test 4: B2B Create Order with automatic routing
        # ----------------------------------------------------
        print("\n📦 Test 4: Programmatic Order Creation...")
        order_res = client.post('/api/partner/create-order', headers=partner_headers, json={
            "receiver_name": "Nguyen Van Test Partner",
            "receiver_phone": "0901234567",
            "sender_address": "12 Phố Tràng Tiền, Tràng Tiền, Hoàn Kiếm, Hà Nội",
            "receiver_address": "2 Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            "weight_gram": 1500,
            "length_cm": 20,
            "width_cm": 15,
            "height_cm": 10,
            "declared_value": 500000,
            "cod_amount": 0,
            "description": "B2B Programmatic Delivery Test Order"
        })
        
        if order_res.status_code != 201:
            print(f"❌ Order creation failed! Status: {order_res.status_code}")
            print(order_res.data.decode('utf-8'))
            return False
            
        order_data = json.loads(order_res.data.decode('utf-8'))
        order_info = order_data['data']
        order_id = order_info['order_id']
        print(f"✅ Order successfully created! Order ID: {order_id}")
        print(f"   - Calculated 5-Point Routing Path:")
        for idx, step in enumerate(order_info['routing'], 1):
            print(f"     Step {idx}: {step}")

        # Verify order in database
        db_order = DonHang.query.get(order_id)
        if not db_order:
            print("❌ Order not found in database!")
            return False
        print(f"✅ Verified order exists in DB. Assigned branch coordinates:")
        print(f"   - Sender Branch Code: {db_order.MaChiNhanhGui}")
        print(f"   - Receiver Branch Code: {db_order.MaChiNhanhNhan}")

        # ----------------------------------------------------
        # Test 5: B2B Track Order
        # ----------------------------------------------------
        print("\n📍 Test 5: Programmatic Order Tracking...")
        track_res = client.get(f'/api/partner/track-order/{order_id}', headers=partner_headers)
        
        if track_res.status_code != 200:
            print(f"❌ Order tracking failed! Status: {track_res.status_code}")
            print(track_res.data.decode('utf-8'))
            return False
            
        track_data = json.loads(track_res.data.decode('utf-8'))
        track_info = track_data['data']
        print(f"✅ Tracking retrieval successful!")
        print(f"   - Current Status: {track_info['status']}")
        print(f"   - Latest Timeline Entry: {track_info['timeline'][0]['info']}")

        # ----------------------------------------------------
        # Clean up database entry to keep seed data clean
        # ----------------------------------------------------
        print("\n🧹 Cleaning up test database entries...")
        LichSu_TrangThai.query.filter_by(MaDonHang=order_id).delete()
        DonHang.query.filter_by(MaDonHang=order_id).delete()
        KhoaAPI.query.filter_by(ChuoiKhoaAPI=api_key).delete()
        db.session.commit()
        print("✅ Cleanup finished.")

        print("\n" + "=" * 70)
        print("🎉 ALL TESTS PASSED SUCCESSFULLY! PHASE 2 IS FULLY OPERATIONAL!")
        print("=" * 70)
        return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
