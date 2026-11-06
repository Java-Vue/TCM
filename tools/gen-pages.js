#!/usr/bin/env node
/* ==========================================================================
   岐黄翰墨 · 页面骨架生成器 (Generate Page Shells)
   --------------------------------------------------------------------------
   作用：根据 data/site.json 的导航配置与各页 data/*.json 的标题信息，
        生成根目录下的静态 HTML 页面骨架（内容由 assets/js/app.js 动态渲染）。

   用法：
     node tools/gen-pages.js          # 生成全部页面骨架
     node tools/gen-pages.js --force  # 已存在时也覆盖（默认也覆盖，仅提示）

   新增页面流程见 README「新增一个页面」一节。
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

function readJSON(name) {
  const f = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; }
}

const site = readJSON('site');
if (!site) {
  console.error('✖ 无法读取 data/site.json');
  process.exit(1);
}

const siteInfo = site.site || {};

/** 生成单个页面 */
function buildPage(nav) {
  const data = nav.key === 'home' ? null : readJSON(nav.key);
  const page = data && data.page ? data.page : null;

  const title = page
    ? `${page.title} · ${siteInfo.name || '岐黄翰墨'}`
    : `${siteInfo.name || '岐黄翰墨'} · ${siteInfo.subtitle || ''}`.trim();

  const desc = page
    ? (page.description || page.lead || '').replace(/\s+/g, ' ').slice(0, 160)
    : (siteInfo.description || '').slice(0, 160);

  const keywords = (siteInfo.keywords || []).join('、');

  const activeKey = nav.key;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="theme-color" content="#26332b">
<meta name="author" content="${siteInfo.author || ''}">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${keywords}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:site_name" content="${siteInfo.name || ''}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
<link rel="apple-touch-icon" href="assets/img/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/main.css">
</head>
<body data-page="${activeKey}">
<a class="skip-link" href="#main-content">跳转到主要内容</a>

<div class="mobile-bar">
  <button class="nav-toggle" type="button" aria-label="打开导航菜单" aria-expanded="false" aria-controls="sidebar">
    <span></span><span></span><span></span>
  </button>
  <div class="mobile-brand">${siteInfo.name || '岐黄翰墨'}<small>${siteInfo.subtitle || ''}</small></div>
</div>

<div class="site-layout">
  <aside class="sidebar" id="sidebar"></aside>
  <div class="sidebar-dimmer" aria-hidden="true"></div>
  <div class="content">
    <main class="content-card" id="main-content">
      <div class="loading"><div class="spinner"></div><p>正在载入内容…</p></div>
    </main>
  </div>
</div>

<footer class="site-footer" id="site-footer"></footer>

<button class="back-to-top" type="button" aria-label="回到顶部">
  <i class="fa fa-arrow-up" aria-hidden="true"></i><span class="percent" aria-hidden="true"></span>
</button>

<noscript>
  <div style="max-width:780px;margin:36px auto;padding:22px 24px;border:1px solid #e5ddcb;border-radius:10px;background:#fffdf9;font-family:'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.9;color:#4b463d">
    <strong style="font-size:1.05em">请开启浏览器的 JavaScript</strong>
    <p style="margin:8px 0 0">本站的正文内容存放在 <code>data/*.json</code> 中，由页面脚本动态渲染装配。
    请在浏览器设置中启用 JavaScript 后重新加载本页。</p>
  </div>
</noscript>

<script src="assets/data/tcm-data.js"></script>
<script src="assets/js/render.js"></script>
<script src="assets/js/data-loader.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
`;
}

console.log('▶ 生成页面骨架');
let n = 0;
for (const nav of site.nav || []) {
  const file = path.join(ROOT, nav.href);
  fs.writeFileSync(file, buildPage(nav), 'utf8');
  console.log('  ✔ ' + nav.href.padEnd(20) + nav.title);
  n++;
}

// 404 页面
const notFound = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#26332b">
<title>页面未找到 · ${siteInfo.name || '岐黄翰墨'}</title>
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css">
<link rel="stylesheet" href="assets/css/theme.css">
<link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
<div class="content" style="max-width:760px;margin:0 auto;padding:70px 20px">
  <div class="content-card text-center">
    <div style="font-size:3.2rem;color:var(--brand-accent);font-family:var(--font-serif);line-height:1">404</div>
    <h1 class="page-title" style="margin-top:14px">未找到此页</h1>
    <p class="muted">您访问的页面可能已被移动或删除。请从下方入口重新导航。</p>
    <div class="hero-actions" style="justify-content:center;margin-top:22px">
      <a class="btn btn-accent" href="index.html"><i class="fa fa-home"></i> 返回首页</a>
      <a class="btn" href="theory.html"><i class="fa fa-book"></i> 中医基础理论</a>
      <a class="btn" href="herbs.html"><i class="fa fa-leaf"></i> 本草图鉴</a>
    </div>
  </div>
</div>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, '404.html'), notFound, 'utf8');
console.log('  ✔ 404.html             404 页面');
console.log('');
console.log('✔ 共生成 ' + (n + 1) + ' 个页面');
