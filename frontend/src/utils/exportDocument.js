/**
 * Export utilities — hoàn toàn phía client, không cần server.
 *
 * Lỗi thường gặp với window.open():
 *   Browser chặn popup khi được gọi từ synthetic event (Ant Design Dropdown).
 * Giải pháp PDF: dùng iframe ẩn thay vì window.open().
 */

/* ── Helpers ────────────────────────────────────────── */

function sanitizeFilename(title) {
  return (title || 'document').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document';
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // Cần append vào DOM để Safari không chặn
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Giải phóng URL sau 1 giây (đủ thời gian browser tải file)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSS chung dùng cho cả HTML export và PDF print */
function getDocumentCSS() {
  return `
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #202124;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 40px;
    }
    h1 { font-size: 20pt; font-weight: 700; margin: 0.8em 0 0.3em; }
    h2 { font-size: 16pt; font-weight: 700; margin: 0.7em 0 0.3em; }
    h3 { font-size: 14pt; font-weight: 700; margin: 0.6em 0 0.3em; }
    p  { margin: 0 0 0.5em; }
    blockquote {
      border-left: 3px solid #dadce0;
      padding-left: 1rem;
      color: #5f6368;
      margin: 1em 0;
      font-style: italic;
    }
    code {
      background: #f1f3f4;
      border-radius: 3px;
      color: #c0392b;
      font-size: 0.875em;
      font-family: 'Roboto Mono', monospace;
      padding: 0.1em 0.3em;
    }
    pre {
      background: #f8f9fa;
      border: 1px solid #e8eaed;
      border-radius: 4px;
      padding: 0.75rem 1rem;
      overflow-x: auto;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85em;
    }
    pre code { background: none; padding: 0; color: inherit; }
    ul { list-style: disc;    padding-left: 1.5em; margin: 0.5em 0; }
    ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
    a  { color: #1155cc; text-decoration: underline; }
    img { max-width: 100%; border-radius: 2px; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #dadce0; padding: 6px 12px; }
    th { background: #f1f3f4; font-weight: 600; text-align: left; }
    hr { border: none; border-top: 1px solid #dadce0; margin: 1.5em 0; }
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    ul[data-type="taskList"] li { display: flex; gap: 8px; align-items: flex-start; margin: 0.2em 0; }
    /* Ẩn cursor overlay khi in */
    .collaboration-cursor__caret,
    .collaboration-cursor__label { display: none !important; }
  `;
}

function buildHTMLDocument(title, bodyHTML) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title || 'Document'}</title>
  <style>${getDocumentCSS()}</style>
</head>
<body>${bodyHTML}</body>
</html>`;
}

/* ── Export functions ────────────────────────────────── */

export function exportAsHTML(editor, title) {
  if (!editor) return;
  const html = buildHTMLDocument(title, editor.getHTML());
  downloadBlob(`${sanitizeFilename(title)}.html`, html, 'text/html;charset=utf-8');
}

export function exportAsText(editor, title) {
  if (!editor) return;
  const text = editor.getText({ blockSeparator: '\n\n' });
  downloadBlob(`${sanitizeFilename(title)}.txt`, text, 'text/plain;charset=utf-8');
}

export function exportAsMarkdown(editor, title) {
  if (!editor) return;
  const json = editor.getJSON();
  const markdown = nodeToMarkdown(json);
  downloadBlob(`${sanitizeFilename(title)}.md`, markdown, 'text/markdown;charset=utf-8');
}

/**
 * Xuất PDF bằng cách:
 * 1. Tạo HTML blob từ nội dung editor
 * 2. Nhúng vào iframe ẩn
 * 3. Gọi iframe.contentWindow.print()
 *
 * Không dùng window.open() để tránh bị browser chặn popup
 * khi được gọi từ Dropdown menu (synthetic event).
 */
export function exportAsPDF(editor, title) {
  if (!editor) return;

  const editorEl = document.querySelector('.ProseMirror');
  if (!editorEl) return;

  const printHTML = buildHTMLDocument(title, editorEl.innerHTML);

  // Tạo iframe ẩn
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(printHTML);
  iframeDoc.close();

  // Đợi tài nguyên (font, ảnh) load xong rồi mới print
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus(); // cần thiết cho một số browser
      iframe.contentWindow.print();
    } finally {
      // Xóa iframe sau khi dialog print đóng (300ms là đủ)
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 500);
    }
  };
}

/* ── Markdown converter ──────────────────────────────── */

function nodeToMarkdown(node, opts = {}) {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map((n) => nodeToMarkdown(n)).join('\n\n');

    case 'paragraph':
      return inlineToMarkdown(node.content || []);

    case 'heading': {
      const level = node.attrs?.level || 1;
      const text = inlineToMarkdown(node.content || []);
      return `${'#'.repeat(level)} ${text}`;
    }

    case 'bulletList':
      return (node.content || []).map((item) => {
        const text = (item.content || []).map((n) => nodeToMarkdown(n)).join('\n');
        return `- ${text}`;
      }).join('\n');

    case 'orderedList': {
      let i = node.attrs?.start || 1;
      return (node.content || []).map((item) => {
        const text = (item.content || []).map((n) => nodeToMarkdown(n)).join('\n');
        return `${i++}. ${text}`;
      }).join('\n');
    }

    case 'taskList':
      return (node.content || []).map((item) => {
        const checked = item.attrs?.checked ? 'x' : ' ';
        const text = (item.content || []).map((n) => nodeToMarkdown(n)).join('\n');
        return `- [${checked}] ${text}`;
      }).join('\n');

    case 'blockquote':
      return (node.content || []).map((n) => `> ${nodeToMarkdown(n)}`).join('\n');

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((n) => n.text || '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
      return '---';

    case 'image': {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      if (src.startsWith('data:')) return `![${alt}](image)`;
      return `![${alt}](${src})`;
    }

    case 'table':
      return tableToMarkdown(node);

    default:
      return (node.content || []).map((n) => nodeToMarkdown(n)).join('');
  }
}

function inlineToMarkdown(nodes) {
  return (nodes || []).map((node) => {
    if (node.type === 'text') {
      let text = node.text || '';
      const marks = node.marks || [];
      if (marks.some((m) => m.type === 'code')) return `\`${text}\``;
      if (marks.some((m) => m.type === 'link')) {
        const href = marks.find((m) => m.type === 'link')?.attrs?.href || '';
        if (marks.some((m) => m.type === 'bold'))   text = `**${text}**`;
        if (marks.some((m) => m.type === 'italic')) text = `_${text}_`;
        return `[${text}](${href})`;
      }
      if (marks.some((m) => m.type === 'bold'))        text = `**${text}**`;
      if (marks.some((m) => m.type === 'italic'))      text = `_${text}_`;
      if (marks.some((m) => m.type === 'strike'))      text = `~~${text}~~`;
      return text;
    }
    if (node.type === 'hardBreak') return '  \n';
    return nodeToMarkdown(node);
  }).join('');
}

function tableToMarkdown(tableNode) {
  const rows = tableNode.content || [];
  if (!rows.length) return '';

  const getCells = (row) =>
    (row.content || []).map((cell) =>
      (cell.content || []).map((n) => nodeToMarkdown(n)).join(' ').trim()
    );

  const headerRow = getCells(rows[0]);
  const separator = headerRow.map(() => '---');
  const bodyRows  = rows.slice(1).map(getCells);

  const toRow = (cells) => `| ${cells.join(' | ')} |`;
  return [toRow(headerRow), toRow(separator), ...bodyRows.map(toRow)].join('\n');
}
