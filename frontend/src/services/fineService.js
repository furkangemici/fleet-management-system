import api from './api';

const fineService = {
  // Tüm cezaları getir
  getAllFines: async (params) => {
    try {
      const response = await api.get('/fines', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // İstatistikleri getir
  getStats: async (params) => {
    try {
      const response = await api.get('/fines/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Yeni ceza oluştur
  createFine: async (data) => {
    try {
      const response = await api.post('/fines', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cezayı güncelle
  updateFine: async (id, data) => {
    try {
      const response = await api.put(`/fines/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cezayı sil
  deleteFine: async (id) => {
    try {
      const response = await api.delete(`/fines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default fineService;
