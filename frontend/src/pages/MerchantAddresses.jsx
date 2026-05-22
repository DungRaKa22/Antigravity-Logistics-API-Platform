import React, { useState, useEffect } from 'react';
import { AddressService } from '../services/api';
import { Search, Plus, Trash2, X, Star } from 'lucide-react';

export default function MerchantAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Trạng thái modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [isDefaultForm, setIsDefaultForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch danh sách địa chỉ từ API
  async function fetchAddresses() {
    try {
      setLoading(true);
      const res = await AddressService.getAddresses();
      if (res.success) {
        setAddresses(res.data || []);
      } else {
        setError(res.message || 'Không thể tải danh sách địa chỉ.');
      }
    } catch (err) {
      console.error("Fetch Addresses Error:", err);
      setError('Lỗi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Tìm kiếm địa chỉ
  const filteredAddresses = addresses.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm) ||
    item.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Thêm địa chỉ mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !addressDetail.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await AddressService.createAddress({
        name: name.trim(),
        phone: phone.trim(),
        address: addressDetail.trim(),
        isDefault: isDefaultForm
      });

      if (res.success) {
        // Làm mới danh sách địa chỉ
        await fetchAddresses();
        // Reset form và đóng modal
        setName('');
        setPhone('');
        setAddressDetail('');
        setIsDefaultForm(false);
        setShowModal(false);
      } else {
        alert(res.message || 'Thêm địa chỉ thất bại.');
      }
    } catch (err) {
      console.error("Create Address Error:", err);
      alert('Đã xảy ra lỗi khi lưu địa chỉ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Đặt địa chỉ làm mặc định
  const handleSetDefault = async (id) => {
    try {
      const res = await AddressService.setDefaultAddress(id);
      if (res.success) {
        // Cập nhật state trực tiếp hoặc reload
        await fetchAddresses();
      } else {
        alert(res.message || 'Thiết lập địa chỉ mặc định thất bại.');
      }
    } catch (err) {
      console.error("Set Default Error:", err);
      alert('Đã xảy ra lỗi khi đặt địa chỉ mặc định.');
    }
  };

  // Xóa địa chỉ
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      const res = await AddressService.deleteAddress(id);
      if (res.success) {
        setAddresses(prev => prev.filter(item => item.id !== id));
      } else {
        alert(res.message || 'Xóa địa chỉ thất bại.');
      }
    } catch (err) {
      console.error("Delete Address Error:", err);
      alert('Đã xảy ra lỗi khi xóa địa chỉ.');
    }
  };

  return (
    <div className="bg-canvas min-h-screen py-10 px-6 lg:px-16 relative overflow-hidden">
      {/* Advanced Neon Aurora Background Blobs */}
      <div className="neon-aurora-blob bg-accent-purple/10 w-[600px] h-[600px] -top-20 -left-20 animate-pulse"></div>
      <div className="neon-aurora-blob bg-cyan-500/5 w-[500px] h-[500px] bottom-10 right-10 animate-pulse" style={{ animationDuration: '6s' }}></div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-6 border-b border-black/10 relative z-10">
        <div>
          <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest block mb-1">Address Book</span>
          <h1 className="text-3xl font-black text-black tracking-widest uppercase font-display text-glow-purple">Sổ địa chỉ</h1>
          <p className="text-mute text-xs font-semibold uppercase tracking-wider mt-1">Lưu giữ thông tin liên hệ và địa chỉ lấy hàng thường dùng</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-6 py-3 text-xs uppercase tracking-widest font-extrabold flex items-center gap-2 h-12"
        >
          <Plus className="w-4 h-4 text-white" /> Thêm địa chỉ mới
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-xs p-4 rounded-xl mb-8 border border-rose-200 font-bold uppercase tracking-wider relative z-10">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <section className="mb-8 relative z-10">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-purple" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tên liên hệ hoặc số điện thoại..."
            className="w-full input-neon h-14 pl-12 pr-4 focus:shadow-[0_0_20px_rgba(94,14,215,0.08)] text-xs font-bold uppercase tracking-wider text-black placeholder-mute transition-all duration-300"
          />
        </div>
      </section>

      {/* Address Grid */}
      {loading ? (
        <div className="text-center py-12 text-mute font-bold uppercase tracking-widest animate-pulse relative z-10">
          Đang tải danh sách địa chỉ...
        </div>
      ) : filteredAddresses.length === 0 ? (
        <div className="text-center py-12 text-mute font-bold uppercase tracking-wider border border-dashed border-black/10 rounded-2xl relative z-10 bg-white/40">
          Không tìm thấy địa chỉ nào trong sổ địa chỉ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredAddresses.map((item) => (
            <div
              key={item.id}
              className={`glow-card p-6 flex flex-col justify-between transition-all duration-300 min-h-[240px] relative overflow-hidden group ${
                item.isDefault 
                  ? 'border-accent-purple/40 bg-accent-purple/[0.03] shadow-[0_4px_20px_rgba(94,14,215,0.08)]' 
                  : 'border-black/10 bg-white/50 hover:border-accent-purple/30'
              }`}
            >
              {item.isDefault && (
                <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-accent-purple/5 rounded-bl-[80px] pointer-events-none"></div>
              )}
              
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-black text-base text-black tracking-widest uppercase break-all font-display text-glow-purple">
                    {item.name}
                  </h3>
                  {item.isDefault && (
                    <span className="bg-accent-purple text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase shrink-0 shadow-[0_2px_8px_rgba(94,14,215,0.18)]">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-xs text-mute font-bold tracking-wider mb-4 uppercase">{item.phone}</p>
                <div className="pt-4 border-t border-black/5">
                  <p className="text-xs text-black leading-relaxed font-semibold">{item.address}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-black/5 mt-4">
                <div>
                  {!item.isDefault && (
                    <button
                      onClick={() => handleSetDefault(item.id)}
                      className="text-[10px] font-black text-mute hover:text-accent-purple uppercase tracking-widest transition-all duration-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-accent-purple animate-pulse" /> Đặt mặc định
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-mute hover:text-rose-600 hover:scale-115 transition-all cursor-pointer rounded-lg bg-transparent hover:bg-rose-50 border border-transparent hover:border-rose-200"
                  title="Xóa địa chỉ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay Thêm Địa Chỉ */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-3xl overflow-hidden flex flex-col relative z-10 animate-slide-up-card border border-black/10 shadow-[0_15px_50px_rgba(0,0,0,0.1)]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center bg-black/[0.02]">
              <h2 className="font-black text-sm text-black uppercase tracking-widest font-display text-glow-purple">Thêm địa chỉ mới</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-black hover:text-accent-purple hover:scale-115 transition-all p-2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-mute uppercase tracking-widest block">Tên liên hệ</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full input-neon px-4 py-3.5 text-sm text-black placeholder-mute focus:outline-none focus:border-accent-purple transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-mute uppercase tracking-widest block">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full input-neon px-4 py-3.5 text-sm text-black placeholder-mute focus:outline-none focus:border-accent-purple transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-mute uppercase tracking-widest block">Địa chỉ chi tiết</label>
                  <textarea
                    required
                    rows="3"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full input-neon p-4 text-sm text-black placeholder-mute resize-none font-semibold"
                  ></textarea>
                </div>
                
                {/* Default Address Checkbox */}
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefaultForm}
                    onChange={(e) => setIsDefaultForm(e.target.checked)}
                    className="rounded border-black/20 bg-white text-accent-purple focus:ring-accent-purple w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isDefault" className="text-xs font-bold text-black uppercase tracking-wider select-none cursor-pointer">
                    Đặt địa chỉ này làm mặc định lấy hàng
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-black/5 flex justify-end items-center gap-4 bg-black/[0.02]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-xs font-black text-mute hover:text-black uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-6 py-3 text-xs uppercase tracking-widest font-extrabold min-w-[120px]"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
