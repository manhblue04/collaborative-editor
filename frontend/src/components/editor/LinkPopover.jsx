import { useState, useEffect, useRef } from 'react';
import { Input, Button, Switch, Space } from 'antd';

export default function LinkPopover({ open, onClose, editor }) {
  const existingHref = editor?.isActive('link') ? editor.getAttributes('link').href : '';
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [newTab, setNewTab] = useState(false);
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
      editor.setLink({ href: url, target: newTab ? '_blank' : null }).run();
    } else if (text && !editor.state.selection.empty) {
      editor.setLink({ href: url, target: newTab ? '_blank' : null }).run();
    } else if (text) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}"${newTab ? ' target="_blank"' : ''}>${text}</a>`)
        .run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  return (
    <div
      className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-80 rounded-lg border border-gray-200 bg-white shadow-xl p-4"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="text-sm font-medium text-gray-700 mb-3">Link</div>
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">URL</div>
        <Input
          ref={urlRef}
          size="small"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleApply}
        />
      </div>
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">Text</div>
        <Input
          size="small"
          placeholder="Link text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={handleApply}
        />
      </div>
      <div className="mb-3 flex items-center gap-2">
        <Switch size="small" checked={newTab} onChange={setNewTab} />
        <span className="text-xs text-gray-500">Open in new tab</span>
      </div>
      <Space>
        <Button size="small" type="primary" onClick={handleApply} disabled={!url}>
          Apply
        </Button>
        {existingHref && (
          <Button size="small" danger onClick={handleRemove}>
            Remove
          </Button>
        )}
      </Space>
    </div>
  );
}
