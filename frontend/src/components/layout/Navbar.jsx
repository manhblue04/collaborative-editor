import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/helpers';

const { Text } = Typography;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div className="font-medium">{user?.name}</div>
          <Text type="secondary" className="!text-xs">
            {user?.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm">
            CE
          </div>
          <span className="hidden sm:block text-lg font-semibold text-gray-900">
            CollabEdit
          </span>
        </Link>

        {user && (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors">
              <Avatar style={{ backgroundColor: user.color || '#2563eb' }}>
                {getInitials(user.name)}
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-gray-700 pr-2">
                {user.name}
              </span>
            </button>
          </Dropdown>
        )}
      </div>
    </nav>
  );
}
