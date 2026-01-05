import api from './api';

const insuranceService = {
  getAllInsurances: async (params) => {
    const response = await api.get('/insurances', { params });
    return response.data;
  },

  getInsuranceById: async (id) => {
    const response = await api.get(`/insurances/${id}`);
    return response.data;
  },

  createInsurance: async (data) => {
    const response = await api.post('/insurances', data);
    return response.data;
  },

  updateInsurance: async (id, data) => {
    const response = await api.put(`/insurances/${id}`, data);
    return response.data;
  },

  deleteInsurance: async (id) => {
    const response = await api.delete(`/insurances/${id}`);
    return response.data;
  }
};

export default insuranceService;
