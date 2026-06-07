import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Zap, DollarSign, Trash2, Plus, ArrowRight, MapPin, Truck, HelpCircle, CheckCircle2, Copy, Check, Navigation, Printer } from 'lucide-react';
import L from 'leaflet';
import { OrderService, AddressService, TrackingService } from '../services/api';
import { fetchRouteGeometry } from '../utils/routing';
import { useNavigate } from 'react-router-dom';
import { printWaybill } from '../utils/waybill';
import LocationPickerModal from '../components/LocationPickerModal';

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

const branchNeonIcon = L.divIcon({
  className: 'custom-leaflet-branch-icon',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-35"></div>
    <div class="relative w-5 h-5 bg-[#140b27] border-3 border-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center">
      <div class="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Calculate Haversine distance client-side between two coordinates [lat, lng]
const calculateHaversineDistance = (coords1, coords2) => {
  if (!coords1 || !coords2) return 0;
  const lat1 = parseFloat(coords1[0]);
  const lon1 = parseFloat(coords1[1]);
  const lat2 = parseFloat(coords2[0]);
  const lon2 = parseFloat(coords2[1]);
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
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

export default function MerchantOrder() {
  const navigate = useNavigate();
  const [addressBook, setAddressBook] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  
  const [serviceType, setServiceType] = useState('standard');
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [pickupType, setPickupType] = useState('TU_MANG_RA_BUU_CUC');
  const [inspectionPolicy, setInspectionPolicy] = useState('KHONG_XEM');

  // Dynamic Multi-stop Receivers State
  const [receivers, setReceivers] = useState([
    {
      receiver_name: '',
      receiver_phone: '',
      receiver_address: '',
      receiver_lat: null,
      receiver_lng: null,
      description: '',
      length_cm: '10',
      width_cm: '10',
      height_cm: '10',
      weight_gram: '1000',
      cod_amount: '0',
      declared_value: '0'
    }
  ]);

  const [pickerActiveIndex, setPickerActiveIndex] = useState(null);

  const [active3dIndex, setActive3dIndex] = useState(0);

  // 3D Visualizer variables based on active package stop
  const activeRec = receivers[active3dIndex] || receivers[0] || {};
  const resolvedL = parseInt(activeRec.length_cm) || 10;
  const resolvedW = parseInt(activeRec.width_cm) || 10;
  const resolvedH = parseInt(activeRec.height_cm) || 10;
  const volumetricWeight = (resolvedL * resolvedW * resolvedH) / 6000;
  const boxStyles = {
    '--w-3d': `${Math.min(180, Math.max(45, resolvedL * 2.8))}px`,
    '--h-3d': `${Math.min(180, Math.max(8, resolvedH * 2.8))}px`,
    '--d-3d': `${Math.min(180, Math.max(45, resolvedW * 2.8))}px`,
  };

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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState(null); // OSRM real road geometry

  // Derive receiverCoordsList from receivers state
  const receiverCoordsList = useMemo(() => {
    return receivers
      .map((r, idx) => {
        if (r.receiver_lat && r.receiver_lng) {
          return {
            index: idx,
            coords: [r.receiver_lat, r.receiver_lng],
            name: r.receiver_name || `Người nhận ${idx + 1}`
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [receivers]);

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
            if (defaultAddr.lat && defaultAddr.lng) {
              setSenderCoords([parseFloat(defaultAddr.lat), parseFloat(defaultAddr.lng)]);
            }
          } else if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].id.toString());
            setSenderAddress(res.data[0].address);
            if (res.data[0].lat && res.data[0].lng) {
              setSenderCoords([parseFloat(res.data[0].lat), parseFloat(res.data[0].lng)]);
            }
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
      if (chosen.lat && chosen.lng) {
        setSenderCoords([parseFloat(chosen.lat), parseFloat(chosen.lng)]);
      }
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
        receiver_lat: null,
        receiver_lng: null,
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
    setActive3dIndex(prev => Math.min(prev, updated.length - 1));
  };

  // Simple fallback geocode for sender address if not present in address book entry
  useEffect(() => {
    if (!senderAddress) return;
    setIsGeocoding(true);
    
    const chosen = addressBook.find(item => item.id.toString() === selectedAddressId);
    if (chosen && chosen.lat && chosen.lng) {
      setSenderCoords([parseFloat(chosen.lat), parseFloat(chosen.lng)]);
      setIsGeocoding(false);
    } else {
      const delayDebounce = setTimeout(async () => {
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
        } finally {
          setIsGeocoding(false);
        }
      }, 1000);
      return () => clearTimeout(delayDebounce);
    }
  }, [senderAddress, addressBook, selectedAddressId]);

  // Trạm trung chuyển cấu hình tọa độ vùng miền
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
    if (!coords || !Array.isArray(coords) || coords.length < 2) return 'BAC';
    const lat = parseFloat(coords[0]);
    if (isNaN(lat)) return 'BAC';
    if (lat >= 19.5) return 'BAC';
    if (lat >= 14.0) return 'TRUNG';
    return 'NAM';
  };

  const getPlannedPreviewHubs = () => {
    if (!senderCoords || receiverCoordsList.length !== 1) return [];
    
    const recCoords = receiverCoordsList[0].coords;
    const clientDist = calculateHaversineDistance(senderCoords, recCoords);
    
    // If client-side distance is less than 10km, it's always direct
    if (clientDist < 10.0) return [];
    
    const hasEstimated = estimatedFee && estimatedFee.shipping_fee > 0;
    const distance = hasEstimated ? estimatedFee.distance_km : clientDist;
    
    // Skip hubs if distance is less than 10km (direct delivery)
    const isDirect = distance < 10.0;
    if (isDirect) return [];

    const senderReg = getRegion(senderCoords);
    const receiverReg = getRegion(recCoords);
    const originHub = HUBS[senderReg];
    const destHub = HUBS[receiverReg];
    
    const list = [originHub];
    if (senderReg !== receiverReg) {
      list.push(destHub);
    }
    return list;
  };

  const plannedPreviewHubs = getPlannedPreviewHubs();
  const resolvedRoutingPath = estimatedFee && estimatedFee.routing_path && estimatedFee.routing_path.length > 0
    ? estimatedFee.routing_path
    : null;

  // Fetch OSRM real road geometry when sender/receiver coordinates change
  useEffect(() => {
    if (senderCoords && receiverCoordsList.length > 0) {
      setRouteGeometry(null);
      let waypoints = [];
      if (resolvedRoutingPath) {
        waypoints = resolvedRoutingPath.map(item => [parseFloat(item.coords[0]), parseFloat(item.coords[1])]);
      } else if (receiverCoordsList.length === 1) {
        // Single stop order: apply dynamic regional routing path preview
        waypoints = [senderCoords];
        plannedPreviewHubs.forEach(hub => waypoints.push(hub.coords));
        waypoints.push(receiverCoordsList[0].coords);
      } else {
        // Multi-stop optimized path preview
        waypoints = [senderCoords, ...receiverCoordsList.sort((a, b) => a.index - b.index).map(r => r.coords)];
      }

      fetchRouteGeometry(waypoints).then((geometry) => {
        if (geometry && geometry.length > 0) {
          setRouteGeometry(geometry);
        }
      });
    } else {
      setRouteGeometry(null);
    }
  }, [senderCoords, receiverCoordsList, plannedPreviewHubs.map(h => h.name).join('|'), JSON.stringify(resolvedRoutingPath)]);

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
            singleRec.declared_value,
            senderCoords,
            singleRec.receiver_lat && singleRec.receiver_lng ? [singleRec.receiver_lat, singleRec.receiver_lng] : null
          );
          if (res.success && res.data) {
            setEstimatedFee({
              distance_km: res.data.distance_km,
              shipping_fee: res.data.shipping_fee,
              insurance_fee: res.data.insurance_fee,
              total_fee: res.data.shipping_fee + res.data.insurance_fee,
              chargeable_weight: res.data.chargeable_weight,
              routing_path: res.data.routing_path,
              optimized_receivers: []
            });
          }
        } else {
          // Multi-stop optimizations & calculations
          const payload = {
            sender_address: senderAddress,
            sender_lat: senderCoords ? senderCoords[0] : null,
            sender_lng: senderCoords ? senderCoords[1] : null,
            receivers: receivers.map(r => ({
              receiver_name: r.receiver_name,
              receiver_phone: r.receiver_phone,
              receiver_address: r.receiver_address,
              receiver_lat: r.receiver_lat,
              receiver_lng: r.receiver_lng,
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
          inspection_policy: inspectionPolicy,
          sender_lat: senderCoords ? senderCoords[0] : null,
          sender_lng: senderCoords ? senderCoords[1] : null,
          receiver_lat: singleRec.receiver_lat,
          receiver_lng: singleRec.receiver_lng
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
          sender_lat: senderCoords ? senderCoords[0] : null,
          sender_lng: senderCoords ? senderCoords[1] : null,
          service_package_id: serviceType === 'express' ? 2 : 1,
          pickup_type: pickupType,
          inspection_policy: inspectionPolicy,
          receivers: receivers.map(r => ({
            receiver_name: r.receiver_name,
            receiver_phone: r.receiver_phone,
            receiver_address: r.receiver_address,
            receiver_lat: r.receiver_lat,
            receiver_lng: r.receiver_lng,
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
        receiver_lat: null,
        receiver_lng: null,
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-135px)] gap-6 overflow-hidden bg-transparent w-full animate-fade-in">
      
      {/* Left Column: Form Canvas */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white/60 border border-black/10 rounded-[24px] shadow-sm overflow-y-auto custom-scrollbar relative z-10 backdrop-blur-md">
        
        <div className="p-8 max-w-xl mx-auto w-full relative z-10">
          <div className="flex justify-between items-center mb-8 border-b border-black/10 pb-4">
            <div>
              <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">Volumetric Core</span>
              <h1 className="text-2xl font-black text-black tracking-widest uppercase font-display text-glow-purple">Tạo Vận Đơn</h1>
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
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-mute uppercase tracking-widest">Địa chỉ nhận</label>
                      <button
                        type="button"
                        onClick={() => setPickerActiveIndex(index)}
                        className="text-[10px] font-black text-accent-purple uppercase tracking-widest hover:underline transition-all cursor-pointer"
                      >
                        📍 Chọn trên bản đồ
                      </button>
                    </div>
                    <input
                      type="text"
                      value={rec.receiver_address}
                      onChange={(e) => handleReceiverChange(index, 'receiver_address', e.target.value)}
                      placeholder="Chọn địa điểm nhận hàng trên bản đồ"
                      className="input-neon font-semibold text-sm cursor-pointer bg-white"
                      onClick={() => setPickerActiveIndex(index)}
                      readOnly
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-black uppercase tracking-widest text-glow">Gói dịch vụ vận chuyển</h3>
                <button
                  type="button"
                  onClick={() => setShowServiceDetail(true)}
                  className="text-[10px] font-black text-accent-purple hover:text-accent-purple/80 uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1"
                >
                  Xem chi tiết gói
                </button>
              </div>
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
               <div className="mb-4 bg-black/5 border border-black/10 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs shadow-inner gap-3 animate-clip-1">
                 <div className="space-y-1.5 w-full sm:w-auto">
                   <div className="flex flex-wrap items-center gap-2">
                     <p className="text-[9px] font-black text-accent-purple uppercase tracking-widest">Lộ trình: {estimatedFee.distance_km?.toFixed(1)} km</p>
                     <span className="text-[9px] font-extrabold text-white bg-accent-purple/80 px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
                       {estimatedFee.distance_km <= 30.0 ? 'Nội tỉnh' : estimatedFee.distance_km <= 300.0 ? 'Nội miền' : 'Liên miền'}
                     </span>
                     {receivers[0] && (parseInt(receivers[0].length_cm || 0) + parseInt(receivers[0].width_cm || 0) + parseInt(receivers[0].height_cm || 0)) < 100 && (
                       <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
                         Miễn cồng kềnh (&lt;100cm)
                       </span>
                     )}
                   </div>
                   <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-extrabold uppercase tracking-widest text-mute">
                     <span>Cước ship: <strong className="text-black">{estimatedFee.shipping_fee?.toLocaleString()}đ</strong></span>
                     {estimatedFee.insurance_fee > 0 ? (
                       <span>Bảo hiểm: <strong className="text-black">{estimatedFee.insurance_fee?.toLocaleString()}đ</strong></span>
                     ) : (
                       <span className="text-[9.5px] text-emerald-600 font-black lowercase tracking-normal">miễn phí bảo hiểm (&lt;1M)</span>
                     )}
                   </div>
                   {resolvedRoutingPath && (
                     <div className="text-[10px] text-mute font-bold flex flex-wrap items-center gap-1.5 mt-2 bg-white/50 border border-black/5 p-2 rounded-xl">
                       <span className="text-[9px] font-black uppercase text-accent-purple shrink-0">Tuyến đường:</span>
                       {resolvedRoutingPath.map((item, idx) => (
                         <React.Fragment key={idx}>
                           <span className={item.type.startsWith('branch') ? 'text-blue-600 font-extrabold' : item.type.startsWith('hub') ? 'text-amber-600 font-extrabold' : 'text-black font-semibold'}>
                             {item.name}
                           </span>
                           {idx < resolvedRoutingPath.length - 1 && <span className="text-mute opacity-50 font-normal">➡️</span>}
                         </React.Fragment>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="text-left sm:text-right shrink-0">
                   <p className="text-[9px] text-mute uppercase font-black tracking-widest">
                     Tính cước: {estimatedFee.chargeable_weight ? `${((estimatedFee.chargeable_weight) / 1000).toFixed(2)} kg` : '...'}
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
               <span>{isLoading ? "ĐANG TẠO VẬN ĐƠN..." : "XÁC NHẬN TẠO ĐƠN"}</span>
               <ArrowRight className="w-4 h-4 text-white animate-pulse" />
             </button>
           </div>
        </div>
      </div>

      {/* Right Column: Dynamic 3D Box & Leaflet Maps */}
      <div className="hidden lg:flex w-1/2 flex-col gap-6 h-full relative z-10">
        
        {/* Top Pane: 3D Holographic box visualizer */}
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

          {/* Package visualizer selector tabs for multi-stop orders */}
          {receivers.length > 1 ? (
            <div className="absolute top-4 left-4 z-[1000] flex gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
              {receivers.map((_, rIdx) => (
                <button
                  key={rIdx}
                  type="button"
                  onClick={() => setActive3dIndex(rIdx)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    active3dIndex === rIdx
                      ? 'bg-accent-purple text-white shadow-[0_0_10px_#5E0ED7]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Gói #{rIdx + 1}
                </button>
              ))}
            </div>
          ) : (
            <div className="absolute top-4 left-4 flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[8px] font-black text-emerald-400 tracking-wider uppercase">3D Render Projection</span>
            </div>
          )}

          <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black tracking-widest text-black border border-black/5 shadow-md">
            TRỌNG LƯỢNG QUY ĐỔI: {volumetricWeight.toFixed(2)} kg (Gói {receivers.length > 1 ? `#${active3dIndex + 1}` : ''})
          </div>
        </div>

        {/* Bottom Pane: Route map */}
        <div className="w-full h-[58%] bg-white/60 border border-black/10 rounded-[24px] shadow-sm overflow-hidden relative backdrop-blur-md">
          {estimatedFee.optimized_receivers && estimatedFee.optimized_receivers.length > 0 ? (
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-xl p-4.5 rounded-2xl border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.05)] space-y-3 max-w-sm animate-fadeIn">
              <h4 className="text-[9px] font-black text-black uppercase tracking-widest text-glow">Lộ trình đa điểm tối ưu</h4>
              <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-4.5 h-4.5 bg-black/10 text-black rounded-full flex items-center justify-center font-bold text-[8.5px]">G</span>
                  <span className="font-semibold text-mute truncate flex-1">Xuất phát: {senderAddress}</span>
                </div>
                {estimatedFee.optimized_receivers.map((rec, legIdx) => (
                  <div key={legIdx} className="flex items-center gap-2.5 text-[11px]">
                    <span className="w-4.5 h-4.5 bg-accent-purple text-white rounded-full flex items-center justify-center font-black text-[8.5px] shadow-[0_0_8px_#5E0ED7]">{legIdx + 1}</span>
                    <div className="flex-1 font-semibold text-black flex justify-between items-center">
                      <span className="truncate max-w-[150px] text-mute">{rec.receiver_name}</span>
                      <span className="text-accent-purple font-black text-glow">{rec.distance_km.toFixed(1)} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 z-[1000] bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
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
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <ChangeView 
                center={senderCoords} 
                bounds={[senderCoords, ...receiverCoordsList.map(r => r.coords)]} 
              />

              {/* Route path: OSRM real road geometry or fallback straight line */}
              {(() => {
                let straightLine = [senderCoords, ...receiverCoordsList.sort((a, b) => a.index - b.index).map(r => r.coords)];
                if (receiverCoordsList.length === 1) {
                  straightLine = [
                    senderCoords,
                    ...plannedPreviewHubs.map(hub => hub.coords),
                    receiverCoordsList[0].coords
                  ];
                }
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

              {resolvedRoutingPath ? (
                resolvedRoutingPath.map((item, idx) => {
                  if (item.type === 'branch_sender' || item.type === 'branch_receiver') {
                    return (
                      <Marker key={`branch-${idx}`} position={item.coords} icon={branchNeonIcon}>
                        <Popup>
                          <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                            <p className="text-blue-500 font-black">🏢 CHI NHÁNH PHỤ TRÁCH</p>
                            <p className="text-black mt-1 font-semibold">{item.name}</p>
                            <p className="text-[10px] text-mute mt-0.5 leading-normal italic">
                              {item.type === 'branch_sender' ? 'Chi nhánh gom/nhận hàng nguồn.' : 'Chi nhánh phát/giao hàng đầu nhận.'}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  if (item.type === 'hub_sender' || item.type === 'hub_receiver') {
                    return (
                      <Marker key={`hub-${idx}`} position={item.coords} icon={hubNeonIcon}>
                        <Popup>
                          <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                            <p className="text-amber-500 font-black">🏢 KHO TRUNG CHUYỂN</p>
                            <p className="text-black mt-1 font-semibold">{item.name}</p>
                            <p className="text-[10px] text-mute mt-0.5 leading-normal italic">
                              {item.type === 'hub_sender' ? 'Tổng kho trung chuyển xuất phát.' : 'Tổng kho trung chuyển nhận hàng.'}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })
              ) : (
                plannedPreviewHubs.map((hub, idx) => (
                  <Marker key={`preview-hub-${idx}`} position={hub.coords} icon={hubNeonIcon}>
                    <Popup>
                      <div className="text-black text-xs font-bold uppercase tracking-wider p-1">
                        <p className="text-amber-500 font-black">🏢 {hub.name.includes('Miền Bắc') ? 'KHO TRUNG CHUYỂN MIỀN BẮC' : hub.name.includes('Miền Trung') ? 'KHO TRUNG CHUYỂN MIỀN TRUNG' : 'KHO TRUNG CHUYỂN MIỀN NAM'}</p>
                        <p className="text-black mt-1 font-semibold">{hub.name.split(' (')[1]?.replace(')', '') || 'Trạm trung chuyển'}</p>
                        <p className="text-[10px] text-mute mt-0.5 leading-normal italic">
                          {plannedPreviewHubs.length === 1 
                            ? 'Trạm trung chuyển chặng nội miền bắt buộc.' 
                            : idx === 0 
                              ? 'Trạm trung chuyển đầu nguồn (Xuất phát).' 
                              : 'Trạm trung chuyển cuối nguồn (Đến miền nhận).'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))
              )}

            </MapContainer>
          </div>
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

      {/* Modal Chọn Vị Trí Trên Bản Đồ Cho Người Nhận */}
      <LocationPickerModal
        isOpen={pickerActiveIndex !== null}
        onClose={() => setPickerActiveIndex(null)}
        onConfirm={(loc) => {
          if (pickerActiveIndex !== null) {
            handleReceiverChange(pickerActiveIndex, 'receiver_address', loc.address);
            handleReceiverChange(pickerActiveIndex, 'receiver_lat', loc.lat);
            handleReceiverChange(pickerActiveIndex, 'receiver_lng', loc.lng);
          }
        }}
        initialCoords={
          pickerActiveIndex !== null && receivers[pickerActiveIndex]?.receiver_lat && receivers[pickerActiveIndex]?.receiver_lng
            ? [receivers[pickerActiveIndex].receiver_lat, receivers[pickerActiveIndex].receiver_lng]
            : (senderCoords || [21.0285, 105.8542])
        }
        title={`Chọn địa chỉ giao hàng ${receivers.length > 1 ? `#${pickerActiveIndex + 1}` : ''}`}
      />

      {/* Service Package Detail Comparison Modal */}
      {showServiceDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white border border-black/10 rounded-3xl p-8 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative flex flex-col animate-scale-up-card">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10">
              <div>
                <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">
                  Bảng so sánh chi tiết
                </span>
                <h3 className="text-xl font-black text-black uppercase tracking-widest font-display text-glow">
                  Gói dịch vụ vận chuyển
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowServiceDetail(false)}
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 hover:border-black/20 transition-all text-black font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Standard Column */}
              <div className="bg-black/[0.01] border border-black/5 rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                      <Package className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-black uppercase tracking-wider">Standard</h4>
                      <p className="text-[9px] text-mute font-bold tracking-widest uppercase">Vận chuyển tiêu chuẩn</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3.5 mb-6">
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span><strong>Cước cơ bản:</strong> 15,000 VNĐ</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span><strong>Thời gian giao nhận:</strong> 2 - 3 ngày làm việc</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span><strong>Quy đổi cồng kềnh:</strong> Hệ số 6000 (Dài × Rộng × Cao / 6000)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span>Phù hợp với hàng hóa thông thường, không cần giao gấp.</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setServiceType('standard');
                    setShowServiceDetail(false);
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    serviceType === 'standard'
                      ? 'bg-black text-white'
                      : 'border border-black/10 hover:border-black/25 text-black'
                  }`}
                >
                  {serviceType === 'standard' ? 'Đang chọn' : 'Chọn gói Standard'}
                </button>
              </div>

              {/* Express Column */}
              <div className="bg-accent-purple/5 border border-accent-purple/20 rounded-2xl p-6 relative flex flex-col justify-between">
                <div className="absolute top-3 right-3 bg-accent-purple text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest animate-pulse">
                  Hoả Tốc
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent-purple animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-black uppercase tracking-wider">Express</h4>
                      <p className="text-[9px] text-accent-purple font-bold tracking-widest uppercase">Giao hỏa tốc 24H</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3.5 mb-6">
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-accent-purple font-black">⚡</span>
                      <span><strong>Cước cơ bản:</strong> 30,000 VNĐ</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-accent-purple font-black">⚡</span>
                      <span><strong>Thời gian giao nhận:</strong> Trong vòng 24H (Nội thành)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-accent-purple font-black">⚡</span>
                      <span><strong>Quy đổi cồng kềnh:</strong> Hệ số 5000 (Dài × Rộng × Cao / 5000)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-mute font-semibold">
                      <span className="text-accent-purple font-black">⚡</span>
                      <span>Ưu tiên bốc xếp và điều phối giao nhận nhanh nhất.</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setServiceType('express');
                    setShowServiceDetail(false);
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    serviceType === 'express'
                      ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20'
                      : 'border border-accent-purple/20 hover:border-accent-purple/40 text-accent-purple'
                  }`}
                >
                  {serviceType === 'express' ? 'Đang chọn' : 'Chọn gói Express'}
                </button>
              </div>
            </div>

            {/* Note text */}
            <p className="text-[10px] text-mute font-semibold text-center uppercase tracking-wider">
              * Hệ số quy đổi cồng kềnh được dùng để tính khối lượng quy đổi từ kích thước vật lý của kiện hàng.
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
