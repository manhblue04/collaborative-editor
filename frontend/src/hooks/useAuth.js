import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export function useAuth(requireAuth = true) {
  const navigate = useNavigate();
  const { user, token, loading, error, login, register, logout, fetchMe, clearError } =
    useAuthStore();

  useEffect(() => {
    if (requireAuth && !token) {
      navigate('/login');
    }
  }, [requireAuth, token, navigate]);

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  return { user, token, loading, error, login, register, logout, clearError };
}
