import api from './axios';

export function unwrapCollection(payload) {
  return {
    items: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    meta: Array.isArray(payload?.data) ? payload.meta ?? payload : null,
  };
}

export const endpoints = {
  stats: () => api.get('/dashboard/stats'),
  clients: (params) => api.get('/clients', { params }),
  compteurs: (params) => api.get('/compteurs', { params }),
  secteurs: (params) => api.get('/secteurs', { params }),
  pannes: (params) => api.get('/pannes', { params }),
  reparations: (params) => api.get('/reparations', { params }),
  interventions: (params) => api.get('/interventions', { params }),
  users: (params) => api.get('/users', { params }),
  settings: () => api.get('/settings'),
  logs: (params) => api.get('/logs', { params }),
  technicians: (params) => api.get('/users/technicians', { params }),
  operators: (params) => api.get('/users/technicians', { params }),
  releves: (params) => api.get('/releves', { params }),
  notifications: (params) => api.get('/notifications', { params }),
  markNotificationsRead: (payload = {}) => api.post('/notifications/read', payload),
};
