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
    <div className="bg-canvas min-h-screen py-8 px-6 lg:px-16 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-[32px] font-bold text-ink tracking-tight mb-1">Sổ địa chỉ</h1>
          <p className="text-secondary text-sm">Lưu giữ thông tin liên hệ và địa chỉ lấy hàng thường dùng</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-on-primary font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm địa chỉ mới
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl mb-8 border border-amber-100">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <section className="mb-8">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mute" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tên liên hệ hoặc số điện thoại..."
            className="w-full h-14 pl-12 pr-4 bg-canvas-soft border-none focus:ring-1 focus:ring-primary text-sm rounded-none text-ink placeholder-mute"
          />
        </div>
      </section>

      {/* Address Grid */}
      {loading ? (
        <div className="text-center py-12 text-secondary text-sm">
          Đang tải danh sách địa chỉ...
        </div>
      ) : filteredAddresses.length === 0 ? (
        <div className="text-center py-12 text-secondary text-sm border border-dashed border-gray-200 rounded-2xl">
          Không tìm thấy địa chỉ nào trong sổ địa chỉ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddresses.map((item) => (
            <div
              key={item.id}
              className={`bg-canvas border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 min-h-[240px] ${
                item.isDefault ? 'border-primary shadow-sm bg-gray-50/20' : 'border-gray-200 hover:border-primary'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg text-ink tracking-tight uppercase break-all">
                    {item.name}
                  </h3>
                  {item.isDefault && (
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary font-medium mb-4">{item.phone}</p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-body leading-relaxed">{item.address}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-50 mt-4">
                <div>
                  {!item.isDefault && (
                    <button
                      onClick={() => handleSetDefault(item.id)}
                      className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5" /> Đặt mặc định
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-mute hover:text-red-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-canvas w-full max-w-lg rounded-2xl overflow-hidden flex flex-col relative z-10 animate-scaleUp border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-lg text-ink uppercase tracking-tight">Thêm địa chỉ mới</h2>
              <button onClick={() => setShowModal(false)} className="text-ink hover:opacity-50 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink uppercase block">Tên liên hệ</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-canvas-soft border-none h-12 px-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink placeholder-mute"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink uppercase block">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full bg-canvas-soft border-none h-12 px-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink placeholder-mute"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink uppercase block">Địa chỉ chi tiết</label>
                  <textarea
                    required
                    rows="3"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full bg-canvas-soft border-none p-4 rounded-none focus:ring-1 focus:ring-primary text-sm text-ink placeholder-mute resize-none"
                  ></textarea>
                </div>
                
                {/* Default Address Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefaultForm}
                    onChange={(e) => setIsDefaultForm(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium text-ink select-none cursor-pointer">
                    Đặt địa chỉ này làm mặc định lấy hàng
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end items-center gap-4 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm font-semibold text-secondary hover:text-ink transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition-all min-w-[120px]"
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
