import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, Zap, DollarSign, ShieldAlert, CheckSquare, Eye } from 'lucide-react';
import L from 'leaflet';
import { OrderService, AddressService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Reusing icons
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

export default function MerchantOrder() {
  const navigate = useNavigate();
  const [addressBook, setAddressBook] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  const [serviceType, setServiceType] = useState('standard');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    length: '10',
    width: '10',
    height: '10',
    weight: '1000',
    sender_address: '',
    description: '',
    cod_amount: '0',
    declared_value: '0',
    pickup_type: 'TU_MANG_RA_BUU_CUC',
    inspection_policy: 'KHONG_XEM'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState({
    distance_km: 0,
    shipping_fee: 0,
    insurance_fee: 0,
    chargeable_weight: 0
  });

  const shopPoint = [21.0333, 105.8500]; // Hanoi Shop
  const destPoint = [20.8449, 106.6881]; // Hai Phong
  
  // Tải danh sách địa chỉ gửi
  useEffect(() => {
    async function loadAddressBook() {
      try {
        const res = await AddressService.getAddresses();
        if (res.success && res.data) {
          setAddressBook(res.data);
          // Tìm địa chỉ mặc định
          const defaultAddr = res.data.find(item => item.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id.toString());
            setFormData(prev => ({ ...prev, sender_address: defaultAddr.address }));
          } else if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].id.toString());
            setFormData(prev => ({ ...prev, sender_address: res.data[0].address }));
          }
        }
      } catch (err) {
        console.error("Failed to load address book", err);
      }
    }
    loadAddressBook();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cập nhật địa chỉ gửi khi thay đổi combo box
  const handleAddressSelectChange = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    const chosen = addressBook.find(item => item.id.toString() === id);
    if (chosen) {
      setFormData(prev => ({ ...prev, sender_address: chosen.address }));
    }
  };

  // Tính cước động thời gian thực bằng cách nghe các biến số thay đổi
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const { sender_address, address, weight, length, width, height, declared_value } = formData;
      if (sender_address && address && weight) {
        setCalculatingFee(true);
        try {
          const res = await OrderService.calculateFee(
            sender_address,
            address,
            weight,
            length,
            width,
            height,
            declared_value
          );
          if (res.success && res.data) {
            setEstimatedFee(res.data);
          }
        } catch (err) {
          console.error("Calculate fee failed dynamically", err);
        } finally {
          setCalculatingFee(false);
        }
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounce);
  }, [
    formData.sender_address,
    formData.address,
    formData.weight,
    formData.length,
    formData.width,
    formData.height,
    formData.declared_value
  ]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.sender_address) {
      alert("Vui lòng chọn địa chỉ gửi hàng trong Sổ địa chỉ trước!");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...formData, service: serviceType };
      const response = await OrderService.createOrder(payload);
      if (response.success) {
        alert("Tạo đơn thành công! Mã vận đơn: " + response.data.MaVanDon);
        navigate('/merchant/orders');
      } else {
        alert(response.message || "Tạo vận đơn thất bại.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo đơn hàng. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-canvas overflow-y-auto border-r border-gray-200">
        <div className="p-8 max-w-xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-ink mb-8">Tạo vận đơn mới</h1>
          
          <form onSubmit={handleCreateOrder} className="flex flex-col gap-8 pb-32">
            
            {/* Section 1: Địa chỉ gửi */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-ink">1. Thông tin người gửi</h3>
                <button
                  type="button"
                  onClick={() => navigate('/merchant/addresses')}
                  className="text-xs font-semibold text-primary underline hover:opacity-75"
                >
                  + Quản lý sổ địa chỉ
                </button>
              </div>
              
              {addressBook.length === 0 ? (
                <div className="bg-amber-50 p-4 border border-amber-200 rounded-none text-sm text-amber-800">
                  Bạn chưa có địa chỉ gửi nào. Vui lòng nhấn nút quản lý sổ địa chỉ để thêm mới.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-ink uppercase">Chọn địa điểm lấy hàng</label>
                  <select
                    value={selectedAddressId}
                    onChange={handleAddressSelectChange}
                    className="w-full bg-canvas-soft border-none h-12 px-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink cursor-pointer"
                  >
                    {addressBook.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.phone}) - {item.address} {item.isDefault ? '[MẶC ĐỊNH]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Section 2: Người nhận */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">2. Thông tin người nhận</h3>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Tên người nhận</label>
                <input type="text" name="name" onChange={handleInputChange} value={formData.name} placeholder="Họ và tên người nhận" className="input-uber" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Số điện thoại nhận</label>
                <input type="tel" name="phone" onChange={handleInputChange} value={formData.phone} placeholder="Số điện thoại nhận hàng" className="input-uber" required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Địa chỉ nhận</label>
                <input type="text" name="address" onChange={handleInputChange} value={formData.address} placeholder="Địa chỉ chi tiết (VD: 123 Lê Lợi, Quận 1, TP.HCM)" className="input-uber" required />
              </div>
            </div>

            {/* Section 3: Thuộc tính hàng hóa */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">3. Hàng hóa & Kích thước</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Mô tả hàng hóa</label>
                <input type="text" name="description" onChange={handleInputChange} value={formData.description} placeholder="Quần áo, phụ kiện điện thoại..." className="input-uber" required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink uppercase">Dài (cm)</label>
                  <input type="number" name="length" onChange={handleInputChange} value={formData.length} placeholder="Dài" className="input-uber" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink uppercase">Rộng (cm)</label>
                  <input type="number" name="width" onChange={handleInputChange} value={formData.width} placeholder="Rộng" className="input-uber" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-ink uppercase">Cao (cm)</label>
                  <input type="number" name="height" onChange={handleInputChange} value={formData.height} placeholder="Cao" className="input-uber" required />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Khối lượng (gram)</label>
                <input type="number" name="weight" onChange={handleInputChange} value={formData.weight} placeholder="Trọng lượng thực tế" className="input-uber" required />
              </div>
            </div>

            {/* Section 4: Thu hộ COD & Khai giá */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">4. Tài chính (COD & Bảo hiểm)</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Tiền thu hộ COD (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                  <input type="number" name="cod_amount" onChange={handleInputChange} value={formData.cod_amount} placeholder="Nhập số tiền thu hộ nếu có" className="input-uber pl-9" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink uppercase">Giá trị hàng hóa khai giá (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                  <input type="number" name="declared_value" onChange={handleInputChange} value={formData.declared_value} placeholder="Để tính phí bảo hiểm đền bù khi sự cố xảy ra" className="input-uber pl-9" />
                </div>
                <p className="text-[10px] text-mute italic">Lưu ý: Phí bảo hiểm = 0.5% giá trị hàng khai giá.</p>
              </div>
            </div>

            {/* Section 5: Gói dịch vụ */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">5. Gói dịch vụ vận chuyển</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setServiceType('standard')}
                  className={`p-4 border-2 cursor-pointer transition-colors flex flex-col justify-between h-28 ${serviceType === 'standard' ? 'border-primary bg-canvas-softer' : 'border-transparent bg-canvas-soft hover:bg-gray-200'}`}
                >
                   <Package className="w-6 h-6 mb-2" />
                   <div>
                     <h4 className="font-bold text-sm">Standard (Tiêu chuẩn)</h4>
                     <p className="text-[10px] text-secondary">2-3 ngày làm việc</p>
                   </div>
                </div>
                <div 
                  onClick={() => setServiceType('express')}
                  className={`p-4 border-2 cursor-pointer transition-colors flex flex-col justify-between h-28 ${serviceType === 'express' ? 'border-primary bg-canvas-softer' : 'border-transparent bg-canvas-soft hover:bg-gray-200'}`}
                >
                   <Zap className="w-6 h-6 mb-2 text-ink" />
                   <div>
                     <h4 className="font-bold text-sm">Express (Hỏa tốc)</h4>
                     <p className="text-[10px] text-secondary">Trong ngày / 24H</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Section 6: Các tùy chọn bổ sung */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-ink">6. Tùy chọn nghiệp vụ</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink uppercase">Quyền kiểm tra hàng hóa</label>
                <select
                  name="inspection_policy"
                  value={formData.inspection_policy}
                  onChange={handleInputChange}
                  className="w-full bg-canvas-soft border-none h-12 px-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink cursor-pointer"
                >
                  <option value="KHONG_XEM">Không cho khách xem hàng</option>
                  <option value="XEM_KHONG_THU">Cho khách xem nhưng không cho thử</option>
                  <option value="THU_HANG">Cho khách thử hàng thoải mái</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink uppercase">Hình thức gửi lấy hàng</label>
                <select
                  name="pickup_type"
                  value={formData.pickup_type}
                  onChange={handleInputChange}
                  className="w-full bg-canvas-soft border-none h-12 px-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink cursor-pointer"
                >
                  <option value="TU_MANG_RA_BUU_CUC">Tự mang hàng ra bưu cục gần nhất</option>
                  <option value="NHAN_VIEN_DEN_LAY">Bưu tá Antigravity đến tận nơi lấy hàng</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Sticky CTA Footer */}
        <div className="sticky bottom-0 w-full bg-canvas p-6 border-t border-gray-200 mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
           <div className="max-w-xl mx-auto w-full">
             
             {/* Live Fee Breakdown */}
             {(formData.sender_address && formData.address) && (
               <div className="mb-4 bg-canvas-softer border border-gray-200 p-4 flex justify-between items-center">
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-mute uppercase tracking-wider">Ước tính khoảng cách: {estimatedFee.distance_km?.toFixed(1)} km</p>
                   <div className="flex gap-4 text-xs text-secondary">
                     <span>Cước: <strong>{estimatedFee.shipping_fee?.toLocaleString()}đ</strong></span>
                     {parseFloat(formData.declared_value) > 0 && (
                       <span>Bảo hiểm: <strong>{estimatedFee.insurance_fee?.toLocaleString()}đ</strong></span>
                     )}
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-secondary">Tổng cộng dự kiến:</p>
                   <p className="text-xl font-bold text-primary">
                     {calculatingFee ? '...' : `${(estimatedFee.shipping_fee + estimatedFee.insurance_fee).toLocaleString()}đ`}
                   </p>
                 </div>
               </div>
             )}

             <button type="submit" disabled={isLoading || calculatingFee} onClick={handleCreateOrder} className="btn-primary w-full py-4 text-xl flex justify-between px-8 group disabled:opacity-50">
               <span>{isLoading ? "ĐANG TẠO..." : "TẠO VẬN ĐƠN"}</span>
             </button>
           </div>
        </div>
      </div>

      {/* Right Column: Map */}
      <div className="hidden lg:block w-1/2 h-full bg-canvas-soft relative">
         <MapContainer 
          center={[20.9391, 106.2691]} // Midpoint roughly
          zoom={9} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          {/* Route Line */}
          <Polyline 
            positions={[shopPoint, destPoint]} 
            color="#000000" 
            weight={4} 
            opacity={0.8} 
            dashArray="8, 8"
          />

          <Marker position={shopPoint} icon={pickupIcon}>
            <Popup>Kho của bạn</Popup>
          </Marker>

          <Marker position={destPoint} icon={blackPinIcon}>
            <Popup>Điểm Giao Dự Kiến</Popup>
          </Marker>

        </MapContainer>
      </div>

    </div>
  );
}
