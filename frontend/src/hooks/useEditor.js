import { useState, useEffect, useRef } from 'react';
import { useEditor as useTiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { createYDoc, destroyYDoc } from '../yjs/yjsConfig';
import { createWebsocketProvider, destroyProvider } from '../yjs/provider';
import { useSocket } from './useSocket';

export function useCollaborativeEditor(documentId, user) {
  const [isReady, setIsReady] = useState(false);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    const ydoc = createYDoc();
    const provider = createWebsocketProvider(ydoc, documentId);

    ydocRef.current = ydoc;
    providerRef.current = provider;

    provider.on('sync', (isSynced) => {
      if (isSynced) setIsReady(true);
    });

    setInitialized(true);

    return () => {
      setInitialized(false);
      setIsReady(false);
      destroyProvider(provider);
      destroyYDoc(ydoc);
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [documentId]);

  const { onlineUsers, connectionStatus, disconnect, reconnect } = useSocket(
    providerRef.current,
    user
  );

  const editor = useTiptapEditor(
    {
      extensions: initialized
        ? [
            StarterKit.configure({ history: false }),
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
            Underline,
            Placeholder.configure({ placeholder: 'Start writing...' }),
            Collaboration.configure({ document: ydocRef.current }),
            CollaborationCursor.configure({
              provider: providerRef.current,
              user: user
                ? { name: user.name, color: user.color }
                : { name: 'Anonymous', color: '#999999' },
            }),
          ]
        : [
            StarterKit,
            Highlight,
            TaskList,
            TaskItem.configure({ nested: true }),
            Underline,
            Placeholder.configure({ placeholder: 'Loading...' }),
          ],
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none',
        },
      },
      editable: initialized,
    },
    [documentId, initialized]
  );

  return {
    editor,
    isReady,
    onlineUsers,
    connectionStatus,
    disconnect,
    reconnect,
    ydoc: ydocRef.current,
    provider: providerRef.current,
  };
}
