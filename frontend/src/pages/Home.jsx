import React, { useState } from 'react';
import { Package, Zap, ShieldCheck, ArrowRight, Code, Star, RefreshCw, BarChart3, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [weight, setWeight] = useState(1000);
  const [feeResult, setFeeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const sampleJson = `{
  "sender_address": "123 Đường Cầu Giấy, Hà Nội",
  "service_package_id": 2,
  "pickup_type": "NHANVIEN_DEN_LAY",
  "receivers": [
    {
      "receiver_name": "Nguyễn Văn B",
      "receiver_phone": "0987654321",
      "receiver_address": "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
      "weight_gram": 1500,
      "cod_amount": 500000
    }
  ]
}`;

  return (
    <div className="bg-canvas flex flex-col min-h-screen text-black relative overflow-hidden font-sans">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
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
      `}</style>

      {/* Background Loop Video (Original Colors with Light Overlay) */}
      <div className="absolute top-0 left-0 w-full h-[85vh] z-0 pointer-events-none overflow-hidden border-b border-black/5">
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
        {/* Overlay Light Blur Canvas */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
        
        {/* Advanced Neon Aurora Background Blobs */}
        <div className="neon-aurora-blob bg-accent-purple/5 w-[600px] h-[600px] -top-20 -left-20 animate-pulse"></div>
        <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-28 pb-16 px-6 lg:px-24 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Stacked Brand Typography & Tagline */}
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
            <div>SHAPING BOLD LOGISTICS</div>
            <div>FLOWS WITH ZERO GRAVITY</div>
            <div>FOR YOUR GLOBAL ENTERPRISE</div>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              onClick={() => navigate('/register')} 
              className="btn-primary px-8 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group hover:scale-[1.03] transition-all"
            >
              HỢP TÁC NGAY <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/tracking')} 
              className="bg-white/80 text-black border border-black/10 rounded-full hover:bg-white hover:border-black/20 active:scale-95 px-8 py-4 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
            >
              TRA CỨU VẬN ĐƠN
            </button>
          </div>
        </div>

        {/* Right Column: Calculator & Stats */}
        <div className="flex-1 w-full flex flex-col gap-10">
          
          {/* Rate shipping Calculator */}
          <div className="w-full max-w-md animate-slide-up-card relative mx-auto lg:mx-0">
            <div className="bg-white/80 backdrop-blur-xl border border-black/10 rounded-[24px] shadow-[0_15px_35px_rgba(0,0,0,0.05)] p-8 relative z-10">
              <h2 className="text-sm font-black text-black uppercase tracking-widest font-display mb-6 text-glow-purple">
                Ước tính cước vận chuyển
              </h2>
              <form onSubmit={handleSearch} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-mute">Điểm Lấy Hàng</label>
                  <input 
                    type="text" 
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Ví dụ: Cầu Giấy, Hà Nội" 
                    className="bg-white text-black border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all duration-300 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-mute">Điểm Giao Hàng</label>
                  <input 
                    type="text" 
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="Ví dụ: Quận 1, TP.HCM" 
                    className="bg-white text-black border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all duration-300 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-mute">Trọng lượng (gram)</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ví dụ: 1000" 
                    className="bg-white text-black border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent-purple/40 w-full focus:border-accent-purple transition-all duration-300 text-xs font-bold"
                  />
                </div>
                
                {feeResult !== null && feeResult !== undefined && (
                   <div className="bg-black/5 p-4 rounded-xl border border-black/5 shadow-inner">
                      <p className="text-[9px] text-mute uppercase tracking-widest font-black">Ước tính cước phí:</p>
                      <p className="text-xl font-black text-black text-glow font-display mt-1">
                        {feeResult?.toLocaleString()} VNĐ
                      </p>
                   </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="btn-primary w-full py-4 text-xs uppercase tracking-widest font-black disabled:opacity-50"
                >
                  {isLoading ? "ĐANG TÍNH TOÁN..." : "TRA CỨU CƯỚC"}
                </button>
              </form>
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

      {/* Services Row */}
      <section className="relative z-10 bg-canvas-soft py-24 px-6 lg:px-24 border-t border-black/10">
         <div className="max-w-6xl mx-auto">
           <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow text-center mb-2">Our Capabilities</span>
           <h3 className="text-xl font-black text-black uppercase tracking-widest font-display mb-16 text-center text-glow-purple">Dịch vụ cốt lõi</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Standard */}
              <div className="bg-white border border-black/10 rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col items-center text-center hover:border-accent-purple/30 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)]">
                 <div className="w-16 h-16 bg-black/[0.02] group-hover:bg-accent-purple/10 border border-black/10 group-hover:border-accent-purple/30 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-inner group-hover:shadow-[0_4px_15px_rgba(94,14,215,0.15)]">
                   <Package className="w-6 h-6 text-black group-hover:text-accent-purple transition-colors duration-300" />
                 </div>
                 <h4 className="text-sm font-black text-black uppercase tracking-widest font-display mb-3 group-hover:text-accent-purple transition-all duration-300">Giao hàng Tiêu chuẩn</h4>
                 <p className="text-xs text-mute leading-relaxed font-semibold">Giải pháp tối ưu chi phí cho các đơn hàng B2B không yêu cầu thời gian ngặt nghèo. Dịch vụ phủ sóng 63 tỉnh thành.</p>
              </div>
              {/* Express */}
              <div className="bg-white border border-black/10 rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col items-center text-center hover:border-accent-purple/30 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)]">
                 <div className="w-16 h-16 bg-black/[0.02] group-hover:bg-accent-purple/10 border border-black/10 group-hover:border-accent-purple/30 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-inner group-hover:shadow-[0_4px_15px_rgba(94,14,215,0.15)]">
                   <Zap className="w-6 h-6 text-black group-hover:text-accent-purple transition-colors duration-300" />
                 </div>
                 <h4 className="text-sm font-black text-black uppercase tracking-widest font-display mb-3 group-hover:text-accent-purple transition-all duration-300">Hỏa tốc (Express)</h4>
                 <p className="text-xs text-mute leading-relaxed font-semibold">Cam kết vận chuyển giao ngay trong vòng 2-4 tiếng nội thành. Vận tốc siêu tốc, đáp ứng mọi kịch bản cấp bách.</p>
              </div>
              {/* Insurance */}
              <div className="bg-white border border-black/10 rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col items-center text-center hover:border-accent-purple/30 hover:shadow-[0_10px_25px_rgba(94,14,215,0.08)]">
                 <div className="w-16 h-16 bg-black/[0.02] group-hover:bg-accent-purple/10 border border-black/10 group-hover:border-accent-purple/30 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-inner group-hover:shadow-[0_4px_15px_rgba(94,14,215,0.15)]">
                   <ShieldCheck className="w-6 h-6 text-black group-hover:text-accent-purple transition-colors duration-300" />
                 </div>
                 <h4 className="text-sm font-black text-black uppercase tracking-widest font-display mb-3 group-hover:text-accent-purple transition-all duration-300">Bảo hiểm 100%</h4>
                 <p className="text-xs text-mute leading-relaxed font-semibold">Bảo vệ hàng hóa tuyệt đối. Hỗ trợ đền bù 100% giá trị khai báo nếu xảy ra bất kỳ sự cố ngoài ý muốn nào.</p>
              </div>
           </div>
         </div>
      </section>

      {/* Pricing Packages Row */}
      <section className="relative z-10 bg-canvas py-24 px-6 lg:px-24 border-t border-black/10">
         <div className="max-w-6xl mx-auto">
           <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow text-center mb-2">Flexible Rates</span>
           <h3 className="text-xl font-black text-black uppercase tracking-widest font-display mb-16 text-center text-glow-purple">Bảng giá gói dịch vụ</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Standard Tier */}
              <div className="bg-white border border-black/10 rounded-3xl p-8 flex flex-col hover:border-black/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
                <span className="text-[9px] font-black text-mute uppercase tracking-widest mb-1">Standard Pack</span>
                <h4 className="text-base font-black text-black uppercase tracking-widest font-display">Tiêu Chuẩn</h4>
                <div className="my-6">
                  <span className="text-3xl font-black text-black">15.000đ</span>
                  <span className="text-xs text-mute font-bold"> / 500g đầu</span>
                </div>
                <p className="text-xs text-mute leading-relaxed font-semibold mb-8 flex-1">Phù hợp cho các chủ shop kinh doanh Online vừa và nhỏ, thời gian giao hàng 2-3 ngày, độ bao phủ tối đa.</p>
                <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                  <li className="flex items-center gap-2">✓ Lấy hàng tận nơi miễn phí</li>
                  <li className="flex items-center gap-2">✓ Đổi địa chỉ giao 1 lần miễn phí</li>
                  <li className="flex items-center gap-2">✓ Giao lại 3 lần không cước</li>
                </ul>
                <button onClick={() => navigate('/register')} className="w-full py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-black/80 transition-colors">BẮT ĐẦU NGAY</button>
              </div>

              {/* Express Tier */}
              <div className="bg-white border-2 border-accent-purple rounded-3xl p-8 flex flex-col shadow-[0_12px_40px_rgba(94,14,215,0.08)] relative transform md:-translate-y-2">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-accent-purple text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_12px_#5E0ED7]">PHỔ BIẾN NHẤT</div>
                <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest mb-1 text-glow">Express Pack</span>
                <h4 className="text-base font-black text-black uppercase tracking-widest font-display">Hỏa Tốc</h4>
                <div className="my-6">
                  <span className="text-3xl font-black text-black">28.000đ</span>
                  <span className="text-xs text-mute font-bold"> / 500g đầu</span>
                </div>
                <p className="text-xs text-mute leading-relaxed font-semibold mb-8 flex-1">Vận chuyển siêu tốc nội thành trong 2H - 4H, liên tỉnh đường bay cam kết trong vòng 24H. Đặt chất lượng lên hàng đầu.</p>
                <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                  <li className="flex items-center gap-2">✓ Ưu tiên lấy hàng trong 30P</li>
                  <li className="flex items-center gap-2">✓ Định vị lộ trình chính xác vệ tinh</li>
                  <li className="flex items-center gap-2">✓ Bồi thường tối đa 10.000.000đ</li>
                </ul>
                <button onClick={() => navigate('/register')} className="w-full py-3 bg-accent-purple text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-[#6e19f1] transition-colors shadow-lg shadow-accent-purple/20">TRẢI NGHIỆM LIỀN</button>
              </div>

              {/* B2B Tier */}
              <div className="bg-white border border-black/10 rounded-3xl p-8 flex flex-col hover:border-black/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all">
                <span className="text-[9px] font-black text-mute uppercase tracking-widest mb-1">Corporate Plan</span>
                <h4 className="text-base font-black text-black uppercase tracking-widest font-display">Doanh Nghiệp</h4>
                <div className="my-6">
                  <span className="text-3xl font-black text-black">Chiết Khấu</span>
                  <span className="text-xs text-mute font-bold"> / Thương lượng</span>
                </div>
                <p className="text-xs text-mute leading-relaxed font-semibold mb-8 flex-1">Thiết kế lộ trình riêng biệt cho sàn TMĐT lớn và chuỗi phân phối. Tích hợp trực tiếp hệ thống đối soát tự động.</p>
                <ul className="text-xs text-black font-semibold space-y-3 mb-8">
                  <li className="flex items-center gap-2">✓ Tích hợp hệ thống API / SDK</li>
                  <li className="flex items-center gap-2">✓ Hỗ trợ đối soát COD hàng tuần</li>
                  <li className="flex items-center gap-2">✓ Account Manager hỗ trợ 24/7</li>
                </ul>
                <button onClick={() => navigate('/register')} className="w-full py-3 bg-white border border-black/10 text-black text-[10px] font-black tracking-widest uppercase rounded-xl hover:bg-black/5 transition-all">LIÊN HỆ TƯ VẤN</button>
              </div>

           </div>
         </div>
      </section>

      {/* B2B API Section */}
      <section className="relative z-10 bg-canvas-soft py-24 px-6 lg:px-24 border-t border-black/10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow">Integrate Anything</span>
            <h2 className="text-xl font-black text-black uppercase tracking-widest font-display">Tích Hợp API B2B Mạnh Mẽ</h2>
            <p className="text-xs text-mute leading-relaxed font-semibold">
              Hệ thống Logistics không trọng lực Antigravity hỗ trợ các nhà phát triển và doanh nghiệp lớn kết nối trực tiếp cổng API tạo đơn hàng loạt, tối ưu hóa Nearest-Neighbor tự động qua các điểm giao đa chặng bằng mã code tối giản.
            </p>
            <div className="space-y-3 font-semibold text-xs text-black">
              <div className="flex items-center gap-2.5">
                <Code className="w-4 h-4 text-accent-purple" />
                <span>RESTful API chuẩn xác với phản hồi JSON</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-accent-purple" />
                <span>Webhook đồng bộ trạng thái bưu kiện tự động</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-accent-purple" />
                <span>Thống kê volumetric và cước phí theo chu kỳ</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
              <div className="bg-neutral-850 px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                <span>POST /api/order/multistop</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <pre className="p-5 text-neutral-300 overflow-x-auto text-[11px] leading-relaxed custom-scrollbar bg-neutral-950">
                <code>{sampleJson}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="relative z-10 bg-canvas py-24 px-6 lg:px-24 border-t border-black/10">
         <div className="max-w-6xl mx-auto">
           <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block text-glow text-center mb-2">Partner Feedback</span>
           <h3 className="text-xl font-black text-black uppercase tracking-widest font-display mb-16 text-center text-glow-purple">Khách hàng nói về Antigravity</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Testimonial 1 */}
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all">
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
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all">
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
              <div className="bg-white border border-black/10 rounded-2xl p-6 hover:shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition-all">
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
                     <stop offset="0%" stop-color="#a78bfa" />
                     <stop offset="100%" stop-color="#ffffff" />
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
