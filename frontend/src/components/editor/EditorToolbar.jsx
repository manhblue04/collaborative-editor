import { Tooltip, Divider } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  HighlightOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  RedoOutlined,
  UndoOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { LuQuote, LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { classNames } from '../../utils/helpers';

function ToolBtn({ onClick, isActive = false, disabled = false, title, children }) {
  return (
    <Tooltip title={title} mouseEnterDelay={0.4}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={classNames(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors',
          isActive
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export default function EditorToolbar({ editor, disabled = false }) {
  if (!editor) return null;
  const isDisabled = disabled || !editor.isEditable;

  return (
    <div
      className={classNames(
        'flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-3 py-2 sticky top-0 z-10',
        isDisabled && 'opacity-50 pointer-events-none'
      )}
    >
      <ToolBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <UndoOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <RedoOutlined />
      </ToolBtn>

      <Divider type="vertical" className="!mx-1 !h-6" />

      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <LuHeading1 />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <LuHeading2 />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <LuHeading3 />
      </ToolBtn>

      <Divider type="vertical" className="!mx-1 !h-6" />

      <ToolBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <BoldOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <ItalicOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <StrikethroughOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <HighlightOutlined />
      </ToolBtn>

      <Divider type="vertical" className="!mx-1 !h-6" />

      <ToolBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <UnorderedListOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <OrderedListOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <CheckSquareOutlined />
      </ToolBtn>

      <Divider type="vertical" className="!mx-1 !h-6" />

      <ToolBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <LuQuote />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <CodeOutlined />
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <MinusOutlined />
      </ToolBtn>
    </div>
  );
}
