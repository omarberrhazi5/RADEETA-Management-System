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
  users: (params) => api.get('/users', { params }),
  operators: (params) => api.get('/users/operators', { params }),
  releves: (params) => api.get('/releves', { params }),
  factures: (params) => api.get('/factures', { params }),
  paiements: (params) => api.get('/paiements', { params }),
  tariffSettings: () => api.get('/tariff-settings'),
  notifications: (params) => api.get('/notifications', { params }),
  markNotificationsRead: (payload = {}) => api.post('/notifications/read', payload),
};
