export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const USER_COLORS = [
  '#958DF1',
  '#F98181',
  '#FBBC88',
  '#FAF594',
  '#70CFF8',
  '#94FADB',
  '#B9F18D',
  '#E8A0BF',
  '#C4A1FF',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96E6A1',
  '#DDA0DD',
  '#F0E68C',
  '#87CEEB',
];

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  EDITOR: '/documents/:id',
};
