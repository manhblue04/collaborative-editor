import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Tag, Alert, Tooltip, Spin, App as AntdApp } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  WifiOutlined,
  DisconnectOutlined,
  EyeOutlined,
  EditOutlined,
  CrownFilled,
} from '@ant-design/icons';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import { useCollaborativeEditor } from '../hooks/useEditor';
import EditorWrapper from '../components/editor/EditorWrapper';
import Sidebar from '../components/layout/Sidebar';
import UserCursors from '../components/editor/UserCursor';
import ShareModal from '../components/editor/ShareModal';
import { debounce } from '../utils/debounce';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(true);
  const { message } = AntdApp.useApp();
  const { currentDocument, fetchDocument, updateDocument, clearCurrent } =
    useDocumentStore();

  const [title, setTitle] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const role = currentDocument?.role || 'viewer';
  const canEdit = role === 'owner' || role === 'editor';
  const isOwner = role === 'owner';

  const { editor, isReady, onlineUsers, connectionStatus } = useCollaborativeEditor(
    id,
    user,
    { canEdit }
  );

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
      {/* Header */}
      <header className="z-20 flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Tooltip title="Back to dashboard">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
            />
          </Tooltip>

          <Input
            value={title}
            onChange={handleTitleChange}
            disabled={!canEdit}
            variant="borderless"
            className="!min-w-0 !flex-1 !text-base !font-semibold"
            placeholder="Untitled Document"
          />

          <Tag
            color={roleConfig[role].color}
            icon={roleConfig[role].icon}
            className="!hidden sm:!inline-flex !items-center"
          >
            {roleConfig[role].label}
          </Tag>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <Tooltip title={`Connection: ${connectionStatus}`}>
            <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs">
              {connectionStatus === 'connected' ? (
                <WifiOutlined className="!text-green-500" />
              ) : (
                <DisconnectOutlined className="!text-red-500" />
              )}
              <span className="hidden md:inline text-gray-500 capitalize">
                {connectionStatus}
              </span>
            </span>
          </Tooltip>

          <UserCursors users={onlineUsers} />

          {isOwner && (
            <Button
              type="primary"
              icon={<ShareAltOutlined />}
              onClick={() => setShareOpen(true)}
            >
              <span className="hidden sm:inline">Share</span>
            </Button>
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
              ? 'Reconnecting...'
              : 'You are offline. Changes will sync when reconnected.'
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
          message="You are viewing this document in read-only mode."
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
    </div>
  );
}
