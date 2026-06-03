"""
Integration Test Script for Phase 3: Momo Webhook & Push Notifications (Web Push / SSE Toasts)
Run: .\backend\venv\Scripts\python.exe tests/test_phase3_payment_notifications.py
"""
import sys
import os
import json

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app
from app.extensions import db
from app.models import NguoiDung, DonHang, LichSu_TrangThai, DangKyNhanThongBao

def run_phase3_tests():
    print("=" * 75)
    print("🧪 RUNNING INTEGRATION TESTS FOR PHASE 3 (MOMO & PUSH NOTIFICATIONS)")
    print("=" * 75)

    app = create_app('default')
    client = app.test_client()

    with app.app_context():
        # 1. Fetch our operational seed accounts
        customer = NguoiDung.query.filter_by(TenDangNhap="shop1").first()
        shipper = NguoiDung.query.filter_by(TenDangNhap="shipper_hn").first()

        if not customer or not shipper:
            print("❌ Failure: Seed data missing. Please run seed_postgres.py first.")
            return False

        print(f"✅ Found Customer: {customer.HoTen} (ID: {customer.MaNguoiDung})")
        print(f"✅ Found Shipper: {shipper.HoTen} (ID: {shipper.MaNguoiDung})")

        # ----------------------------------------------------
        # Logins
        # ----------------------------------------------------
        print("\n🔑 Step 3.1: Authenticating accounts...")
        # Customer Login
        res_cust = client.post('/api/auth/login', json={"username": "shop1", "password": "shop123"})
        cust_token = json.loads(res_cust.data.decode('utf-8'))['data']['token']
        print(f"   - Customer JWT Token acquired: {cust_token[:20]}...")

        # Shipper Login
        res_ship = client.post('/api/auth/login', json={"username": "shipper_hn", "password": "ship123"})
        ship_token = json.loads(res_ship.data.decode('utf-8'))['data']['token']
        print(f"   - Shipper JWT Token acquired: {ship_token[:20]}...")

        # ----------------------------------------------------
        # Test 1: Subscribe Push Notification
        # ----------------------------------------------------
        print("\n🔔 Test 1: Registering Web Push VAPID subscriptions...")
        
        # Subscribe Customer
        cust_headers = {'Authorization': f'Bearer {cust_token}', 'Content-Type': 'application/json'}
        res_sub_cust = client.post('/api/notifications/subscribe', headers=cust_headers, json={
            "endpoint": "https://fcm.googleapis.com/fcm/send/d5_shop1_mock_push_token_2026",
            "keys": {
                "p256dh": "BLm59z85hU0_shop1_p256dh_key_string",
                "auth": "auth_key_shop1_2026"
            }
        })
        if res_sub_cust.status_code not in [200, 201]:
            print(f"❌ Customer subscription failed! Status: {res_sub_cust.status_code}")
            return False
        print("   ✅ Customer browser VAPID push token registered.")

        # Subscribe Shipper
        ship_headers = {'Authorization': f'Bearer {ship_token}', 'Content-Type': 'application/json'}
        res_sub_ship = client.post('/api/notifications/subscribe', headers=ship_headers, json={
            "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/d5_shipper_mock_push_token_2026",
            "keys": {
                "p256dh": "BLm59z85hU0_shipper_p256dh_key_string",
                "auth": "auth_key_shipper_2026"
            }
        })
        if res_sub_ship.status_code not in [200, 201]:
            print(f"❌ Shipper subscription failed! Status: {res_sub_ship.status_code}")
            return False
        print("   ✅ Shipper browser VAPID push token registered.")

        # ----------------------------------------------------
        # Test 2: Create Retail Non-COD Order (Payment Lock)
        # ----------------------------------------------------
        print("\n🔒 Test 2: Creating Retail Non-COD Order (Simulating Payment Lock)...")
        res_order = client.post('/api/orders/', headers=cust_headers, json={
            "receiver_name": "Nguyen Van C - Retail Customer",
            "receiver_phone": "0981112222",
            "sender_address": "12 Phố Tràng Tiền, Tràng Tiền, Hoàn Kiếm, Hà Nội",
            "receiver_address": "2 Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            "weight_gram": 500,
            "length_cm": 10,
            "width_cm": 10,
            "height_cm": 5,
            "cod_amount": 0,
            "description": "Retail Non-COD Momo Sandbox Order"
        })
        
        if res_order.status_code != 201:
            print(f"❌ Order creation failed! Status: {res_order.status_code}")
            print(res_order.data.decode('utf-8'))
            return False
            
        order_data = json.loads(res_order.data.decode('utf-8'))['data']
        order_id = order_data['order_id']
        print(f"   ✅ Order successfully locked! Order ID: {order_id}")
        print(f"   - Current Status in response: '{order_data['status']}'")
        print(f"   - Checkout Redirect URL: '{order_data['payment_url']}'")

        # Verify DB states
        db_order = DonHang.query.get(order_id)
        if db_order.TrangThaiHienTai != 'CHO_THANH_TOAN' or db_order.TrangThaiThanhToan != 'CHUA_THANH_TOAN':
            print(f"❌ DB state mismatch! Current: {db_order.TrangThaiHienTai}, Payment: {db_order.TrangThaiThanhToan}")
            return False
        print("   ✅ Database verified: states correctly set to 'CHO_THANH_TOAN' and 'CHUA_THANH_TOAN'.")

        # ----------------------------------------------------
        # Test 3: Anti-Fake Order Lock Check (Shippers must not see it)
        # ----------------------------------------------------
        print("\n🛡️ Test 3: Checking Anti-Fake Order locks (Shipper list filtration)...")
        res_shipper_list = client.get('/api/orders/', headers=ship_headers)
        shipper_orders = json.loads(res_shipper_list.data.decode('utf-8'))['data']
        
        is_visible_to_shipper = any(o['order_id'] == order_id for o in shipper_orders)
        if is_visible_to_shipper:
            print("❌ Failure: Shipper can see un-paid locked order!")
            return False
        print("   ✅ Verified: Locked order is fully hidden from unassigned shipper listings!")

        # ----------------------------------------------------
        # Test 4: Momo Webhook Simulation (Simulated Checkout success)
        # ----------------------------------------------------
        print("\n💳 Test 4: Executing Momo Webhook Callback Simulation...")
        # Direct callback webhook simulation trigger
        res_webhook = client.post(f'/api/payment/simulate-callback/{order_id}')
        
        if res_webhook.status_code != 200:
            print(f"❌ Webhook simulation failed! Status: {res_webhook.status_code}")
            print(res_webhook.data.decode('utf-8'))
            return False
            
        print("   ✅ Webhook completed successfully.")
        
        # Verify DB changes
        db_order_after = DonHang.query.get(order_id)
        if db_order_after.TrangThaiHienTai != 'CHO_LAY_HANG' or db_order_after.TrangThaiThanhToan != 'DA_THANH_TOAN':
            print(f"❌ DB update failure post-webhook! Current: {db_order_after.TrangThaiHienTai}, Payment: {db_order_after.TrangThaiThanhToan}")
            return False
            
        print("   ✅ Database verified: states correctly transitioned to 'CHO_LAY_HANG' and 'DA_THANH_TOAN'.")
        
        # Verify order history tracking
        history = LichSu_TrangThai.query.filter_by(MaDonHang=order_id).order_by(LichSu_TrangThai.MaLichSu.desc()).first()
        print(f"   - Latest History entry MaTrangThai: '{history.MaTrangThai}'")
        print(f"   - Latest Location/Details log: '{history.ThongTinViTri}'")

        # ----------------------------------------------------
        # Test 5: Verify Shipper can now see the unlocked order
        # ----------------------------------------------------
        print("\n🚴 Test 5: Checking unassigned list filtration after successful payment...")
        res_shipper_list_after = client.get('/api/orders/', headers=ship_headers)
        shipper_orders_after = json.loads(res_shipper_list_after.data.decode('utf-8'))['data']
        
        is_visible_to_shipper_now = any(o['order_id'] == order_id for o in shipper_orders_after)
        if not is_visible_to_shipper_now:
            print("❌ Failure: Unlocked order is still hidden from shipper list!")
            return False
        print("   ✅ Verified: Unlocked order is now visible and ready to be picked up by shippers!")

        # ----------------------------------------------------
        # Clean up database entries
        # ----------------------------------------------------
        print("\n🧹 Step 3.6: Cleaning up test data...")
        LichSu_TrangThai.query.filter_by(MaDonHang=order_id).delete()
        DonHang.query.filter_by(MaDonHang=order_id).delete()
        DangKyNhanThongBao.query.filter_by(MaNguoiDung=customer.MaNguoiDung).delete()
        DangKyNhanThongBao.query.filter_by(MaNguoiDung=shipper.MaNguoiDung).delete()
        db.session.commit()
        print("   ✅ Cleanup finished.")

        print("\n" + "=" * 75)
        print("🎉 ALL TESTS PASSED SUCCESSFULLY! PHASE 3 IS FULLY OPERATIONAL!")
        print("=" * 75)
        return True

if __name__ == "__main__":
    success = run_phase3_tests()
    sys.exit(0 if success else 1)
