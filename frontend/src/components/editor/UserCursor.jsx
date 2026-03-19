import { getInitials } from '../../utils/helpers';

export default function UserCursors({ users = [] }) {
  if (!users.length) return null;

  return (
    <div className="flex -space-x-2">
      {users.map((user) => (
        <div
          key={user.clientId}
          className="relative group"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-sm transition-transform hover:scale-110 hover:z-10"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {getInitials(user.name)}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block">
            <div
              className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-white shadow-lg"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
