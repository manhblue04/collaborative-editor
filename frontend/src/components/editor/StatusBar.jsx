export default function StatusBar({ editor }) {
  if (!editor) return null;

  const text = editor.state.doc.textContent;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-4 py-1.5 text-xs text-gray-400">
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
    </div>
  );
}
