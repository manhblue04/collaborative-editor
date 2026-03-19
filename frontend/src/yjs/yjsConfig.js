import * as Y from 'yjs';

export function createYDoc() {
  return new Y.Doc();
}

export function getYXmlFragment(ydoc, fieldName = 'default') {
  return ydoc.getXmlFragment(fieldName);
}

export function destroyYDoc(ydoc) {
  if (ydoc) {
    ydoc.destroy();
  }
}
