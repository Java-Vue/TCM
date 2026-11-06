#!/usr/bin/env node
/* ==========================================================================
   岐黄翰墨 · 本地预览 / 编辑服务器 (Static Server + Editor API)
   --------------------------------------------------------------------------
   零依赖的静态文件服务器，同时为「可视化编辑器」提供受限的写入接口。

   用法：
     node tools/serve.js            # 默认 http://127.0.0.1:8080
     node tools/serve.js 3000       # 指定端口
     node tools/serve.js --no-write # 只读模式，禁用写入接口

   写入接口（仅本机可用）：
     GET  /__tcm/session            → { ok, token, name }   取本次会话令牌
     GET  /api/data/<file>.json     → 读取数据文件
     PUT  /api/data/<file>.json     → 写入数据文件（需令牌 + 同源校验）
     POST /api/upload               → 上传图片（需令牌 + 同源校验）

   安全说明：
     · 服务器只绑定 127.0.0.1，外部机器访问不到；
     · 写入接口校验 Origin / Sec-Fetch-Site，拒绝跨站网页发起的请求；
     · 还需携带服务端随机生成的会话令牌，外部网页既读不到令牌也发不出合法请求。
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, '.backup');
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8080;
const ALLOW_WRITE = !process.argv.includes('--no-write');

/** 本次运行的会话令牌（每次启动随机生成） */
const SESSION_TOKEN = crypto.randomBytes(24).toString('hex');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const ALLOWED_DATA = new Set([
  'site', 'theory', 'classics', 'herbs', 'formulas',
  'acupuncture', 'diet', 'solar', 'constitution', 'diseases', 'about'
]);

/* ------------------------------------------------------------------ */
/* 安全校验                                                            */
/* ------------------------------------------------------------------ */
function sameOrigin(req) {
  // Sec-Fetch-Site：同源为 same-origin，跨站为 cross-site / same-site
  const site = req.headers['sec-fetch-site'];
  if (site === 'cross-site' || site === 'same-site') return false;

  const origin = req.headers.origin;
  if (origin) {
    try {
      const o = new URL(origin);
      const allowed = ['127.0.0.1', 'localhost', '[::1]'];
      return allowed.includes(o.hostname) && Number(o.port || 80) === PORT;
    } catch (e) { return false; }
  }
  // 没有 Origin 时靠 Sec-Fetch-Site 判定；两者都没有则视为非同源
  return site === 'same-origin' || site === 'none';
}

