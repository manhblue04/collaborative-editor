import { useState } from 'react';
import { Tooltip, Divider, Dropdown } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  HighlightOutlined,
  FontColorsOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  RedoOutlined,
  UndoOutlined,
  MinusOutlined,
  PictureOutlined,
  LinkOutlined,
  TableOutlined,
  SearchOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LineHeightOutlined,
} from '@ant-design/icons';
import { LuQuote, LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { classNames } from '../../utils/helpers';
import { TEXT_COLORS, HIGHLIGHT_COLORS } from '../../utils/constants';
import ColorPickerBtn from './ColorPickerBtn';
import ImageDialog from './ImageDialog';
import TableContextMenu from './TableContextMenu';

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

const ALIGN_ICONS = {
  left: <AlignLeftOutlined />,
  center: <AlignCenterOutlined />,
  right: <AlignRightOutlined />,
  justify: <LineHeightOutlined />,
};

export default function EditorToolbar({ editor, disabled = false, onOpenSearch }) {
  const [imageOpen, setImageOpen] = useState(false);
  const [alignDropdownOpen, setAlignDropdownOpen] = useState(false);
  const [insertDropdownOpen, setInsertDropdownOpen] = useState(false);

  if (!editor) return null;
  const isDisabled = disabled || !editor.isEditable;

  const getCurrentAlign = () => {
    if (editor.isActive({ textAlign: 'left' })) return 'left';
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    return 'left';
  };

  const currentTextColor = editor.getAttributes('textStyle').color || '#000000';
  const currentHighlightColor = editor.getAttributes('highlight').color || '#fef08a';

  const insertTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  const alignItems = [
    { key: 'left', icon: <AlignLeftOutlined />, label: 'Align Left' },
    { key: 'center', icon: <AlignCenterOutlined />, label: 'Align Center' },
    { key: 'right', icon: <AlignRightOutlined />, label: 'Align Right' },
    { key: 'justify', icon: <LineHeightOutlined />, label: 'Justify' },
  ];

  const insertItems = [
    {
      key: 'image',
      icon: <PictureOutlined />,
      label: 'Image',
      onClick: () => setImageOpen(true),
    },
    {
      key: 'table',
      icon: <TableOutlined />,
      label: 'Table (3×3)',
      onClick: () => {
        insertTable(3, 3);
        setInsertDropdownOpen(false);
      },
    },
    { type: 'divider' },
    {
      key: 'hr',
      icon: <MinusOutlined />,
      label: 'Horizontal Rule',
      onClick: () => {
        editor.chain().focus().setHorizontalRule().run();
        setInsertDropdownOpen(false);
      },
    },
  ];

  return (
    <>
      <div
        className={classNames(
          'flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-3 py-2 sticky top-0 z-10',
          isDisabled && 'opacity-50 pointer-events-none'
        )}
      >
        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <UndoOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
          <RedoOutlined />
        </ToolBtn>

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <LuHeading1 />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <LuHeading2 />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <LuHeading3 />
        </ToolBtn>

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Inline */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <BoldOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <ItalicOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <StrikethroughOutlined />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
            } else {
              // Extend selection to word if nothing selected, so bubble menu triggers
              if (editor.state.selection.empty) {
                editor.chain().focus().extendMarkRange('link').run();
              }
              // BubbleMenu will appear automatically on selection
            }
          }}
          isActive={editor.isActive('link')}
          title="Link (Ctrl+K)"
        >
          <LinkOutlined />
        </ToolBtn>

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Colors */}
        <ColorPickerBtn
          color={currentTextColor}
          onChange={(c) => editor.chain().focus().setColor(c).run()}
          icon={<FontColorsOutlined />}
          title="Text Color"
          presets={TEXT_COLORS}
        />
        <ColorPickerBtn
          color={currentHighlightColor}
          onChange={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
          icon={<HighlightOutlined />}
          title="Highlight Color"
          presets={HIGHLIGHT_COLORS}
        />

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Alignment Dropdown */}
        <Dropdown
          open={alignDropdownOpen}
          onOpenChange={setAlignDropdownOpen}
          menu={{
            items: alignItems.map((a) => ({
              key: a.key,
              icon: a.icon,
              label: a.label,
              onClick: () => {
                editor.chain().focus().setTextAlign(a.key).run();
                setAlignDropdownOpen(false);
              },
            })),
            selectedKeys: [getCurrentAlign()],
          }}
          trigger={['click']}
        >
          <Tooltip title="Text Align" mouseEnterDelay={0.4}>
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              {ALIGN_ICONS[getCurrentAlign()]}
            </button>
          </Tooltip>
        </Dropdown>

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
          <UnorderedListOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
          <OrderedListOutlined />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">
          <CheckSquareOutlined />
        </ToolBtn>

        <Divider type="vertical" className="!mx-1 !h-6" />

        {/* Blocks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
          <LuQuote />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
          <CodeOutlined />
        </ToolBtn>

        {/* Insert Dropdown */}
        <Dropdown
          open={insertDropdownOpen}
          onOpenChange={setInsertDropdownOpen}
          menu={{ items: insertItems }}
          trigger={['click']}
        >
          <Tooltip title="Insert" mouseEnterDelay={0.4}>
            <button type="button" className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <PictureOutlined className="text-xs" />
              <span className="text-xs">Insert</span>
            </button>
          </Tooltip>
        </Dropdown>

        {/* Table contextual */}
        <div className="ml-auto flex items-center gap-1">
          <TableContextMenu editor={editor} />
        </div>

        {/* Search */}
        <Tooltip title="Find & Replace (Ctrl+F)" mouseEnterDelay={0.4}>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={onOpenSearch}
          >
            <SearchOutlined />
          </button>
        </Tooltip>
      </div>

      {/* Image Dialog */}
      <ImageDialog open={imageOpen} onClose={() => setImageOpen(false)} editor={editor} />
    </>
  );
}
