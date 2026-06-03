"""
Integration Test Script for Phase 4: WebSocket CSKH Chat & DB Persistence
Run: .\backend\venv\Scripts\python.exe tests/test_phase4_websocket_chat.py
"""
import sys
import os
import json
from io import BytesIO

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import create_app
from app.extensions import db, socketio
from app.models import NguoiDung, TinNhan

def run_phase4_tests():
    print("=" * 75)
    print("🧪 RUNNING INTEGRATION TESTS FOR PHASE 4 (WEBSOCKET REAL-TIME CHAT)")
    print("=" * 75)

    flask_app = create_app('default')
    client = flask_app.test_client()

    with flask_app.app_context():
        # 1. Fetch our operational seed accounts
        customer = NguoiDung.query.filter_by(TenDangNhap="shop1").first()
        cskh = NguoiDung.query.filter_by(TenDangNhap="cskh1").first()

        if not customer or not cskh:
            print("❌ Failure: Seed data missing. Please run seed_postgres.py first.")
            return False

        print(f"✅ Found Customer: {customer.HoTen} (ID: {customer.MaNguoiDung})")
        print(f"✅ Found CSKH Agent: {cskh.HoTen} (ID: {cskh.MaNguoiDung})")

        # ----------------------------------------------------
        # Logins
        # ----------------------------------------------------
        print("\n🔑 Step 4.1: Authenticating accounts...")
        # Customer Login
        res_cust = client.post('/api/auth/login', json={"username": "shop1", "password": "shop123"})
        cust_token = json.loads(res_cust.data.decode('utf-8'))['data']['token']
        print(f"   - Customer JWT Token acquired: {cust_token[:20]}...")

        # ----------------------------------------------------
        # Test 1: Load Room History (HTTP)
        # ----------------------------------------------------
        print("\n📂 Test 1: Loading chat history (HTTP)...")
        headers = {'Authorization': f'Bearer {cust_token}', 'Content-Type': 'application/json'}
        room_id = "order_AG-999999"
        
        res_hist = client.get(f'/api/chat/history/{room_id}', headers=headers)
        if res_hist.status_code != 200:
            print(f"❌ Failed to get chat history! Status: {res_hist.status_code}")
            return False
            
        hist_data = json.loads(res_hist.data.decode('utf-8'))
        print(f"   ✅ Chat history fetched successfully for room: {hist_data['room']}.")
        print(f"   - Past message count: {hist_data['count']}")

        # ----------------------------------------------------
        # Test 2: Upload Proof Image (HTTP)
        # ----------------------------------------------------
        print("\n📸 Test 2: Uploading complaint proof image (HTTP multipart)...")
        dummy_file = (BytesIO(b"dummy image data"), "broken_package.png")
        res_upload = client.post('/api/chat/upload', headers={'Authorization': f'Bearer {cust_token}'}, data={
            'file': dummy_file
        }, content_type='multipart/form-data')
        
        if res_upload.status_code != 201:
            print(f"❌ File upload failed! Status: {res_upload.status_code}")
            print(res_upload.data.decode('utf-8'))
            return False
            
        upload_data = json.loads(res_upload.data.decode('utf-8'))
        file_url = upload_data['file_url']
        print(f"   ✅ File uploaded successfully!")
        print(f"   - Hosted Static URL: '{file_url}'")
        
        # Verify file exists on disk
        local_path = os.path.join(flask_app.root_path, file_url.lstrip('/'))
        if not os.path.exists(local_path):
            print(f"❌ File does not exist on disk: {local_path}")
            return False
        print("   ✅ Verified: File successfully written to static media storage.")

        # ----------------------------------------------------
        # Test 3: SocketIO Connection and Joining Room
        # ----------------------------------------------------
        print("\n🔌 Test 3: Simulating WebSocket Connection & Room Joins...")
        
        # Establish Socket.io test clients
        socket_cust = socketio.test_client(flask_app)
        socket_cskh = socketio.test_client(flask_app)
        
        if not socket_cust.is_connected() or not socket_cskh.is_connected():
            print("❌ Failure: Could not establish WebSocket connection!")
            return False
        print("   ✅ Both Customer & CSKH connected to Socket.io Server.")

        # Customer Joins Room
        socket_cust.emit('join_room', {"room": room_id, "username": "Sneaker World"})
        cust_received = socket_cust.get_received()
        
        # Verify connection confirmation
        joined_cust = any(r['name'] == 'status' and room_id in r['args'][0]['message'] for r in cust_received)
        if not joined_cust:
            print("❌ Customer join room failed!")
            return False
        print("   ✅ Customer joined room successfully.")

        # CSKH Joins Room
        socket_cskh.emit('join_room', {"room": room_id, "username": "CSKH Nhung"})
        cskh_received = socket_cskh.get_received()
        joined_cskh = any(r['name'] == 'status' and room_id in r['args'][0]['message'] for r in cskh_received)
        if not joined_cskh:
            print("❌ CSKH join room failed!")
            return False
        print("   ✅ CSKH joined room successfully.")

        # ----------------------------------------------------
        # Test 4: Real-time Message Broadcast & DB Persistence
        # ----------------------------------------------------
        print("\n✉️ Test 4: Exchanging real-time Socket.io messages...")
        
        # Customer sends message
        content_text = "Hộp đựng giày bị rách nát nghiêm trọng, nhờ CSKH đền bù giúp!"
        socket_cust.emit('send_message', {
            "room": room_id,
            "sender_id": customer.MaNguoiDung,
            "receiver_id": cskh.MaNguoiDung,
            "content": content_text,
            "file_url": file_url
        })
        
        # Verify CSKH received it instantly via Socket broadcast
        cskh_inbox = socket_cskh.get_received()
        received_msg = [r for r in cskh_inbox if r['name'] == 'receive_message']
        
        if not received_msg:
            print("❌ CSKH did not receive the broadcast message!")
            return False
            
        msg_payload = received_msg[0]['args'][0]
        print(f"   ✅ Real-time message broadcast successfully delivered to CSKH room!")
        print(f"   - Sender Name: '{msg_payload['sender_name']}'")
        print(f"   - Message Content: '{msg_payload['content']}'")
        print(f"   - Attachment URL: '{msg_payload['file_url']}'")

        # Verify DB Persistence
        db_message = TinNhan.query.filter_by(PhongChatId=room_id).first()
        if not db_message or db_message.NoiDung != content_text or db_message.FileDinhKemUrl != file_url:
            print("❌ DB persistence verification failed!")
            return False
        print("   ✅ Database verified: Message and attachment link successfully saved to PostgreSQL.")

        # ----------------------------------------------------
        # Test 5: Typing Indicator Broadcast
        # ----------------------------------------------------
        print("\n✍️ Test 5: Broadcasting typing indicators...")
        
        # CSKH starts typing
        socket_cskh.emit('typing', {"room": room_id, "username": "CSKH Nhung", "is_typing": True})
        
        # Verify customer gets the indicator
        cust_inbox = socket_cust.get_received()
        typing_event = [r for r in cust_inbox if r['name'] == 'typing']
        
        if not typing_event:
            print("❌ Customer did not receive typing event!")
            return False
            
        typing_payload = typing_event[0]['args'][0]
        print(f"   ✅ Typing indicator received by Customer: {typing_payload['username']} is typing? {typing_payload['is_typing']}")

        # ----------------------------------------------------
        # Cleanup
        # ----------------------------------------------------
        print("\n🧹 Step 4.6: Cleaning up test media and database records...")
        
        # Delete message in DB
        TinNhan.query.filter_by(PhongChatId=room_id).delete()
        db.session.commit()
        print("   ✅ DB records removed.")
        
        # Delete file on disk
        if os.path.exists(local_path):
            os.remove(local_path)
            print("   ✅ Test upload file deleted from disk.")
            
        socket_cust.disconnect()
        socket_cskh.disconnect()
        print("   ✅ Sockets disconnected.")

        print("\n" + "=" * 75)
        print("🎉 ALL TESTS PASSED SUCCESSFULLY! PHASE 4 IS FULLY OPERATIONAL!")
        print("=" * 75)
        return True

if __name__ == "__main__":
    success = run_phase4_tests()
    sys.exit(0 if success else 1)
