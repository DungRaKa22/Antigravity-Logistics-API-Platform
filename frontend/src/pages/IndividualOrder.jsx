import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Zap, DollarSign, ArrowRight, MapPin, Truck, CheckCircle2, Copy, Check, Navigation, CreditCard, ChevronRight } from 'lucide-react';
import L from 'leaflet';
import { OrderService, TrackingService, BACKEND_URL } from '../services/api';
import { fetchRouteGeometry } from '../utils/routing';
import { useNavigate, useLocation } from 'react-router-dom';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to dynamically change Leaflet map bounds
function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const validBounds = bounds.filter(b => b && b[0] !== undefined && b[1] !== undefined);
      if (validBounds.length >= 2) {
        map.fitBounds(validBounds, { padding: [50, 50], maxZoom: 14 });
      } else if (validBounds.length === 1) {
        map.setView(validBounds[0], 12);
      }
    } else if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, bounds]);
  return null;
}

// Glowing Custom Neon Markers
const purplePulsingIcon = L.divIcon({
  className: 'custom-leaflet-pulsing-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-6 h-6 bg-[#5E0ED7] rounded-full animate-ping opacity-60"></div>
    <div class="relative w-4 h-4 bg-[#5E0ED7] border-2 border-white rounded-full shadow-[0_0_15px_#5E0ED7]"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const destinationNeonIcon = L.divIcon({
  className: 'custom-leaflet-dest-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-cyan-500 rounded-full animate-pulse opacity-40"></div>
    <div class="relative w-5 h-5 bg-white border-3 border-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const hubNeonIcon = L.divIcon({
  className: 'custom-leaflet-hub-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-amber-500 rounded-full animate-ping opacity-35"></div>
    <div class="relative w-5 h-5 bg-[#140b27] border-3 border-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const HUBS = {
  BAC: {
    name: 'Kho Trung Chuyển Miền Bắc (Từ Sơn, Bắc Ninh)',
    coords: [21.1155, 105.9964]
  },
  TRUNG: {
    name: 'Kho Trung Chuyển Miền Trung (An Tây, Quảng Ngãi)',
    coords: [15.1205, 108.7925]
  },
  NAM: {
    name: 'Kho Trung Chuyển Miền Nam (Bình Hòa, TP.HCM)',
    coords: [10.9325, 106.7215]
  }
};

const getRegion = (coords) => {
  if (!coords) return 'BAC';
  const lat = coords[0];
  if (lat >= 19.5) return 'BAC';
  if (lat >= 14.0) return 'TRUNG';
  return 'NAM';
};

// Calculate Haversine distance client-side between two coordinates [lat, lng]
const calculateHaversineDistance = (coords1, coords2) => {
  if (!coords1 || !coords2) return 0;
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

export default function IndividualOrder() {
  const navigate = useNavigate();
  const location = useLocation();

  const homeState = location.state || {};

  // Form Fields State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState(homeState.pickup || '');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState(homeState.dropoff || '');

  const [description, setDescription] = useState('Hàng tiêu dùng cá nhân');
  const [lengthCm, setLengthCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [heightCm, setHeightCm] = useState('10');
  const [weightGram, setWeightGram] = useState(homeState.weight || '1000');
  const [declaredValue, setDeclaredValue] = useState('0');

  const [serviceType, setServiceType] = useState('standard');
  const [pickupType, setPickupType] = useState('TU_MANG_RA_BUU_CUC');
  const [inspectionPolicy, setInspectionPolicy] = useState('KHONG_XEM');
  const [paymentMethod, setPaymentMethod] = useState('vietqr');

  // UI Processing States
  const [isLoading, setIsLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState({
    distance_km: 10,
    shipping_fee: 0,
    insurance_fee: 0,
    total_fee: 0,
  });

  // Map & Geocoding States
  const [senderCoords, setSenderCoords] = useState([21.0285, 105.8542]); // Default Hanoi
  const [receiverCoords, setReceiverCoords] = useState([10.7769, 106.7009]); // Default Saigon
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState(null);

  // Success Dialog State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    orderId: '',
    totalFee: 0,
    paymentUrl: ''
  });
  const [copiedId, setCopiedId] = useState(null);

  // 3D Visualizer variables
  const resolvedL = parseInt(lengthCm) || 10;
  const resolvedW = parseInt(widthCm) || 10;
  const resolvedH = parseInt(heightCm) || 10;
  const volumetricWeight = (resolvedL * resolvedW * resolvedH) / 6000;
  const boxStyles = {
    '--w-3d': `${Math.min(180, Math.max(45, resolvedL * 2.8))}px`,
    '--h-3d': `${Math.min(180, Math.max(8, resolvedH * 2.8))}px`,
    '--d-3d': `${Math.min(180, Math.max(45, resolvedW * 2.8))}px`,
  };

  const getPlannedPreviewHubs = () => {
    if (!senderCoords || !receiverCoords) return [];
    
    const clientDist = calculateHaversineDistance(senderCoords, receiverCoords);
    
    // If client-side distance is less than 10km, it's always direct
    if (clientDist < 10.0) return [];
    
    const hasEstimated = estimatedFee && estimatedFee.shipping_fee > 0;
    const distance = hasEstimated ? estimatedFee.distance_km : clientDist;
    
    // Skip hubs if distance is less than 10km (direct delivery)
    const isDirect = distance < 10.0;
    if (isDirect) return [];

    const senderReg = getRegion(senderCoords);
    const receiverReg = getRegion(receiverCoords);
    const originHub = HUBS[senderReg];
    const destHub = HUBS[receiverReg];
    
    const list = [originHub];
    if (senderReg !== receiverReg) {
      list.push(destHub);
    }
    return list;
  };

  const plannedPreviewHubs = getPlannedPreviewHubs();

  // Debounced Geocoding
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!senderAddress && !receiverAddress) return;
      setIsGeocoding(true);

      // Geocode Sender
      if (senderAddress) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(senderAddress)}&format=json&limit=1`;
          const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics/1.0' } });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setSenderCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          }
        } catch (err) {
          console.error("Sender geocoding error", err);
        }
      }

      // Respect OSM Nominatim 1 req/sec limit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Geocode Receiver
      if (receiverAddress) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(receiverAddress)}&format=json&limit=1`;
          const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics/1.0' } });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setReceiverCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            }
          }
        } catch (err) {
          console.error("Receiver geocoding error", err);
        }
      }

      setIsGeocoding(false);
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [senderAddress, receiverAddress]);

  // Fetch OSRM Routing Path
  useEffect(() => {
    if (senderCoords && receiverCoords) {
      setRouteGeometry(null);
      const waypoints = [senderCoords];
      plannedPreviewHubs.forEach(hub => waypoints.push(hub.coords));
      waypoints.push(receiverCoords);

      fetchRouteGeometry(waypoints).then((geometry) => {
        if (geometry && geometry.length > 0) {
          setRouteGeometry(geometry);
        }
      });
    }
  }, [senderCoords, receiverCoords, plannedPreviewHubs.map(h => h.name).join('|')]);

  // Dynamic Fee Calculation
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!senderAddress || !receiverAddress || !weightGram) return;
      setCalculatingFee(true);
      try {
        const res = await OrderService.calculateFee(
          senderAddress,
          receiverAddress,
          weightGram,
          lengthCm,
          widthCm,
          heightCm,
          declaredValue
        );
        if (res.success && res.data) {
          setEstimatedFee({
            distance_km: res.data.distance_km,
            shipping_fee: res.data.shipping_fee,
            insurance_fee: res.data.insurance_fee,
            total_fee: res.data.shipping_fee + res.data.insurance_fee,
            chargeable_weight: res.data.chargeable_weight,
          });
        }
      } catch (err) {
        console.error("DYNAMIC FEE ERROR:", err);
      } finally {
        setCalculatingFee(false);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [senderAddress, receiverAddress, weightGram, lengthCm, widthCm, heightCm, declaredValue]);

  // Submit Handler
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !senderAddress) {
      alert("Vui lòng điền đầy đủ thông tin liên hệ của Người gửi!");
      return;
    }
    if (!receiverName || !receiverPhone || !receiverAddress) {
      alert("Vui lòng điền đầy đủ thông tin liên hệ của Người nhận!");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_address: senderAddress,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        weight_gram: parseInt(weightGram) || 1000,
        length_cm: parseInt(lengthCm) || 10,
        width_cm: parseInt(widthCm) || 10,
        height_cm: parseInt(heightCm) || 10,
        service_package_id: serviceType === 'express' ? 2 : 1,
        description: description || "Đơn hàng lẻ vãng lai",
        declared_value: parseFloat(declaredValue) || 0,
        pickup_type: pickupType,
        inspection_policy: inspectionPolicy,
        payment_method: paymentMethod,
        cod_amount: 0 // B2C lẻ cước ship trả trước bắt buộc
      };

      const response = await OrderService.createGuestOrder(payload);
      if (response.success && response.data) {
        setSuccessDetails({
          orderId: response.data.order_id,
          totalFee: estimatedFee.total_fee,
          paymentUrl: `${BACKEND_URL}${response.data.payment_url}`
        });
        setShowSuccessModal(true);
      } else {
        alert(response.message || "Tạo vận đơn khách lẻ thất bại.");
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng kiểm tra lại đường truyền mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-135px)] gap-6 overflow-hidden bg-transparent w-full animate-fade-in px-4 max-w-7xl mx-auto">
      
      {/* Left Column: B2C Form Canvas */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white/70 border border-black/10 rounded-[28px] shadow-lg overflow-y-auto custom-scrollbar relative z-10 backdrop-blur-xl">
        <div className="p-8 max-w-xl mx-auto w-full relative z-10">
          
          <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4">
            <div>
              <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">B2C Retail Channel</span>
              <h1 className="text-2xl font-black text-black tracking-widest uppercase font-display text-glow-purple">Gửi Hàng Cá Nhân</h1>
            </div>
            <span className="px-3.5 py-1.5 bg-accent-purple/10 text-accent-purple text-[10px] font-black tracking-widest rounded-full uppercase border border-accent-purple/20">
              ⚡ Giao hàng nhanh 24/7
            </span>
          </div>

          <form onSubmit={handleCreateOrder} className="flex flex-col gap-8 pb-24">
            
            {/* SENDER BOX */}
            <div className="glow-card p-6 border border-black/10 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col gap-4 rounded-3xl">
              <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 text-glow">
                <span className="w-5 h-5 bg-[#5E0ED7] text-white text-[10px] rounded-full flex items-center justify-center font-black">A</span>
                1. Thông tin người gửi lẻ
              </h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Tên người gửi</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nhập họ tên của bạn"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Số điện thoại gửi</label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Nhập SĐT liên hệ bưu tá"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Địa chỉ gửi hàng (Lấy hàng)</label>
                  <input
                    type="text"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="Địa chỉ chi tiết nơi lấy hàng"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* RECEIVER BOX */}
            <div className="glow-card p-6 border border-black/10 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col gap-4 rounded-3xl">
              <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 text-glow">
                <span className="w-5 h-5 bg-cyan-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">B</span>
                2. Thông tin người nhận
              </h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Tên người nhận</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Họ và tên người nhận"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Số điện thoại nhận</label>
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="Số điện thoại người nhận"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Địa chỉ nhận hàng (Giao hàng)</label>
                  <input
                    type="text"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="Địa chỉ chi tiết nơi giao hàng"
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* PACKAGE BOX */}
            <div className="glow-card p-6 border border-black/10 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col gap-4 rounded-3xl">
              <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 text-glow">
                <span className="w-5 h-5 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">📦</span>
                3. Chi tiết hàng hóa
              </h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Mô tả sản phẩm</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="VD: Quần áo, tài liệu giấy, đồ dùng..."
                    className="input-neon font-semibold text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Dài (cm)</label>
                    <input
                      type="number"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value)}
                      className="input-neon font-semibold text-xs text-center"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Rộng (cm)</label>
                    <input
                      type="number"
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value)}
                      className="input-neon font-semibold text-xs text-center"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Cao (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="input-neon font-semibold text-xs text-center"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Trọng lượng (gram)</label>
                    <input
                      type="number"
                      value={weightGram}
                      onChange={(e) => setWeightGram(e.target.value)}
                      placeholder="Cân nặng thực tế"
                      className="input-neon font-semibold text-xs text-center"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Giá trị khai giá (VND)</label>
                    <input
                      type="number"
                      value={declaredValue}
                      onChange={(e) => setDeclaredValue(e.target.value)}
                      placeholder="Tính phí bảo hiểm"
                      className="input-neon font-semibold text-xs text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SERVICES */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow">4. Lựa chọn gói vận chuyển</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setServiceType('standard')}
                  className={`p-4 border cursor-pointer transition-all duration-300 flex flex-col justify-between h-24 rounded-2xl ${
                    serviceType === 'standard' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)] font-bold' 
                      : 'border-black/10 bg-black/[0.01] text-mute hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                   <Package className="w-5 h-5 text-black" />
                   <div>
                     <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-black">Standard Express</h4>
                     <p className="text-[8px] text-mute uppercase tracking-widest mt-0.5 font-bold">2-3 ngày làm việc</p>
                   </div>
                </div>
                <div 
                  onClick={() => setServiceType('express')}
                  className={`p-4 border cursor-pointer transition-all duration-300 flex flex-col justify-between h-24 rounded-2xl ${
                    serviceType === 'express' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)] font-bold' 
                      : 'border-black/10 bg-black/[0.01] text-mute hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                   <Zap className="w-5 h-5 text-accent-purple animate-pulse" />
                   <div>
                     <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-black">Quantum Speed</h4>
                     <p className="text-[8px] text-mute uppercase tracking-widest mt-0.5 font-bold">Trong ngày / 24 Giờ</p>
                   </div>
                </div>
              </div>
            </div>

            {/* ADDITIONAL OPTIONS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Quyền kiểm hàng</label>
                <select
                  value={inspectionPolicy}
                  onChange={(e) => setInspectionPolicy(e.target.value)}
                  className="w-full input-neon h-10 px-3 focus:outline-none focus:border-accent-purple text-[10px] text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                >
                  <option value="KHONG_XEM" className="bg-white text-black">Không xem hàng</option>
                  <option value="XEM_KHONG_THU" className="bg-white text-black">Xem không thử</option>
                  <option value="THU_HANG" className="bg-white text-black">Cho thử hàng</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-mute uppercase tracking-widest">Phương thức thu lấy</label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full input-neon h-10 px-3 focus:outline-none focus:border-accent-purple text-[10px] text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                >
                  <option value="TU_MANG_RA_BUU_CUC" className="bg-white text-black">Tự ra bưu cục gửi</option>
                  <option value="NHAN_VIEN_DEN_LAY" className="bg-white text-black">Bưu tá qua lấy</option>
                </select>
              </div>
            </div>

            {/* PAYMENT METHOD METHOD */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-accent-purple" />
                5. Phương thức thanh toán cước
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-4 border cursor-pointer transition-all duration-300 flex items-center justify-between rounded-2xl h-14 ${
                    paymentMethod === 'vietqr' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)]' 
                      : 'border-black/10 bg-black/[0.01] text-mute hover:border-black/20'
                  }`}
                >
                   <span className="font-extrabold text-[11px] uppercase tracking-wider">Cổng VietQR (MB Bank)</span>
                   <CheckCircle2 className={`w-4 h-4 ${paymentMethod === 'vietqr' ? 'text-accent-purple' : 'text-black/10'}`} />
                </div>
                <div 
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-4 border cursor-pointer transition-all duration-300 flex items-center justify-between rounded-2xl h-14 ${
                    paymentMethod === 'momo' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)]' 
                      : 'border-black/10 bg-black/[0.01] text-mute hover:border-black/20'
                  }`}
                >
                   <span className="font-extrabold text-[11px] uppercase tracking-wider">Ví Điện Tử MoMo</span>
                   <CheckCircle2 className={`w-4 h-4 ${paymentMethod === 'momo' ? 'text-accent-purple' : 'text-black/10'}`} />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Sticky Billing & CTA Footer */}
        <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-2xl p-6 border-t border-black/10 mt-auto shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-20">
           <div className="max-w-xl mx-auto w-full">
             
             {/* Live Fee Breakdown */}
             {senderAddress && receiverAddress && estimatedFee.total_fee > 0 && (
               <div className="mb-4 bg-black/[0.03] border border-black/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs shadow-inner gap-3 animate-clip-1">
                 <div className="space-y-1 w-full sm:w-auto">
                   <div className="flex flex-wrap items-center gap-2">
                     <p className="text-[9px] font-black text-accent-purple uppercase tracking-widest">Lộ trình: {estimatedFee.distance_km?.toFixed(1)} km</p>
                     <span className="text-[8px] font-extrabold text-white bg-accent-purple/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                       {estimatedFee.distance_km <= 30.0 ? 'Nội tỉnh' : estimatedFee.distance_km <= 300.0 ? 'Nội miền' : 'Liên miền'}
                     </span>
                     {resolvedL + resolvedW + resolvedH < 100 && (
                       <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                         Miễn cồng kềnh
                       </span>
                     )}
                   </div>
                   <div className="flex flex-wrap gap-x-4 text-[9.5px] font-extrabold uppercase tracking-widest text-mute">
                     <span>Cước gốc: <strong className="text-black">{estimatedFee.shipping_fee?.toLocaleString()}đ</strong></span>
                     {estimatedFee.insurance_fee > 0 && (
                       <span>Bảo hiểm: <strong className="text-black">{estimatedFee.insurance_fee?.toLocaleString()}đ</strong></span>
                     )}
                   </div>
                 </div>
                 <div className="text-left sm:text-right shrink-0">
                   <p className="text-[9px] text-mute uppercase font-black tracking-widest">
                     Tổng cước ship trả trước
                   </p>
                   <p className="text-lg font-black text-black text-glow font-display mt-0.5">
                     {calculatingFee ? '...' : `${estimatedFee.total_fee.toLocaleString()}đ`}
                   </p>
                 </div>
               </div>
             )}

             <button
               type="submit"
               disabled={isLoading || calculatingFee}
               onClick={handleCreateOrder}
               className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest flex justify-between px-8 items-center disabled:opacity-50"
             >
               <span>{isLoading ? "ĐANG TẠO ĐƠN VẬN..." : "XÁC NHẬN TẠO & THANH TOÁN"}</span>
               <ArrowRight className="w-4 h-4 text-white animate-pulse" />
             </button>
           </div>
        </div>
      </div>

      {/* Right Column: Holographic Maps & 3D projection */}
      <div className="hidden lg:flex w-1/2 flex-col gap-6 h-full relative z-10">
        
        {/* Double projection tabs (3D Box & Leaflet Map) */}
        {/* Top pane: 3D Holographic box visualizer */}
        <div className="scene3d neon-glow-grid relative w-full h-[38%] rounded-[24px] border border-black/10 overflow-hidden bg-[#090314]/95 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(139,92,246,0.15)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />
          
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

          <div className="absolute top-4 left-4 flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[8px] font-black text-emerald-400 tracking-wider uppercase">3D Render Projection</span>
          </div>

          <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black tracking-widest text-black border border-black/5 shadow-md">
            TRỌNG LƯỢNG QUY ĐỔI: {volumetricWeight.toFixed(2)} kg
          </div>
        </div>

        {/* Bottom pane: Route map */}
        <div className="w-full h-[58%] bg-white/60 border border-black/10 rounded-[24px] shadow-sm overflow-hidden relative backdrop-blur-md">
          {estimatedFee.total_fee > 0 && (
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-1">
              <p className="text-[9px] font-black text-black uppercase tracking-wider flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
                LỘ TRÌNH ĐỊNH TUYẾN
              </p>
              <p className="text-[8px] text-mute font-bold uppercase">Xuất phát: {senderAddress || 'Người gửi'}</p>
              <p className="text-[8px] text-mute font-bold uppercase">Điểm đến: {receiverAddress || 'Người nhận'}</p>
            </div>
          )}

          <div className="w-full h-full absolute inset-0 z-0">
            <MapContainer 
              center={senderCoords} 
              zoom={10} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <ChangeView center={senderCoords} zoom={6} bounds={[senderCoords, receiverCoords, ...plannedPreviewHubs.map(h => h.coords)]} />
              
              {/* Sender Pin */}
              {senderCoords && (
                <Marker position={senderCoords} icon={purplePulsingIcon}>
                  <Popup>
                    <div className="text-xs font-semibold">📍 ĐIỂM GỬI HÀNG<p className="text-[10px] text-mute mt-0.5">{senderAddress}</p></div>
                  </Popup>
                </Marker>
              )}

              {/* Hub Intermediate Pins */}
              {plannedPreviewHubs.map((hub, idx) => (
                <Marker key={idx} position={hub.coords} icon={hubNeonIcon}>
                  <Popup>
                    <div className="text-xs font-bold text-amber-600">🏢 {hub.name}</div>
                  </Popup>
                </Marker>
              ))}

              {/* Receiver Pin */}
              {receiverCoords && (
                <Marker position={receiverCoords} icon={destinationNeonIcon}>
                  <Popup>
                    <div className="text-xs font-semibold text-cyan-600">🎯 ĐIỂM NHẬN HÀNG<p className="text-[10px] text-mute mt-0.5">{receiverAddress}</p></div>
                  </Popup>
                </Marker>
              )}

              {/* Polyline path */}
              {routeGeometry && routeGeometry.length > 0 ? (
                <Polyline positions={routeGeometry} color="#5E0ED7" weight={4} opacity={0.8} dashArray="5, 10" />
              ) : (
                senderCoords && receiverCoords && (
                  <Polyline 
                    positions={[senderCoords, ...plannedPreviewHubs.map(h => h.coords), receiverCoords]} 
                    color="#5E0ED7" 
                    weight={3} 
                    opacity={0.5} 
                    dashArray="4, 8" 
                  />
                )
              )}
            </MapContainer>
          </div>
        </div>

      </div>

      {/* Success Modal / Checkout Simulation Gate */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#090314]/85 z-[10000] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-black/10 w-full max-w-md rounded-[32px] p-8 shadow-[0_25px_50px_rgba(0,0,0,0.3)] text-center relative overflow-hidden animate-slide-up-card">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-purple to-cyan-500"></div>
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
              <span className="material-symbols-outlined text-emerald-500 text-3xl font-black">check</span>
            </div>

            <h2 className="text-xl font-black text-black uppercase tracking-wide">Khởi Tạo Đơn Hàng Thành Công!</h2>
            <p className="text-[10px] text-mute tracking-widest font-black uppercase mt-1">B2C Retail Channel Gate</p>

            <div className="my-6 p-4.5 bg-black/[0.02] border border-black/5 rounded-2xl text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-mute uppercase tracking-wider text-[9.5px]">Mã vận đơn:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-black font-display text-glow-purple">{successDetails.orderId}</span>
                  <button 
                    onClick={() => handleCopy(successDetails.orderId)}
                    className="p-1 text-mute hover:text-accent-purple hover:bg-accent-purple/10 rounded transition-colors"
                  >
                    {copiedId === successDetails.orderId ? <span className="text-[9px] text-emerald-600 font-extrabold">Copied</span> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-black/5 pt-2">
                <span className="font-bold text-mute uppercase tracking-wider text-[9.5px]">Tổng cước thanh toán:</span>
                <span className="font-black text-black text-sm">{successDetails.totalFee?.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-black/5 pt-2">
                <span className="font-bold text-mute uppercase tracking-wider text-[9.5px]">Hình thức thanh toán:</span>
                <span className="font-extrabold text-accent-purple uppercase tracking-wider text-[10px]">
                  {paymentMethod === 'vietqr' ? 'MB Bank VietQR' : 'Ví MoMo Pay'}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[9.5px] p-4 rounded-xl text-left leading-normal font-bold uppercase tracking-wider mb-6">
              ⚠️ Đơn hàng cá nhân bắt buộc thanh toán trước. Trạng thái hiện tại đang BỊ KHÓA ở dạng "Chờ thanh toán". Nhấn nút dưới đây để thực hiện quét mã thanh toán mở khóa đơn.
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={successDetails.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(94,14,215,0.3)] hover:scale-[1.02] transition-transform"
              >
                <span>TIẾN HÀNH THANH TOÁN</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                className="w-full py-3 bg-black/5 text-black hover:bg-black/10 hover:border-black/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-black/5"
              >
                VỀ TRANG CHỦ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
