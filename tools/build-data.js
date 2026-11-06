#!/usr/bin/env node
/* ==========================================================================
   岐黄翰墨 · 数据构建脚本 (Build Data)
   --------------------------------------------------------------------------
   作用：把 data/*.json（内容的唯一源）打包成 assets/data/tcm-data.js，
        供 file:// 协议直接双击打开 HTML 时使用（浏览器禁止 file:// 下的 fetch）。

   用法：
     node tools/build-data.js          # 等价于 npm run build
     node tools/build-data.js --check  # 只做校验，不写文件

   不依赖任何第三方包，仅需 Node.js 14+。
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(ROOT, 'assets', 'data', 'tcm-data.js');

const DATA_FILES = [
  'site', 'theory', 'classics', 'herbs', 'formulas',
  'acupuncture', 'diet', 'solar', 'constitution', 'diseases', 'about'
];

const checkOnly = process.argv.includes('--check');

/* ---------- 校验工具 ---------- */
const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function countText(node) {
  let n = 0;
  if (typeof node === 'string') return node.replace(/\s/g, '').length;
  if (Array.isArray(node)) return node.reduce((a, b) => a + countText(b), 0);
  if (node && typeof node === 'object') {
    return Object.keys(node).reduce((a, k) => a + countText(node[k]), 0);
  }
  return 0;
}

const ALLOWED_BLOCKS = new Set([
  'paragraph', 'heading', 'list', 'table', 'quote',
  'callout', 'keypoints', 'cards', 'divider', 'accordion'
]);

function validateBlocks(blocks, where) {
  if (!Array.isArray(blocks)) { fail(`${where}: blocks 必须是数组`); return; }
  blocks.forEach((b, i) => {
    const at = `${where}.blocks[${i}]`;
    if (!b || !b.type) { fail(`${at}: 缺少 type 字段`); return; }
    if (!ALLOWED_BLOCKS.has(b.type)) { fail(`${at}: 未知块类型 "${b.type}"`); }
    if (b.type === 'table') {
      const head = b.head || [];
      const rows = b.rows || [];
      rows.forEach((r, ri) => {
        if (!Array.isArray(r) || r.length !== head.length) {
          fail(`${at}.rows[${ri}]: 列数(${Array.isArray(r) ? r.length : '?'}) 与表头(${head.length})不一致`);
        }
      });
    }
    if (b.type === 'cards') {
      (b.items || []).forEach((c, ci) => {
        if (!c.title) fail(`${at}.items[${ci}]: 缺少 title`);
      });
    }
  });
}

/* ---------- 主流程 ---------- */
console.log('▶ 岐黄翰墨 · 数据构建');
console.log('  源目录：' + DATA_DIR);
console.log('');

const bundle = {};
let totalChars = 0;

for (const name of DATA_FILES) {
  const file = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(file)) { fail(`缺少数据文件：data/${name}.json`); continue; }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`data/${name}.json 不是合法 JSON：${e.message}`);
    continue;
  }
  bundle[name] = data;

  if (name === 'site') {
    if (!data.nav || !data.nav.length) fail('data/site.json: nav 不能为空');
    console.log(`  ✔ site.json          导航 ${data.nav ? data.nav.length : 0} 项`);
    continue;
  }

  const page = data.page;
  if (!page) { fail(`data/${name}.json: 缺少 page 字段`); continue; }
  if (!page.key) fail(`data/${name}.json: page.key 缺失`);
  if (!page.title) fail(`data/${name}.json: page.title 缺失`);
  if (!['section', 'collection'].includes(page.type)) {
    fail(`data/${name}.json: page.type 必须是 section 或 collection，实际为 "${page.type}"`);
  }

  const entries = page.type === 'collection' ? (page.items || []) : (page.sections || []);
  if (!entries.length) fail(`data/${name}.json: ${page.type} 型页面内容为空`);

  const ids = new Set();
  entries.forEach((e, i) => {
    const where = `data/${name}.json ${page.type}[${i}]`;
    if (!e.id) fail(`${where}: 缺少 id`);
    else if (ids.has(e.id)) fail(`${where}: id 重复 —— "${e.id}"`);
    else ids.add(e.id);
    if (!e.title) fail(`${where}: 缺少 title`);
    if (!e.summary) warn(`${where}: 缺少 summary`);
    if (!e.blocks || !e.blocks.length) fail(`${where}: blocks 为空`);
    else validateBlocks(e.blocks, where);
  });

  const chars = countText(page);
  totalChars += chars;
  const label = page.type === 'collection' ? '条目' : '章节';
  console.log(
    `  ✔ ${(name + '.json').padEnd(22)} ${String(entries.length).padStart(3)} ${label}` +
    `　${String(Math.round(chars / 1000)).padStart(4)}k 字`
  );
}

/* ---------- 生成统计文件 stats.json ---------- */
/**
 * 站点上的「内容统计」「专题导航计数」「首页简介与模块描述」里的数字
 * 全部来自这里，随内容增减自动更新，不再写死在页面或配置里。
 * stats.json 是构建产物，由 build-data.js 自动生成，不要手工编辑。
 */
