export default function StatusBar({ editor, pageCount = 1 }) {
  if (!editor) return null;

  const text = editor.state.doc.textContent;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div
      className="flex items-center gap-4 border-t border-gray-200 bg-white px-4 py-1"
      style={{ fontSize: '12px', color: '#5f6368', userSelect: 'none' }}
    >
      <span>Trang {pageCount}</span>
      <span>·</span>
      <span>{wordCount.toLocaleString()} từ</span>
      <span>·</span>
      <span>{charCount.toLocaleString()} ký tự</span>
    </div>
  );
}
