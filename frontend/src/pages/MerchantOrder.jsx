import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Zap, DollarSign, Trash2, Plus, ArrowRight, MapPin, Truck, HelpCircle, CheckCircle2, Copy, Check, Navigation, Printer } from 'lucide-react';
import L from 'leaflet';
import { OrderService, AddressService, TrackingService } from '../services/api';
import { fetchRouteGeometry } from '../utils/routing';
import { useNavigate } from 'react-router-dom';
import { printWaybill } from '../utils/waybill';

// Fix Leaflet's default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ChangeView component to dynamically fit bounds of geocoded markers
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

// Custom Neon Purple Pulsing DivIcons
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
    <div class="absolute w-8 h-8 bg-purple-500 rounded-full animate-pulse opacity-40"></div>
    <div class="relative w-5 h-5 bg-white border-3 border-[#5E0ED7] rounded-full shadow-[0_0_20px_#5E0ED7] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-[#5E0ED7] rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function MerchantOrder() {
  const navigate = useNavigate();
  const [addressBook, setAddressBook] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  
  const [serviceType, setServiceType] = useState('standard');
  const [pickupType, setPickupType] = useState('TU_MANG_RA_BUU_CUC');
  const [inspectionPolicy, setInspectionPolicy] = useState('KHONG_XEM');

  // Dynamic Multi-stop Receivers State
  const [receivers, setReceivers] = useState([
    {
      receiver_name: '',
      receiver_phone: '',
      receiver_address: '',
      description: '',
      length_cm: '10',
      width_cm: '10',
      height_cm: '10',
      weight_gram: '1000',
      cod_amount: '0',
      declared_value: '0'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState({
    distance_km: 10,
    shipping_fee: 0,
    insurance_fee: 0,
    total_fee: 0,
    optimized_receivers: []
  });

  // Dynamic geocoding coordinates states
  const [senderCoords, setSenderCoords] = useState([21.0333, 105.8500]); // Fallback Hanoi
  const [receiverCoordsList, setReceiverCoordsList] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState(null); // OSRM real road geometry

  // Success dialog/modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    orderIds: [],
    totalFee: 0,
    isMulti: false
  });
  const [copiedId, setCopiedId] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  // Fetch sender addresses
  useEffect(() => {
    async function loadAddressBook() {
      try {
        const res = await AddressService.getAddresses();
        if (res.success && res.data) {
          setAddressBook(res.data);
          const defaultAddr = res.data.find(item => item.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id.toString());
            setSenderAddress(defaultAddr.address);
          } else if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].id.toString());
            setSenderAddress(res.data[0].address);
          }
        }
      } catch (err) {
        console.error("Failed to load address book", err);
      }
    }
    loadAddressBook();
  }, []);

  const handleAddressSelectChange = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    const chosen = addressBook.find(item => item.id.toString() === id);
    if (chosen) {
      setSenderAddress(chosen.address);
    }
  };

  const handleReceiverChange = (index, field, value) => {
    const updated = [...receivers];
    updated[index][field] = value;
    setReceivers(updated);
  };

  const addReceiver = () => {
    if (receivers.length >= 3) {
      alert("Hệ thống hiện tại hỗ trợ tối đa 3 điểm nhận trên một chuyến đi để đảm bảo tối ưu lộ trình tốt nhất!");
      return;
    }
    setReceivers([
      ...receivers,
      {
        receiver_name: '',
        receiver_phone: '',
        receiver_address: '',
        description: '',
        length_cm: '10',
        width_cm: '10',
        height_cm: '10',
        weight_gram: '1000',
        cod_amount: '0',
        declared_value: '0'
      }
    ]);
  };

  const removeReceiver = (index) => {
    if (receivers.length === 1) return;
    const updated = receivers.filter((_, i) => i !== index);
    setReceivers(updated);
  };

  // Geocode address changes dynamically with debounce to prevent OpenStreetMap API spam
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!senderAddress) return;
      
      setIsGeocoding(true);
      // 1. Geocode sender address
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
        console.error("Failed to geocode sender address", err);
      }

      // 2. Geocode receiver addresses in sequence (to respect Nominatim's 1 req/sec limit)
      const coordsList = [];
      for (let i = 0; i < receivers.length; i++) {
        const addr = receivers[i].receiver_address;
        if (addr) {
          if (i > 0) {
            // Wait 1 second before querying OSM for subsequent addresses
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`;
            const res = await fetch(url, { headers: { 'User-Agent': 'Antigravity-Logistics/1.0' } });
            if (res.ok) {
              const data = await res.json();
              if (data && data.length > 0) {
                coordsList.push({
                  index: i,
                  coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
                  name: receivers[i].receiver_name || `Người nhận ${i + 1}`
                });
              }
            }
          } catch (err) {
            console.error(`Failed to geocode receiver address at index ${i}`, err);
          }
        }
      }
      setReceiverCoordsList(coordsList);
      setIsGeocoding(false);
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [senderAddress, receivers.map(r => r.receiver_address).join('|')]);

  // Fetch OSRM real road geometry when sender/receiver coordinates change
  useEffect(() => {
    if (senderCoords && receiverCoordsList.length > 0) {
      const waypoints = [senderCoords, ...receiverCoordsList.sort((a, b) => a.index - b.index).map(r => r.coords)];
      setRouteGeometry(null);
      fetchRouteGeometry(waypoints).then((geometry) => {
        if (geometry && geometry.length > 0) {
          setRouteGeometry(geometry);
        }
      });
    } else {
      setRouteGeometry(null);
    }
  }, [senderCoords, receiverCoordsList]);

  // Real-time Fee Estimation
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!senderAddress) return;
      
      const allValid = receivers.every(r => r.receiver_address && r.weight_gram && r.receiver_name);
      if (!allValid) return;

      setCalculatingFee(true);
      try {
        if (receivers.length === 1) {
          // Single stop calculations
          const singleRec = receivers[0];
          const res = await OrderService.calculateFee(
            senderAddress,
            singleRec.receiver_address,
            singleRec.weight_gram,
            singleRec.length_cm,
            singleRec.width_cm,
            singleRec.height_cm,
            singleRec.declared_value
          );
          if (res.success && res.data) {
            setEstimatedFee({
              distance_km: res.data.distance_km,
              shipping_fee: res.data.shipping_fee,
              insurance_fee: res.data.insurance_fee,
              total_fee: res.data.shipping_fee + res.data.insurance_fee,
              optimized_receivers: []
            });
          }
        } else {
          // Multi-stop optimizations & calculations
          const payload = {
            sender_address: senderAddress,
            receivers: receivers.map(r => ({
              receiver_name: r.receiver_name,
              receiver_phone: r.receiver_phone,
              receiver_address: r.receiver_address,
              description: r.description,
              length_cm: parseInt(r.length_cm),
              width_cm: parseInt(r.width_cm),
              height_cm: parseInt(r.height_cm),
              weight_gram: parseInt(r.weight_gram),
              declared_value: parseFloat(r.declared_value),
              cod_amount: parseFloat(r.cod_amount)
            }))
          };
          const res = await OrderService.calculateMultistopFee(payload);
          if (res.success && res.data) {
            setEstimatedFee({
              distance_km: res.data.optimized_receivers.reduce((acc, curr) => acc + curr.distance_km, 0),
              shipping_fee: res.data.total_shipping_fee,
              insurance_fee: res.data.total_insurance_fee,
              total_fee: res.data.total_fee,
              optimized_receivers: res.data.optimized_receivers
            });
          }
        }
      } catch (err) {
        console.error("DYNAMIC FEE ERROR:", err);
      } finally {
        setCalculatingFee(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [senderAddress, receivers]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!senderAddress) {
      alert("Vui lòng chọn địa chỉ gửi hàng trong Sổ địa chỉ trước!");
      return;
    }

    const hasEmptyField = receivers.some(r => !r.receiver_name || !r.receiver_phone || !r.receiver_address);
    if (hasEmptyField) {
      alert("Vui lòng điền đầy đủ tên, SĐT và địa chỉ của tất cả người nhận!");
      return;
    }

    setIsLoading(true);
    try {
      if (receivers.length === 1) {
        // Single order creation
        const singleRec = receivers[0];
        const payload = {
          name: singleRec.receiver_name,
          phone: singleRec.receiver_phone,
          address: singleRec.receiver_address,
          sender_address: senderAddress,
          weight: singleRec.weight_gram,
          length: singleRec.length_cm,
          width: singleRec.width_cm,
          height: singleRec.height_cm,
          service: serviceType,
          description: singleRec.description || "Đơn tạo lẻ từ Merchant Portal",
          cod_amount: singleRec.cod_amount,
          declared_value: singleRec.declared_value,
          pickup_type: pickupType,
          inspection_policy: inspectionPolicy
        };
        const response = await OrderService.createOrder(payload);
        if (response.success) {
          setSuccessDetails({
            orderIds: [response.data.order_id],
            totalFee: estimatedFee.total_fee,
            isMulti: false
          });
          setShowSuccessModal(true);
        } else {
          alert(response.message || "Tạo vận đơn thất bại.");
        }
      } else {
        // Multi-stop order creation
        const payload = {
          sender_address: senderAddress,
          service_package_id: serviceType === 'express' ? 2 : 1,
          pickup_type: pickupType,
          inspection_policy: inspectionPolicy,
          receivers: receivers.map(r => ({
            receiver_name: r.receiver_name,
            receiver_phone: r.receiver_phone,
            receiver_address: r.receiver_address,
            description: r.description,
            length_cm: parseInt(r.length_cm),
            width_cm: parseInt(r.width_cm),
            height_cm: parseInt(r.height_cm),
            weight_gram: parseInt(r.weight_gram),
            declared_value: parseFloat(r.declared_value),
            cod_amount: parseFloat(r.cod_amount)
          }))
        };
        const response = await OrderService.createMultistopOrder(payload);
        if (response.success) {
          const ids = response.data?.order_ids || [];
          setSuccessDetails({
            orderIds: ids.length > 0 ? ids : ["Hành trình tối ưu"],
            totalFee: estimatedFee.total_fee,
            isMulti: true
          });
          setShowSuccessModal(true);
        } else {
          alert(response.message || "Tạo đơn hàng đa điểm thất bại.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo đơn hàng. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintWaybill = async (orderId) => {
    if (!orderId) return;
    setPrintingId(orderId);
    try {
      const res = await TrackingService.trackOrder(orderId);
      if (res.success && res.data) {
        printWaybill(res.data);
      } else {
        alert("Không thể tải thông tin đơn hàng để in.");
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi tải dữ liệu in tem.");
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintAllWaybills = async () => {
    if (!successDetails.orderIds || successDetails.orderIds.length === 0) return;
    for (const id of successDetails.orderIds) {
      await handlePrintWaybill(id);
    }
  };

  const resetForm = () => {
    setReceivers([
      {
        receiver_name: '',
        receiver_phone: '',
        receiver_address: '',
        description: '',
        length_cm: '10',
        width_cm: '10',
        height_cm: '10',
        weight_gram: '1000',
        cod_amount: '0',
        declared_value: '0'
      }
    ]);
    setEstimatedFee({
      distance_km: 10,
      shipping_fee: 0,
      insurance_fee: 0,
      total_fee: 0,
      optimized_receivers: []
    });
    setReceiverCoordsList([]);
    setServiceType('standard');
    setPickupType('TU_MANG_RA_BUU_CUC');
    setInspectionPolicy('KHONG_XEM');
    setShowSuccessModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-canvas">
      
      {/* Left Column: Form Canvas */}
      <div className="w-full lg:w-1/2 flex flex-col bg-canvas overflow-y-auto border-r border-black/10 custom-scrollbar relative z-10">
        {/* Advanced Neon Aurora Background Blobs */}
        <div className="neon-aurora-blob bg-accent-purple/5 w-[400px] h-[400px] -top-10 -left-10 animate-pulse"></div>

        <div className="p-8 max-w-xl mx-auto w-full relative z-10">
          <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4">
            <div>
              <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">Volumetric Core</span>
              <h1 className="text-2xl font-black text-black tracking-widest uppercase font-display text-glow">Tạo Vận Đơn</h1>
            </div>
            {receivers.length > 1 && (
              <span className="px-3.5 py-1.5 bg-accent-purple text-white text-[10px] font-black tracking-widest rounded-full uppercase shadow-[0_0_15px_rgba(94,14,215,0.2)] animate-pulse">
                Multi-Stop Route
              </span>
            )}
          </div>
          
          <form onSubmit={handleCreateOrder} className="flex flex-col gap-8 pb-32">
            
            {/* Section 1: Sender Addresses */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow">1. Thông tin người gửi</h3>
                <button
                  type="button"
                  onClick={() => navigate('/merchant/addresses')}
                  className="text-[10px] font-black text-accent-purple uppercase tracking-widest hover:underline hover:text-[#7d2ae8] transition-colors"
                >
                  + Quản lý sổ địa chỉ
                </button>
              </div>
              
              {addressBook.length === 0 ? (
                <div className="bg-amber-500/10 text-amber-800 text-xs p-4 rounded-xl border border-amber-500/20 font-bold uppercase tracking-wider">
                  Bạn chưa có địa chỉ gửi nào. Vui lòng nhấn nút quản lý sổ địa chỉ để thêm mới.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Chọn địa điểm lấy hàng</label>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelectChange}
                    className="w-full input-neon h-12 px-4 focus:outline-none focus:border-accent-purple text-xs text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                  >
                    {addressBook.map((item) => (
                      <option key={item.id} value={item.id} className="bg-white text-black font-semibold">
                        {item.name} ({item.phone}) - {item.address} {item.isDefault ? '[MẶC ĐỊNH]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dynamic Receivers Block */}
            {receivers.map((rec, index) => (
              <div key={index} className="glow-card p-6 border border-black/10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col gap-6 relative animate-slide-up-card">
                {receivers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReceiver(index)}
                    className="absolute top-4 right-4 p-2 bg-red-500/5 hover:bg-red-500/10 rounded-lg text-red-600 transition-colors cursor-pointer border border-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <h3 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 text-glow">
                  <span className="w-5 h-5 bg-accent-purple text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-[0_0_10px_#5E0ED7]">{index + 1}</span>
                  Điểm giao hàng {receivers.length > 1 ? `#${index + 1}` : ''}
                </h3>

                {/* Section 2: Receiver Info */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Tên người nhận</label>
                    <input
                      type="text"
                      value={rec.receiver_name}
                      onChange={(e) => handleReceiverChange(index, 'receiver_name', e.target.value)}
                      placeholder="Họ và tên người nhận"
                      className="input-neon font-semibold text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Số điện thoại nhận</label>
                    <input
                      type="tel"
                      value={rec.receiver_phone}
                      onChange={(e) => handleReceiverChange(index, 'receiver_phone', e.target.value)}
                      placeholder="Số điện thoại nhận hàng"
                      className="input-neon font-semibold text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Địa chỉ nhận</label>
                    <input
                      type="text"
                      value={rec.receiver_address}
                      onChange={(e) => handleReceiverChange(index, 'receiver_address', e.target.value)}
                      placeholder="Địa chỉ chi tiết (VD: 123 Lê Lợi, Quận 1, TP.HCM)"
                      className="input-neon font-semibold text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Section 3: Package Attributes */}
                <div className="flex flex-col gap-4 pt-4 border-t border-black/10">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Mô tả hàng hóa</label>
                    <input
                      type="text"
                      value={rec.description}
                      onChange={(e) => handleReceiverChange(index, 'description', e.target.value)}
                      placeholder="Quần áo, phụ kiện điện thoại..."
                      className="input-neon font-semibold text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Dài (cm)</label>
                      <input
                        type="number"
                        value={rec.length_cm}
                        onChange={(e) => handleReceiverChange(index, 'length_cm', e.target.value)}
                        placeholder="Dài"
                        className="input-neon font-semibold text-sm"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Rộng (cm)</label>
                      <input
                        type="number"
                        value={rec.width_cm}
                        onChange={(e) => handleReceiverChange(index, 'width_cm', e.target.value)}
                        placeholder="Rộng"
                        className="input-neon font-semibold text-sm"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Cao (cm)</label>
                      <input
                        type="number"
                        value={rec.height_cm}
                        onChange={(e) => handleReceiverChange(index, 'height_cm', e.target.value)}
                        placeholder="Cao"
                        className="input-neon font-semibold text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Khối lượng (gram)</label>
                    <input
                      type="number"
                      value={rec.weight_gram}
                      onChange={(e) => handleReceiverChange(index, 'weight_gram', e.target.value)}
                      placeholder="Trọng lượng thực tế"
                      className="input-neon font-semibold text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Section 4: COD & Declared Value */}
                <div className="flex flex-col gap-4 pt-4 border-t border-black/10">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Tiền thu hộ COD (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-purple" />
                      <input
                        type="number"
                        value={rec.cod_amount}
                        onChange={(e) => handleReceiverChange(index, 'cod_amount', e.target.value)}
                        placeholder="Nhập số tiền thu hộ nếu có"
                        className="input-neon pl-9 font-semibold text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Giá trị hàng hóa khai giá (VNĐ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-purple" />
                      <input
                        type="number"
                        value={rec.declared_value}
                        onChange={(e) => handleReceiverChange(index, 'declared_value', e.target.value)}
                        placeholder="Tính phí bảo hiểm đền bù"
                        className="input-neon pl-9 font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add stop button */}
            <button
              type="button"
              onClick={addReceiver}
              className="py-4 border border-dashed border-black/10 hover:border-accent-purple/40 hover:bg-accent-purple/5 hover:text-accent-purple rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-mute transition-all duration-300 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-accent-purple" />
              Thêm Điểm Giao Hàng Đa Điểm
            </button>

            {/* Section 5: Service Package */}
            <div className="flex flex-col gap-4 pt-4 border-t border-black/10">
              <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow">Gói dịch vụ vận chuyển</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setServiceType('standard')}
                  className={`p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between h-28 rounded-2xl ${
                    serviceType === 'standard' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)]' 
                      : 'border-black/10 bg-black/[0.02] text-mute hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                   <Package className="w-6 h-6 mb-2 text-black" />
                   <div>
                     <h4 className="font-bold text-xs uppercase tracking-wider text-black">Standard</h4>
                     <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">2-3 ngày làm việc</p>
                   </div>
                </div>
                <div 
                  onClick={() => setServiceType('express')}
                  className={`p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between h-28 rounded-2xl ${
                    serviceType === 'express' 
                      ? 'border-accent-purple bg-accent-purple/5 text-black shadow-[0_2px_12px_rgba(94,14,215,0.12)]' 
                      : 'border-black/10 bg-black/[0.02] text-mute hover:border-black/20 hover:bg-black/5'
                  }`}
                >
                   <Zap className="w-6 h-6 mb-2 text-accent-purple animate-pulse" />
                   <div>
                     <h4 className="font-bold text-xs uppercase tracking-wider text-black">Express</h4>
                     <p className="text-[10px] text-mute uppercase tracking-widest mt-0.5">Trong ngày / 24H</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Section 6: Additional Options */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow">Tùy chọn nghiệp vụ</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Quyền kiểm tra hàng hóa</label>
                <select
                  value={inspectionPolicy}
                  onChange={(e) => setInspectionPolicy(e.target.value)}
                  className="w-full input-neon h-12 px-4 focus:outline-none focus:border-accent-purple text-xs text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                >
                  <option value="KHONG_XEM" className="bg-white text-black font-semibold">Không cho khách xem hàng</option>
                  <option value="XEM_KHONG_THU" className="bg-white text-black font-semibold">Cho khách xem nhưng không cho thử</option>
                  <option value="THU_HANG" className="bg-white text-black font-semibold">Cho khách thử hàng thoải mái</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Hình thức gửi lấy hàng</label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full input-neon h-12 px-4 focus:outline-none focus:border-accent-purple text-xs text-black cursor-pointer font-bold tracking-wider uppercase transition-colors"
                >
                  <option value="TU_MANG_RA_BUU_CUC" className="bg-white text-black font-semibold">Tự mang hàng ra bưu cục gần nhất</option>
                  <option value="NHAN_VIEN_DEN_LAY" className="bg-white text-black font-semibold">Bưu tá Antigravity đến tận nơi lấy hàng</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Sticky CTA Footer */}
        <div className="sticky bottom-0 w-full bg-white/80 backdrop-blur-xl p-6 border-t border-black/10 mt-auto shadow-[0_-8px_30px_rgba(0,0,0,0.03)] z-20">
           <div className="max-w-xl mx-auto w-full">
             
             {/* Live Fee Breakdown */}
             {senderAddress && estimatedFee.total_fee > 0 && (
               <div className="mb-4 bg-black/5 border border-black/10 p-4 rounded-2xl flex justify-between items-center text-xs shadow-inner animate-clip-1">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-accent-purple uppercase tracking-widest">Lộ trình: {estimatedFee.distance_km?.toFixed(1)} km</p>
                   <div className="flex gap-4 text-[10px] font-extrabold uppercase tracking-widest text-mute">
                     <span>Cước ship: <strong className="text-black">{estimatedFee.shipping_fee?.toLocaleString()}đ</strong></span>
                     {estimatedFee.insurance_fee > 0 && (
                       <span>Bảo hiểm: <strong className="text-black">{estimatedFee.insurance_fee?.toLocaleString()}đ</strong></span>
                     )}
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] text-mute uppercase font-black tracking-widest">Ước tính tổng cước:</p>
                   <p className="text-lg font-black text-black text-glow font-display">
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
               <span>{isLoading ? "ĐANG TẠO VẬN ĐƠN..." : "XÁC NHẬN TẠO ĐƠN"}</span>
               <ArrowRight className="w-4 h-4 text-white animate-pulse" />
             </button>
           </div>
        </div>
      </div>

      {/* Right Column: Map & Optimized Path Display */}
      <div className="hidden lg:block w-1/2 h-full bg-canvas-soft relative z-10">
        {estimatedFee.optimized_receivers && estimatedFee.optimized_receivers.length > 0 ? (
          <div className="absolute top-6 left-6 right-6 z-[1000] bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-4 max-w-md animate-fadeIn">
            <h4 className="text-[10px] font-black text-black uppercase tracking-widest text-glow">Lộ trình Nearest-Neighbor tối ưu</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-5 h-5 bg-black/10 text-black rounded-full flex items-center justify-center font-bold text-[9px]">G</span>
                <span className="font-semibold text-mute truncate flex-1">Xuất phát: {senderAddress}</span>
              </div>
              {estimatedFee.optimized_receivers.map((rec, legIdx) => (
                <div key={legIdx} className="flex items-center gap-3 text-xs">
                  <span className="w-5 h-5 bg-accent-purple text-white rounded-full flex items-center justify-center font-black text-[9px] shadow-[0_0_8px_#5E0ED7]">{legIdx + 1}</span>
                  <div className="flex-1 font-semibold text-black flex justify-between items-center">
                    <span className="truncate max-w-[200px] text-mute">{rec.receiver_name} ({rec.receiver_address})</span>
                    <span className="text-accent-purple font-black text-glow">{rec.distance_km.toFixed(1)} km</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-mute border-t border-black/10 pt-2.5 leading-relaxed font-bold uppercase tracking-wider">
              💡 Lộ trình đa điểm: Chặng 1 nguyên cước. Các chặng tiếp theo đi cùng tuyến đường được <span className="text-accent-purple text-glow">chiết khấu 30% cước phí</span>.
            </div>
          </div>
        ) : (
          <div className="absolute top-6 left-6 z-[1000] bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent-purple animate-pulse" />
            <span>📍 Chế độ giao hàng tiêu chuẩn</span>
          </div>
        )}

        <div className="w-full h-full absolute inset-0 z-0">
          <MapContainer 
            center={senderCoords || [21.0333, 105.8500]} 
            zoom={10} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            
            <ChangeView 
              center={senderCoords} 
              bounds={[senderCoords, ...receiverCoordsList.map(r => r.coords)]} 
            />

            {/* Route path: OSRM real road geometry or fallback straight line */}
            {(() => {
              const straightLine = [senderCoords, ...receiverCoordsList.sort((a, b) => a.index - b.index).map(r => r.coords)];
              const positions = routeGeometry || (straightLine.length >= 2 ? straightLine : null);
              if (!positions) return null;
              return (
                <>
                  {/* Shadow glow layer */}
                  <Polyline 
                    positions={positions} 
                    color="#5E0ED7" 
                    weight={10} 
                    opacity={0.12} 
                    lineCap="round" 
                    lineJoin="round"
                  />
                  {/* Main route line */}
                  <Polyline 
                    positions={positions} 
                    color="#5E0ED7" 
                    weight={5} 
                    opacity={0.85} 
                    lineCap="round" 
                    lineJoin="round"
                  />
                </>
              );
            })()}

            {senderCoords && (
              <Marker position={senderCoords} icon={purplePulsingIcon}>
                <Popup>
                  <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                    <p className="text-accent-purple">📍 ĐIỂM GỬI HÀNG</p>
                    <p className="text-[10px] text-mute mt-1">{senderAddress || 'Địa chỉ người gửi'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {receiverCoordsList.map((rec, rIdx) => (
              <Marker key={rIdx} position={rec.coords} icon={destinationNeonIcon}>
                <Popup>
                  <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                    <p className="text-accent-purple">📍 ĐIỂM NHẬN #{rec.index + 1}</p>
                    <p className="text-black mt-1 font-semibold">{rec.name}</p>
                    <p className="text-[10px] text-mute mt-0.5">{receivers[rec.index]?.receiver_address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        </div>
      </div>

      {/* Floating Success Dialog Modal - Premium Light Studio Glass */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white border border-black/10 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative flex flex-col items-center text-center animate-scale-up-card">
            
            {/* Pulsing Success Tick Icon */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-20 h-20 bg-emerald-500/10 rounded-full animate-ping opacity-60"></div>
              <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Volumetric Core Synced</span>
            <h3 className="text-xl font-black text-black uppercase tracking-widest mb-2 font-display text-glow">TẠO ĐƠN THÀNH CÔNG</h3>
            <p className="text-xs text-mute font-semibold mb-6">Đơn hàng đã được ghi nhận trên hệ thống Logistics Antigravity.</p>

            {/* Order Details Inside Modal */}
            <div className="w-full bg-black/[0.02] border border-black/5 rounded-2xl p-4 mb-6 space-y-3.5 text-left">
              <div>
                <p className="text-[9px] font-black text-mute uppercase tracking-widest mb-1.5">Mã vận đơn (Bấm để sao chép)</p>
                <div className="flex flex-col gap-2">
                  {successDetails.orderIds.map((id, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center bg-white border border-black/10 px-3.5 py-2 rounded-xl transition-all hover:border-accent-purple/35"
                    >
                      <div 
                        onClick={() => handleCopy(id)}
                        className="flex-1 flex justify-between items-center cursor-pointer hover:bg-accent-purple/5 p-1 rounded-lg mr-2 group"
                      >
                        <span className="text-xs font-black text-black tracking-widest">{id}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-black text-mute group-hover:text-accent-purple uppercase tracking-widest">
                            {copiedId === id ? 'Đã chép!' : 'Sao chép'}
                          </span>
                          {copiedId === id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-mute group-hover:text-accent-purple transition-colors" />
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintWaybill(id);
                        }}
                        disabled={printingId === id}
                        className="p-2 bg-accent-purple/10 border border-[#5E0ED7]/25 hover:border-[#5E0ED7]/50 text-[#5E0ED7] hover:bg-[#5E0ED7] hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                        title="In tem vận đơn"
                      >
                        {printingId === id ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#5E0ED7] border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-black/5 pt-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] font-black text-mute uppercase tracking-widest">Gói dịch vụ</p>
                  <p className="font-extrabold text-black uppercase mt-0.5">{serviceType}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-mute uppercase tracking-widest">Tổng cước phí</p>
                  <p className="font-black text-accent-purple text-glow text-sm mt-0.5">{successDetails.totalFee.toLocaleString()}đ</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handlePrintAllWaybills}
                className="w-full py-3.5 bg-gradient-to-r from-[#5E0ED7] to-purple-600 text-white text-[10px] font-black tracking-widest uppercase rounded-2xl hover:from-[#4f0cb5] hover:to-purple-700 transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>IN TEM VẬN ĐƠN (A6)</span>
              </button>
              <button
                onClick={() => navigate('/merchant/orders')}
                className="w-full py-3.5 bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-2xl hover:bg-black/80 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                <span>XEM DANH SÁCH ĐƠN HÀNG</span>
              </button>
              <button
                onClick={resetForm}
                className="w-full py-3.5 bg-white border border-black/10 text-black text-[10px] font-black tracking-widest uppercase rounded-2xl hover:bg-black/5 transition-all flex items-center justify-center gap-2"
              >
                <span>TIẾP TỤC TẠO ĐƠN MỚI</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
