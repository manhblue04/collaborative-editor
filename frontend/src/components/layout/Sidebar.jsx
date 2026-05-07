import { getInitials } from '../../utils/helpers';
import SharePanel from '../editor/SharePanel';
import { FiUsers, FiShare2 } from 'react-icons/fi';
import { useState } from 'react';

export default function Sidebar({
  documentId,
  onlineUsers = [],
  connectionStatus,
  userRole,
}) {
  const [activeTab, setActiveTab] = useState('users');
  const isOwner = userRole === 'owner';

  const statusColors = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    disconnected: 'bg-red-500',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-gray-200 bg-white">
      {/* Tab Header */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'users'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FiUsers size={14} />
          Online
        </button>
        <button
          onClick={() => setActiveTab('share')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'share'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FiShare2 size={14} />
          Share
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Connection Status */}
          <div className="mb-4 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                statusColors[connectionStatus] || 'bg-gray-400'
              }`}
            />
            <span className="text-xs font-medium text-gray-500">
              {statusLabels[connectionStatus] || connectionStatus}
            </span>
          </div>

          {/* Online Users */}
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Now ({onlineUsers.length + 1})
          </h3>
          <div className="space-y-1">
            {/* Current User */}
            <div className="flex items-center gap-3 rounded-lg bg-primary-50/70 px-3 py-2.5">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-semibold text-white">
                  You
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <span className="text-sm font-medium text-primary-700">You</span>
            </div>

            {/* Other Users */}
            {onlineUsers.map((u) => (
              <div
                key={u.clientId}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors animate-fade-in"
              >
                <div className="relative">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: u.color }}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <span className="text-sm text-gray-700 truncate">{u.name}</span>
              </div>
            ))}
          </div>

          {onlineUsers.length === 0 && (
            <p className="mt-4 text-center text-xs text-gray-400">
              No other users online
            </p>
          )}
        </div>
      ) : (
        <SharePanel
          documentId={documentId}
          isOwner={isOwner}
          onClose={() => setActiveTab('users')}
        />
      )}
    </aside>
  );
}
