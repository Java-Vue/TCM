/* ==========================================================================
   岐黄翰墨 · 公共渲染模块 (Shared Renderer)
   --------------------------------------------------------------------------
   站点页面（app.js）与可视化编辑器（editor.js）共用这一套渲染逻辑，
   保证「编辑器里的预览」与「线上看到的排版」完全一致。

   暴露到 window.TCM：
     TCM.utils      —— 字符串 / DOM 工具
     TCM.placeholder—— 确定性 SVG 占位图生成器
     TCM.renderBlocks—— 内容块渲染器（对应 data/_schema.md §5）
     TCM.blockTypes —— 内容块元信息（编辑器据此生成表单）
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = global.document;
  var TCM = global.TCM = global.TCM || {};

  /* ======================================================================
     1. 通用工具
     ====================================================================== */
  var U = {
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    /** 行内 Markdown：**粗体** *斜体* `代码` */
    md: function (s) {
      return U.esc(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    },

    /** 稳定字符串哈希（用于占位图配色） */
    hash: function (str) {
      var h = 5381, i = str ? str.length : 0;
      while (i) {
        h = (h * 33) ^ str.charCodeAt(--i);
      }
      return Math.abs(h);
    },

    /** 把标签数组渲染成 chips */
    chips: function (tags) {
      if (!tags || !tags.length) return '';
      return tags.map(function (t) {
        return '<span class="entry-tag">' + U.esc(t) + '</span>';
      }).join('');
    },

    /** 把 meta 数组渲染成定义列表 */
    metaList: function (meta) {
      if (!meta || !meta.length) return '';
      return '<div class="entry-meta">' + meta.map(function (m) {
        return '<dl class="entry-meta-row"><dt>' + U.esc(m.label) + '</dt><dd>' + U.md(m.value) + '</dd></dl>';
      }).join('') + '</div>';
    },

    /** 简易节流 */
    throttle: function (fn, wait) {
      var last = 0, timer = null;
      return function () {
        var now = new Date().getTime();
        var ctx = this, args = arguments;
        var remain = wait - (now - last);
        if (remain <= 0) {
          clearTimeout(timer);
          last = now;
          fn.apply(ctx, args);
        } else if (!timer) {
          timer = setTimeout(function () {
            last = new Date().getTime();
            timer = null;
            fn.apply(ctx, args);
          }, remain);
        }
      };
    },

    /** 生成 URL 安全的 id（用于 DOM id） */
    slug: function (s) {
      return String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'item';
    },

    /**
     * 阿拉伯数字转中文数字：60 → 六十，105 → 一百零五，110 → 一百一十
     * 用于首页简介与模块描述，让「六十味常用中药」随条目数自动变化
     */
    cnNum: function (n) {
      n = Math.floor(Number(n));
      if (!isFinite(n)) return String(n);
      if (n === 0) return '零';
      if (n < 0) return '负' + U.cnNum(-n);

      var D = '零一二三四五六七八九';
      var U10 = ['', '十', '百', '千'];
      var B = ['', '万', '亿', '兆'];

      // 每四位一节
      var groups = [];
      var r = n;
      while (r > 0) { groups.push(r % 10000); r = Math.floor(r / 10000); }

      var out = '';
      var needZero = false;
      for (var gi = groups.length - 1; gi >= 0; gi--) {
        var g = groups[gi];
        if (g === 0) { needZero = true; continue; }

        var seg = '';
        var pendingZero = false;
        var started = false;
        for (var pos = 3; pos >= 0; pos--) {
          var d = Math.floor(g / Math.pow(10, pos)) % 10;
          if (d === 0) {
            if (started) pendingZero = true;
            continue;
          }
          if (pendingZero) { seg += '零'; pendingZero = false; }
          seg += D[d] + U10[pos];
          started = true;
        }
        // 最高位是「一十」时省略「一」：十一、十九
        if (gi === groups.length - 1 && seg.indexOf('一十') === 0) seg = seg.slice(1);
        if (needZero) { out += '零'; needZero = false; }
        out += seg + B[gi];
        needZero = (g < 1000);
      }
      return out;
    },

    /**
     * 填充文案里的数量占位符
     *   {count}     → 当前板块的数量
     *   {herbs}     → 指定板块的数量（键名与 stats.boards 一致）
     * 数字用中文，与正文语气一致；stats 缺失时保留原样。
     */
    fillCounts: function (text, boardKey, stats) {
      if (!text) return '';
      var boards = (stats && stats.boards) || {};
      return String(text).replace(/\{(\w+)\}/g, function (m, key) {
        var k = (key === 'count') ? boardKey : key;
        var b = boards[k];
        if (!b) return m;
        return U.cnNum(b.count);
      });
    },

    /**
     * 取某个板块的统计条目
     */
    statOf: function (stats, boardKey) {
      return (stats && stats.boards && stats.boards[boardKey]) || null;
    }
  };
  TCM.utils = U;

  /* ======================================================================
     2. 确定性 SVG 占位图
     ====================================================================== */
  var PALETTES = [
    ['#2f4438', '#4a6b57'],
    ['#6b3a2e', '#9c5c42'],
    ['#33475f', '#55708c'],
    ['#5a4a2e', '#8a7448'],
    ['#3d4a52', '#63757f'],
    ['#4a3350', '#74537c'],
    ['#2e4a4a', '#4d7a76']
  ];

  /**
   * 生成占位图（SVG data URI）
   * @param {string} label  显示的汉字（1–2 字）
   * @param {string} seed   决定配色的种子（通常为 id 或标题）
   * @param {string} kind   'herb' | 'book' | 'formula' | 'dish' | 'default'
   */
  function placeholder(label, seed, kind) {
    label = String(label || '医').slice(0, 2);
    var h = U.hash(seed || label);
    var pal = PALETTES[h % PALETTES.length];
    var deco = '';

    if (kind === 'book') {
      deco =
        '<g opacity="0.13" fill="none" stroke="#fff" stroke-width="3">' +
        '<rect x="120" y="34" width="96" height="132" rx="4"/>' +
        '<line x1="168" y1="34" x2="168" y2="166"/>' +
        '<line x1="134" y1="60" x2="152" y2="60"/>' +
        '<line x1="134" y1="78" x2="152" y2="78"/>' +
        '<line x1="184" y1="60" x2="202" y2="60"/>' +
        '<line x1="184" y1="78" x2="202" y2="78"/>' +
        '</g>';
    } else if (kind === 'formula') {
      deco =
        '<g opacity="0.14" fill="none" stroke="#fff" stroke-width="3">' +
        '<path d="M136 58 h64 v26 a32 34 0 0 1 -64 0 z"/>' +
        '<line x1="128" y1="52" x2="208" y2="52"/>' +
        '<line x1="168" y1="118" x2="168" y2="142"/>' +
        '<path d="M142 142 h52 l-8 24 h-36 z"/>' +
        '</g>';
    } else if (kind === 'dish') {
      deco =
        '<g opacity="0.14" fill="none" stroke="#fff" stroke-width="3">' +
        '<path d="M110 104 a58 46 0 0 0 116 0 z"/>' +
        '<path d="M96 104 h144"/>' +
        '<path d="M148 62 q10 -18 22 -4"/>' +
        '<path d="M176 58 q12 -16 22 -2"/>' +
        '</g>';
    } else {
      deco =
        '<g opacity="0.16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">' +
        '<path d="M168 176 q-4 -54 -2 -96"/>' +
        '<path d="M166 118 q-30 -14 -40 -38 q30 4 40 22"/>' +
        '<path d="M168 104 q28 -18 34 -44 q-28 8 -34 28"/>' +
        '<path d="M167 142 q26 -12 34 -30 q-26 4 -34 18"/>' +
        '</g>';
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336 200" width="336" height="200" role="img" aria-label="' +
      U.esc(label) + '">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + pal[0] + '"/>' +
      '<stop offset="1" stop-color="' + pal[1] + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="v" cx="0.78" cy="0.16" r="0.8">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0.20"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<rect width="336" height="200" fill="url(#g)"/>' +
      '<rect width="336" height="200" fill="url(#v)"/>' +
      deco +
      '<text x="168" y="112" text-anchor="middle" font-family="Songti SC, STSong, SimSun, serif" ' +
      'font-size="74" fill="#fff" fill-opacity="0.82" letter-spacing="6">' + U.esc(label) + '</text>' +
      '<rect x="258" y="146" width="26" height="26" rx="3" fill="#a63d2f" fill-opacity="0.9"/>' +
      '<text x="271" y="165" text-anchor="middle" font-family="Songti SC, STSong, SimSun, serif" ' +
      'font-size="15" fill="#f7ecd9">印</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  TCM.placeholder = placeholder;

  /* ======================================================================
     3. 内容块元信息（编辑器据此生成表单）
     ====================================================================== */
  TCM.blockTypes = [
    { type: 'paragraph', label: '段落', icon: '¶', desc: '普通正文段落，支持加粗等格式' },
    { type: 'heading', label: '小标题', icon: 'H', desc: '段落内部的小节标题' },
    { type: 'list', label: '列表', icon: '☰', desc: '有序或无序的条目清单' },
    { type: 'table', label: '表格', icon: '▦', desc: '对比表，如「性味 / 功效 / 主治」' },
    { type: 'quote', label: '引文', icon: '❝', desc: '古籍原文，并注明出处' },
    { type: 'callout', label: '提示框', icon: '!', desc: '重点提示、注意事项、就医提醒' },
    { type: 'keypoints', label: '要点卡片', icon: '✓', desc: '几条要点，醒目的总结框' },
    { type: 'cards', label: '图文卡片', icon: '▢', desc: '并排的若干张小卡片' },
    { type: 'accordion', label: '折叠面板', icon: '⊟', desc: '默认收起，点开才看到' },
    { type: 'divider', label: '分隔线', icon: '—', desc: '一条装饰分隔线' }
  ];

  /* ======================================================================
     4. 内容块渲染器
     ====================================================================== */
  var BLOCKS = {

    paragraph: function (b) {
      return '<p class="block-p">' + U.md(b.text) + '</p>';
    },

    heading: function (b) {
      var lv = b.level === 4 ? 4 : 3;
      return '<h' + lv + ' class="block-h" data-level="' + lv + '">' + U.md(b.text) + '</h' + lv + '>';
    },

    list: function (b) {
      var tag = b.ordered ? 'ol' : 'ul';
      var items = (b.items || []).map(function (it) {
        return '<li>' + U.md(it) + '</li>';
      }).join('');
      return '<' + tag + ' class="block-list">' + items + '</' + tag + '>';
    },

    table: function (b) {
      var head = (b.head || []).map(function (h) {
        return '<th scope="col">' + U.md(h) + '</th>';
      }).join('');
      var rows = (b.rows || []).map(function (r) {
        return '<tr>' + (r || []).map(function (c) {
          return '<td>' + U.md(c) + '</td>';
        }).join('') + '</tr>';
      }).join('');
      var cap = b.caption ? '<caption>' + U.md(b.caption) + '</caption>' : '';
      return '<div class="table-wrap"><table class="block-table">' + cap +
        '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    },

    quote: function (b) {
      return '<blockquote class="block-quote"><p>' + U.md(b.text) + '</p>' +
        (b.source ? '<div class="source">' + U.esc(b.source) + '</div>' : '') + '</blockquote>';
    },

    callout: function (b) {
      var v = ['info', 'success', 'warning', 'danger', 'default'].indexOf(b.variant) >= 0
        ? b.variant : 'info';
      return '<div class="callout callout-' + v + '">' +
        (b.title ? '<span class="callout-title">' + U.md(b.title) + '</span>' : '') +
        (b.text ? '<p>' + U.md(b.text) + '</p>' : '') + '</div>';
    },

    keypoints: function (b) {
      var items = (b.items || []).map(function (i) {
        return '<li>' + U.md(i) + '</li>';
      }).join('');
      return '<div class="keypoints">' +
        '<p class="keypoints-title">' + U.md(b.title || '掌握要点') + '</p>' +
        '<ul>' + items + '</ul></div>';
    },

    cards: function (b) {
      var cols = b.columns === 2 ? 2 : 3;
      var items = (b.items || []).map(function (c) {
        var bullets = (c.bullets && c.bullets.length)
          ? '<ul>' + c.bullets.map(function (x) { return '<li>' + U.md(x) + '</li>'; }).join('') + '</ul>'
          : '';
        return '<div class="mini-card"><div class="mini-card-head">' +
          (c.icon ? '<span class="mini-card-icon">' + U.esc(c.icon) + '</span>' : '') +
          '<h4 class="mini-card-title">' + U.md(c.title) + '</h4></div>' +
          (c.text ? '<p class="mini-card-text">' + U.md(c.text) + '</p>' : '') +
          bullets + '</div>';
      }).join('');
      return '<div class="block-cards" style="grid-template-columns:repeat(' + cols + ',1fr)">' +
        items + '</div>';
    },

    divider: function () {
      return '<div class="block-divider"></div>';
    },

    accordion: function (b) {
      var items = (b.items || []).map(function (it, i) {
        return '<details class="accordion-item"' + (i === 0 ? ' open' : '') + '>' +
          '<summary>' + U.md(it.title) + '</summary>' +
          '<div class="accordion-body"><p>' + U.md(it.text) + '</p></div></details>';
      }).join('');
      return '<div class="accordion">' + items + '</div>';
    }
  };
  TCM.blockRenderers = BLOCKS;

  /** 渲染 blocks 数组 */
  function renderBlocks(blocks) {
    if (!blocks || !blocks.length) return '';
    return blocks.map(function (b) {
      var fn = BLOCKS[b && b.type];
      if (!fn) {
        console.warn('[TCM] 未知内容块类型：', b && b.type);
        return '';
      }
      try {
        return fn(b);
      } catch (e) {
        console.error('[TCM] 内容块渲染失败：', b.type, e);
        return '';
      }
    }).join('');
  }
  TCM.renderBlocks = renderBlocks;

  /** 把 section / item 渲染成预览片段（编辑器与站点卡片预览共用） */
  TCM.renderSection = function (s) {
    return '<div class="section-head">' +
      '<div class="section-icon" aria-hidden="true">' + U.esc(s.icon || '☯') + '</div>' +
      '<div><h2 class="section-title">' + U.esc(s.title) + '</h2>' +
      (s.subtitle ? '<p class="section-sub">' + U.esc(s.subtitle) + '</p>' : '') +
      '</div></div>' +
      (s.summary ? '<div class="section-summary">' + U.esc(s.summary) + '</div>' : '') +
      '<div class="blocks">' + renderBlocks(s.blocks) + '</div>';
  };

  if (doc) {
    doc.documentElement.setAttribute('data-tcm-renderer', 'ready');
  }
})(window);
