import React, { useState } from 'react';
import { Package, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
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

  return (
    <div className="bg-canvas flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-canvas-softer py-16 lg:py-24 px-6 lg:px-24 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
        
        {/* Left: Text Content */}
        <div className="flex-1 max-w-2xl">
          <h1 className="text-[40px] lg:text-[64px] leading-[1.1] font-bold text-ink mb-6 tracking-tight">
            Giao hàng siêu tốc.<br/>Xuyên không gian.
          </h1>
          <p className="text-lg lg:text-xl text-secondary mb-10 max-w-lg">
            Trải nghiệm dịch vụ logistics chuyên nghiệp với cước phí minh bạch và hệ thống theo dõi chuẩn xác từng mili-giây.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
             <button onClick={() => navigate('/merchant/order/new')} className="btn-primary px-8 py-4 text-lg">
                Tạo Đơn Ngay <ArrowRight className="ml-2 w-5 h-5" />
             </button>
             <button onClick={() => navigate('/tracking')} className="btn-secondary px-8 py-4 text-lg">
                Tra Cứu Vận Đơn
             </button>
          </div>
        </div>

        {/* Right: Request Form Card */}
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-ink mb-6">Tra cước vận chuyển</h2>
            <form onSubmit={handleSearch} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink">Điểm Lấy Hàng</label>
                <input 
                  type="text" 
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Ví dụ: Cầu Giấy, Hà Nội" 
                  className="input-uber"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink">Điểm Giao Hàng</label>
                <input 
                  type="text" 
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Ví dụ: Quận 1, TP.HCM" 
                  className="input-uber"
                />
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <label className="text-sm font-medium text-ink">Trọng lượng (gram)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ví dụ: 1000" 
                  className="input-uber"
                />
              </div>
              
              {feeResult !== null && feeResult !== undefined && (
                 <div className="bg-canvas-soft p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-secondary">Ước tính cước phí:</p>
                    <p className="text-2xl font-bold text-ink">{feeResult?.toLocaleString()} VNĐ</p>
                 </div>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-lg disabled:opacity-50">
                {isLoading ? "ĐANG TÍNH TOÁN..." : "TRA CỨU CƯỚC"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Services Row */}
      <section className="bg-canvas py-20 px-6 lg:px-24">
         <h3 className="text-2xl lg:text-3xl font-bold text-ink mb-12 text-center">Dịch vụ nổi bật</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Standard */}
            <div className="flex flex-col items-center text-center p-8 rounded-xl hover:bg-canvas-softer transition-colors cursor-pointer group">
               <div className="w-20 h-20 bg-canvas-softer group-hover:bg-canvas-soft rounded-full flex items-center justify-center mb-6 transition-colors">
                 <Package className="w-10 h-10 text-ink" />
               </div>
               <h4 className="text-xl font-bold mb-3">Giao hàng Tiêu chuẩn</h4>
               <p className="text-secondary">Giải pháp tối ưu chi phí cho các đơn hàng không yêu cầu thời gian khắt khe. Dịch vụ phủ sóng 63 tỉnh thành.</p>
            </div>
            {/* Express */}
            <div className="flex flex-col items-center text-center p-8 rounded-xl hover:bg-canvas-softer transition-colors cursor-pointer group">
               <div className="w-20 h-20 bg-canvas-softer group-hover:bg-canvas-soft rounded-full flex items-center justify-center mb-6 transition-colors">
                 <Zap className="w-10 h-10 text-ink" />
               </div>
               <h4 className="text-xl font-bold mb-3">Hỏa tốc (Express)</h4>
               <p className="text-secondary">Cam kết giao ngay trong vòng 2-4 tiếng nội thành. Vận tốc ánh sáng, đáp ứng mọi nhu cầu cấp bách.</p>
            </div>
            {/* Insurance */}
            <div className="flex flex-col items-center text-center p-8 rounded-xl hover:bg-canvas-softer transition-colors cursor-pointer group">
               <div className="w-20 h-20 bg-canvas-softer group-hover:bg-canvas-soft rounded-full flex items-center justify-center mb-6 transition-colors">
                 <ShieldCheck className="w-10 h-10 text-ink" />
               </div>
               <h4 className="text-xl font-bold mb-3">Bảo hiểm 100%</h4>
               <p className="text-secondary">Bảo vệ hàng hóa tuyệt đối. Đền bù 100% giá trị khai báo nếu xảy ra bất kỳ sự cố nào trong quá trình vận chuyển.</p>
            </div>
         </div>
      </section>
    </div>
  );
}
