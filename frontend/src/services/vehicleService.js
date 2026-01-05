import api from './api';

const vehicleService = {
  // Araçları getir
  getAllVehicles: async (params) => {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },

  // Tek araç getir
  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Araç ekle
  createVehicle: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  // Araç güncelle
  updateVehicle: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  // Araç sil
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  }
};

export default vehicleService;
