import { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Spin } from 'antd';
import EditorToolbar from './EditorToolbar';
import StatusBar from './StatusBar';
import SearchReplaceBar from './SearchReplaceBar';
import LinkPopover from './LinkPopover';

export default function EditorWrapper({ editor, isReady, canEdit = true }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (linkOpen) setLinkOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, linkOpen]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <EditorToolbar
        editor={editor}
        disabled={!canEdit}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLink={() => setLinkOpen(true)}
      />
      <div className="relative flex-1 overflow-y-auto">
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Spin tip="Syncing document..." size="large" />
          </div>
        )}
        {linkOpen && (
          <LinkPopover open={linkOpen} onClose={() => setLinkOpen(false)} editor={editor} />
        )}
        {searchOpen && (
          <SearchReplaceBar editor={editor} onClose={() => setSearchOpen(false)} />
        )}
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
      <StatusBar editor={editor} />
    </div>
  );
}
