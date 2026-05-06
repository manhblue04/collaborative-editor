import api from './api';

export const documentService = {
  async getAll() {
    const { data } = await api.get('/documents');
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  async create(title = 'Untitled Document') {
    const { data } = await api.post('/documents', { title });
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/documents/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  async share(id, payload) {
    const { data } = await api.post(`/documents/${id}/share`, payload);
    return data;
  },

  async getPermissions(id) {
    const { data } = await api.get(`/documents/${id}/permissions`);
    return data;
  },

  async revokePermission(id, userId) {
    const { data } = await api.delete(`/documents/${id}/share/${userId}`);
    return data;
  },

  async getState(id) {
    const { data } = await api.get(`/documents/${id}/state`);
    return data;
  },
};
