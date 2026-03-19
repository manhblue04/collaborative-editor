import { getInitials } from '../../utils/helpers';

export default function Sidebar({ onlineUsers = [], connectionStatus }) {
  const statusColors = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  };

  return (
    <aside className="w-64 shrink-0 border-l border-gray-200 bg-white p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`h-2 w-2 rounded-full ${statusColors[connectionStatus] || 'bg-gray-400'}`}
          />
          <span className="text-xs font-medium text-gray-500 capitalize">
            {connectionStatus}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Online Users ({onlineUsers.length + 1})
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-primary-700">You</span>
          </div>
          {onlineUsers.map((u) => (
            <div
              key={u.clientId}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: u.color }}
              >
                {getInitials(u.name)}
              </div>
              <span className="text-sm text-gray-700 truncate">{u.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
