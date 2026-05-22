import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, CheckCircle2, Navigation, AlertCircle, Loader, Package, Phone, Truck, ShieldCheck, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { TrackingService } from '../services/api';
import { fetchRouteGeometry } from '../utils/routing';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Neon Purple Pulsing DivIcons
const purplePulsingIcon = L.divIcon({
  className: 'custom-leaflet-pulsing-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-6 h-6 bg-[#5E0ED7] rounded-full animate-ping opacity-30"></div>
    <div class="relative w-4 h-4 bg-[#5E0ED7] border-2 border-white rounded-full shadow-[0_0_10px_rgba(94,14,215,0.4)]"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const destinationNeonIcon = L.divIcon({
  className: 'custom-leaflet-dest-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-purple-500 rounded-full animate-pulse opacity-20"></div>
    <div class="relative w-5 h-5 bg-white border-3 border-[#5E0ED7] rounded-full shadow-[0_0_12px_rgba(94,14,215,0.3)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-[#5E0ED7] rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// ChangeView component to dynamically fit bounds of geocoded markers
function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const validBounds = bounds.filter(b => b && b[0] !== undefined && b[1] !== undefined);
      if (validBounds.length >= 2) {
        map.fitBounds(validBounds, { padding: [50, 50], maxZoom: 12 });
      } else if (validBounds.length === 1) {
        map.setView(validBounds[0], 12);
      }
    } else if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, bounds]);
  return null;
}

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [trackingCode, setTrackingCode] = useState(codeParam);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Geocoded coordinates states for map
  const [senderCoords, setSenderCoords] = useState(null);
  const [receiverCoords, setReceiverCoords] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null); // OSRM real road geometry

  const fetchTracking = async (codeToSearch) => {
    if (!codeToSearch.trim()) return;
    try {
      setLoading(true);
      setError('');
      setOrderData(null);
      setSenderCoords(null);
      setReceiverCoords(null);

      const res = await TrackingService.trackOrder(codeToSearch.trim());
      if (res.success) {
        setOrderData(res.data);
      } else {
        setError(res.message || 'Không tìm thấy thông tin vận đơn.');
      }
    } catch (err) {
      console.error(err);
      setError('Mã vận đơn không tồn tại hoặc lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) {
      setTrackingCode(codeParam);
      fetchTracking(codeParam);
    }
  }, [codeParam]);

  // Geocode address changes dynamically with Nominatim (with debouncing rate respect)
  useEffect(() => {
    if (orderData) {
      const geocode = async (address, setCoords) => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
          const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics/1.0' } });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          }
        } catch (e) {
          console.error("Geocoding failed for address: " + address, e);
        }
      };

      if (orderData.sender_address) {
        geocode(orderData.sender_address, setSenderCoords);
      }
      if (orderData.receiver_address) {
        // Sleep 1 second before doing recipient address to avoid overlapping Nominatim API rate limits
        setTimeout(() => {
          geocode(orderData.receiver_address, setReceiverCoords);
        }, 1000);
      }
    }
  }, [orderData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setSearchParams({ code: trackingCode.trim() });
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'GIAO_THANH_CONG': return 'Giao thành công';
      case 'DANG_VAN_CHUYEN': return 'Đang vận chuyển';
      case 'DA_LAY_HANG': return 'Đã lấy hàng';
      case 'CHO_LAY_HANG': return 'Chờ lấy hàng';
      case 'DA_HUY': return 'Đã hủy';
      default: return status || 'Chờ xử lý';
    }
  };

  const steps = [
    { key: 'CHO_LAY_HANG', label: 'Đã Tiếp Nhận' },
    { key: 'DA_LAY_HANG', label: 'Đã Lấy Hàng' },
    { key: 'DANG_VAN_CHUYEN', label: 'Đang Vận Chuyển' },
    { key: 'GIAO_THANH_CONG', label: 'Giao Thành Công' },
  ];

  const getActiveStepIndex = (status) => {
    switch (status) {
      case 'CHO_LAY_HANG': return 0;
      case 'DA_LAY_HANG': return 1;
      case 'DANG_VAN_CHUYEN': return 2;
      case 'GIAO_THANH_CONG': return 3;
      default: return 0;
    }
  };

  // Fetch OSRM real road geometry when both coordinates are ready
  useEffect(() => {
    if (senderCoords && receiverCoords) {
      setRouteGeometry(null); // Reset while fetching
      fetchRouteGeometry([senderCoords, receiverCoords]).then((geometry) => {
        if (geometry && geometry.length > 0) {
          setRouteGeometry(geometry);
        }
      });
    }
  }, [senderCoords, receiverCoords]);

  // Use OSRM route if available, fallback to straight line
  const polylineCoords = routeGeometry || (senderCoords && receiverCoords ? [senderCoords, receiverCoords] : null);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row overflow-hidden bg-canvas text-black">
      
      {/* Left Column: Tracking search and detailed information panel */}
      <div className="w-full lg:w-[45%] flex flex-col bg-canvas border-r border-black/10 overflow-y-auto custom-scrollbar relative z-10 h-full">
        {/* Advanced Neon Aurora Background Blobs */}
        <div className="neon-aurora-blob bg-accent-purple/5 w-[350px] h-[350px] -top-10 -left-10 animate-pulse"></div>

        <div className="p-8 w-full max-w-xl mx-auto flex flex-col h-full relative z-10">
          
          {/* Form Header */}
          <div className="mb-8 pb-4 border-b border-black/10">
            <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">Quantum Tracking</span>
            <h1 className="text-2xl font-black text-black tracking-widest uppercase font-display text-glow">Định Vị Bưu Gửi</h1>
            <p className="text-xs text-mute font-semibold mt-1">Kết nối bưu kiện bằng dữ liệu vệ tinh không trọng lực thời gian thực.</p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="mb-8 w-full">
            <div className="bg-black/[0.02] rounded-2xl shadow-inner flex items-center p-2 border border-black/10 hover:border-accent-purple/40 focus-within:border-accent-purple focus-within:bg-white focus-within:shadow-[0_0_20px_rgba(94,14,215,0.08)] transition-all duration-300">
              <Search className="w-5 h-5 text-accent-purple ml-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Nhập mã vận đơn (VD: AG-123456)" 
                className="flex-1 bg-transparent border-none outline-none px-3 text-black font-semibold placeholder-mute text-xs focus:ring-0 focus:outline-none"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary px-5 py-2.5 text-[10px] uppercase tracking-widest shrink-0 font-black flex items-center gap-1.5"
              >
                {loading ? <Loader className="w-3 h-3 animate-spin text-white" /> : 'TRA CỨU'}
              </button>
            </div>
          </form>

          {/* Body Content */}
          <div className="flex-1">
            {loading ? (
              <div className="glow-card p-8 flex flex-col items-center justify-center text-center gap-4 border border-black/10">
                <Loader className="w-8 h-8 animate-spin text-accent-purple" />
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-black animate-pulse">KẾT NỐI VỆ TINH...</h4>
                  <p className="text-[10px] text-mute mt-1 font-semibold">Đang truy vấn bưu gửi trong cơ sở dữ liệu thời gian thực</p>
                </div>
              </div>
            ) : error ? (
              <div className="glow-card p-6 flex gap-4 border border-red-500/20 shadow-[0_8px_30px_rgba(239,68,68,0.05)]">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-black text-black text-xs tracking-widest uppercase">Không tìm thấy thông tin</h4>
                  <p className="text-[11px] text-mute font-bold uppercase mt-1 tracking-wide">{error}</p>
                  <p className="text-[10px] text-mute mt-2 leading-relaxed">Hãy chắc chắn rằng bạn đã nhập chính xác mã vận đơn có định dạng <strong className="text-black">AG-xxxxxx</strong> được cấp khi tạo đơn.</p>
                </div>
              </div>
            ) : orderData ? (
              <div className="space-y-8 animate-fadeIn pb-16">
                
                {/* Header overview */}
                <div className="flex justify-between items-start bg-black/[0.02] border border-black/5 p-5 rounded-2xl">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-mute font-black block mb-1">Mã bưu gửi</span>
                    <h2 className="text-xl font-black text-black tracking-widest font-display uppercase text-glow">{orderData.order_id}</h2>
                    <p className="text-mute font-extrabold text-[10px] uppercase tracking-wider mt-1">GỬI NGÀY: {orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
                  </div>
                  <span className="px-3.5 py-2 rounded-full text-[10px] font-black tracking-widest bg-accent-purple text-white shadow-[0_4px_12px_rgba(94,14,215,0.22)] uppercase animate-pulse">
                    {getStatusText(orderData.current_status)}
                  </span>
                </div>

                {/* Horizontal Stepper Pipeline */}
                <div>
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-4 text-glow">Trạng thái bưu gửi</h3>
                  <div className="w-full py-6 px-4 bg-black/[0.01] border border-black/5 rounded-2xl shadow-inner">
                    <div className="flex justify-between items-center relative">
                      {/* Background pipe */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[4px] bg-black/10 rounded-full z-0"></div>
                      {/* Active highlighted pipe */}
                      <div 
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-[4px] bg-accent-purple shadow-[0_0_10px_rgba(94,14,215,0.5)] rounded-full z-0 transition-all duration-700"
                        style={{ 
                          width: `${(getActiveStepIndex(orderData.current_status) / (steps.length - 1)) * 88}%` 
                        }}
                      ></div>

                      {steps.map((step, idx) => {
                        const activeIdx = getActiveStepIndex(orderData.current_status);
                        const isPast = idx <= activeIdx;
                        const isCurrent = idx === activeIdx;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 shadow-md ${
                                isCurrent 
                                  ? 'bg-accent-purple text-white ring-4 ring-accent-purple/20 scale-110 shadow-[0_0_12px_#5E0ED7]' 
                                  : isPast 
                                    ? 'bg-accent-purple text-white' 
                                    : 'bg-white border border-black/10 text-mute'
                              }`}
                            >
                              {isCurrent ? (
                                <Navigation className="w-4.5 h-4.5 fill-current animate-pulse text-white" />
                              ) : isPast ? (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest mt-2 text-center max-w-[70px] ${
                              isCurrent 
                                ? 'text-accent-purple text-glow-purple font-black' 
                                : isPast 
                                  ? 'text-black font-extrabold' 
                                  : 'text-mute'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sender card */}
                  <div className="bg-black/[0.01] border border-black/5 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-glow-purple">
                      <Truck className="w-4 h-4 text-accent-purple shrink-0" />
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Người Gửi</h4>
                    </div>
                    <div className="text-xs space-y-1 font-semibold">
                      <p className="text-black font-bold uppercase">{orderData.sender_name || 'HỆ THỐNG ĐỐI TÁC'}</p>
                      <p className="text-mute flex items-center gap-1"><Phone className="w-3 h-3 text-mute" /> {orderData.sender_phone || 'N/A'}</p>
                      <p className="text-mute leading-relaxed mt-1 text-[11px] bg-white border border-black/5 p-2 rounded-lg">{orderData.sender_address || 'Địa chỉ kho gửi'}</p>
                    </div>
                  </div>

                  {/* Recipient card */}
                  <div className="bg-black/[0.01] border border-black/5 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-glow-purple">
                      <MapPin className="w-4 h-4 text-accent-purple shrink-0" />
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Người Nhận</h4>
                    </div>
                    <div className="text-xs space-y-1 font-semibold">
                      <p className="text-black font-bold uppercase">{orderData.receiver_name}</p>
                      <p className="text-mute flex items-center gap-1"><Phone className="w-3 h-3 text-mute" /> {orderData.receiver_phone}</p>
                      <p className="text-mute leading-relaxed mt-1 text-[11px] bg-white border border-black/5 p-2 rounded-lg">{orderData.receiver_address}</p>
                    </div>
                  </div>

                  {/* Physical specs */}
                  <div className="bg-black/[0.01] border border-black/5 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-glow-purple">
                      <Package className="w-4 h-4 text-accent-purple shrink-0" />
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Bưu Kiện</h4>
                    </div>
                    <div className="text-xs space-y-1.5 font-semibold">
                      <p className="text-black italic truncate">"{orderData.description || 'Hàng hóa ký gửi'}"</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-mute uppercase tracking-wider pt-1 border-t border-black/5">
                        <div>Trọng lượng: <strong className="text-black block text-xs font-black">{orderData.weight_gram?.toLocaleString()}g</strong></div>
                        <div>Kích thước: <strong className="text-black block text-xs font-black">{orderData.length_cm}x{orderData.width_cm}x{orderData.height_cm}cm</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Payment & pricing specs */}
                  <div className="bg-black/[0.01] border border-black/5 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-glow-purple">
                      <ShieldCheck className="w-4 h-4 text-accent-purple shrink-0" />
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest">Thanh Toán & Gói</h4>
                    </div>
                    <div className="text-xs space-y-1.5 font-semibold">
                      <p className="text-black font-bold uppercase">Gói: <span className="text-accent-purple text-glow-purple">{orderData.service_package || 'Tiêu chuẩn'}</span></p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-mute uppercase tracking-wider pt-1 border-t border-black/5">
                        <div>Thu hộ COD: <strong className="text-accent-purple text-glow text-xs font-black">{orderData.cod_amount ? `${orderData.cod_amount.toLocaleString()}đ` : '0đ'}</strong></div>
                        <div>Tổng cước phí: <strong className="text-black block text-xs font-black">{orderData.shipping_fee ? `${(orderData.shipping_fee + (orderData.insurance_fee || 0)).toLocaleString()}đ` : 'Đã thanh toán'}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline vertical stepper */}
                <div className="border-t border-black/10 pt-6">
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-6 text-glow">Lịch sử hành trình bưu gửi</h3>
                  <div className="flex flex-col gap-0 relative pl-4">
                    {/* Vertical line connection */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-accent-purple/20 rounded-full z-0"></div>
                    
                    {orderData.timeline && orderData.timeline.length > 0 ? (
                      orderData.timeline.map((item, index) => (
                        <div key={index} className="flex gap-5 items-start relative z-10 mb-6 last:mb-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                            index === 0 
                              ? 'bg-accent-purple text-white border-2 border-white shadow-[0_2px_8px_rgba(94,14,215,0.22)]' 
                              : 'bg-white text-mute border border-black/10 shadow-inner'
                          }`}>
                            {index === 0 ? (
                              <Navigation className="w-3 h-3 fill-current text-white animate-pulse" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-mute" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-extrabold text-xs uppercase tracking-widest ${index === 0 ? 'text-black text-glow-purple' : 'text-mute'}`}>
                              {getStatusText(item.status)}
                            </h4>
                            <p className="text-xs text-mute mt-1 leading-relaxed">{item.info}</p>
                            <p className="text-[10px] text-accent-purple font-bold tracking-wider mt-1">
                              {new Date(item.time).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-mute font-bold uppercase tracking-wider">Chưa có hành trình cập nhật.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="glow-card p-8 border border-black/10 bg-black/[0.01] text-center shadow-inner mt-4">
                <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center mx-auto mb-4 border border-accent-purple/20">
                  <MapPin className="w-5 h-5 text-accent-purple" />
                </div>
                <h3 className="text-sm font-black text-black tracking-widest uppercase mb-2 font-display">🔍 Tọa độ Định vị Trống</h3>
                <p className="text-xs text-mute leading-relaxed max-w-sm mx-auto font-semibold">
                  Vui lòng nhập mã vận đơn vào ô tìm kiếm ở trên để kết nối định vị bưu kiện của bạn qua mạng lưới vệ tinh thời gian thực.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Right Column: Dynamic Leaflet Map */}
      <div className="w-full lg:flex-1 h-[40vh] lg:h-full bg-canvas-soft relative z-10">
        
        {/* Map top indicator */}
        <div className="absolute top-6 left-6 z-[1000] bg-white/85 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>🌐 MẠNG LƯỚI ĐỊNH VỊ LIÊN TỈNH ANTIGRAVITY</span>
        </div>

        <div className="w-full h-full absolute inset-0 z-0">
          <MapContainer 
            center={[16.0544, 106.2022]} // Central Vietnam
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />

            <ChangeView 
              center={senderCoords || [16.0544, 106.2022]} 
              bounds={polylineCoords} 
            />

            {/* Shadow layer for glow effect */}
            {polylineCoords && (
              <Polyline 
                positions={polylineCoords} 
                color="#5E0ED7" 
                weight={10} 
                opacity={0.12} 
                lineCap="round" 
                lineJoin="round"
              />
            )}
            {/* Main route line */}
            {polylineCoords && (
              <Polyline 
                positions={polylineCoords} 
                color="#5E0ED7" 
                weight={5} 
                opacity={0.85} 
                lineCap="round" 
                lineJoin="round"
              />
            )}

            {senderCoords && (
              <Marker position={senderCoords} icon={purplePulsingIcon}>
                <Popup>
                  <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                    <p className="text-accent-purple">📍 ĐIỂM GỬI (KHO LẤY HÀNG)</p>
                    <p className="text-black mt-1 font-semibold">{orderData?.sender_name || 'Chủ hàng'}</p>
                    <p className="text-[10px] text-mute mt-0.5">{orderData?.sender_address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {receiverCoords && (
              <Marker position={receiverCoords} icon={destinationNeonIcon}>
                <Popup>
                  <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                    <p className="text-accent-purple">📍 ĐIỂM NHẬN (KHÁCH NHẬN)</p>
                    <p className="text-black mt-1 font-semibold">{orderData?.receiver_name}</p>
                    <p className="text-[10px] text-mute mt-0.5">{orderData?.receiver_address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

          </MapContainer>
        </div>
      </div>

    </div>
  );
}
