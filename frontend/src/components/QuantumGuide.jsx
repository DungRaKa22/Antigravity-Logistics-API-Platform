import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { TrackingService, ChatService } from '../services/api';

const DECISION_TREE = {
  welcome: {
    text: "Xin chào! 👋 Chào mừng bạn đến với **Antigravity Express** - Nền tảng Logistics API-First thế hệ mới.\n\nTôi là **Quantum Assistant**, trợ lý ảo của bạn. Tôi có thể giúp gì cho bạn hôm nay?",
    options: [
      { text: "🚀 Tìm hiểu về Antigravity Express", next: "intro" },
      { text: "💵 Làm sao tính thử cước vận chuyển?", next: "calculator" },
      { text: "🔍 Định vị & Tra cứu hành trình bưu gửi", next: "tracking" },
      { text: "📞 Trò chuyện với nhân viên CSKH trực tuyến", next: "cskh_handover" },
      { text: "🔑 Đăng ký tài khoản chủ shop", next: "register_guide" },
      { text: "💻 Tài liệu API tích hợp B2B", next: "b2b_api" }
    ],
    parent: null
  },
  intro: {
    text: "**Antigravity Express** là nền tảng logistics hiện đại, cung cấp dịch vụ giao nhận kết hợp bản đồ lộ trình số (OSRM) và đối soát tài chính COD tự động 100% cực kỳ nhanh chóng.\n\nHệ thống được thiết kế theo mô hình 3-Tier Architecture hiện đại với giao diện Dark-Neon độc đáo.",
    options: [
      { text: "🛸 Các gói dịch vụ vận chuyển gồm những gì?", next: "services" },
      { text: "💰 Cơ chế đối soát dòng tiền hoạt động sao?", next: "cod_reconciliation" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  },
  services: {
    text: "Chúng tôi cung cấp 2 gói cước chuyên chở tối ưu:\n\n1. ⚡ **Gói EXPRESS (Hỏa tốc)**: Chuyên chở nội đô siêu tốc bằng đội xe điện tự hành **EV-Van Quantum**.\n2. 📦 **Gói STANDARD (Tiêu chuẩn)**: Vận chuyển tiết kiệm chặng dài bằng mạng lưới **Cargo Drone** chở bưu kiện tự động vượt mọi địa hình.",
    options: [
      { text: "💵 Xem cách tính cước tự động", next: "calculator" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "intro"
  },
  cod_reconciliation: {
    text: "Quy trình đối soát COD diễn ra tự động:\n\n- Đơn hàng giao `Thành công` ➡️ Hệ thống tạo sao kê ghi nhận tức thì.\n- Số thực nhận tự động khấu trừ: `COD - Phí ship - Phí bảo hiểm`.\n- Định kỳ, hệ thống gom sao kê thành **Hóa đơn đối soát** (`HoaDonDoiSoat`).\n- Admin chỉ cần duyệt chi ➡️ Tiền tự động giải ngân về tài khoản ngân hàng của bạn.",
    options: [
      { text: "🔑 Đăng ký tài khoản để trải nghiệm", next: "register_guide" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "intro"
  },
  calculator: {
    text: "Bạn có thể tính thử cước phí ngay tại **Trang chủ** qua bộ tính cước thông minh:\n\n1. Điền địa chỉ gửi/nhận ➡️ API tự động đo đạc khoảng cách thực tế bằng **OSRM**.\n2. Điền kích thước (D x R x C) ➡️ Quy đổi thể tích tự động: `(D x R x C) / 5000` gram.\n3. Trọng lượng tính cước bằng giá trị lớn nhất giữa khối lượng thực tế và khối lượng thể tích.\n4. Điền giá trị khai báo hàng hóa để tự tính phí bảo hiểm 0.5% cước phí.",
    options: [
      { text: "🔍 Tìm hiểu cách tra cứu bưu gửi", next: "tracking" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  },
  tracking: {
    text: "Công nghệ **Hero Tracking** giúp bạn định vị bưu gửi thời gian thực.\n\nVui lòng **nhập mã bưu phẩm (ví dụ: AG-10001)** vào ô tra cứu trực tiếp bên dưới cửa sổ chat này để truy vấn hành trình.",
    options: [
      { text: "📞 Yêu cầu nhân viên CSKH hỗ trợ đơn này", next: "cskh_handover" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  },
  cskh_handover: {
    text: "Bộ phận CSKH của Antigravity Express sẵn sàng lắng nghe bạn trực tiếp thông qua kênh chat mã hóa thời gian thực.\n\nNhân viên hỗ trợ sẽ tiếp nhận và phản hồi ngay lập tức tại màn hình tổng đài.",
    options: [
      { text: "🤝 Bắt đầu kết nối trò chuyện trực tiếp", next: "cskh_connect" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  },
  cskh_connect: {
    text: "Đang kiểm tra thông tin tài khoản và kết nối của bạn...",
    options: [
      { text: "⬅️ Hủy bỏ kết nối & Quay lại", next: "welcome" }
    ],
    parent: "cskh_handover"
  },
  register_guide: {
    text: "Để tham gia cùng cộng đồng chủ shop Antigravity:\n\n1. Nhấp nút **Đăng ký** tại thanh công cụ trên cùng.\n2. Khởi tạo tài khoản với vai trò **Chủ Cửa Hàng (Merchant)**.\n3. Sau khi đăng nhập, bạn có thể thiết lập sổ địa chỉ mặc định đầu tiên để tự động chọn làm kho gửi, in tem nhãn in nhiệt A6 SPX/GHN tự động và đối soát rút tiền bất kỳ lúc nào.",
    options: [
      { text: "💻 Tìm hiểu cách kết nối B2B API", next: "b2b_api" },
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  },
  b2b_api: {
    text: "Dành cho các nhà phát triển và đối tác lớn:\n\n1. Liên hệ Quản trị viên để nhận **API Key bảo mật 64 ký tự** dạng `AG_PARTNER_...`.\n2. Tích hợp đẩy đơn hàng loạt trực tiếp thông qua API với Header `X-API-Key` mà không cần duy trì token JWT hết hạn.\n3. Mọi Endpoint và dữ liệu phản hồi được mô tả chi tiết trong tài liệu RESTful API.",
    options: [
      { text: "⬅️ Quay lại danh mục chính", next: "welcome" }
    ],
    parent: "welcome"
  }
};


export default function QuantumGuide() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState('welcome');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: DECISION_TREE.welcome.text, timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Custom states for Live tracking & CSKH handover
  const [trackingCode, setTrackingCode] = useState('');
  const [handoverOrderId, setHandoverOrderId] = useState('');
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [liveChatRoom, setLiveChatRoom] = useState('');
  const [chatInputText, setChatInputText] = useState('');

  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Socket.io integration for human CSKH handover
  useEffect(() => {
    if (isLiveChat && liveChatRoom) {
      const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.hostname}`;
      const socket = io(socketUrl, { autoConnect: true });
      socketRef.current = socket;

      socket.emit('join_room', {
        room: liveChatRoom,
        username: user?.fullname || 'Khách Vãng Lai'
      });

      socket.on('receive_message', (payload) => {
        if (payload.room === liveChatRoom) {
          // Push CSKH message to bot message list!
          const isCurrentUser = payload.sender_id === (user?.id || 999999);
          if (!isCurrentUser) {
            setMessages(prev => [...prev, {
              sender: 'bot',
              text: `👩‍💼 **[CSKH]**: ${payload.message}`,
              timestamp: new Date()
            }]);
          }
        }
      });

      // Load historical chat history
      const fetchHistory = async () => {
        try {
          const res = await ChatService.getHistory(liveChatRoom);
          if (res.success && res.data.length > 0) {
            const formattedHistory = res.data.map(m => ({
              sender: m.sender_id === (user?.id || 999999) ? 'user' : 'bot',
              text: m.sender_id === (user?.id || 999999) ? m.content : `👩‍💼 **[CSKH]**: ${m.content}`,
              timestamp: new Date(m.timestamp)
            }));
            setMessages(prev => [...prev, ...formattedHistory]);
          }
        } catch (err) {
          console.error("Error loading chat history:", err);
        }
      };
      
      fetchHistory();

      return () => {
        socket.emit('leave_room', { room: liveChatRoom, username: user?.fullname || 'Khách Vãng Lai' });
        socket.disconnect();
      };
    }
  }, [isLiveChat, liveChatRoom]);

  // Auto-scroll chat area to bottom when messages or typing change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleLiveTrackingSearch = async (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    const searchedCode = trackingCode.trim();
    setTrackingCode('');
    setIsTyping(true);
    
    setMessages(prev => [...prev, {
      sender: 'user',
      text: `🔍 Tra cứu mã đơn hàng: **${searchedCode}**`,
      timestamp: new Date()
    }]);

    try {
      const res = await TrackingService.trackOrder(searchedCode);
      setIsTyping(false);
      if (res.success && res.data) {
        setHandoverOrderId(res.data.order_id);
        
        let timelineText = `📦 **KẾT QUẢ ĐỊNH VỊ VẬN ĐƠN: #${res.data.order_id}**\n\n`;
        timelineText += `🔹 **Trạng thái**: ${res.data.current_status}\n`;
        timelineText += `🔹 **Gói dịch vụ**: ${res.data.service_package}\n`;
        timelineText += `🔹 **Người gửi**: ${res.data.sender_name}\n`;
        timelineText += `🔹 **Người nhận**: ${res.data.receiver_name} (${res.data.receiver_address})\n\n`;
        
        if (res.data.timeline && res.data.timeline.length > 0) {
          timelineText += `📍 **Hành trình chi tiết:**\n`;
          res.data.timeline.forEach((step, idx) => {
            const timeStr = new Date(step.time).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            timelineText += `${idx === 0 ? '🟢' : '⚪'} **[${timeStr}]** ${step.info}\n`;
          });
        } else {
          timelineText += `⚠️ Chưa ghi nhận lịch trình bưu tá cho đơn hàng này.`;
        }

        setMessages(prev => [...prev, {
          sender: 'bot',
          text: timelineText,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `❌ Không tìm thấy thông tin cho mã vận đơn **${searchedCode}**. Vui lòng kiểm tra lại.`,
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `❌ Không tìm thấy bưu gửi **${searchedCode}** trong cơ sở dữ liệu. Vui lòng nhập mã bưu phẩm hợp lệ (ví dụ: AG-10001).`,
        timestamp: new Date()
      }]);
    }
  };

  const handleConnectLiveCSKH = async (orderId) => {
    setIsTyping(true);
    setMessages(prev => [...prev, {
      sender: 'user',
      text: `Kết nối CSKH cho đơn hàng: **${orderId.trim()}**`,
      timestamp: new Date()
    }]);

    try {
      await ChatService.createComplaint({
        order_id: orderId.trim(),
        title: `Hỗ trợ qua Quantum Guide`,
        content: `Khách hàng yêu cầu hỗ trợ trực tiếp qua chatbot Quantum Guide.`
      });
    } catch (err) {
      console.log("Ticket might already exist, joining room directly.");
    }
    
    setIsTyping(false);
    setLiveChatRoom(orderId.trim());
    setIsLiveChat(true);
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: `🟢 **ĐÃ KẾT NỐI TỔNG ĐÀI VIÊN CSKH!**\n\nYêu cầu hỗ trợ đơn hàng **#${orderId.trim()}** đã được tiếp nhận. Tổng đài viên đang phản hồi bạn trực tiếp.`,
      timestamp: new Date()
    }]);
  };

  const handleSendLiveMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !socketRef.current || !liveChatRoom) return;

    const senderId = user?.id || 999999;
    const senderName = user?.fullname || 'Khách CSKH';
    const msgText = chatInputText.trim();
    
    setChatInputText('');

    socketRef.current.emit('send_message', {
      room: liveChatRoom,
      sender_id: senderId,
      sender_name: senderName,
      content: msgText
    });

    setMessages(prev => [...prev, {
      sender: 'user',
      text: msgText,
      timestamp: new Date()
    }]);
  };

  const handleOptionClick = (option) => {
    if (isTyping) return;

    const userMsg = { sender: 'user', text: option.text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const nextKey = option.next;

    if (nextKey === 'cskh_connect') {
      if (!user) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: `⚠️ **Yêu cầu đăng nhập:**\n\nBạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Chủ Shop (Merchant) để kết nối trực tuyến với tổng đài viên CSKH.`,
            timestamp: new Date()
          }]);
          setCurrentNode('welcome');
        }, 800);
        return;
      }

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (handoverOrderId) {
          handleConnectLiveCSKH(handoverOrderId);
        } else {
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: `📝 **Nhập mã đơn hàng cần hỗ trợ:**\n\nVui lòng nhập mã bưu phẩm (ví dụ: **AG-10001**) bạn muốn khiếu nại vào ô chat bên dưới:`,
            timestamp: new Date()
          }]);
          setCurrentNode('cskh_connect');
        }
      }, 800);
      return;
    }

    const targetNode = DECISION_TREE[nextKey];
    if (!targetNode) return;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentNode(nextKey);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: targetNode.text,
        timestamp: new Date()
      }]);
    }, 850);
  };

  const handleRestart = () => {
    setIsTyping(false);
    setIsLiveChat(false);
    setLiveChatRoom('');
    setHandoverOrderId('');
    setCurrentNode('welcome');
    setMessages([
      { sender: 'bot', text: DECISION_TREE.welcome.text, timestamp: new Date() }
    ]);
  };

  const handleBack = () => {
    if (isLiveChat) {
      handleRestart();
      return;
    }
    const parentNode = DECISION_TREE[currentNode]?.parent;
    if (parentNode && DECISION_TREE[parentNode]) {
      const parentData = DECISION_TREE[parentNode];
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setCurrentNode(parentNode);
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `🔄 Trở lại chặng trước đó.\n\n${parentData.text}`,
          timestamp: new Date()
        }]);
      }, 500);
    }
  };


  // Helper to parse double bold markers and newlines in message formatting
  const renderMessageText = (text) => {
    return text.split('\n').map((line, lIdx) => {
      // Regex replace for double asterisks **bold**
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={lIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[14px]'}>
          {parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-extrabold text-white text-glow-purple">{part}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const currentNodeData = DECISION_TREE[currentNode] || DECISION_TREE.welcome;
  const showBackButton = currentNodeData.parent !== null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end select-none">
      
      {/* CHAT WIDGET CONTAINER */}
      {isOpen && (
        <div className="w-[360px] h-[520px] rounded-[28px] bg-[#090314]/92 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden mb-4 animate-slide-in relative z-10 transition-all duration-300">
          
          {/* Subtle horizontal glow bar at the top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5E0ED7] to-transparent shadow-[0_1px_10px_#5E0ED7]"></div>

          {/* CHAT HEADER */}
          <header className="px-5 py-4 border-b border-white/5 bg-[#120626]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Animated Glowing AI Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#1e0a3d] border border-[#5E0ED7]/40 flex items-center justify-center shadow-[0_0_12px_rgba(94,14,215,0.25)]">
                  <span className="material-symbols-outlined text-accent-purple text-glow-purple text-lg animate-pulse">hub</span>
                </div>
                {/* Active Indicator green dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090314] shadow-[0_0_8px_#10b981] animate-pulse"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-wider font-display">Quantum Guide</span>
                <span className="text-[9px] font-bold text-mute uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  Trực tuyến
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Back button */}
              {showBackButton && (
                <button 
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-white/5 text-[#afafaf] hover:text-white transition-colors cursor-pointer"
                  title="Quay lại"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              )}
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/5 text-[#afafaf] hover:text-white transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </header>

          {/* CHAT MESSAGES SCROLL AREA */}
          <main 
            ref={scrollRef}
            className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-[#090314]/50 to-[#0e051e]/30"
          >
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`
                    max-w-[82%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-sm
                    ${isUser 
                      ? 'bg-accent-purple text-white rounded-tr-none shadow-[0_4px_12px_rgba(94,14,215,0.18)]' 
                      : 'bg-[#150d2a]/55 border border-white/5 text-white/95 rounded-tl-none leading-relaxed'
                    }
                  `}>
                    {isUser ? <p>{msg.text}</p> : renderMessageText(msg.text)}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-[#150d2a]/55 border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </main>

          {/* OPTIONS / INPUTS PANEL */}
          <section className="px-5 py-3.5 border-t border-white/5 bg-[#090314]/95 shrink-0 flex flex-col gap-2">
            {isLiveChat ? (
              <form onSubmit={handleSendLiveMessage} className="flex gap-2 w-full">
                <input 
                  type="text" 
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  className="flex-1 px-4 py-2 border border-white/10 bg-white/5 rounded-full text-xs text-white focus:outline-none focus:border-accent-purple"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-accent-purple text-white text-[10px] font-black tracking-wider uppercase rounded-full hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  GỬI
                </button>
              </form>
            ) : currentNode === 'tracking' ? (
              <form onSubmit={handleLiveTrackingSearch} className="flex gap-2 w-full">
                <input 
                  type="text" 
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Nhập mã vận đơn (vd: AG-10001)..."
                  className="flex-1 px-4 py-2 border border-white/10 bg-white/5 rounded-full text-xs text-white focus:outline-none focus:border-accent-purple font-mono"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-accent-purple text-white text-[10px] font-black tracking-wider uppercase rounded-full hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  TÌM
                </button>
              </form>
            ) : currentNode === 'cskh_connect' ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!trackingCode.trim()) return;
                  handleConnectLiveCSKH(trackingCode);
                  setTrackingCode('');
                }} 
                className="flex gap-2 w-full"
              >
                <input 
                  type="text" 
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Nhập mã đơn để chat..."
                  className="flex-1 px-4 py-2 border border-white/10 bg-white/5 rounded-full text-xs text-white focus:outline-none focus:border-accent-purple font-mono"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase rounded-full hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  CHAT
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                {!isTyping && currentNodeData.options && (
                  currentNodeData.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(opt)}
                      className="w-full text-left px-4 py-2 border border-[#5E0ED7]/35 bg-[#120626]/50 hover:bg-[#5E0ED7] text-white hover:text-white rounded-full text-[10.5px] font-extrabold uppercase tracking-wide transition-all duration-300 shadow-sm hover:shadow-[0_0_12px_rgba(94,14,215,0.3)] cursor-pointer"
                    >
                      {opt.text}
                    </button>
                  ))
                )}
              </div>
            )}
          </section>

          {/* CHAT FOOTER & RESTART */}
          <footer className="px-5 py-2.5 border-t border-white/5 bg-[#120626]/50 flex justify-center shrink-0">
            <button 
              onClick={handleRestart}
              className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-mute hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs animate-spin-hover">restart_alt</span>
              Restart Conversation
            </button>
          </footer>

        </div>
      )}

      {/* FLOATING ACTION TRIGGER BUBBLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-15 h-15 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative z-10
          ${isOpen 
            ? 'bg-rose-600/90 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105' 
            : 'bg-[#0d061c]/90 border border-[#5E0ED7]/50 shadow-[0_0_25px_rgba(94,14,215,0.45)] hover:shadow-[0_0_35px_rgba(94,14,215,0.65)] hover:scale-105 hover:-translate-y-0.5'
          }
        `}
        title="Trợ lý Quantum Guide"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-white text-[28px] animate-fadeIn">close</span>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Pulsing glow ring around avatar inside */}
            <span className="absolute -inset-2 rounded-full border border-accent-purple/35 animate-ping opacity-45"></span>
            <span className="material-symbols-outlined text-white text-[28px] text-glow-purple">support_agent</span>
            
            {/* Notification alert red/purple badge dot */}
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-[#5E0ED7] border-2 border-[#0d061c] rounded-full shadow-[0_0_6px_#5e0ed7]"></span>
          </div>
        )}
      </button>

    </div>
  );
}
