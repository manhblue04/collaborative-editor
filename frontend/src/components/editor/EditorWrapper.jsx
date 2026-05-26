import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { Spin } from 'antd';
import EditorToolbar from './EditorToolbar';
import StatusBar from './StatusBar';
import SearchReplaceBar from './SearchReplaceBar';
import LinkBubbleMenu from './LinkBubbleMenu';

/**
 * A4 @ 96dpi = 1123px tổng chiều cao.
 * Padding đều 96px → nội dung mỗi trang = 1123 - 96 - 96 = 931px.
 * PAGE_MARGIN_TOP = 96 khớp padding-top của .docs-page.
 * Đường gap guard tính từ gốc ProseMirror (không có padding).
 */
const A4_H           = 1123;  // chiều cao A4 ở 96dpi (px)
const PAGE_PADDING   = 96;    // padding đều 4 phía của .docs-page
const PAGE_CONTENT_H = A4_H - PAGE_PADDING * 2;  // = 931px
const PAGE_GAP       = 24;
const PAGE_MARGIN_TOP = PAGE_PADDING;  // = 96px

/** Nhãn số trang hiện ra ở góc phải trong lề dưới của mỗi trang */
function PageNumbers({ count }) {
  if (count < 1) return null;
  return (
    <div className="page-number-overlay" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="page-number-label"
          style={{ top: PAGE_MARGIN_TOP + (i + 1) * PAGE_CONTENT_H - 18 }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

/**
 * Nếu cursor rơi vào vùng "gap" giữa 2 trang (vùng CSS xám không phải giấy),
 * tự động đẩy cursor về đầu trang tiếp theo.
 *
 * Có 2 lớp bảo vệ:
 * 1. mousedown: chặn click trong vùng gap, redirect sang vị trí đầu trang tiếp
 * 2. selectionUpdate: xử lý trường hợp cursor di chuyển bằng keyboard (↓, End…)
 */
function usePageGapGuard(editor, sheetRef) {
  useEffect(() => {
    if (!editor) return;

    /** Query ProseMirror element lazily (có thể chưa mount khi effect chạy) */
    const getPm = () => sheetRef.current?.querySelector('.ProseMirror');

    function getGapIndex(pm, relY) {
      for (let i = 0; ; i++) {
        const gapStart = PAGE_MARGIN_TOP + (i + 1) * PAGE_CONTENT_H;
        if (gapStart > pm.scrollHeight + PAGE_GAP) return -1;
        if (relY >= gapStart && relY < gapStart + PAGE_GAP) return i;
        if (gapStart > relY) return -1;
      }
    }

    function jumpPastGap(pm, clientX, gapIndex) {
      const pmRect    = pm.getBoundingClientRect();
      const gapEnd    = PAGE_MARGIN_TOP + (gapIndex + 1) * PAGE_CONTENT_H + PAGE_GAP;
      const targetY   = pmRect.top + gapEnd + 2;
      const pos       = editor.view.posAtCoords({ left: clientX, top: targetY });
      if (pos) {
        editor.commands.setTextSelection(pos.pos);
        editor.view.focus();
      }
    }

    /* ── Lớp 1: mousedown — chặn click trong vùng gap ── */
    const onMouseDown = (e) => {
      const pm = getPm();
      if (!pm) return;
      const relY = e.clientY - pm.getBoundingClientRect().top;
      const gap  = getGapIndex(pm, relY);
      if (gap === -1) return;
      e.preventDefault();
      e.stopPropagation();
      jumpPastGap(pm, e.clientX, gap);
    };

    /* ── Lớp 2: selectionUpdate — xử lý di chuyển bằng keyboard ── */
    const onSelectionUpdate = () => {
      const pm = getPm();
      if (!pm || !editor.view) return;
      const coords = editor.view.coordsAtPos(editor.state.selection.from);
      const relY   = coords.top - pm.getBoundingClientRect().top;
      const gap    = getGapIndex(pm, relY);
      if (gap === -1) return;
      setTimeout(() => {
        if (!editor.isDestroyed) jumpPastGap(pm, coords.left, gap);
      }, 0);
    };

    /* Gắn sự kiện lên document (capture) để bắt trước ProseMirror */
    document.addEventListener('mousedown', onMouseDown, { capture: true });
    editor.on('selectionUpdate', onSelectionUpdate);

    return () => {
      document.removeEventListener('mousedown', onMouseDown, { capture: true });
      editor.off('selectionUpdate', onSelectionUpdate);
    };
  }, [editor, sheetRef]);
}

export default function EditorWrapper({ editor, isReady, canEdit = true }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const sheetRef = useRef(null);

  /* ── Tính số trang từ chiều cao thực của ProseMirror ── */
  const updatePageCount = useCallback(() => {
    const pm = sheetRef.current?.querySelector('.ProseMirror');
    if (!pm) return;
    setPageCount(Math.max(1, Math.ceil(pm.scrollHeight / PAGE_CONTENT_H)));
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', updatePageCount);
    updatePageCount();
    return () => editor.off('update', updatePageCount);
  }, [editor, updatePageCount]);

  useEffect(() => {
    const pm = sheetRef.current?.querySelector('.ProseMirror');
    if (!pm) return;
    const ro = new ResizeObserver(updatePageCount);
    ro.observe(pm);
    return () => ro.disconnect();
  }, [editor, updatePageCount]);

  /* ── Chặn cursor vào vùng gap giữa trang ── */
  usePageGapGuard(editor, sheetRef);

  /* ── Phím tắt ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* ── Toolbar sticky full-width ── */}
      <div className="docs-toolbar">
        <EditorToolbar
          editor={editor}
          disabled={!canEdit}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </div>

      {/* ── Search bar nổi ── */}
      {searchOpen && (
        <div className="relative z-30">
          <SearchReplaceBar editor={editor} onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ── Canvas xám — cuộn dọc ── */}
      <div className="docs-canvas">
        {!isReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f0f4f9]/80 backdrop-blur-sm">
            <Spin tip="Đang đồng bộ tài liệu..." size="large" />
          </div>
        )}

        {/* Tờ giấy A4 */}
        <div className="docs-page" ref={sheetRef}>
          <PageNumbers count={pageCount} />
          {editor && canEdit && <LinkBubbleMenu editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <StatusBar editor={editor} pageCount={pageCount} />
    </div>
  );
}
