import { useState, useCallback, useEffect } from 'react';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { searchPluginKey } from '../extensions/searchPlugin';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function useSearchReplace(editor) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const findMatches = useCallback(() => {
    if (!editor || !searchQuery) {
      clearHighlights();
      setMatches([]);
      setCurrentIndex(0);
      return;
    }

    const regex = new RegExp(escapeRegex(searchQuery), 'gi');
    const results = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        let match;
        while ((match = regex.exec(node.text)) !== null) {
          results.push({ from: pos + match.index, to: pos + match.index + match[0].length });
        }
      }
    });

    setMatches(results);
    if (results.length > 0) {
      setCurrentIndex(0);
      applyDecorations(results, 0);
      editor.commands.setTextSelection({ from: results[0].from, to: results[0].to });
      editor.commands.scrollIntoView();
    } else {
      clearHighlights();
    }
  }, [editor, searchQuery]);

  const applyDecorations = useCallback((matchResults, current) => {
    if (!editor) return;
    const decorations = matchResults.map((m, i) =>
      Decoration.inline(m.from, m.to, {
        class: i === current ? 'search-match-current' : 'search-match',
      })
    );
    const tr = editor.state.tr.setMeta(searchPluginKey, {
      decorations: DecorationSet.create(editor.state.doc, decorations),
    });
    editor.view.dispatch(tr);
  }, [editor]);

  const clearHighlights = useCallback(() => {
    if (!editor) return;
    const tr = editor.state.tr.setMeta(searchPluginKey, {
      decorations: DecorationSet.empty,
    });
    editor.view.dispatch(tr);
  }, [editor]);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    applyDecorations(matches, next);
    editor.commands.setTextSelection({ from: matches[next].from, to: matches[next].to });
    editor.commands.scrollIntoView();
  }, [matches, currentIndex, editor, applyDecorations]);

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
    applyDecorations(matches, prev);
    editor.commands.setTextSelection({ from: matches[prev].from, to: matches[prev].to });
    editor.commands.scrollIntoView();
  }, [matches, currentIndex, editor, applyDecorations]);

  const replace = useCallback(() => {
    if (matches.length === 0) return;
    const match = matches[currentIndex];
    editor
      .chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceQuery)
      .run();
    setTimeout(() => findMatches(), 0);
  }, [matches, currentIndex, editor, replaceQuery, findMatches]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0) return;
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    sorted.forEach((m) => {
      editor.chain().focus().setTextSelection({ from: m.from, to: m.to }).insertContent(replaceQuery).run();
    });
    setMatches([]);
    setCurrentIndex(0);
    clearHighlights();
  }, [matches, editor, replaceQuery, clearHighlights]);

  useEffect(() => {
    const timer = setTimeout(() => findMatches(), 200);
    return () => clearTimeout(timer);
  }, [searchQuery, findMatches]);

  return {
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    matches,
    currentIndex,
    goToNext,
    goToPrev,
    replace,
    replaceAll,
    clearHighlights,
  };
}
