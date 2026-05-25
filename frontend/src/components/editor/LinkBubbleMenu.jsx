import { useState, useEffect, useRef, useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { Input } from 'antd';
import { LinkOutlined, CheckOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons';

export default function LinkBubbleMenu({ editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const inputRef = useRef(null);

  const existingHref = editor?.isActive('link') ? editor.getAttributes('link').href : '';
  const isLinkActive = editor?.isActive('link');

  // When entering edit mode, prefill URL
  useEffect(() => {
    if (isEditing) {
      setUrlValue(existingHref || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, existingHref]);

  // Open in edit mode immediately when no link exists (user clicked link button with selection)
  const shouldShowEditMode = isEditing || (!isLinkActive && editor?.state.selection && !editor?.state.selection.empty);

  const handleApply = useCallback(() => {
    const url = urlValue.trim();
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setIsEditing(false);
    setUrlValue('');
  }, [editor, urlValue]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsEditing(false);
    setUrlValue('');
  }, [editor]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setUrlValue('');
    }
  };

  const openLink = () => {
    if (existingHref) window.open(existingHref, '_blank', 'noopener,noreferrer');
  };

  // Only show for text selections or when cursor is on a link
  const shouldShow = ({ editor, from, to }) => {
    const selection = editor.state.selection;
    const hasText = from !== to;
    return hasText || editor.isActive('link');
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      tippyOptions={{
        duration: 100,
        placement: 'bottom',
        onHide: () => {
          setIsEditing(false);
          setUrlValue('');
        },
      }}
    >
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg">
        {isLinkActive && !isEditing ? (
          /* ── Existing link: show URL + actions ── */
          <>
            <LinkOutlined className="text-blue-500 text-xs shrink-0" />
            <span
              className="max-w-[180px] truncate text-xs text-blue-500 underline cursor-pointer hover:text-blue-700"
              onClick={openLink}
              title={existingHref}
            >
              {existingHref}
            </span>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-xs"
              title="Edit link"
              onClick={() => setIsEditing(true)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 text-xs"
              title="Open in new tab"
              onClick={openLink}
            >
              <GlobalOutlined />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-red-50 hover:text-red-500 text-xs"
              title="Remove link"
              onClick={handleRemove}
            >
              <DeleteOutlined />
            </button>
          </>
        ) : (
          /* ── Edit / insert link ── */
          <>
            <LinkOutlined className="text-gray-400 text-xs shrink-0" />
            <Input
              ref={inputRef}
              size="small"
              variant="borderless"
              placeholder="Paste or type a URL…"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="!w-52 !px-1"
            />
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 text-white hover:bg-blue-600 text-xs shrink-0"
              title="Apply (Enter)"
              onClick={handleApply}
              disabled={!urlValue.trim()}
            >
              <CheckOutlined />
            </button>
            {existingHref && (
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 text-xs shrink-0"
                title="Remove link"
                onClick={handleRemove}
              >
                <DeleteOutlined />
              </button>
            )}
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
