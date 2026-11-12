/* ================= MD Editor ================= */
(function () {
  'use strict';

  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const paneEdit = document.getElementById('paneEdit');
  const panePreview = document.getElementById('panePreview');
  const workspace = document.getElementById('workspace');
  const dragbar = document.getElementById('dragbar');
  const saveStatus = document.getElementById('saveStatus');
  const charCount = document.getElementById('charCount');
  const cursorPos = document.getElementById('cursorPos');
  const syncScrollBox = document.getElementById('syncScroll');
  const themeToggle = document.getElementById('themeToggle');
  const fileInput = document.getElementById('fileInput');
  const toolbar = document.getElementById('toolbar');
  const headingDropdown = document.getElementById('headingDropdown');
  const headingBtn = document.getElementById('headingBtn');
  const headingLabel = document.getElementById('headingLabel');
  const headingMenu = document.getElementById('headingMenu');
  const gutter = document.getElementById('gutter');
  const mirror = document.getElementById('mirror');

  const STORAGE_KEY = 'md-editor:content';
  const THEME_KEY = 'md-editor:theme';
  const VIEW_KEY = 'md-editor:view';
  const SYNC_KEY = 'md-editor:syncScroll';

  const SAMPLE_DOC = `# 欢迎使用 MD Editor

一个**纯前端**、无需登录的在线 Markdown 编辑器，左侧编辑，右侧实时预览。

## 快捷键

| 快捷键 | 功能 |
| ------ | ---- |
| Ctrl + B | 粗体 |
| Ctrl + I | 斜体 |
| Ctrl + K | 链接 |
| Ctrl + S | 保存 |
| Ctrl + Z / Ctrl + Shift + Z | 撤销 / 重做 |
| Tab / Shift + Tab | 缩进 / 取消缩进 |

## 功能特性

- ✅ 实时预览、同步滚动
- ✅ 自动保存到本地（localStorage）
- ✅ 明暗主题切换
- ✅ 导出 \`.md\` / \`.html\`，复制渲染 HTML
- ✅ 代码高亮、表格、任务列表

## 代码示例

\`\`\`javascript
function greet(name) {
  console.log(\`你好, \${name}!\`);
}
greet('Markdown');
\`\`\`

> 提示：内容会自动保存在浏览器本地，刷新页面不会丢失。

开始你的创作吧！
`;

  /* ---------- Markdown 渲染 ---------- */
  marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function (code, lang) {
      try {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      } catch (e) {
        return code;
      }
    },
  });

  function render() {
    const html = marked.parse(editor.value);
    preview.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    preview.querySelectorAll('a').forEach((a) => (a.target = '_blank'));
  }

  /* ---------- 统计与状态 ---------- */
  function updateStats() {
    const text = editor.value;
    const chars = text.replace(/\s/g, '').length;
    charCount.textContent = chars + ' 字';

    const upto = text.slice(0, editor.selectionStart);
    const lines = upto.split('\n');
    cursorPos.textContent = '行 ' + lines.length + ', 列 ' + (lines[lines.length - 1].length + 1);

    // 光标所在行标题级别 → 同步标题下拉的显示
    const currentLine = lines[lines.length - 1];
    const levelMatch = currentLine.match(/^\s*(#{1,6})\s/);
    const level = levelMatch ? levelMatch[1].length : 0;
    headingLabel.textContent = level ? 'H' + level : '标题';
    headingMenu.querySelectorAll('[data-heading]').forEach((b) => {
      b.classList.toggle('is-active', Number(b.dataset.heading) === level);
    });
  }

  /* ---------- 自动保存 ---------- */
  let saveTimer = null;
  function scheduleSave() {
    saveStatus.textContent = '编辑中…';
    saveStatus.classList.add('dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, editor.value);
      saveStatus.textContent = '已保存';
      saveStatus.classList.remove('dirty');
    }, 600);
  }

  function loadSaved() {
    return localStorage.getItem(STORAGE_KEY);
  }

  /* ---------- 工具栏：插入 Markdown ---------- */
  function wrap(before, after, placeholder) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || placeholder || '';
    editor.setRangeText(before + selected + after, start, end, 'end');
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + selected.length;
    editor.focus();
    onChange();
  }

  function linePrefix(prefix, { numbered = false } = {}) {
    const value = editor.value;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
    const block = value.slice(lineStart, lineEnd) || '';
    const lines = block.split('\n');
    let allHave = true;
    lines.forEach((l, i) => {
      const p = numbered ? i + 1 + '. ' : prefix;
      if (!l.startsWith(p)) allHave = false;
    });
    const newLines = lines.map((l, i) => {
      const p = numbered ? i + 1 + '. ' : prefix;
      if (allHave) return l.slice(p.length);
      return p + l.replace(/^(#{1,6}\s|>\s|[-*+]\s\[[ x]\]\s|[-*+]\s|\d+\.\s)/, '');
    });
    editor.setRangeText(newLines.join('\n'), lineStart, lineEnd, 'end');
    editor.focus();
    onChange();
  }

  function insertBlock(text) {
    const start = editor.selectionStart;
    const before = editor.value.slice(0, start);
    const pad = before.length === 0 || before.endsWith('\n\n') ? '' :
      before.endsWith('\n') ? '\n' : '\n\n';
    editor.setRangeText(pad + text, start, editor.selectionEnd, 'end');
    editor.focus();
    onChange();
  }

  const commands = {
    bold: () => wrap('**', '**', '粗体文本'),
    italic: () => wrap('*', '*', '斜体文本'),
    strike: () => wrap('~~', '~~', '删除线文本'),
    h1: () => linePrefix('# '),
    h2: () => linePrefix('## '),
    h3: () => linePrefix('### '),
    h4: () => linePrefix('#### '),
    h5: () => linePrefix('##### '),
    h6: () => linePrefix('###### '),
    quote: () => linePrefix('> '),
    ul: () => linePrefix('- '),
    ol: () => linePrefix('', { numbered: true }),
    task: () => linePrefix('- [ ] '),
    code: () => wrap('`', '`', '代码'),
    codeblock: () => wrap('\n```js\n', '\n```\n', '// 代码'),
    link: () => wrap('[', '](https://)', editor.value.slice(editor.selectionStart, editor.selectionEnd) || '链接文字'),
    image: () => insertBlock('![图片描述](https://)'),
    table: () => insertBlock('| 表头一 | 表头二 | 表头三 |\n| ------ | ------ | ------ |\n| 内容 | 内容 | 内容 |'),
    hr: () => insertBlock('---'),
    clear: () => {
      if (confirm('确定清空全部内容吗？')) {
        editor.value = '';
        onChange();
        editor.focus();
      }
    },
  };

  document.getElementById('toolbar').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cmd]');
    if (btn && commands[btn.dataset.cmd]) commands[btn.dataset.cmd]();
  });

  /* ---------- 标题下拉（H1-H6） ---------- */
  function openHeadingMenu(open) {
    headingDropdown.classList.toggle('open', open);
    toolbar.classList.toggle('dropdown-open', open);
  }

  headingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openHeadingMenu(!headingDropdown.classList.contains('open'));
  });

  headingMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-heading]');
    if (!item) return;
    openHeadingMenu(false);
    commands['h' + item.dataset.heading]();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') openHeadingMenu(false);
  });

  /* ---------- 行号栏（支持自动折行的精确对齐） ---------- */
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function syncMirrorStyle() {
    const cs = getComputedStyle(editor);
    mirror.style.fontFamily = cs.fontFamily;
    mirror.style.fontSize = cs.fontSize;
    mirror.style.fontWeight = cs.fontWeight;
    mirror.style.lineHeight = cs.lineHeight;
    mirror.style.letterSpacing = cs.letterSpacing;
    mirror.style.tabSize = cs.tabSize;
    // 与编辑器文本内容区同宽，保证折行位置一致
    mirror.style.width =
      editor.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 'px';
  }

  function updateGutter() {
    syncMirrorStyle();
    const lines = editor.value.split('\n');
    mirror.innerHTML = lines
      .map((l) => '<div>' + (l ? escapeHtml(l) : '&nbsp;') + '</div>')
      .join('');
    const rowHeight = parseFloat(getComputedStyle(editor).lineHeight);
    let html = '';
    for (let i = 0; i < mirror.children.length; i++) {
      // 折行后的行占用多个视觉行，行号块高度随之增加，保证对齐
      const h = mirror.children[i].offsetHeight || rowHeight;
      html += '<div style="height:' + h + 'px;line-height:' + rowHeight + 'px">' + (i + 1) + '</div>';
    }
    gutter.innerHTML = html;
    gutter.scrollTop = editor.scrollTop;
  }

  // 窗口/分栏尺寸变化时重新测量折行
  if (window.ResizeObserver) new ResizeObserver(updateGutter).observe(editor);

  /* ---------- 编辑事件 ---------- */
  function onChange() {
    render();
    updateStats();
    updateGutter();
    scheduleSave();
  }

  let renderTimer = null;
  let gutterTimer = null;
  editor.addEventListener('input', () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 150); // 输入防抖，打字更流畅
    clearTimeout(gutterTimer);
    gutterTimer = setTimeout(updateGutter, 150); // 行号随内容更新（防抖）
    updateStats();
    scheduleSave();
  });
  editor.addEventListener('click', updateStats);
  editor.addEventListener('keyup', updateStats);
  editor.addEventListener('select', updateStats);

  /* ---------- 同步滚动 ---------- */
  let syncing = false;
  function syncFrom(fromEl, toEl) {
    if (!syncScrollBox.checked || syncing) return;
    syncing = true;
    const fromMax = fromEl.scrollHeight - fromEl.clientHeight;
    const toMax = toEl.scrollHeight - toEl.clientHeight;
    if (fromMax > 0 && toMax > 0) {
      toEl.scrollTop = (fromEl.scrollTop / fromMax) * toMax;
    }
    requestAnimationFrame(() => (syncing = false));
  }

  editor.addEventListener('scroll', () => {
    syncFrom(editor, panePreview);
    gutter.scrollTop = editor.scrollTop; // 行号与编辑区同步滚动
  });
  panePreview.addEventListener('scroll', () => syncFrom(panePreview, editor));
  syncScrollBox.checked = localStorage.getItem(SYNC_KEY) !== '0';
  syncScrollBox.addEventListener('change', () =>
    localStorage.setItem(SYNC_KEY, syncScrollBox.checked ? '1' : '0')
  );

  /* ---------- 快捷键 ---------- */
  editor.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') { e.preventDefault(); commands.bold(); return; }
      if (key === 'i') { e.preventDefault(); commands.italic(); return; }
      if (key === 'k') { e.preventDefault(); commands.link(); return; }
      if (key === 's') { e.preventDefault(); localStorage.setItem(STORAGE_KEY, editor.value); saveStatus.textContent = '已保存'; saveStatus.classList.remove('dirty'); return; }
      if (key === 'z' && e.shiftKey) { e.preventDefault(); document.execCommand('redo'); return; }
      if (key === '/') { e.preventDefault(); wrap('<!-- ', ' -->', '注释'); return; }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      if (start !== end || e.shiftKey) {
        // 多行缩进 / 取消缩进
        const value = editor.value;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
        const block = value.slice(lineStart, lineEnd);
        const lines = block.split('\n').map((l) =>
          e.shiftKey ? l.replace(/^(\t| {1,4})/, '') : '\t' + l
        );
        editor.setRangeText(lines.join('\n'), lineStart, lineEnd, 'end');
      } else {
        editor.setRangeText('\t', start, end, 'end');
      }
      editor.focus();
      onChange();
    }
  });

  /* ---------- 菜单（文件 / 视图） ---------- */
  document.querySelectorAll('.menu').forEach((menu) => {
    menu.querySelector('.menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.menu.open').forEach((m) => m !== menu && m.classList.remove('open'));
      menu.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.menu.open').forEach((m) => m.classList.remove('open'));
    openHeadingMenu(false);
  });

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportHtml() {
    const style = document.querySelector('link[href*="github-markdown"]').outerHTML;
    const isDark = document.documentElement.dataset.theme === 'dark';
    download(
      'document.html',
      `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${isDark ? 'dark' : 'light'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>导出文档</title>
${style}
<style>body{max-width:860px;margin:0 auto;padding:32px 16px;background:${isDark ? '#0d1117' : '#fff'}}</style>
</head>
<body class="markdown-body">
${preview.innerHTML}
</body>
</html>`,
      'text/html'
    );
  }

  const menuActions = {
    new: () => {
      if (editor.value && !confirm('新建文件将覆盖当前内容，确定继续吗？')) return;
      editor.value = '';
      onChange();
      editor.focus();
    },
    open: () => fileInput.click(),
    'save-md': () => download('document.md', editor.value, 'text/markdown'),
    'save-html': exportHtml,
    'copy-html': () => {
      navigator.clipboard.writeText(preview.innerHTML).then(
        () => (saveStatus.textContent = 'HTML 已复制'),
        () => alert('复制失败，请手动复制')
      );
    },
    'toggle-edit': () => setView('edit'),
    'toggle-preview': () => setView('preview'),
    'toggle-split': () => setView('split'),
  };

  document.querySelectorAll('.menu-dropdown button').forEach((btn) =>
    btn.addEventListener('click', () => menuActions[btn.dataset.action] && menuActions[btn.dataset.action]())
  );

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.value = reader.result;
      onChange();
      editor.focus();
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  /* ---------- 视图切换（编辑 / 预览 / 分栏） ---------- */
  function setView(view) {
    localStorage.setItem(VIEW_KEY, view);
    applyView(view);
  }
  function applyView(view) {
    if (view === 'edit') {
      paneEdit.style.flex = '1 1 100%';
      panePreview.style.display = 'none';
      dragbar.style.display = 'none';
    } else if (view === 'preview') {
      paneEdit.style.display = 'none';
      panePreview.style.flex = '1 1 100%';
      dragbar.style.display = 'none';
    } else {
      paneEdit.style.display = '';
      panePreview.style.display = '';
      dragbar.style.display = '';
      paneEdit.style.flex = '1 1 ' + (parseInt(localStorage.getItem('md-editor:split') || '50', 10)) + '%';
      panePreview.style.flex = '1 1 auto';
    }
  }
  applyView(localStorage.getItem(VIEW_KEY) || 'split');

  /* ---------- 拖动分栏 ---------- */
  let dragging = false;
  dragbar.addEventListener('mousedown', (e) => {
    dragging = true;
    dragbar.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = workspace.getBoundingClientRect();
    const pct = Math.min(85, Math.max(15, ((e.clientX - rect.left) / rect.width) * 100));
    paneEdit.style.flex = '1 1 ' + pct + '%';
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    dragbar.classList.remove('dragging');
    document.body.style.cursor = '';
    const pct = parseFloat(paneEdit.style.flex.split(' ')[2]);
    localStorage.setItem('md-editor:split', String(Math.round(pct)));
  });

  /* ---------- 主题切换 ---------- */
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(THEME_KEY, theme);
  }
  themeToggle.addEventListener('click', () =>
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
  );
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(localStorage.getItem(THEME_KEY) || (prefersDark ? 'dark' : 'light'));

  /* ---------- 初始化 ---------- */
  editor.value = loadSaved() !== null ? loadSaved() : SAMPLE_DOC;
  render();
  updateStats();
  updateGutter();
  editor.focus();
  editor.setSelectionRange(0, 0);
})();
