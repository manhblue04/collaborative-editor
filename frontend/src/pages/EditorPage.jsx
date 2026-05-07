import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import { useCollaborativeEditor } from '../hooks/useEditor';
import EditorWrapper from '../components/editor/EditorWrapper';
import Sidebar from '../components/layout/Sidebar';
import UserCursors from '../components/editor/UserCursor';
import { debounce } from '../utils/debounce';
import {
  FiArrowLeft,
  FiWifi,
  FiWifiOff,
  FiUsers,
  FiShare2,
  FiEye,
  FiEdit3,
  FiShield,
} from 'react-icons/fi';

function RolePill({ role }) {
  const config = {
    owner: {
      icon: FiShield,
      label: 'Owner',
      className: 'bg-purple-100 text-purple-700',
    },
    editor: {
      icon: FiEdit3,
      label: 'Editor',
      className: 'bg-blue-100 text-blue-700',
    },
    viewer: {
      icon: FiEye,
      label: 'View only',
      className: 'bg-gray-100 text-gray-600',
    },
  };

  const c = config[role] || config.viewer;
  const Icon = c.icon;

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.className}`}
    >
      <Icon size={12} />
      <span>{c.label}</span>
    </div>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const { user } = useAuth(true);
  const { currentDocument, fetchDocument, updateDocument, clearCurrent } =
    useDocumentStore();

  const [title, setTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  const {
    editor,
    isReady,
    onlineUsers,
    connectionStatus,
  } = useCollaborativeEditor(id, user);

  useEffect(() => {
    if (id) fetchDocument(id);
    return () => clearCurrent();
  }, [id, fetchDocument, clearCurrent]);

  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
    }
  }, [currentDocument]);

  // Set editor editable based on role
  useEffect(() => {
    if (editor && currentDocument) {
      const isViewer = currentDocument.role === 'viewer';
      editor.setEditable(!isViewer);
    }
  }, [editor, currentDocument]);

  const debouncedUpdateTitle = debounce((newTitle) => {
    if (id && newTitle.trim()) {
      updateDocument(id, { title: newTitle });
    }
  }, 800);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdateTitle(newTitle);
  };

  const canEdit =
    currentDocument?.role === 'owner' || currentDocument?.role === 'editor';

  const connectionDot =
    connectionStatus === 'connected'
      ? 'bg-emerald-500'
      : connectionStatus === 'connecting'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to="/dashboard"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Back to dashboard"
          >
            <FiArrowLeft size={20} />
          </Link>

          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={!canEdit}
              className="w-full border-none bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder-gray-400 focus:ring-0 disabled:cursor-default disabled:text-gray-700"
              placeholder="Untitled Document"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Role Badge */}
          {currentDocument?.role && <RolePill role={currentDocument.role} />}

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2" title={connectionStatus}>
            <div className={`h-2 w-2 rounded-full ${connectionDot}`} />
            {connectionStatus === 'connected' ? (
              <FiWifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <FiWifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>

          {/* Online Users Avatars */}
          <UserCursors users={onlineUsers} />

          {/* Toggle Sidebar */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`rounded-lg p-1.5 transition-colors ${
              showSidebar
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="Toggle sidebar"
          >
            <FiUsers size={18} />
          </button>
        </div>
      </header>

      {/* Viewer Banner */}
      {currentDocument?.role === 'viewer' && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2">
          <FiEye className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            You have view-only access to this document
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <EditorWrapper editor={editor} isReady={isReady} />
          </div>
        </main>

        {showSidebar && (
          <Sidebar
            documentId={id}
            onlineUsers={onlineUsers}
            connectionStatus={connectionStatus}
            userRole={currentDocument?.role}
          />
        )}
      </div>
    </div>
  );
}