const STAT_BOARDS = [
  'theory', 'classics', 'herbs', 'formulas',
  'acupuncture', 'diet', 'solar', 'constitution', 'diseases', 'about'
];

function buildStats() {
  // 单位与固定值来自 site.json 的 stats 段（内容元信息，属于人工维护部分）
  let siteCfg = {};
  try {
    siteCfg = (JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'site.json'), 'utf8')).stats || {});
  } catch (e) { /* site.json 缺失时用默认单位 */ }

  const boards = {};
  let totalEntries = 0;
  let totalChars = 0;

  for (const key of STAT_BOARDS) {
    const data = bundle[key];
    if (!data || !data.page) continue;
    const page = data.page;
    const arr = page.type === 'collection' ? (page.items || []) : (page.sections || []);
    const raw = arr.length;
    totalEntries += raw;
    totalChars += countText(page);

    const cfg = siteCfg[key] || {};
    boards[key] = {
      count: (typeof cfg.count === 'number') ? cfg.count : raw,
      raw: raw,
      unit: cfg.unit || (page.type === 'collection' ? '条' : '章'),
      type: page.type
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: { entries: totalEntries, chars: totalChars },
    boards: boards
  };
}

const stats = buildStats();
fs.writeFileSync(path.join(DATA_DIR, 'stats.json'), JSON.stringify(stats, null, 2), 'utf8');
bundle.stats = stats;

console.log('');
console.log('  ── 统计（自动生成 data/stats.json）──');
for (const key of STAT_BOARDS) {
  const b = stats.boards[key];
  if (!b) continue;
  const mark = b.count === b.raw ? '' : '（固定值，章节 ' + b.raw + '）';
  console.log('    ' + key.padEnd(14) + String(b.count).padStart(4) + ' ' + b.unit + mark);
}
console.log('    合计 ' + stats.totals.entries + ' 条 / 约 ' + Math.round(stats.totals.chars / 1000) + 'k 字');

/* ---------- 校验汇总 ---------- */
if (warnings.length) {
  console.log('');
  warnings.forEach(w => console.log('  ⚠ ' + w));
}
if (errors.length) {
  console.error('');
  console.error('✖ 校验未通过，共 ' + errors.length + ' 处问题：');
  errors.forEach(e => console.error('   - ' + e));
  process.exit(1);
}

if (checkOnly) {
  console.log('');
  console.log('✔ 校验通过（未写出文件）。合计正文约 ' + (Math.round(totalChars / 1000)) + 'k 字。');
  process.exit(0);
}

/* ---------- 输出 bundle ---------- */
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

const json = JSON.stringify(bundle);
const banner =
  '/* ==========================================================================\n' +
  '   岐黄翰墨 · 数据预构建包（自动生成，请勿手工编辑）\n' +
  '   来源：data/*.json\n' +
  '   生成：node tools/build-data.js\n' +
  '   用途：在 file:// 协议下提供数据（浏览器禁止本地 fetch）\n' +
  '   ' + new Date().toISOString() + '\n' +
  '   ========================================================================== */\n';

fs.writeFileSync(OUT_FILE, banner + 'window.__TCM_DATA__ = ' + json + ';\n', 'utf8');

const size = fs.statSync(OUT_FILE).size;
console.log('');
console.log('✔ 校验通过，正文合计约 ' + (Math.round(totalChars / 1000)) + 'k 字');
console.log('✔ 已生成 ' + path.relative(ROOT, OUT_FILE) + '（' + (size / 1024).toFixed(0) + ' KB）');

/* ---------- 同步 GitHub Actions 工作流到仓库根目录 ---------- */
// GitHub 只识别仓库根目录下的 .github/workflows/，
// 而本站要求所有文件都放在 TCM/ 内，因此这里自动做一次镜像同步。
const workflowSrc = path.join(ROOT, '.github', 'workflows', 'pages.yml');
const repoRoot = path.resolve(ROOT, '..');
const workflowDst = path.join(repoRoot, '.github', 'workflows', 'pages.yml');

if (fs.existsSync(workflowSrc) && repoRoot !== ROOT) {
  try {
    fs.mkdirSync(path.dirname(workflowDst), { recursive: true });
    const same = fs.existsSync(workflowDst) &&
      fs.readFileSync(workflowSrc, 'utf8') === fs.readFileSync(workflowDst, 'utf8');
    if (!same) {
      fs.writeFileSync(workflowDst, fs.readFileSync(workflowSrc, 'utf8'), 'utf8');
      console.log('✔ 已同步工作流到 ' + path.relative(repoRoot, workflowDst).replace(/\\/g, '/'));
    } else {
      console.log('· 工作流已与 ' + path.relative(repoRoot, workflowDst).replace(/\\/g, '/') + ' 保持一致');
    }
  } catch (e) {
    console.warn('⚠ 同步工作流失败（可手动复制）：' + e.message);
  }
}

console.log('');
console.log('  提示：以 http:// 方式访问时页面直接读取 data/*.json，本包仅作 file:// 场景的兜底。');
