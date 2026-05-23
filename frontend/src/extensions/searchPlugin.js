import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const searchPluginKey = new PluginKey('search');

const searchPlugin = new Plugin({
  key: searchPluginKey,
  state: {
    init() { return DecorationSet.empty; },
    apply(tr, oldState, oldDocState, newDocState) {
      const meta = tr.getMeta(searchPluginKey);
      if (meta !== undefined) return meta.decorations;
      if (tr.docChanged) return oldState.map(tr.mapping, tr.doc);
      return oldState;
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',
  addProseMirrorPlugins() {
    return [searchPlugin];
  },
});
