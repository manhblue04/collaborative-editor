import { Tooltip, Popconfirm } from 'antd';
import {
  InsertRowAboveOutlined,
  InsertRowBelowOutlined,
  DeleteRowOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  DeleteColumnOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export default function TableContextMenu({ editor }) {
  if (!editor?.isActive('table')) return null;

  const btn = 'inline-flex h-7 w-7 items-center justify-center rounded text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors';

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5">
      <Tooltip title="Add row above" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().addRowBefore().run()}>
          <InsertRowAboveOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Add row below" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().addRowAfter().run()}>
          <InsertRowBelowOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Delete row" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().deleteRow().run()}>
          <DeleteRowOutlined />
        </button>
      </Tooltip>
      <span className="w-px h-4 bg-blue-200 mx-0.5" />
      <Tooltip title="Add column left" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().addColumnBefore().run()}>
          <InsertRowLeftOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Add column right" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <InsertRowRightOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Delete column" mouseEnterDelay={0.4}>
        <button type="button" className={btn} onClick={() => editor.chain().focus().deleteColumn().run()}>
          <DeleteColumnOutlined />
        </button>
      </Tooltip>
      <span className="w-px h-4 bg-blue-200 mx-0.5" />
      <Popconfirm
        title="Delete this table?"
        onConfirm={() => editor.chain().focus().deleteTable().run()}
        okText="Delete"
        placement="bottom"
      >
        <Tooltip title="Delete table" mouseEnterDelay={0.4}>
          <button type="button" className={`${btn} hover:!text-red-500 hover:!bg-red-50`}>
            <DeleteOutlined />
          </button>
        </Tooltip>
      </Popconfirm>
    </div>
  );
}
