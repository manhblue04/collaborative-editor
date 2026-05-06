import { EditorContent } from '@tiptap/react';
import { Spin } from 'antd';
import EditorToolbar from './EditorToolbar';

export default function EditorWrapper({ editor, isReady, canEdit = true }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <EditorToolbar editor={editor} disabled={!canEdit} />
      <div className="relative flex-1 overflow-y-auto">
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Spin tip="Syncing document..." size="large" />
          </div>
        )}
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
    </div>
  );
}
