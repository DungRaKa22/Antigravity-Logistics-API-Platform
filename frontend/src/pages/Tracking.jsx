import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, CheckCircle2, Navigation, AlertCircle, Loader } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { TrackingService } from '../services/api';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Uber-style Black Pin Icon
const blackPinIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDEwYzAgNy05IDEzLTkgMTNzLTktNi05LTEzYTkgOSAwIDAgMSAxOCAwemk9IiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IiNmZmZmZmYiPjwvY2lyY2xlPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzU1NTU1NSIgc3Ryb2tlPSIjNTU1NTU1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjQiIGZpbGw9IiNmZmZmZmYiPjwvY2lyY2xlPjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [trackingCode, setTrackingCode] = useState(codeParam);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (codeToSearch) => {
    if (!codeToSearch.trim()) return;
    try {
      setLoading(true);
      setError('');
      setOrderData(null);
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

  // Mock Map coordinates for visual representation
  const pickupPoint = [21.0285, 105.8542]; // Hanoi
  const dropoffPoint = [10.8231, 106.6297]; // HCMC
  const polylineCoords = [pickupPoint, dropoffPoint];

  return (
    <div className="h-[calc(100vh-64px)] relative bg-canvas-soft overflow-hidden animate-fadeIn">
      
      {/* Floating Search Bar */}
      <form onSubmit={handleSearchSubmit} className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4">
        <div className="bg-canvas rounded-full shadow-lg flex items-center p-2 border border-gray-100">
          <Search className="w-5 h-5 text-secondary ml-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Nhập mã vận đơn (VD: AG-489364)" 
            className="flex-1 bg-transparent border-none outline-none px-3 text-ink font-semibold placeholder-mute text-sm"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
          />
          <button type="submit" className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider shrink-0">
            Tra Cứu
          </button>
        </div>
      </form>

      {/* Map Layer */}
      <div className="w-full h-full absolute inset-0 z-0">
        <MapContainer 
          center={[16.0544, 106.2022]} 
          zoom={6} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <Polyline 
            positions={polylineCoords} 
            color="#a3a3a3" 
            weight={3} 
            opacity={0.6} 
            dashArray="6, 6"
          />

          <Marker position={pickupPoint} icon={pickupIcon}>
            <Popup>Điểm gửi hàng</Popup>
          </Marker>

          <Marker position={dropoffPoint} icon={pickupIcon}>
            <Popup>Điểm nhận hàng</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Dynamic Status Card */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-4">
        {loading ? (
          <div className="bg-canvas rounded-2xl p-6 shadow-2xl flex items-center justify-center gap-3">
            <Loader className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-semibold text-ink">Đang tra cứu hành trình...</span>
          </div>
        ) : error ? (
          <div className="bg-canvas rounded-2xl p-6 shadow-2xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-ink text-sm">Tra cứu thất bại</h4>
              <p className="text-xs text-secondary">{error}</p>
            </div>
          </div>
        ) : orderData ? (
          <div className="bg-canvas rounded-2xl p-6 shadow-2xl border border-gray-100 max-h-[350px] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-ink tracking-tight mb-1">Mã vận đơn: {orderData.order_id}</h2>
                <p className="text-secondary font-semibold text-xs">Ngày gửi: {orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-on-primary">
                {getStatusText(orderData.current_status)}
              </span>
            </div>

            {/* Stepper (Timeline) */}
            <div className="flex flex-col gap-0 relative pl-4">
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>
              
              {orderData.timeline && orderData.timeline.length > 0 ? (
                orderData.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start relative z-10 mb-6 last:mb-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${index === 0 ? 'bg-primary text-on-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {index === 0 ? (
                        <Navigation className="w-3 h-3 fill-current" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${index === 0 ? 'text-ink' : 'text-secondary'}`}>{getStatusText(item.status)}</h4>
                      <p className="text-xs text-secondary mt-0.5">{item.info}</p>
                      <p className="text-[10px] text-mute font-medium mt-1">
                        {new Date(item.time).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary">Chưa có hành trình cập nhật.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-canvas rounded-2xl p-6 shadow-2xl border border-gray-100 text-center">
            <h3 className="text-base font-bold text-ink mb-1">🔍 Tra Cứu Vận Đơn Thời Gian Thực</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Vui lòng nhập mã vận đơn vào ô tìm kiếm ở trên để cập nhật thông tin hành trình và định vị bưu kiện của bạn.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
