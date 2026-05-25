import { useState, useEffect, useRef } from 'react';
import { Input, Button } from 'antd';
import { LinkOutlined, CloseOutlined } from '@ant-design/icons';

export default function LinkPopover({ open, onClose, editor }) {
  const existingHref = editor?.isActive('link') ? editor.getAttributes('link').href : '';
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const urlRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUrl(existingHref || '');
      setText(
        existingHref
          ? ''
          : editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') || ''
      );
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [open, existingHref, editor]);

  if (!open) return null;

  const handleApply = () => {
    if (!url) return;
    editor.chain().focus().extendMarkRange('link');
    if (existingHref) {
      editor.setLink({ href: url }).run();
    } else if (text && !editor.state.selection.empty) {
      editor.setLink({ href: url }).run();
    } else if (text) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  return (
    <div className="flex items-center gap-2">
      <LinkOutlined className="text-gray-400 shrink-0" />
      <Input
        ref={urlRef}
        size="small"
        placeholder="URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onPressEnter={handleApply}
        className="!w-56"
      />
      <Input
        size="small"
        placeholder="Text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPressEnter={handleApply}
        className="!w-40"
      />
      <Button size="small" type="primary" onClick={handleApply} disabled={!url}>
        {existingHref ? 'Update' : 'Apply'}
      </Button>
      {existingHref && (
        <Button size="small" danger onClick={handleRemove}>
          Remove
        </Button>
      )}
      <button
        type="button"
        className="shrink-0 text-gray-400 hover:text-gray-600 p-1"
        onClick={onClose}
      >
        <CloseOutlined className="text-xs" />
      </button>
    </div>
  );
}
