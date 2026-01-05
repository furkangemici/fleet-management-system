import api from './api';

const maintenanceService = {
  // Tüm bakım kayıtlarını getir
  getAllMaintenances: async (params = {}) => {
    const response = await api.get('/maintenances', { params });
    return response.data;
  },

  // Bakım detayı getir
  getMaintenanceById: async (id) => {
    const response = await api.get(`/maintenances/${id}`);
    return response.data;
  },

  // Yeni bakım kaydı oluştur
  createMaintenance: async (data) => {
    const response = await api.post('/maintenances', data);
    return response.data;
  },

  // Bakım kaydını güncelle
  updateMaintenance: async (id, data) => {
    const response = await api.put(`/maintenances/${id}`, data);
    return response.data;
  },

  // Bakım kaydını sil
  deleteMaintenance: async (id) => {
    const response = await api.delete(`/maintenances/${id}`);
    return response.data;
  },

  // Bakım istatistikleri
  getMaintenanceStats: async (params = {}) => {
    const response = await api.get('/maintenances/stats', { params });
    return response.data;
  }
};

export default maintenanceService;