function hasToken(req) {
  const t = req.headers['x-tcm-token'];
  if (typeof t !== 'string' || t.length !== SESSION_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(t), Buffer.from(SESSION_TOKEN));
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ------------------------------------------------------------------ */
/* 数据写入                                                            */
/* ------------------------------------------------------------------ */
function rebuildBundle() {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(__dirname, 'build-data.js')], {
      cwd: ROOT, stdio: 'ignore'
    });
    p.on('close', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

function countEntries(data) {
  const page = data && data.page;
  if (!page) return 0;
  return ((page.sections || []).length + (page.items || []).length);
}

async function handleWrite(req, res, pathname) {
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: '拒绝跨站写入请求' });
  if (!hasToken(req)) return json(res, 403, { ok: false, error: '令牌无效，请刷新页面后重试' });

  const name = pathname.replace(/^\/api\/data\//, '').replace(/\.json$/, '');
  if (!ALLOWED_DATA.has(name)) {
    return json(res, 400, { ok: false, error: `不允许修改 ${name}` });
  }

  let raw;
  try {
    raw = await readBody(req, 64 * 1024 * 1024);
  } catch (e) {
    return json(res, 413, { ok: false, error: e.message });
  }

  let data;
  try {
    data = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    return json(res, 400, { ok: false, error: 'JSON 格式有误：' + e.message });
  }

  if (!data || !data.page || !data.page.title) {
    return json(res, 400, { ok: false, error: '数据缺少 page 结构，未写入' });
  }
  if (name !== 'site' && !data.page.key) {
    return json(res, 400, { ok: false, error: '数据缺少 page.key，未写入' });
  }

  const target = path.join(DATA_DIR, name + '.json');

  // ---- 防误删护栏（服务端硬保护）----
  // 条目数骤降到原来的一半以下时，一律拒绝写入，避免误操作摧毁整个板块。
  let oldCount = 0;
  try {
    const old = JSON.parse(fs.readFileSync(target, 'utf8'));
    oldCount = countEntries(old);
  } catch (e) { /* 新文件，无旧数据 */ }

  const newCount = countEntries(data);
  let allowShrink = false;
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    allowShrink = !!(parsed && parsed.__allowShrink);
  } catch (e) { /* ignore */ }

  if (oldCount >= 4 && newCount < Math.ceil(oldCount * 0.5) && !allowShrink) {
    return json(res, 409, {
      ok: false,
      shrink: true,
      oldCount: oldCount,
      newCount: newCount,
      error: `条目数将从 ${oldCount} 条骤减到 ${newCount} 条，已阻止写入以防误删。` +
        `确认要删除这么多内容的话，请重新确认。`
    });
  }

  // 备份旧文件（写前自动留底，写错了可以找回）
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.copyFileSync(target, path.join(BACKUP_DIR, name + '.' + stamp + '.json'));
  } catch (e) { /* 首次写入时无旧文件，忽略 */ }

  try {
    const out = JSON.parse(JSON.stringify(data));
    delete out.__allowShrink;
    fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf8');
  } catch (e) {
    return json(res, 500, { ok: false, error: '写入失败：' + e.message });
  }

  const rebuilt = await rebuildBundle();

  json(res, 200, {
    ok: true,
    file: 'data/' + name + '.json',
    entries: countEntries(data),
    bytes: Buffer.byteLength(raw),
    bundleRebuilt: rebuilt,
    message: '已写入 data/' + name + '.json'
  });
}

async function handleUpload(req, res) {
  if (!sameOrigin(req)) return json(res, 403, { ok: false, error: '拒绝跨站上传' });
  if (!hasToken(req)) return json(res, 403, { ok: false, error: '令牌无效' });

  let raw;
  try {
    raw = await readBody(req, 12 * 1024 * 1024);
  } catch (e) {
    return json(res, 413, { ok: false, error: e.message });
  }

  let meta;
  try {
    meta = JSON.parse(raw.toString('utf8'));
  } catch (e) {
    return json(res, 400, { ok: false, error: '上传数据格式有误' });
  }

  const allowed = { '.jpg': 1, '.jpeg': 1, '.png': 1, '.gif': 1, '.webp': 1, '.svg': 1 };
  const ext = String(meta.name || '').toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
  if (!ext || !allowed['.' + ext[1]]) {
    return json(res, 400, { ok: false, error: '只支持 jpg / png / gif / webp / svg 图片' });
  }
  if (!meta.data || typeof meta.data !== 'string') {
    return json(res, 400, { ok: false, error: '缺少图片数据' });
  }

  const b64 = meta.data.replace(/^data:[^;]+;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length > 8 * 1024 * 1024) {
    return json(res, 413, { ok: false, error: '图片不能超过 8 MB' });
  }

  const dir = path.join(ROOT, 'assets', 'img', 'uploads');
  fs.mkdirSync(dir, { recursive: true });

  const safeBase = String(meta.name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .slice(0, 40) || 'image';
  const fileName = safeBase + '-' + Date.now().toString(36) + '.' + ext[1];
  fs.writeFileSync(path.join(dir, fileName), buf);

  json(res, 200, { ok: true, path: 'assets/img/uploads/' + fileName, bytes: buf.length });
}

/* ------------------------------------------------------------------ */
/* 自动重建守卫                                                          */
/* ------------------------------------------------------------------ */
/**
 * data/*.json 改动后，自动重建 stats.json 与预构建包。
 * 这样即使用编辑器（VS Code 等）直接改 JSON，网站上的统计数字也会自动跟上，
 * 不必手动执行 npm run build。
 */
let rebuildPromise = null;
let lastCheck = 0;

function ensureFresh() {
  const now = Date.now();
  if (rebuildPromise) return rebuildPromise;
  if (now - lastCheck < 1200) return Promise.resolve();
  lastCheck = now;

  try {
    const statsPath = path.join(DATA_DIR, 'stats.json');
    let statsMtime = 0;
    try { statsMtime = fs.statSync(statsPath).mtimeMs; } catch (e) { statsMtime = 0; }

    let newest = 0;
    for (const name of ALLOWED_DATA) {
      try {
        newest = Math.max(newest, fs.statSync(path.join(DATA_DIR, name + '.json')).mtimeMs);
      } catch (e) { /* 文件缺失则跳过 */ }
    }

    if (newest > statsMtime + 1) {
      rebuildPromise = new Promise((resolve) => {
        const proc = spawn(process.execPath, [path.join(__dirname, 'build-data.js')], {
          cwd: ROOT, stdio: 'ignore'
        });
        const done = () => { rebuildPromise = null; resolve(); };
        proc.on('close', done);
        proc.on('error', done);
      });
      return rebuildPromise;
    }
  } catch (e) { /* 忽略，不影响服务 */ }

  return Promise.resolve();
}

/* ------------------------------------------------------------------ */
/* 服务器                                                              */
/* ------------------------------------------------------------------ */
const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch (e) {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  // 数据文件被外部改动（编辑器/VS Code）时，先自动重建统计再响应
  ensureFresh().then(() => handleRequest(req, res, pathname)).catch(() => {
    handleRequest(req, res, pathname);
  });
});

