import api from './api';

export const userService = {
  async searchByEmail(email) {
    const { data } = await api.get('/users/search', { params: { email } });
    return data;
  },

  async getAll() {
    const { data } = await api.get('/users');
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
};
