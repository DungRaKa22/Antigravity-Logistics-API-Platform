"""
Notification Service - Antigravity Logistics API Platform
Handles SSE Broadcasts (Toasts) and Web Push dispatch (mock VAPID push logging)
"""
import json
from datetime import datetime
from app.extensions import db
from app.models import NguoiDung, DangKyNhanThongBao

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        new_args = []
        for arg in args:
            if isinstance(arg, str):
                new_args.append(arg.encode('ascii', 'backslashreplace').decode('ascii'))
            else:
                new_args.append(arg)
        try:
            print(*new_args, **kwargs)
        except Exception:
            pass

# Import broadcast_event dynamically to avoid circular dependencies
def get_broadcast_fn():
    try:
        from app.routes.order_routes import broadcast_event
        return broadcast_event
    except ImportError:
        return lambda t, p: None

def trigger_notifications(event_type, recipient_id, payload):
    """
    Triggers dual-channel notification:
    1. SSE Broadcast (Web Toast) for active web pages.
    2. Web Push simulation (prints & logs VAPID dispatch payload) for background apps.
    """
    broadcast = get_broadcast_fn()
    
    # 1. Dispatch Web Toast via SSE (broadcasting to everyone or specific target event)
    # The frontend client filters events based on user roles and IDs
    broadcast(event_type, {
        "recipient_id": recipient_id,
        "payload": payload,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # 2. Query all active Web Push VAPID subscriptions for the recipient(s)
    recipients = []
    if isinstance(recipient_id, list):
        recipients = recipient_id
    elif recipient_id is not None:
        recipients = [recipient_id]
        
    subscriptions = []
    if recipients:
        subscriptions = DangKyNhanThongBao.query.filter(DangKyNhanThongBao.MaNguoiDung.in_(recipients)).all()
        
    safe_print(f"\n========================================================")
    safe_print(f"[NOTIFICATION DISPATCHER]: {event_type}")
    safe_print(f"========================================================")
    safe_print(f"  Event: {event_type}")
    safe_print(f"  Recipients targeted: {recipients}")
    safe_print(f"  Found browser subscriptions in DB: {len(subscriptions)}")
    safe_print(f"  Payload: {json.dumps(payload, ensure_ascii=True)}")
    
    # Simulate sending background VAPID Web Push packets
    for sub in subscriptions:
        user = NguoiDung.query.get(sub.MaNguoiDung)
        user_name = user.HoTen if user else f"User {sub.MaNguoiDung}"
        safe_print(f"\n[WEB PUSH API] Dispatched packet to Google/Mozilla push service:")
        safe_print(f"  - Target User: {user_name} (ID: {sub.MaNguoiDung})")
        safe_print(f"  - Device Endpoint: {sub.Endpoint[:60]}...")
        safe_print(f"  - Browser VAPID Keys: p256dh={sub.P256dh[:20]}..., auth={sub.Auth[:15]}...")
        safe_print(f"  - Encryption: AES-128-GCM")
        safe_print(f"  - Push Packet Body: {{ \"title\": \"Antigravity Express\", \"body\": \"{payload.get('message', 'Cập nhật mới từ hệ thống')}\", \"icon\": \"/neon-logo.png\", \"tag\": \"{event_type}\" }}")
        
    safe_print(f"========================================================\n")
    return True
