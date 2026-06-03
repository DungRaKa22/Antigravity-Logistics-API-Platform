import React, { useState } from 'react';
import { Package, Zap, ShieldCheck, ArrowRight, Code, Star, RefreshCw, BarChart3, HelpCircle, ChevronDown, Monitor, Cpu, Send, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Import AI-generated logistics assets
import smartWarehouseImg from '../assets/images/smart_warehouse.png';
import futuristicDeliveryVanImg from '../assets/images/futuristic_delivery_van.png';
import deliveryDroneImg from '../assets/images/delivery_drone.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Calculator states
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [weight, setWeight] = useState(1000);
  const [feeResult, setFeeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Volumetric Package Visualizer states
  const [selectedPkg, setSelectedPkg] = useState('medium'); // document | medium | heavy | custom
  const [customL, setCustomL] = useState(35);
  const [customW, setCustomW] = useState(25);
  const [customH, setCustomH] = useState(20);

  const handleSelectPkgType = (type) => {
    setSelectedPkg(type);
    if (type === 'document') {
      setCustomL(25);
      setCustomW(15);
      setCustomH(1);
    } else if (type === 'medium') {
      setCustomL(35);
      setCustomW(25);
      setCustomH(20);
    } else if (type === 'heavy') {
      setCustomL(60);
      setCustomW(50);
      setCustomH(40);
    }
  };

  const resolvedL = selectedPkg === 'custom' ? customL : (selectedPkg === 'document' ? 25 : (selectedPkg === 'medium' ? 35 : 60));
  const resolvedW = selectedPkg === 'custom' ? customW : (selectedPkg === 'document' ? 15 : (selectedPkg === 'medium' ? 25 : 50));
  const resolvedH = selectedPkg === 'custom' ? customH : (selectedPkg === 'document' ? 1 : (selectedPkg === 'medium' ? 20 : 40));
  const volumetricWeight = (resolvedL * resolvedW * resolvedH) / 5000;
  const estimatedFee = Math.max(15000, Math.round(15000 + (volumetricWeight * 6000)));

  const boxStyles = {
    '--w-3d': `${Math.min(180, Math.max(45, resolvedL * 2.8))}px`,
    '--h-3d': `${Math.min(180, Math.max(8, resolvedH * 2.8))}px`,
    '--d-3d': `${Math.min(180, Math.max(45, resolvedW * 2.8))}px`,
  };

  // API Sandbox states
  const [activeApiTab, setActiveApiTab] = useState('create'); // create | track | webhook

  // FAQ Accordion states
  const [openFaq, setOpenFaq] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    
    setIsLoading(true);
    setFeeResult(null);
    try {
      const response = await OrderService.calculateFee(pickup, dropoff, weight);
      if (response.success) {
         setFeeResult(response.data.shipping_fee);
      }
    } catch (error) {
      alert("Lỗi khi tính cước. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Volumetric Specs data
  const packageSpecs = {
    document: {
      title: "Phong bì Tài liệu",
      weight: "Dưới 500g",
      dim: "25 x 15 x 1 cm",
      volumetric: "0.07 kg",
      price: "15.000đ",
      desc: "Thích hợp gửi thư từ, văn bản, hợp đồng quan trọng. Lộ trình tối ưu đường bay hỏa tốc chặng ngắn.",
      color: "from-cyan-500/20 to-blue-500/10",
      glow: "border-cyan-400/30"
    },
    medium: {
      title: "Hộp hàng Tiêu chuẩn",
      weight: "Dưới 5kg",
      dim: "35 x 25 x 20 cm",
      volumetric: "3.50 kg",
      price: "28.000đ",
      desc: "Thích hợp cho quần áo, giày dép, phụ kiện số. Quy đổi thể tích chuẩn hóa, hạn chế bóp méo hàng.",
      color: "from-accent-purple/20 to-purple-500/10",
      glow: "border-purple-500/35"
    },
    heavy: {
      title: "Kiện hàng Cồng kềnh",
      weight: "Dưới 30kg",
      dim: "60 x 50 x 40 cm",
      volumetric: "24.00 kg",
      price: "Thương lượng",
      desc: "Thích hợp cho hàng gia dụng cỡ lớn, linh kiện máy móc B2B. Hỗ trợ bốc xếp và xe nâng chuyên dụng.",
      color: "from-amber-500/20 to-orange-500/10",
      glow: "border-amber-400/30"
    }
  };

  // API terminal code mocks
  const apiTerminalData = {
    create: {
      endpoint: "POST /api/order/create",
      request: `{
  "sender_address": "Cầu Giấy, Hà Nội",
  "service_package_id": 2,
  "pickup_type": "NHANVIEN_DEN_LAY",
  "receivers": [
    {
      "receiver_name": "Nguyễn Văn B",
      "receiver_phone": "0987654321",
      "receiver_address": "Quận 1, TP.HCM",
      "weight_gram": 1500,
      "cod_amount": 500000
    }
  ]
}`,
      response: `{
  "success": true,
  "message": "Vận đơn khởi tạo thành công",
  "data": {
    "order_id": "AG-882947",
    "shipping_fee": 28000,
    "insurance_fee": 2000,
    "estimated_delivery": "2026-05-26T18:00:00"
  }
}`
    },
    track: {
      endpoint: "GET /api/tracking/AG-882947",
      request: `No payload required for GET query.
Query Parameters:
- code: "AG-882947"`,
      response: `{
  "success": true,
  "order_id": "AG-882947",
  "current_status": "DANG_VAN_CHUYEN",
  "last_checkpoint": "Bưu cục trung chuyển Miền Trung",
  "estimated_arrival": "Còn 12 giờ",
  "telemetry": {
    "latitude": 16.0544,
    "longitude": 108.2022,
    "velocity_kmh": 64.5
  }
}`
    },
    webhook: {
      endpoint: "Webhook Event: ORDER_STATUS_UPDATED",
      request: `Payload sent to your registered Webhook URL:`,
      response: `{
  "event": "order.status_updated",
  "timestamp": 1779637500,
  "data": {
    "order_id": "AG-882947",
    "old_status": "DA_LAY_HANG",
    "new_status": "DANG_VAN_CHUYEN",
    "checkpoint_info": "Xe van tự hành VN-8829 đang di chuyển",
    "system_ping_ms": 14
  }
}`
    }
  };

  // Partner logo names for infinite scroll marquee
  const partners = ["Shopee Mall", "Lazada Plus", "TikTok Shop", "Sendo B2B", "TechSmart", "SweetBakes", "ViettelPay", "MoMo Tech", "Giaohangnhanh", "VNPost Core"];

  return (
    <div className="bg-canvas flex flex-col min-h-screen text-black relative overflow-hidden font-sans">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes clip-reveal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-clip-1 {
          animation: clip-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-clip-2 {
          animation: clip-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
        }
        .animate-clip-3 {
          animation: clip-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `}</style>

      {/* Background Loop Video (Original Colors with Premium Overlay) */}
      <div className="absolute top-0 left-0 w-full h-[95vh] z-0 pointer-events-none overflow-hidden border-b border-black/5">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        >
          <source 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4" 
            type="video/mp4" 
          />
        </video>
        {/* Overlay Blur Glass Canvas */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] bg-gradient-to-b from-white/10 via-transparent to-canvas"></div>
        
        {/* Advanced Neon Aurora Background Blobs */}
        <div className="neon-aurora-blob bg-accent-purple/5 w-[650px] h-[650px] -top-20 -left-20 animate-pulse"></div>
        <div className="neon-aurora-blob bg-cyan-500/5 w-[550px] h-[550px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 lg:px-24 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Stacked Brand Typography */}
        <div className="flex-1 flex flex-col gap-8 justify-center select-none text-left w-full">
          <div className="flex flex-col">
            <div className="overflow-hidden h-[45px] md:h-[65px] lg:h-[80px]">
              <h1 className="text-black font-extrabold tracking-widest uppercase font-display leading-[0.9] animate-clip-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
                Zero
              </h1>
            </div>
            <div className="overflow-hidden h-[45px] md:h-[65px] lg:h-[80px]">
              <h1 className="text-black font-extrabold tracking-widest uppercase font-display leading-[0.9] animate-clip-2" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
                Gravity
              </h1>
            </div>
            <div className="overflow-hidden h-[50px] md:h-[70px] lg:h-[85px]">
              <h1 className="text-accent-purple text-glow-purple font-extrabold tracking-widest uppercase font-display leading-[0.9] animate-clip-3" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
                Flows
              </h1>
            </div>
          </div>

          <div className="text-xs uppercase tracking-widest text-black/70 font-bold space-y-1.5 border-l-2 border-accent-purple pl-4">
            <div className="flex items-center gap-1.5 text-glow-purple">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-purple"></span>
              </span>
              <span>SAT-NET CONNECTION ESTABLISHED</span>
            </div>
            <div>SHAPING AUTOMATED LOGISTICS</div>
            <div>FOR GLOBAL TECHNOLOGY PARTNERS</div>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              onClick={() => navigate('/create-order')} 
              className="btn-primary px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group hover:scale-[1.03] transition-all bg-gradient-to-r from-accent-purple to-cyan-500 shadow-[0_4px_20px_rgba(94,14,215,0.22)] border-none"
            >
              GỬI HÀNG CÁ NHÂN ⚡
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="bg-white/80 backdrop-blur-md text-black border border-black/10 rounded-full hover:bg-white hover:border-accent-purple/30 active:scale-95 px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
            >
              HỢP TÁC SHOP (B2B)
            </button>
            <button 
              onClick={() => navigate('/tracking')} 
              className="bg-white/80 backdrop-blur-md text-black border border-black/10 rounded-full hover:bg-white hover:border-accent-purple/30 active:scale-95 px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
            >
              TRA CỨU VẬN ĐƠN
            </button>
          </div>
        </div>

        {/* Right Column: Premium Double-Pane Rate Calculator */}
        <div className="flex-1 w-full flex flex-col gap-10">
          
          <div className="w-full max-w-2xl animate-slide-up-card relative mx-auto lg:mx-0 z-10">
            <div className="bg-white/70 backdrop-blur-2xl border border-black/10 rounded-[32px] shadow-[0_15px_50px_rgba(0,0,0,0.05)] p-6 md:p-8 flex flex-col md:flex-row gap-6 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-purple to-cyan-500 rounded-t-[32px]"></div>
              
              {/* Left Pane: Calculator Form */}
              <div className="flex-1 space-y-4">
                <h2 className="text-xs font-black text-black uppercase tracking-widest font-display text-glow-purple flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">calculate</span>
                  <span>TÍNH PHÍ VẬN CHUYỂN</span>
                </h2>
                <form onSubmit={handleSearch} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-mute">Điểm Lấy Hàng</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-purple-600 text-xs absolute left-3 select-none">my_location</span>
                      <input 
                        type="text" 
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="Ví dụ: Cầu Giấy, Hà Nội" 
                        className="bg-white/50 text-black border border-black/10 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all text-xs font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-mute">Điểm Giao Hàng</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-cyan-600 text-xs absolute left-3 select-none">location_on</span>
                      <input 
                        type="text" 
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        placeholder="Ví dụ: Quận 1, TP.HCM" 
                        className="bg-white/50 text-black border border-black/10 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all text-xs font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-mute">Trọng lượng (gram)</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-purple-600 text-xs absolute left-3 select-none">weight</span>
                      <input 
                        type="number" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ví dụ: 1000" 
                        className="bg-white/50 text-black border border-black/10 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all text-xs font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest font-black disabled:opacity-50 mt-1"
                  >
                    {isLoading ? "ĐANG TÍNH..." : "TRA CỨU CƯỚC PHÍ"}
                  </button>
                </form>
              </div>

              {/* Right Pane: Visual Outputs & SLA Mock Charts */}
              <div className="w-full md:w-[45%] flex flex-col justify-between bg-black/[0.02] border border-black/5 p-4.5 rounded-2xl shadow-inner min-h-[220px]">
                {feeResult !== null ? (
                  <div className="space-y-4 flex flex-col justify-between h-full">
                    <div>
                      <p className="text-[9px] text-mute uppercase tracking-widest font-black">ƯỚC TÍNH CƯỚC GỬI:</p>
                      <h3 className="text-2xl font-black text-[#5E0ED7] text-glow font-display mt-0.5">
                        {feeResult.toLocaleString()} VND
                      </h3>
                      <p className="text-[8px] text-mute font-bold uppercase mt-1 leading-normal">
                        *Chưa bao gồm phụ phí bảo hiểm và VAT hàng hóa.
                      </p>
                    </div>

                    {/* Miniature Neo Price Bars represent Service Tiers */}
                    <div className="space-y-2 border-t border-black/5 pt-3">
                      <div>
                        <div className="flex justify-between text-[8px] font-black uppercase text-mute mb-1">
                          <span>TIÊU CHUẨN (2-3 ngày)</span>
                          <span className="text-black">{feeResult.toLocaleString()} đ</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[8px] font-black uppercase text-mute mb-1">
                          <span>HỎA TỐC (2-4 giờ)</span>
                          <span className="text-purple-600">{(feeResult * 1.8).toLocaleString()} đ</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-purple to-pink-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Create Order Prompt for Individual Customers */}
                    <div className="mt-3 p-3.5 bg-accent-purple/5 border border-accent-purple/15 rounded-2xl flex flex-col gap-2 shadow-sm animate-fade-in">
                      <p className="text-[9px] font-black text-black tracking-wider leading-normal uppercase">
                        ✨ BẠN CÓ MUỐN TẠO VẬN ĐƠN NÀY KHÔNG?
                      </p>
                      <button
                        onClick={() => navigate('/create-order', { 
                          state: { 
                            pickup, 
                            dropoff, 
                            weight: weight || '1000' 
                          } 
                        })}
                        className="btn-primary w-full py-2.5 text-[9px] font-black uppercase tracking-widest shadow-[0_4px_12px_rgba(94,14,215,0.2)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        TẠO ĐƠN HÀNG NGAY
                        <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full gap-3 py-6">
                    <div className="w-10 h-10 rounded-full bg-purple-600/5 border border-purple-500/10 flex items-center justify-center shadow-inner animate-pulse">
                      <span className="material-symbols-outlined text-purple-600 text-lg">radar</span>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-black">Mạng Lưới Vệ Tinh Sẵn Sàng</h4>
                      <p className="text-[9px] text-mute leading-relaxed mt-1 max-w-[160px] mx-auto font-semibold">
                        Hãy nhập đầy đủ lộ trình để mô phỏng biểu phí cước chặng đi thời gian thực.
                      </p>
                      <button
                        onClick={() => navigate('/create-order')}
                        className="mt-3 px-4.5 py-2 bg-[#5E0ED7] hover:bg-[#4c0abd] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_2px_10px_rgba(94,14,215,0.2)] cursor-pointer inline-flex items-center gap-1 border-none"
                      >
                        GỬI HÀNG CÁ NHÂN NGAY
                        <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Performance Stats Block - Horizontally Aligned */}
          <div className="animate-slide-up-stats grid grid-cols-3 gap-4 lg:gap-8 border-t border-black/10 pt-8 max-w-md w-full">
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-black tracking-tight uppercase font-display text-glow">
                <span className="text-accent-purple">+</span>150K
              </div>
              <div className="text-[9px] tracking-widest text-mute uppercase font-black mt-1">DELIVERED FLOWS</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-black tracking-tight uppercase font-display text-glow">
                99.9<span className="text-accent-purple">%</span>
              </div>
              <div className="text-[9px] tracking-widest text-mute uppercase font-black mt-1">ON-TIME PRECISION</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-black tracking-tight uppercase font-display text-glow">
                <span className="text-accent-purple">+</span>500
              </div>
              <div className="text-[9px] tracking-widest text-mute uppercase font-black mt-1">ACTIVE PARTNERS</div>
            </div>
          </div>

        </div>
      </section>

      {/* Infinite Partners Marquee Slider */}
      <section className="w-full py-6 border-y border-black/5 bg-black/[0.01] relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-canvas to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-canvas to-transparent z-20 pointer-events-none"></div>
          
          <div className="animate-marquee-scroll flex gap-12 text-black/40 font-display font-extrabold text-xs uppercase tracking-widest shrink-0 py-1">
            {partners.concat(partners).map((partner, idx) => (
              <span key={idx} className="hover:text-purple-600 transition-colors cursor-default select-none">{partner}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Capabilities & Interactive Showcase */}
      <section className="relative z-10 bg-canvas-soft py-24 px-6 lg:px-24 border-b border-black/10">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center">
            <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow mb-2">Capabilities Deck</span>
            <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Mạng Lưới Vận Hành Công Nghệ Cao</h3>
          </div>

          {/* 3-Column Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 (Large - Col Span 2, Row Span 2): Distribution Hub with Smart Warehouse Image background */}
            <div className="col-span-1 md:col-span-2 rounded-[28px] border border-black/10 overflow-hidden relative min-h-[340px] group shadow-sm bg-black flex flex-col justify-end p-8 hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-500">
              {/* Warehouse photo layer */}
              <img 
                src={smartWarehouseImg} 
                alt="Automated Robotics Smart Warehouse Fulfillment" 
                className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity filter contrast-125 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e071e] via-[#0e071e]/70 to-transparent z-0"></div>
              
              {/* Interactive Vector Route Map Overlay */}
              <div className="absolute top-6 right-6 opacity-30 group-hover:opacity-65 transition-opacity duration-500 pointer-events-none select-none z-10 w-[200px] h-[120px]">
                <svg viewBox="0 0 200 120" className="w-full h-full" fill="none">
                  {/* Nodes */}
                  <circle cx="30" cy="80" r="4" fill="#00F2FE" />
                  <circle cx="100" cy="30" r="4" fill="#5E0ED7" />
                  <circle cx="170" cy="70" r="4" fill="#00F2FE" />
                  {/* Connected routes */}
                  <path d="M30 80Q60 40 100 30" stroke="#00F2FE" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M100 30Q140 40 170 70" stroke="#5E0ED7" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M30 80Q100 90 170 70" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 3" />
                  {/* Pulsing signal pin */}
                  <circle cx="100" cy="30" r="10" stroke="#5E0ED7" strokeWidth="1" className="animate-ping" />
                </svg>
              </div>

              {/* Text content card */}
              <div className="relative z-10 space-y-3">
                <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/25 tracking-widest uppercase inline-block">NEAREST-NEIGHBOR V2.4</span>
                <h4 className="text-base font-black text-white uppercase tracking-widest font-display">Hệ Thống Phân Phối Tối Ưu Tự Động</h4>
                <p className="text-xs text-white/60 leading-relaxed font-semibold max-w-lg">
                  Thuật toán định tuyến nâng cấp tự động quy hoạch bưu gửi qua các hub bưu cục chuyển tiếp gần nhất. Giảm thiểu 35% hao phí vận chuyển chặng đi liên tỉnh.
                </p>
              </div>
            </div>

            {/* Bento Card 2: Satellite Scanner */}
            <div className="rounded-[28px] border border-black/10 bg-white/70 backdrop-blur-md overflow-hidden p-8 flex flex-col justify-between min-h-[340px] group shadow-sm hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-500 relative">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/5 border border-purple-500/10 flex items-center justify-center shadow-inner group-hover:shadow-[0_4px_15px_rgba(94,14,215,0.15)] group-hover:bg-purple-600/10 transition-all duration-300">
                  <span className="material-symbols-outlined text-purple-600 text-xl group-hover:scale-110 transition-transform">radar</span>
                </div>
                <h4 className="text-sm font-black text-black uppercase tracking-widest font-display">Vị Trí Vệ Tinh Lộ Trình</h4>
                <p className="text-xs text-mute leading-relaxed font-semibold">
                  Tải dữ liệu tọa độ vệ tinh A6 liên tục 15 giây/lần. Theo dõi đường đi bưu gửi trực quan trên bản đồ nhiệt thời gian thực.
                </p>
              </div>

              {/* Mini radar sweep graphic */}
              <div className="w-full h-16 border border-black/5 bg-black/[0.01] rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner mt-4">
                <div className="absolute w-[200px] h-[200px] rounded-full border border-purple-500/15 animate-ping"></div>
                <div className="absolute w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                <span className="text-[8px] font-mono text-purple-600 font-extrabold uppercase absolute bottom-2 tracking-widest animate-pulse">Pinging Sat-2...</span>
              </div>
            </div>

            {/* Bento Card 3: Shield Insurance */}
            <div className="rounded-[28px] border border-black/10 bg-white/70 backdrop-blur-md overflow-hidden p-8 flex flex-col justify-between min-h-[340px] group shadow-sm hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-500 relative">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shadow-inner group-hover:shadow-[0_4px_15px_rgba(16,185,129,0.15)] group-hover:bg-emerald-500/10 transition-all duration-300">
                  <span className="material-symbols-outlined text-emerald-600 text-xl group-hover:rotate-12 transition-transform">shield</span>
                </div>
                <h4 className="text-sm font-black text-black uppercase tracking-widest font-display">Bảo Hiểm Tuyệt Đối 100%</h4>
                <p className="text-xs text-mute leading-relaxed font-semibold">
                  Cam kết bảo vệ rủi ro ký gửi toàn chặng. Hỗ trợ đền bù 100% giá trị bưu gửi dựa trên khai giá minh bạch tự động hệ thống.
                </p>
              </div>

              {/* Floating dynamic shield element */}
              <div className="flex justify-center items-center h-20 relative select-none">
                <span className="material-symbols-outlined text-[64px] text-emerald-600/10 absolute animate-pulse">shield</span>
                <span className="material-symbols-outlined text-[44px] text-emerald-600/70 absolute group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
            </div>

            {/* Bento Card 4 (Col Span 2): Digital SLA On-Time Speedometer */}
            <div className="col-span-1 md:col-span-2 rounded-[28px] border border-black/10 bg-[#140b27] overflow-hidden p-8 flex flex-col md:flex-row justify-between items-center gap-6 min-h-[220px] group shadow-sm hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-500 relative">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.02)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
              
              <div className="space-y-3 relative z-10 flex-1">
                <span className="text-[9px] font-black text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/25 tracking-widest uppercase inline-block">SLA PERFORMANCE TRACK</span>
                <h4 className="text-base font-black text-white uppercase tracking-widest font-display">Tốc Độ Vận Chuyển Đạt Chuẩn 99.9%</h4>
                <p className="text-xs text-white/50 leading-relaxed font-semibold">
                  Chu kỳ kiểm tra on-time chặt chẽ, tối ưu phân luồng đường bay hỏa tốc và bưu tá giao vận. Antigravity cam kết tỉ lệ thất thoát hay trễ hạn tối thiểu toàn quốc.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0 relative z-10 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-[8px] font-black text-cyan-400 tracking-widest uppercase mb-1">ACCURACY INDEX</span>
                <div className="text-3xl font-black text-glow font-display text-white">99.92%</div>
                <span className="text-[7.5px] font-bold text-white/30 tracking-wide mt-1 uppercase">VERIFIED SECURE BY SAT-NET</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Packages Row with Vehicle Assets */}
      <section className="relative z-10 bg-canvas py-24 px-6 lg:px-24 border-b border-black/10">
         <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
             <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow mb-2">Flexible Rates</span>
             <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Bảng Giá Gói Dịch Vụ & Phương Tiện</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Standard Tier with Delivery Drone image */}
              <div className="bg-white border border-black/10 rounded-3xl overflow-hidden flex flex-col hover:border-black/20 hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] transition-all group">
                <div className="h-44 overflow-hidden relative bg-black">
                  <img 
                    src={deliveryDroneImg} 
                    alt="Autonomous Delivery Cargo Drone" 
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                  <span className="absolute bottom-4 left-6 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-black border border-black/10 shadow-sm">CARGO DRONE</span>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <span className="text-[9px] font-black text-mute uppercase tracking-widest mb-1">Standard Pack</span>
                  <h4 className="text-base font-black text-black uppercase tracking-widest font-display">Tiêu Chuẩn</h4>
                  <div className="my-5">
                    <span className="text-3xl font-black text-black">15.000đ</span>
                    <span className="text-xs text-mute font-bold"> / 500g đầu</span>
                  </div>
                  <p className="text-xs text-mute leading-relaxed font-semibold mb-6 flex-1">Phù hợp cho các chủ shop kinh doanh Online vừa và nhỏ, thời gian giao hàng 2-3 ngày, độ bao phủ tối đa 63 tỉnh thành.</p>
                  <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Lấy hàng tận nơi miễn phí</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Đổi địa chỉ giao 1 lần miễn phí</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Giao lại 3 lần miễn phí</li>
                  </ul>
                  <button onClick={() => navigate('/register')} className="w-full py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-black/80 transition-colors cursor-pointer">BẮT ĐẦU NGAY</button>
                </div>
              </div>

              {/* Express Tier with Electric Delivery Van image */}
              <div className="bg-white border-2 border-accent-purple rounded-3xl overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(94,14,215,0.08)] relative transform md:-translate-y-2 group">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent-purple text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_12px_#5E0ED7] z-20">PHỔ BIẾN NHẤT</div>
                
                <div className="h-44 overflow-hidden relative bg-black">
                  <img 
                    src={futuristicDeliveryVanImg} 
                    alt="Futuristic Electric Delivery autonomous van" 
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                  <span className="absolute bottom-4 left-6 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-black border border-black/10 shadow-sm">ELECTRIC VEHICLE</span>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest mb-1 text-glow">Express Pack</span>
                  <h4 className="text-base font-black text-black uppercase tracking-widest font-display">Hỏa Tốc</h4>
                  <div className="my-5">
                    <span className="text-3xl font-black text-black">28.000đ</span>
                    <span className="text-xs text-mute font-bold"> / 500g đầu</span>
                  </div>
                  <p className="text-xs text-mute leading-relaxed font-semibold mb-6 flex-1">Vận chuyển siêu tốc nội thành trong 2H - 4H, liên tỉnh đường bay nhanh cam kết trong vòng 24H. Định vị lộ trình chặt chẽ.</p>
                  <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Ưu tiên lấy hàng trong 30 phút</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Định vị lộ trình chính xác vệ tinh</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Bồi thường tối đa 10.000.000đ</li>
                  </ul>
                  <button onClick={() => navigate('/register')} className="w-full py-3 bg-accent-purple text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-[#6e19f1] transition-colors shadow-lg shadow-accent-purple/20 cursor-pointer">TRẢI NGHIỆM LIỀN</button>
                </div>
              </div>

              {/* B2B Corporate Tier */}
              <div className="bg-white border border-black/10 rounded-3xl overflow-hidden flex flex-col hover:border-black/20 hover:shadow-[0_12px_35px_rgba(0,0,0,0.03)] transition-all group">
                <div className="h-44 overflow-hidden relative bg-black flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#0d061c] opacity-90 z-0"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                  
                  {/* Dynamic spinning cube vector */}
                  <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-purple-500/40 absolute animate-spin" style={{ animationDuration: '10s' }}>settings</span>
                    <span className="material-symbols-outlined text-[36px] text-cyan-400 absolute">corporate_fare</span>
                  </div>
                  
                  <span className="absolute bottom-4 left-6 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-black border border-black/10 shadow-sm">B2B CONNECT</span>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <span className="text-[9px] font-black text-mute uppercase tracking-widest mb-1">Corporate Plan</span>
                  <div className="my-5">
                    <span className="text-3xl font-black text-black">Thương Lượng</span>
                    <span className="text-xs text-mute font-bold"> / Chiết khấu</span>
                  </div>
                  <p className="text-xs text-mute leading-relaxed font-semibold mb-6 flex-1">Thiết kế lộ trình phân phối riêng biệt cho chuỗi cung ứng TMĐT lớn. Tích hợp cổng thanh toán đối soát dòng tiền tự động.</p>
                  <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Tích hợp trực tiếp hệ thống API / SDK</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Hỗ trợ đối soát tự động hàng tuần</li>
                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-purple-600">done</span> Kênh hỗ trợ kỹ thuật riêng biệt 24/7</li>
                  </ul>
                  <button onClick={() => navigate('/register')} className="w-full py-3 bg-white border border-black/10 text-black text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-black/5 transition-all cursor-pointer">LIÊN HỆ TƯ VẤN</button>
                </div>
              </div>

           </div>
         </div>
      </section>

      {/* Volumetric Package Visualizer Section */}
      <section className="relative z-10 bg-canvas-soft py-24 px-6 lg:px-24 border-b border-black/10">
         <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow mb-2">Package Dimensions</span>
              <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Mô Phỏng Thể Tích Quy Đổi Đơn Hàng</h3>
              <p className="text-xs text-mute font-semibold mt-2">Chọn kích cỡ bưu gửi để xem thông số thể tích quy đổi volumetric và cước dự kiến.</p>
            </div>

            {/* Visualizer card split in two panes */}
            <div className="bg-white/70 backdrop-blur-xl border border-black/10 rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
              
              {/* Left pane: Selector controls */}
              <div className="flex-1 space-y-5 w-full">
                <div aria-label="Package type selection" className="bg-black/5 border border-black/10 p-[4px] rounded-full flex gap-[4px]" role="group">
                  <button 
                    onClick={() => handleSelectPkgType('document')}
                    className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      selectedPkg === 'document' 
                        ? 'bg-accent-purple text-white shadow-md' 
                        : 'text-mute hover:text-black'
                    }`}
                  >
                    Tài Liệu
                  </button>
                  <button 
                    onClick={() => handleSelectPkgType('medium')}
                    className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      selectedPkg === 'medium' 
                        ? 'bg-accent-purple text-white shadow-md' 
                        : 'text-mute hover:text-black'
                    }`}
                  >
                    Hộp Trung
                  </button>
                  <button 
                    onClick={() => handleSelectPkgType('heavy')}
                    className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      selectedPkg === 'heavy' 
                        ? 'bg-accent-purple text-white shadow-md' 
                        : 'text-mute hover:text-black'
                    }`}
                  >
                    Hàng Lớn
                  </button>
                  <button 
                    onClick={() => setSelectedPkg('custom')}
                    className={`flex-1 py-2.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      selectedPkg === 'custom' 
                        ? 'bg-accent-purple text-white shadow-md' 
                        : 'text-mute hover:text-black'
                    }`}
                  >
                    Tùy Chọn
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-black uppercase tracking-widest font-display text-glow-purple">
                    {selectedPkg === 'custom' ? "Hộp Hàng Tùy Biến" : packageSpecs[selectedPkg]?.title}
                  </h4>
                  <p className="text-xs text-mute leading-relaxed font-semibold">
                    {selectedPkg === 'custom' ? "Kéo các thanh trượt bên dưới để thay đổi số đo 3 chiều của hộp hàng. Trực quan 3D bên phải sẽ lập tiếp biến hình thích ứng." : packageSpecs[selectedPkg]?.desc}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 border-y border-black/5 py-4">
                    <div>
                      <span className="text-[9px] font-bold text-mute uppercase">KÍCH THƯỚC:</span>
                      <p className="text-xs font-black text-black mt-0.5">{resolvedL} x {resolvedW} x {resolvedH} cm</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-mute uppercase">THỂ TÍCH QUY ĐỔI:</span>
                      <p className="text-xs font-black text-purple-600 mt-0.5">{volumetricWeight.toFixed(2)} kg</p>
                    </div>
                  </div>

                  {/* Custom size Sliders Console */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-mute mb-1">
                        <span>CHIỀU DÀI (LENGTH):</span>
                        <span className="text-purple-600 font-extrabold">{resolvedL} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={resolvedL}
                        onChange={(e) => {
                          setSelectedPkg('custom');
                          setCustomL(parseInt(e.target.value));
                        }}
                        className="w-full h-1 bg-black/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-mute mb-1">
                        <span>CHIỀU RỘNG (WIDTH):</span>
                        <span className="text-purple-600 font-extrabold">{resolvedW} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="80" 
                        value={resolvedW}
                        onChange={(e) => {
                          setSelectedPkg('custom');
                          setCustomW(parseInt(e.target.value));
                        }}
                        className="w-full h-1 bg-black/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] font-bold text-mute mb-1">
                        <span>CHIỀU CAO (HEIGHT):</span>
                        <span className="text-purple-600 font-extrabold">{resolvedH} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="60" 
                        value={resolvedH}
                        onChange={(e) => {
                          setSelectedPkg('custom');
                          setCustomH(parseInt(e.target.value));
                        }}
                        className="w-full h-1 bg-black/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right pane: Holographic CSS 3D Cube projection */}
              <div className="scene3d neon-glow-grid relative w-full md:w-[45%] h-64 rounded-3xl border border-black/10 overflow-hidden shadow-inner bg-[#090314]/90 flex items-center justify-center">
                {/* Cyberpunk grid overlay lines */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(139,92,246,0.12)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />
                
                {/* Animated 3D Cube */}
                <div className="cube3d" style={boxStyles}>
                  <div className="face3d face3d-front">
                    <span className="face3d-label">FRONT</span>
                    <span className="text-[9.5px] font-extrabold text-purple-300 mt-1">{resolvedL}cm</span>
                  </div>
                  <div className="face3d face3d-back">
                    <span className="face3d-label">BACK</span>
                  </div>
                  <div className="face3d face3d-left">
                    <span className="face3d-label">LEFT</span>
                    <span className="text-[9.5px] font-extrabold text-purple-300 mt-1">{resolvedW}cm</span>
                  </div>
                  <div className="face3d face3d-right">
                    <span className="face3d-label">RIGHT</span>
                  </div>
                  <div className="face3d face3d-top">
                    <span className="face3d-label">TOP</span>
                    <span className="text-[8.5px] font-extrabold text-purple-300 mt-1">{resolvedL} x {resolvedW}</span>
                  </div>
                  <div className="face3d face3d-bottom">
                    <span className="face3d-label">BOTTOM</span>
                  </div>
                </div>

                {/* Absolute overlay elements for cyberpunk sci-fi look */}
                <div className="absolute top-3 left-4 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-[8px] font-black text-emerald-400 tracking-wider uppercase">3D RENDER ACTIVE</span>
                </div>
                
                <span className="absolute bottom-3 right-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black tracking-widest text-black border border-black/5 shadow-md">
                  CƯỚC ƯỚC TÍNH: {estimatedFee.toLocaleString('vi-VN')}đ
                </span>
              </div>

            </div>

         </div>
      </section>

      {/* Interactive API Sandbox Showroom */}
      <section className="relative z-10 bg-canvas py-24 px-6 lg:px-24 border-b border-black/10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow">Integrate Anything</span>
            <h2 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Cổng Sandbox API Tương Tác B2B</h2>
            <p className="text-xs text-mute leading-relaxed font-semibold">
              Hệ thống Logistics Antigravity hỗ trợ các nhà phát triển kết nối trực tiếp qua API RESTful và đồng bộ hóa Webhook chặng đi tự động để khởi tạo và định vị bưu kiện hàng loạt. Click chọn tab terminal bên cạnh để thử nghiệm ngay.
            </p>
            <div className="space-y-3 font-semibold text-xs text-black">
              <div className="flex items-center gap-2.5">
                <Code className="w-4 h-4 text-accent-purple" />
                <span>RESTful API với phản hồi JSON thời gian thực</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-accent-purple" />
                <span>Webhook đồng bộ trạng thái bưu kiện tự động</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-accent-purple" />
                <span>Thống kê sản lượng volumetric theo chu kỳ tài chính</span>
              </div>
            </div>
          </div>

          {/* Right side: Interactive Terminal code block */}
          <div className="flex-1 w-full max-w-2xl animate-fade-in relative z-10">
            <div className="bg-[#07030e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs text-white">
              
              {/* Tab Selector Header */}
              <div className="bg-[#10091e] px-4 py-2 border-b border-white/5 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                </div>
                
                {/* Interactive Endpoint Tabs */}
                <div className="flex gap-1">
                  <button 
                    onClick={() => setActiveApiTab('create')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeApiTab === 'create' ? 'bg-[#5E0ED7] text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    POST Tạo đơn
                  </button>
                  <button 
                    onClick={() => setActiveApiTab('track')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeApiTab === 'track' ? 'bg-[#5E0ED7] text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    GET Tra Cứu
                  </button>
                  <button 
                    onClick={() => setActiveApiTab('webhook')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeApiTab === 'webhook' ? 'bg-[#5E0ED7] text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Webhook
                  </button>
                </div>
              </div>

              {/* Code visualizer display container */}
              <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar bg-[#090412]">
                <div>
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-1">ENDPOINT PATH:</span>
                  <p className="font-mono text-[11px] text-white font-extrabold">{apiTerminalData[activeApiTab].endpoint}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                  <div>
                    <span className="text-[9px] text-purple-300 font-extrabold uppercase tracking-widest block mb-1">REQUEST:</span>
                    <pre className="p-3 bg-[#05020a] border border-white/5 rounded-xl text-[10px] leading-relaxed overflow-x-auto text-white/70">
                      <code>{apiTerminalData[activeApiTab].request}</code>
                    </pre>
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block mb-1">RESPONSE:</span>
                    <pre className="p-3 bg-[#05020a] border border-white/5 rounded-xl text-[10px] leading-relaxed overflow-x-auto text-emerald-350">
                      <code>{apiTerminalData[activeApiTab].response}</code>
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="relative z-10 bg-canvas-soft py-24 px-6 lg:px-24 border-b border-black/10">
         <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow mb-2">Support Center</span>
              <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Giải Đáp Câu Hỏi Thường Gặp</h3>
            </div>

            {/* Accordion list */}
            <div className="space-y-4">
              
              {[
                {
                  q: "Thời gian giao hàng cam kết chặng đi liên tỉnh là bao lâu?",
                  a: "Antigravity Express cam kết thời gian giao hàng cực kỳ tối ưu: Nội thành chặng ngắn trong 2-4 tiếng đối với gói Hỏa Tốc; Liên tỉnh chặng bay vận chuyển Express cam kết trong 24 tiếng; và dịch vụ Tiêu chuẩn phủ sóng 63 tỉnh thành trong vòng 2-3 ngày."
                },
                {
                  q: "Quy trình đối soát tài chính cước phí và thu hộ COD diễn ra như thế nào?",
                  a: "Hệ thống tự động thực hiện chốt chu kỳ đối soát và chuyển tiền COD thu hộ trực tiếp vào tài khoản ngân hàng thụ hưởng đã đăng ký của bạn định kỳ vào thứ Hai và thứ Năm hàng tuần. Bạn có thể tra cứu hóa đơn VietQR tức thì tại Merchant Portal."
                },
                {
                  q: "Mạng lưới vệ tinh định vị bưu kiện hoạt động như thế nào?",
                  a: "Mỗi mã vận đơn phát hành (AG-xxxxxx) được đồng bộ hóa với hệ cơ sở dữ liệu tọa độ chặng đi vệ tinh. Trình tra cứu tracking công khai sử dụng API bản đồ Voyager kết nối lộ trình thời gian thực OSRM giúp hiển thị từng mốc di chuyển và tọa độ chính xác của tài xế."
                }
              ].map((faq, idx) => (
                <div 
                  key={idx}
                  className={`bg-white/70 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'border-purple-500/35 ring-1 ring-purple-500/10 shadow-md' : 'border-black/10'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer outline-none"
                  >
                    <span className="text-xs font-black uppercase text-black tracking-wide pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-purple-600 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {openFaq === idx && (
                    <div className="px-6 pb-5 pt-1 border-t border-black/5">
                      <p className="text-xs text-mute font-semibold leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}

            </div>
         </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="relative z-10 bg-canvas py-24 px-6 lg:px-24 border-b border-black/10">
         <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
             <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow mb-2">Partner Feedback</span>
             <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow-purple">Khách hàng nói về Antigravity</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Testimonial 1 */}
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_12px_25px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-mute font-semibold leading-relaxed mb-6">
                  "Hệ thống tạo đơn đa điểm cực kỳ hữu ích! Shop mình bán bánh ngọt giao trong ngày, từ khi có tính năng này mình tiết kiệm được 30% chi phí vận chuyển so với việc gọi các bên ship lẻ."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center font-bold text-xs text-accent-purple">
                    T
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-black uppercase tracking-wider">Trần Minh Thư</h5>
                    <p className="text-[9px] text-mute font-bold uppercase mt-0.5">Chủ shop SweetBakes</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_12px_25px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-mute font-semibold leading-relaxed mb-6">
                  "Giao diện Light Studio sáng sủa, đẹp mắt và tốc độ định vị vệ tinh chính xác 99%. Đơn vị hiếm hoi tại Việt Nam tích hợp chuẩn chỉ bản đồ động cho từng chặng giao."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center font-bold text-xs text-accent-purple">
                    K
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-black uppercase tracking-wider">Hoàng Khắc Tiệp</h5>
                    <p className="text-[9px] text-mute font-bold uppercase mt-0.5">Founder TechSmart</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_12px_25px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-mute font-semibold leading-relaxed mb-6">
                  "API tích hợp rất sướng, tài liệu chuẩn RESTful giúp team dev của bên mình chỉ mất 2 tiếng là kết nối xong toàn bộ cổng giao nhận của hệ thống. Rất khuyến khích các B2B tích hợp."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent-purple/10 flex items-center justify-center font-bold text-xs text-accent-purple">
                    Q
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-black uppercase tracking-wider">Lê Văn Quân</h5>
                    <p className="text-[9px] text-mute font-bold uppercase mt-0.5">CTO SendoPartner</p>
                  </div>
                </div>
              </div>

           </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white/60 text-xs py-12 px-6 lg:px-24 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-start group">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 25C4 25 9 22 16 22C23 22 28 25 28 25L16 3Z" fill="url(#footerLogoGrad)" />
                <path d="M16 10L10 20H22L16 10Z" fill="black" />
                <circle cx="16" cy="15" r="2.5" fill="#ffffff" />
                <defs>
                   <linearGradient id="footerLogoGrad" x1="4" y1="3" x2="28" y2="25" gradientUnits="userSpaceOnUse">
                     <stop offset="0%" stopColor="#a78bfa" />
                     <stop offset="100%" stopColor="#ffffff" />
                   </linearGradient>
                </defs>
              </svg>
              <div className="flex items-center font-display">
                <span className="font-medium text-xs tracking-[0.5px] text-white/90 uppercase">ANTIGRAVITY</span>
                <span className="bg-white text-black font-extrabold text-[10px] px-1 py-0.2 ml-1 rounded-[1px] tracking-[0.5px] uppercase shadow-[0_2px_8px_rgba(255,255,255,0.1)]">EXPRESS</span>
              </div>
            </div>
            <span className="text-[5px] font-bold text-white/50 tracking-[1.5px] mt-0.5 ml-8 uppercase font-sans">NHANH VÀ ĐÁNG TIN CẬY</span>
          </div>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider text-center md:text-right">
            © 2026 ANTIGRAVITY LOGISTICS PLATFORM. ALL RIGHTS RESERVED. POWERED BY QUANTUM TECHNOLOGY.
          </p>
        </div>
      </footer>

    </div>
  );
}
