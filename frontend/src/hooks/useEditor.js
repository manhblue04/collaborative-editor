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
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { createYDoc, destroyYDoc } from '../yjs/yjsConfig';
import { createWebsocketProvider, destroyProvider } from '../yjs/provider';
import { useSocket } from './useSocket';
import { SearchHighlight } from '../extensions/searchPlugin';
import useAuthStore from '../store/authStore';

const baseExtensions = [
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Underline,
  Image.configure({ allowBase64: true, inline: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    HTMLAttributes: { class: 'editor-link' },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  SearchHighlight,
];

export function useCollaborativeEditor(documentId, user, options = {}) {
  const { canEdit = true } = options;
  const token = useAuthStore((s) => s.token);
  const [isReady, setIsReady] = useState(false);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!documentId || !token) return;

    const ydoc = createYDoc();
    const provider = createWebsocketProvider(ydoc, documentId, token);

    ydocRef.current = ydoc;
    providerRef.current = provider;

    const syncHandler = (isSynced) => {
      if (isSynced) setIsReady(true);
    };
    provider.on('sync', syncHandler);

    setInitialized(true);

    return () => {
      provider.off('sync', syncHandler);
      setInitialized(false);
      setIsReady(false);
      destroyProvider(provider);
      destroyYDoc(ydoc);
      ydocRef.current = null;
      providerRef.current = null;
    };
  }, [documentId, token]);

  const { onlineUsers, connectionStatus, disconnect, reconnect } = useSocket(
    providerRef.current,
    user
  );

  const editor = useTiptapEditor(
    {
      extensions: initialized
        ? [
            StarterKit.configure({ history: false }),
            ...baseExtensions,
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
            ...baseExtensions,
            Placeholder.configure({ placeholder: 'Loading...' }),
          ],
      editable: initialized && canEdit,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none',
        },
      },
    },
    [documentId, initialized, canEdit]
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
