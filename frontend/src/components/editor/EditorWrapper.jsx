import { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Spin } from 'antd';
import EditorToolbar from './EditorToolbar';
import StatusBar from './StatusBar';
import SearchReplaceBar from './SearchReplaceBar';
import LinkBubbleMenu from './LinkBubbleMenu';

export default function EditorWrapper({ editor, isReady, canEdit = true }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <EditorToolbar
        editor={editor}
        disabled={!canEdit}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div className="relative flex-1 overflow-y-auto">
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Spin tip="Syncing document..." size="large" />
          </div>
        )}
        {searchOpen && (
          <SearchReplaceBar editor={editor} onClose={() => setSearchOpen(false)} />
        )}
        {editor && canEdit && <LinkBubbleMenu editor={editor} />}
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
      <StatusBar editor={editor} />
    </div>
  );
}
