import api from './api';

const notificationService = {
  getAll: (limit = 100) => api.get(`/notifications?limit=${limit}`).then(res => res.data.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put(`/notifications/read-all`),
  deleteAll: () => api.delete(`/notifications/delete-all`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;
