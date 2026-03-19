import { EditorContent } from '@tiptap/react';
import EditorToolbar from './EditorToolbar';

export default function EditorWrapper({ editor, isReady }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        {!isReady && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-gray-400">
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Syncing document...</span>
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
    </div>
  );
}
