import { Avatar, Badge, List, Typography, Tag } from 'antd';
import { getInitials } from '../../utils/helpers';

const { Text } = Typography;

const statusBadgeStatus = {
  connected: 'success',
  connecting: 'processing',
  disconnected: 'error',
};

export default function Sidebar({ onlineUsers = [], connectionStatus, currentUser, role }) {
  const items = [
    currentUser && { ...currentUser, isMe: true, clientId: 'me' },
    ...onlineUsers.map((u) => ({ ...u, isMe: false })),
  ].filter(Boolean);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge status={statusBadgeStatus[connectionStatus] || 'default'} />
          <Text strong className="!text-sm capitalize">
            {connectionStatus}
          </Text>
        </div>
        {role && (
          <Tag color={role === 'owner' ? 'gold' : role === 'editor' ? 'blue' : 'default'}>
            Your role: {role}
          </Tag>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Text type="secondary" className="!text-xs !uppercase !tracking-wider !font-semibold">
          Online ({items.length})
        </Text>

        <List
          className="!mt-2"
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(u) => (
            <List.Item className={u.isMe ? '!bg-blue-50 !rounded-lg !px-2' : '!px-2'}>
              <List.Item.Meta
                avatar={
                  <Avatar size="small" style={{ backgroundColor: u.color }}>
                    {getInitials(u.name)}
                  </Avatar>
                }
                title={
                  <Text className="!text-sm">
                    {u.name}
                    {u.isMe && <Tag className="!ml-2 !text-[10px]">You</Tag>}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </aside>
  );
}
