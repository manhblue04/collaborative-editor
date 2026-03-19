import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/helpers';
import Button from '../common/Button';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
            CE
          </div>
          <span className="hidden sm:block text-lg font-semibold text-gray-900">
            CollabEdit
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: user.color || '#3b82f6' }}
              >
                {getInitials(user.name)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