function handleRequest(req, res, pathname) {

  // ---- 编辑器接口 ----
  if (pathname === '/__tcm/session') {
    if (!sameOrigin(req)) return json(res, 403, { ok: false });
    return json(res, 200, {
      ok: true,
      token: SESSION_TOKEN,
      name: '岐黄翰墨',
      writeEnabled: ALLOW_WRITE
    });
  }

  if (pathname.startsWith('/api/data/')) {
    if (req.method === 'GET') {
      const name = pathname.replace(/^\/api\/data\//, '').replace(/\.json$/, '');
      const f = path.join(DATA_DIR, name + '.json');
      if (!ALLOWED_DATA.has(name) || !fs.existsSync(f)) {
        return json(res, 404, { ok: false, error: '文件不存在' });
      }
      return json(res, 200, JSON.parse(fs.readFileSync(f, 'utf8')));
    }
    if (req.method === 'PUT') {
      if (!ALLOW_WRITE) return json(res, 403, { ok: false, error: '服务器以只读模式启动' });
      return handleWrite(req, res, pathname);
    }
    return json(res, 405, { ok: false, error: '不支持的方法' });
  }

  if (pathname === '/api/upload' && req.method === 'POST') {
    if (!ALLOW_WRITE) return json(res, 403, { ok: false, error: '服务器以只读模式启动' });
    return handleUpload(req, res);
  }

  // ---- 静态文件 ----
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(ROOT, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      res.writeHead(302, { Location: pathname.replace(/\/?$/, '/') + 'index.html' });
      res.end(); return;
    }
    fs.readFile(filePath, (err2, buf) => {
      if (err2) {
        const notFound = path.join(ROOT, '404.html');
        fs.readFile(notFound, (e3, nf) => {
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          res.end(e3 ? '404 Not Found' : nf);
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(buf);
    });
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  岐黄翰墨 · 本地服务器已启动');
  console.log('  ➜  网站首页   http://127.0.0.1:' + PORT + '/');
  console.log('  ➜  内容编辑器 http://127.0.0.1:' + PORT + '/editor.html');
  console.log('  根目录：' + ROOT);
  if (ALLOW_WRITE) {
    console.log('  写入接口：已开启（仅限本机，写入前自动备份到 data/.backup/）');
  } else {
    console.log('  写入接口：已关闭（--no-write）');
  }
  console.log('  按 Ctrl+C 停止');
  console.log('');
});
