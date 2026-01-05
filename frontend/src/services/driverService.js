import api from './api';

const driverService = {
  // Sürücüleri getir (filtreleme ile)
  getAllDrivers: async (params) => {
    const response = await api.get('/drivers', { params });
    return response.data;
  },

  // Tek sürücü getir
  getDriverById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },

  // Sürücü ekle
  createDriver: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data;
  },

  // Sürücü güncelle
  updateDriver: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },

  // Sürücü sil
  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  }
};

export default driverService;
