import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import { useCollaborativeEditor } from '../hooks/useEditor';
import EditorWrapper from '../components/editor/EditorWrapper';
import Sidebar from '../components/layout/Sidebar';
import UserCursors from '../components/editor/UserCursor';
import { debounce } from '../utils/debounce';
import { FiArrowLeft, FiWifi, FiWifiOff, FiUsers } from 'react-icons/fi';

export default function EditorPage() {
  const { id } = useParams();
  const { user } = useAuth(true);
  const { currentDocument, fetchDocument, updateDocument, clearCurrent } =
    useDocumentStore();

  const [title, setTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    editor,
    isReady,
    onlineUsers,
    connectionStatus,
    disconnect,
    reconnect,
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

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to="/dashboard"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <FiArrowLeft size={20} />
          </Link>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold text-gray-900 outline-none placeholder-gray-400 focus:ring-0"
            placeholder="Untitled Document"
          />
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            {connectionStatus === 'connected' ? (
              <FiWifi className="h-4 w-4 text-green-500" />
            ) : (
              <FiWifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="hidden sm:block text-xs text-gray-500 capitalize">
              {connectionStatus}
            </span>
          </div>

          {/* Online Users Avatars */}
          <UserCursors users={onlineUsers} />

          {/* Toggle Sidebar */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Toggle sidebar"
          >
            <FiUsers size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <EditorWrapper editor={editor} isReady={isReady} />
          </div>
        </main>

        {showSidebar && (
          <Sidebar
            onlineUsers={onlineUsers}
            connectionStatus={connectionStatus}
          />
        )}
      </div>
    </div>
  );
}
