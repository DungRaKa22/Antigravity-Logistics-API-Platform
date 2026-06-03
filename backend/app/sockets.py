"""
WebSocket Event Handlers - Antigravity Logistics API Platform
Manages real-time CSKH chat rooms, messages, typing indicators, and DB synchronization
"""
import json
from flask import request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.models import TinNhan, NguoiDung
from app.services.notification_service import trigger_notifications

@socketio.on('connect')
def handle_connect():
    print(f"🔌 [SOCKETIO] Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"🔌 [SOCKETIO] Client disconnected: {request.sid}")

@socketio.on('join_room')
def on_join(data):
    room = data.get('room')
    username = data.get('username', 'User')
    if room:
        join_room(room)
        print(f"🚪 [SOCKETIO] {username} joined room: {room}")
        emit('status', {
            'success': True,
            'message': f"Đã kết nối vào phòng {room}.",
            'room': room
        })

@socketio.on('leave_room')
def on_leave(data):
    room = data.get('room')
    username = data.get('username', 'User')
    if room:
        leave_room(room)
        print(f"🚪 [SOCKETIO] {username} left room: {room}")
        emit('status', {
            'success': True,
            'message': f"Đã rời khỏi phòng {room}.",
            'room': room
        })

@socketio.on('send_message')
def handle_send_message(data):
    room = data.get('room')
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content', '').strip()
    file_url = data.get('file_url') # FileDinhKemUrl (optional)
    
    if not room or not sender_id or (not content and not file_url):
        emit('error', {'message': 'Thông tin tin nhắn không hợp lệ'}, room=request.sid)
        return
        
    print(f"✉️ [SOCKETIO] New message in room {room} from User {sender_id}: {content[:30]}...")
    
    # 1. Sync & save message in PostgreSQL DB
    new_msg = TinNhan(
        PhongChatId=room,
        MaNguoiGui=sender_id,
        MaNguoiNhan=receiver_id,
        NoiDung=content,
        FileDinhKemUrl=file_url
    )
    db.session.add(new_msg)
    db.session.commit()
    
    # Build payload to emit to the room
    sender = NguoiDung.query.get(sender_id)
    sender_name = sender.HoTen if sender else f"User {sender_id}"
    
    msg_payload = {
        "message_id": new_msg.MaTinNhan,
        "room": room,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "receiver_id": receiver_id,
        "content": content,
        "file_url": file_url,
        "timestamp": new_msg.ThoiGianGui.isoformat()
    }
    
    # 2. Broadcast message instantly to all users in the WebSocket room
    emit('receive_message', msg_payload, room=room)
    
    # 3. Trigger Web Toast alert (SSE) & Push notifications for the recipient
    if receiver_id:
        trigger_notifications(
            event_type="new_chat_message",
            recipient_id=receiver_id,
            payload={
                "room": room,
                "sender_name": sender_name,
                "message": f"💬 Tin nhắn mới từ {sender_name}: {content[:50]}" if content else "💬 Đã gửi một hình ảnh đính kèm.",
                "updated_at": new_msg.ThoiGianGui.isoformat()
            }
        )

@socketio.on('typing')
def handle_typing(data):
    room = data.get('room')
    is_typing = data.get('is_typing', False)
    username = data.get('username', 'Ai đó')
    
    if room:
        emit('typing', {
            'room': room,
            'username': username,
            'is_typing': is_typing
        }, room=room, include_self=False)
