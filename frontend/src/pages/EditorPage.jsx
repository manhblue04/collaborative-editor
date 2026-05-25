import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Input, Tag, Alert, Tooltip, Spin, Avatar, Dropdown, App as AntdApp, Typography } from 'antd';
import {
  ShareAltOutlined,
  EyeOutlined,
  EditOutlined,
  CrownFilled,
  FileTextOutlined,
  CloudOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  LogoutOutlined,
  UserOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import useDocumentStore from '../store/documentStore';
import useAuthStore from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useCollaborativeEditor } from '../hooks/useEditor';
import EditorWrapper from '../components/editor/EditorWrapper';
import Sidebar from '../components/layout/Sidebar';
import UserCursors from '../components/editor/UserCursor';
import ShareModal from '../components/editor/ShareModal';
import VersionHistoryDrawer from '../components/editor/VersionHistoryDrawer';
import { debounce } from '../utils/debounce';
import { getInitials } from '../utils/helpers';

const { Text } = Typography;

// Icon đám mây thể hiện trạng thái kết nối/lưu
function SyncStatusIcon({ status }) {
  if (status === 'connected') {
    return (
      <Tooltip title="Đã lưu lên cloud">
        <CloudOutlined className="!text-gray-400 !text-base" />
      </Tooltip>
    );
  }
  if (status === 'connecting') {
    return (
      <Tooltip title="Đang đồng bộ...">
        <SyncOutlined spin className="!text-blue-400 !text-base" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Mất kết nối – thay đổi chưa được lưu">
      <CloudUploadOutlined className="!text-orange-400 !text-base" />
    </Tooltip>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(true);
  const { logout } = useAuthStore();
  const { message } = AntdApp.useApp();
  const { currentDocument, fetchDocument, updateDocument, clearCurrent } =
    useDocumentStore();

  const [title, setTitle] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const role = currentDocument?.role || 'viewer';
  const canEdit = role === 'owner' || role === 'editor';
  const isOwner = role === 'owner';

  const { editor, isReady, onlineUsers, connectionStatus, disconnect, ydoc } =
    useCollaborativeEditor(id, user, { canEdit });

  useEffect(() => {
    if (id) fetchDocument(id);
    return () => clearCurrent();
  }, [id, fetchDocument, clearCurrent]);

  useEffect(() => {
    if (currentDocument) setTitle(currentDocument.title);
  }, [currentDocument]);

  const debouncedUpdateTitle = useMemo(
    () =>
      debounce((newTitle) => {
        if (id && newTitle.trim()) {
          updateDocument(id, { title: newTitle });
        }
      }, 800),
    [id, updateDocument]
  );

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (canEdit) debouncedUpdateTitle(newTitle);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dropdown menu tài khoản (giống Navbar trang chính)
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div className="font-medium">{user?.name}</div>
          <Text type="secondary" className="!text-xs">{user?.email}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  const roleConfig = {
    owner: { color: 'gold', icon: <CrownFilled />, label: 'Owner' },
    editor: { color: 'blue', icon: <EditOutlined />, label: 'Editor' },
    viewer: { color: 'default', icon: <EyeOutlined />, label: 'Viewer' },
  };

  if (!currentDocument) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip="Loading document..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ── Header Google Docs style ── */}
      <header className="z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm gap-3">

        {/* ── LEFT: logo + file icon + title + sync ── */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Logo CE – click về dashboard */}
          <Tooltip title="Về trang chính">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm select-none">
                CE
              </div>
            </Link>
          </Tooltip>

          {/* Icon tài liệu */}
          <FileTextOutlined className="!text-blue-500 !text-xl shrink-0" />

          {/* Tiêu đề tài liệu */}
          <Input
            value={title}
            onChange={handleTitleChange}
            disabled={!canEdit}
            variant="borderless"
            className="!min-w-0 !flex-1 !text-[15px] !font-semibold !text-gray-800 !px-1"
            placeholder="Untitled Document"
          />

          {/* Badge vai trò */}
          <Tag
            color={roleConfig[role].color}
            icon={roleConfig[role].icon}
            className="!hidden sm:!inline-flex !items-center !shrink-0"
          >
            {roleConfig[role].label}
          </Tag>

          {/* Trạng thái đồng bộ cloud */}
          <span className="shrink-0">
            <SyncStatusIcon status={connectionStatus} />
          </span>
        </div>

        {/* ── RIGHT: collaborators + share + user account ── */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Danh sách người đang chỉnh sửa */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center">
              <UserCursors users={onlineUsers} />
            </div>
          )}

          {/* Nút Lịch sử phiên bản */}
          <Tooltip title="Lịch sử phiên bản">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
              className="!rounded-full"
            />
          </Tooltip>

          {/* Nút Share (chỉ owner) */}
          {isOwner ? (
            <Button
              type="primary"
              icon={<ShareAltOutlined />}
              onClick={() => setShareOpen(true)}
              className="!rounded-full !px-4"
            >
              <span className="hidden sm:inline">Chia sẻ</span>
            </Button>
          ) : (
            /* Viewer hoặc editor không phải owner */
            <Button
              variant="outlined"
              icon={<EyeOutlined />}
              className="!rounded-full !px-4 !text-gray-600"
              disabled
            >
              <span className="hidden sm:inline capitalize">{role}</span>
            </Button>
          )}

          {/* Tài khoản người dùng – giống Navbar trang chính */}
          {user && (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <button className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-gray-100 transition-colors">
                <Avatar style={{ backgroundColor: user.color || '#2563eb' }} size={34}>
                  {getInitials(user.name)}
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>
            </Dropdown>
          )}
        </div>
      </header>

      {/* Connection banner */}
      {connectionStatus !== 'connected' && (
        <Alert
          banner
          type={connectionStatus === 'connecting' ? 'info' : 'warning'}
          showIcon
          message={
            connectionStatus === 'connecting'
              ? 'Đang kết nối lại...'
              : 'Bạn đang offline. Thay đổi sẽ được đồng bộ khi kết nối lại.'
          }
          className="!py-1.5 !text-xs"
        />
      )}

      {/* Viewer notice */}
      {role === 'viewer' && (
        <Alert
          banner
          type="info"
          showIcon
          icon={<EyeOutlined />}
          message="Bạn đang xem tài liệu này ở chế độ chỉ đọc."
          className="!py-1.5 !text-xs"
        />
      )}

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mx-auto max-w-4xl">
            <EditorWrapper editor={editor} isReady={isReady} canEdit={canEdit} />
          </div>
        </main>

        <Sidebar
          onlineUsers={onlineUsers}
          connectionStatus={connectionStatus}
          currentUser={user}
          role={role}
        />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        documentId={id}
        currentUserId={user?.id}
        isOwner={isOwner}
      />

      <VersionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        documentId={id}
        canEdit={canEdit}
        onBeforeRestore={() => {
          // QUAN TRỌNG: Disconnect provider TRƯỚC khi gọi API restore.
          // Nếu không, provider sẽ tự reconnect sau khi server kick room
          // và push state cũ (đang nằm trong Y.Doc local) đè state đã khôi phục.
          try { disconnect?.(); } catch { /* ignore */ }
          // Destroy Y.Doc local để xoá hoàn toàn state cũ khỏi bộ nhớ,
          // tránh mọi khả năng nó được sync ngược lên server.
          try { ydoc?.destroy?.(); } catch { /* ignore */ }
        }}
        onRestoreSuccess={() => navigate(0)}
      />
    </div>
  );
}
