import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token JWT vào header của mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const AuthService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username, password, fullname) => {
    const response = await api.post('/auth/register', { username, password, fullname });
    return response.data;
  },
  getUsers: async (role = '', month = '', year = '') => {
    const response = await api.get(`/auth/users?role=${role}&month=${month}&year=${year}`);
    return response.data;
  },
  createStaff: async (staffData) => {
    const response = await api.post('/auth/staff', staffData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  updateShipperConfig: async (shipperId, configData) => {
    const response = await api.put(`/auth/users/${shipperId}/shipper-config`, configData);
    return response.data;
  }

};

export const OrderService = {
  // Tính cước
  calculateFee: async (pickup, dropoff, weight, length = 10, width = 10, height = 10, declaredValue = 0) => {
    try {
      const response = await api.post('/orders/calculate', {
        sender_address: pickup,
        receiver_address: dropoff,
        weight_gram: parseInt(weight) || 1000,
        length_cm: parseInt(length) || 10,
        width_cm: parseInt(width) || 10,
        height_cm: parseInt(height) || 10,
        declared_value: parseFloat(declaredValue) || 0
      });
      return response.data;
    } catch (error) {
      console.error("Calculate Fee Error:", error);
      throw error;
    }
  },

  // Tạo đơn hàng
  createOrder: async (orderData) => {
    try {
      const payload = {
        receiver_name: orderData.name,
        receiver_phone: orderData.phone,
        receiver_address: orderData.address,
        sender_address: orderData.sender_address, // Lấy động từ địa chỉ gửi được chọn
        weight_gram: parseInt(orderData.weight) || 1000,
        length_cm: parseInt(orderData.length) || 10,
        width_cm: parseInt(orderData.width) || 10,
        height_cm: parseInt(orderData.height) || 10,
        service_package_id: orderData.service === 'express' ? 2 : 1,
        description: orderData.description || "Đơn tạo từ Merchant Portal",
        cod_amount: parseFloat(orderData.cod_amount) || 0,
        declared_value: parseFloat(orderData.declared_value) || 0,
        pickup_type: orderData.pickup_type || "TU_MANG_RA_BUU_CUC",
        inspection_policy: orderData.inspection_policy || "KHONG_XEM"
      };
      
      const response = await api.post('/orders/', payload);
      return response.data;
    } catch (error) {
      console.error("Create Order Error:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của người dùng hiện tại
  getOrders: async () => {
    try {
      const response = await api.get('/orders/');
      return response.data;
    } catch (error) {
      console.error("Get Orders Error:", error);
      throw error;
    }
  },

  // Tính cước đa điểm
  calculateMultistopFee: async (multistopData) => {
    const response = await api.post('/orders/calculate-multistop', multistopData);
    return response.data;
  },

  // Tạo đơn hàng đa điểm
  createMultistopOrder: async (multistopData) => {
    const response = await api.post('/orders/multistop', multistopData);
    return response.data;
  },

  // Gán shipper cho đơn hàng
  assignShipper: async (orderId, shipperId) => {
    const response = await api.put(`/orders/${orderId}/assign`, { shipper_id: shipperId });
    return response.data;
  },

  // Lấy danh sách đơn được gán cho Shipper
  getAssignedOrders: async () => {
    const response = await api.get('/orders/assigned');
    return response.data;
  },

  // Shipper cập nhật đơn hàng
  staffUpdateOrder: async (orderId, updateData) => {
    const response = await api.put(`/orders/${orderId}/staff-update`, updateData);
    return response.data;
  }
};

export const TrackingService = {
  // Tra cứu hành trình
  trackOrder: async (trackingCode) => {
    try {
      const response = await api.get(`/tracking/${trackingCode}`);
      return response.data;
    } catch (error) {
      console.error("Tracking Error:", error);
      throw error;
    }
  }
};

export const FinanceService = {
  // Lấy danh sách đối soát tài chính
  getReconciliations: async (invoiceId = '') => {
    try {
      const url = invoiceId ? `/reconciliations/?invoice_id=${invoiceId}` : '/reconciliations/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Get Reconciliations Error:", error);
      throw error;
    }
  },
  
  // Thanh toán một bản ghi đối soát lẻ (Admin dùng)
  payReconciliation: async (id) => {
    const response = await api.put(`/reconciliations/${id}/pay`);
    return response.data;
  },

  // Tạo hóa đơn đối soát
  createInvoice: async (invoiceData = {}) => {
    const response = await api.post('/reconciliations/invoice', invoiceData);
    return response.data;
  },

  // Lấy danh sách hóa đơn đối soát
  getInvoices: async () => {
    const response = await api.get('/reconciliations/invoices');
    return response.data;
  },

  // Duyệt thanh toán hóa đơn
  payInvoice: async (invoiceId) => {
    const response = await api.put(`/reconciliations/invoices/${invoiceId}/pay`);
    return response.data;
  }
};

export const AddressService = {
  // Lấy danh sách địa chỉ
  getAddresses: async (query = '') => {
    try {
      const response = await api.get(`/address-book/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Get Addresses Error:", error);
      throw error;
    }
  },
  // Thêm địa chỉ mới
  createAddress: async (addressData) => {
    try {
      const response = await api.post('/address-book/', addressData);
      return response.data;
    } catch (error) {
      console.error("Create Address Error:", error);
      throw error;
    }
  },
  // Đặt địa chỉ mặc định
  setDefaultAddress: async (id) => {
    try {
      const response = await api.put(`/address-book/${id}/set-default`);
      return response.data;
    } catch (error) {
      console.error("Set Default Address Error:", error);
      throw error;
    }
  },
  // Xóa địa chỉ
  deleteAddress: async (id) => {
    try {
      const response = await api.delete(`/address-book/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete Address Error:", error);
      throw error;
    }
  }
};

