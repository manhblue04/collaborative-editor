import { create } from 'zustand';
import { authService } from '../services/authService';
import { getRandomColor } from '../utils/helpers';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  get isAuthenticated() {
    return !!get().token;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);
      const user = { ...data.user, color: getRandomColor() };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: data.token, loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Login failed',
        loading: false,
      });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.register(name, email, password);
      set({ loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Registration failed',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const data = await authService.getMe();
      const existingUser = get().user;
      const user = { ...data, color: existingUser?.color || getRandomColor() };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
