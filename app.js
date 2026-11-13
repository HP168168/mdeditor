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
  const langToggle = document.getElementById('langToggle');
  const fileInput = document.getElementById('fileInput');
  const toolbar = document.getElementById('toolbar');
  const headingDropdown = document.getElementById('headingDropdown');
  const headingBtn = document.getElementById('headingBtn');
  const headingLabel = document.getElementById('headingLabel');
  const headingMenu = document.getElementById('headingMenu');
  const gutter = document.getElementById('gutter');
  const mirror = document.getElementById('mirror');
  const mobileSwitcher = document.getElementById('mobileSwitcher');

  const STORAGE_KEY = 'md-editor:content';
  const THEME_KEY = 'md-editor:theme';
  const VIEW_KEY = 'md-editor:view';
  const SYNC_KEY = 'md-editor:syncScroll';
  const LANG_KEY = 'md-editor:lang';

  /* ---------- i18n（方案 A：内联字典 + 运行时切换） ---------- */
  const FALLBACK_LANG = 'zh-CN';
  const DICT = {
    'zh-CN': {
      'menu.file': '文件 ▾',
      'file.new': '新建文件',
      'file.open': '打开 .md 文件…',
      'file.saveMd': '下载 .md',
      'file.saveHtml': '下载 .html',
      'file.copyHtml': '复制渲染 HTML',
      'menu.view': '视图 ▾',
      'view.editOnly': '只看编辑区',
      'view.previewOnly': '只看预览区',
      'view.split': '分栏视图',
      'topbar.syncScroll': '同步滚动',
      'topbar.syncScrollTitle': '编辑区与预览区同步滚动',
      'topbar.theme': '切换明暗主题',
      'topbar.lang': '切换语言',
      'toolbar.bold': '粗体 (Ctrl+B)',
      'toolbar.italic': '斜体 (Ctrl+I)',
      'toolbar.strike': '删除线',
      'toolbar.heading': '标题 H1-H6',
      'heading.label': '标题',
      'heading.h1': '一级标题',
      'heading.h2': '二级标题',
      'heading.h3': '三级标题',
      'heading.h4': '四级标题',
      'heading.h5': '五级标题',
      'heading.h6': '六级标题',
      'toolbar.quote': '引用',
      'toolbar.ul': '无序列表',
      'toolbar.ol': '有序列表',
      'toolbar.task': '任务列表',
      'toolbar.link': '链接 (Ctrl+K)',
      'toolbar.image': '图片',
      'toolbar.code': '行内代码',
      'toolbar.codeblock': '代码块',
      'toolbar.table': '表格',
      'toolbar.hr': '分割线',
      'toolbar.undo': '撤销 (Ctrl+Z)',
      'toolbar.redo': '重做 (Ctrl+Shift+Z)',
      'toolbar.clear': '清空内容',
      'editor.placeholder': '# 在这里输入 Markdown…',
      'editor.aria': 'Markdown 编辑区',
      'dragbar.title': '拖动调整分栏宽度',
      'preview.aria': '预览区',
      'mobile.aria': '编辑/预览视图切换',
      'view.edit': '编辑',
      'view.preview': '预览',
      'view.splitMobile': '分屏',
      'status.saved': '已保存',
      'status.editing': '编辑中…',
      'status.htmlCopied': 'HTML 已复制',
      'error.copyFailed': '复制失败，请手动复制',
      'stats.chars': '{n} 字',
      'stats.cursor': '行 {line}, 列 {col}',
      'confirm.clear': '确定清空全部内容吗？',
      'confirm.new': '新建文件将覆盖当前内容，确定继续吗？',
      'export.title': '导出文档',
      'ph.bold': '粗体文本',
      'ph.italic': '斜体文本',
      'ph.strike': '删除线文本',
      'ph.code': '代码',
      'ph.codeblock': '// 代码',
      'ph.link': '链接文字',
      'ph.image': '图片描述',
      'ph.comment': '注释',
      'table.template':
        '| 表头一 | 表头二 | 表头三 |\n| ------ | ------ | ------ |\n| 内容 | 内容 | 内容 |',
    },
    en: {
      'menu.file': 'File ▾',
      'file.new': 'New file',
      'file.open': 'Open .md file…',
      'file.saveMd': 'Download .md',
      'file.saveHtml': 'Download .html',
      'file.copyHtml': 'Copy rendered HTML',
      'menu.view': 'View ▾',
      'view.editOnly': 'Editor only',
      'view.previewOnly': 'Preview only',
      'view.split': 'Split view',
      'topbar.syncScroll': 'Sync scroll',
      'topbar.syncScrollTitle': 'Sync scrolling between editor and preview',
      'topbar.theme': 'Toggle dark/light theme',
      'topbar.lang': 'Switch language',
      'toolbar.bold': 'Bold (Ctrl+B)',
      'toolbar.italic': 'Italic (Ctrl+I)',
      'toolbar.strike': 'Strikethrough',
      'toolbar.heading': 'Heading H1-H6',
      'heading.label': 'Heading',
      'heading.h1': 'Heading 1',
      'heading.h2': 'Heading 2',
      'heading.h3': 'Heading 3',
      'heading.h4': 'Heading 4',
      'heading.h5': 'Heading 5',
      'heading.h6': 'Heading 6',
      'toolbar.quote': 'Blockquote',
      'toolbar.ul': 'Bullet list',
      'toolbar.ol': 'Numbered list',
      'toolbar.task': 'Task list',
      'toolbar.link': 'Link (Ctrl+K)',
      'toolbar.image': 'Image',
      'toolbar.code': 'Inline code',
      'toolbar.codeblock': 'Code block',
      'toolbar.table': 'Table',
      'toolbar.hr': 'Horizontal rule',
      'toolbar.undo': 'Undo (Ctrl+Z)',
      'toolbar.redo': 'Redo (Ctrl+Shift+Z)',
      'toolbar.clear': 'Clear content',
      'editor.placeholder': '# Type Markdown here…',
      'editor.aria': 'Markdown editor',
      'dragbar.title': 'Drag to resize panes',
      'preview.aria': 'Preview',
      'mobile.aria': 'Edit/preview view switcher',
      'view.edit': 'Edit',
      'view.preview': 'Preview',
      'view.splitMobile': 'Split',
      'status.saved': 'Saved',
      'status.editing': 'Editing…',
      'status.htmlCopied': 'HTML copied',
      'error.copyFailed': 'Copy failed. Please copy manually.',
      'stats.chars': '{n} chars',
      'stats.cursor': 'Ln {line}, Col {col}',
      'confirm.clear': 'Clear all content?',
      'confirm.new': 'Creating a new file will overwrite the current content. Continue?',
      'export.title': 'Exported Document',
      'ph.bold': 'bold text',
      'ph.italic': 'italic text',
      'ph.strike': 'strikethrough text',
      'ph.code': 'code',
      'ph.codeblock': '// code',
      'ph.link': 'link text',
      'ph.image': 'image description',
      'ph.comment': 'comment',
      'table.template':
        '| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell | Cell | Cell |',
    },
  };
  const SUPPORTED_LANGS = Object.keys(DICT);

  // 语言检测：localStorage → navigator.language → 默认 zh-CN
  function detectLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.indexOf(saved) !== -1) return saved;
    const candidates = navigator.languages || [navigator.language || FALLBACK_LANG];
    for (let i = 0; i < candidates.length; i++) {
      const lang = String(candidates[i]).toLowerCase();
      for (let j = 0; j < SUPPORTED_LANGS.length; j++) {
        if (lang.indexOf(SUPPORTED_LANGS[j].toLowerCase().split('-')[0]) === 0) {
          return SUPPORTED_LANGS[j];
        }
      }
    }
    return FALLBACK_LANG;
  }

  let currentLang = detectLang();

  // 取词：缺键回退默认语言并告警；支持 {name} 占位符
  function t(key, params) {
    const dict = DICT[currentLang] || DICT[FALLBACK_LANG];
    let s = dict[key] !== undefined ? dict[key] : DICT[FALLBACK_LANG][key];
    if (s === undefined) {
      console.warn('[i18n] missing key:', key);
      return key;
    }
    if (params) {
      Object.keys(params).forEach((k) => {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
      });
    }
    return s;
  }

  // 将当前语言应用到静态 HTML 标记与动态状态
  function applyI18n() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.dataset.i18nTitle));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    });
    langToggle.textContent = currentLang === FALLBACK_LANG ? 'EN' : '中';
    langToggle.setAttribute('aria-label', t('topbar.lang'));
    langToggle.setAttribute('title', t('topbar.lang'));
    // 动态状态栏随语言刷新：保持“编辑中/已保存”状态语义
    saveStatus.textContent = saveStatus.classList.contains('dirty')
      ? t('status.editing')
      : t('status.saved');
    updateStats();
  }

  // 切换语言：持久化 + 全量重渲染（静态标记与动态状态）
  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1 || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
  }

  langToggle.addEventListener('click', () =>
    setLang(currentLang === FALLBACK_LANG ? 'en' : FALLBACK_LANG)
  );


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
    charCount.textContent = t('stats.chars', { n: chars });

    const upto = text.slice(0, editor.selectionStart);
    const lines = upto.split('\n');
    cursorPos.textContent = t('stats.cursor', {
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });

    // 光标所在行标题级别 → 同步标题下拉的显示
    const currentLine = lines[lines.length - 1];
    const levelMatch = currentLine.match(/^\s*(#{1,6})\s/);
    const level = levelMatch ? levelMatch[1].length : 0;
    headingLabel.textContent = level ? 'H' + level : t('heading.label');
    headingMenu.querySelectorAll('[data-heading]').forEach((b) => {
      b.classList.toggle('is-active', Number(b.dataset.heading) === level);
    });
  }

  /* ---------- 自动保存 ---------- */
  let saveTimer = null;
  function scheduleSave() {
    saveStatus.textContent = t('status.editing');
    saveStatus.classList.add('dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, editor.value);
      saveStatus.textContent = t('status.saved');
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
    bold: () => wrap('**', '**', t('ph.bold')),
    italic: () => wrap('*', '*', t('ph.italic')),
    strike: () => wrap('~~', '~~', t('ph.strike')),
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
    code: () => wrap('`', '`', t('ph.code')),
    codeblock: () => wrap('\n```js\n', '\n```\n', t('ph.codeblock')),
    link: () => wrap('[', '](https://)', editor.value.slice(editor.selectionStart, editor.selectionEnd) || t('ph.link')),
    image: () => insertBlock('![' + t('ph.image') + '](https://)'),
    table: () => insertBlock(t('table.template')),
    hr: () => insertBlock('---'),
    clear: () => {
      if (confirm(t('confirm.clear'))) {
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
      if (key === 's') { e.preventDefault(); localStorage.setItem(STORAGE_KEY, editor.value); saveStatus.textContent = t('status.saved'); saveStatus.classList.remove('dirty'); return; }
      if (key === 'z' && e.shiftKey) { e.preventDefault(); document.execCommand('redo'); return; }
      if (key === '/') { e.preventDefault(); wrap('<!-- ', ' -->', t('ph.comment')); return; }
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
<html lang="${currentLang}" data-theme="${isDark ? 'dark' : 'light'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t('export.title')}</title>
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
      if (editor.value && !confirm(t('confirm.new'))) return;
      editor.value = '';
      onChange();
      editor.focus();
    },
    open: () => fileInput.click(),
    'save-md': () => download('document.md', editor.value, 'text/markdown'),
    'save-html': exportHtml,
    'copy-html': () => {
      navigator.clipboard.writeText(preview.innerHTML).then(
        () => (saveStatus.textContent = t('status.htmlCopied')),
        () => alert(t('error.copyFailed'))
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
    // 手机竖屏为单屏模式：分栏回退为编辑视图（横屏仍可分栏，由 CSS 控制）
    const mobilePortrait =
      window.matchMedia('(max-width: 640px)').matches &&
      window.matchMedia('(orientation: portrait)').matches;
    if (mobilePortrait && view === 'split') view = 'edit';

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

    // 同步移动端分段切换控件的选中态
    document.body.dataset.view = view;
    mobileSwitcher.querySelectorAll('[data-view]').forEach((b) => {
      const active = b.dataset.view === view;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
  }
  applyView(localStorage.getItem(VIEW_KEY) || 'split');

  // 移动端分段切换控件
  mobileSwitcher.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) setView(btn.dataset.view);
  });

  // 断点/方向变化时重新应用视图（如竖屏分栏回退编辑、旋转后恢复分栏）
  const mobileMq = window.matchMedia('(max-width: 640px)');
  const portraitMq = window.matchMedia('(orientation: portrait)');
  const onViewMediaChange = () => applyView(localStorage.getItem(VIEW_KEY) || 'split');
  if (mobileMq.addEventListener) {
    mobileMq.addEventListener('change', onViewMediaChange);
    portraitMq.addEventListener('change', onViewMediaChange);
  } else {
    mobileMq.addListener(onViewMediaChange);
    portraitMq.addListener(onViewMediaChange);
  }

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
  applyI18n();
  editor.value = loadSaved() !== null ? loadSaved() : SAMPLE_DOC;
  render();
  updateStats();
  updateGutter();
  editor.focus();
  editor.setSelectionRange(0, 0);
})();
