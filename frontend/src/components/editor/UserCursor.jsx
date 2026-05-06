import { Avatar, Tooltip } from 'antd';
import { getInitials } from '../../utils/helpers';

export default function UserCursors({ users = [], max = 5 }) {
  if (!users.length) return null;

  return (
    <Avatar.Group max={{ count: max }} size="small">
      {users.map((u) => (
        <Tooltip key={u.clientId} title={u.name}>
          <Avatar style={{ backgroundColor: u.color }}>{getInitials(u.name)}</Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
}
