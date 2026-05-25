/**
 * Export utilities — no external deps needed:
 *  - PDF: browser print with print-specific CSS
 *  - HTML: editor HTML content
 *  - Markdown: manual conversion from editor JSON
 *  - Plain text: editor.getText()
 */

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title) {
  return (title || 'document').replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document';
}

export function exportAsHTML(editor, title) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title || 'Document'}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #111; }
    h1 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.5em; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; }
    p { margin: 0.75em 0; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1em 0; }
    code { background: #f3f4f6; padding: 0.15em 0.3em; border-radius: 4px; font-size: 0.875em; color: #ef4444; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1em; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    ul { list-style: disc; padding-left: 1.5em; }
    ol { list-style: decimal; padding-left: 1.5em; }
    a { color: #3b82f6; text-decoration: underline; }
    img { max-width: 100%; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
    td, th { border: 1px solid #d1d5db; padding: 8px 12px; }
    th { background: #f3f4f6; font-weight: 600; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
  </style>
</head>
<body>
  ${editor.getHTML()}
</body>
</html>`;
  downloadFile(`${sanitizeFilename(title)}.html`, html, 'text/html');
}

export function exportAsText(editor, title) {
  const text = editor.getText({ blockSeparator: '\n\n' });
  downloadFile(`${sanitizeFilename(title)}.txt`, text, 'text/plain');
}

// Simple JSON-to-Markdown converter
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
      // Skip base64 images in markdown — too large
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
      // Apply marks in correct nesting order
      if (marks.some((m) => m.type === 'code')) return `\`${text}\``;
      if (marks.some((m) => m.type === 'link')) {
        const href = marks.find((m) => m.type === 'link')?.attrs?.href || '';
        if (marks.some((m) => m.type === 'bold')) text = `**${text}**`;
        if (marks.some((m) => m.type === 'italic')) text = `_${text}_`;
        return `[${text}](${href})`;
      }
      if (marks.some((m) => m.type === 'bold')) text = `**${text}**`;
      if (marks.some((m) => m.type === 'italic')) text = `_${text}_`;
      if (marks.some((m) => m.type === 'strike')) text = `~~${text}~~`;
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
  const bodyRows = rows.slice(1).map(getCells);

  const toRow = (cells) => `| ${cells.join(' | ')} |`;
  return [toRow(headerRow), toRow(separator), ...bodyRows.map(toRow)].join('\n');
}

export function exportAsMarkdown(editor, title) {
  const json = editor.getJSON();
  const markdown = nodeToMarkdown(json);
  downloadFile(`${sanitizeFilename(title)}.md`, markdown, 'text/markdown');
}

export function exportAsPDF(title) {
  // Inject print CSS to isolate just the editor area
  const style = document.createElement('style');
  style.id = '__export-print-style';
  style.textContent = `
    @media print {
      body > *:not(#root) { display: none !important; }
      #root > * { display: none !important; }
      .ProseMirror-print-target { display: block !important; }
      /* Hide everything except editor content */
      body { margin: 0; }
      .editor-print-wrapper { display: block !important; }
      /* Show only the ProseMirror content */
      body > * { display: none; }
      .ProseMirror { display: block !important; min-height: unset !important; }
    }
  `;

  // Simpler approach: open HTML in new window and print
  const editorEl = document.querySelector('.ProseMirror');
  if (!editorEl) return;

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title || 'Document'}</title>
  <meta charset="UTF-8" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #111; }
    h1 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.5em; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; }
    p { margin: 0.75em 0; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1em 0; }
    code { background: #f3f4f6; padding: 0.15em 0.3em; border-radius: 4px; font-size: 0.875em; color: #ef4444; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1em; border-radius: 8px; }
    pre code { background: none; color: inherit; padding: 0; }
    ul { list-style: disc; padding-left: 1.5em; }
    ol { list-style: decimal; padding-left: 1.5em; }
    a { color: #3b82f6; text-decoration: underline; }
    img { max-width: 100%; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
    td, th { border: 1px solid #d1d5db; padding: 8px 12px; }
    th { background: #f3f4f6; font-weight: 600; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
    /* Task list */
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    ul[data-type="taskList"] li { display: flex; gap: 8px; align-items: flex-start; }
    /* Collaboration cursors hidden on print */
    .collaboration-cursor__caret, .collaboration-cursor__label { display: none !important; }
  </style>
</head>
<body>
  ${editorEl.innerHTML}
  <script>
    window.onload = () => { window.print(); window.close(); }
  </script>
</body>
</html>`);
  win.document.close();
}
