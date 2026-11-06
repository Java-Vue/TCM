/* ==========================================================================
   岐黄翰墨 · 应用主程序 (App)
   --------------------------------------------------------------------------
   职责划分：
     render.js  —— 公共渲染模块（工具 / 占位图 / 内容块），与编辑器共用
     pages      —— 页面渲染器（section 型 / collection 型 / 首页）
     shell      —— 品牌块 / 导航 / 侧栏 / 页脚
     interact   —— 搜索、筛选、展开、目录高亮、回到顶部、移动端抽屉
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = global.document;
  var TCM = global.TCM = global.TCM || {};


  /* ======================================================================
     0-2. 公共能力来自 render.js（工具 / 占位图 / 内容块渲染器）
          与可视化编辑器共用，保证「预览 = 线上排版」
     ====================================================================== */
  var U = TCM.utils;

  /* ======================================================================
     3. 外壳渲染（品牌块 / 导航 / 侧栏 / 页脚）
     ====================================================================== */
  function renderBrand(site) {
    var s = site.site || {};
    return '' +
      '<div class="site-brand">' +
      '<a class="brand-link" href="index.html">' +
      '<span class="brand-mark">' + U.esc(s.mark || '岐黃') + '</span>' +
      '<h1 class="site-title">' + U.esc(s.name || '岐黄翰墨') + '</h1>' +
      '<span class="brand-rule"><i></i><span></span><i></i></span>' +
      '<p class="site-subtitle">' + U.esc(s.subtitle || '') + '</p>' +
      '</a></div>';
  }

  function renderNav(site, activeKey) {
    var nav = site.nav || [];
    return '<nav class="site-nav"><ul class="nav-list">' + nav.map(function (n) {
      var cls = n.key === activeKey ? 'nav-link active' : 'nav-link';
      return '<li class="nav-item"><a class="' + cls + '" href="' + U.esc(n.href) + '">' +
        '<i class="' + U.esc(n.icon || 'fa fa-circle') + '" aria-hidden="true"></i>' +
        '<span>' + U.esc(n.title) + '</span></a></li>';
    }).join('') + '</ul></nav>';
  }

  function renderSidebar(site, activeKey, stats) {
    var sb = site.sidebar || {};
    var html = renderBrand(site) + renderNav(site, activeKey);

    // 站点介绍
    html += '<section class="sidebar-panel">' +
      '<h2 class="panel-title"><i class="fa fa-leaf" aria-hidden="true"></i>关于本站</h2>' +
      '<p class="panel-intro">' + U.esc(sb.intro || '') + '</p>' +
      '</section>';

    // 统计（数量来自 data/stats.json，随内容增减自动更新）
    if (sb.stat && sb.stat.length) {
      html += '<section class="sidebar-panel">' +
        '<h2 class="panel-title"><i class="fa fa-chart-bar" aria-hidden="true"></i>内容统计</h2>' +
        '<div class="stat-grid">' + sb.stat.map(function (s) {
          var b = s.board ? U.statOf(stats, s.board) : null;
          var val = b ? b.count : s.value;
          return '<div class="stat-cell" title="' + U.esc(s.label + '：' + val + (b ? ' ' + b.unit : '')) + '">' +
            '<b>' + U.esc(val) + '</b><span>' + U.esc(s.label) + '</span></div>';
        }).join('') + '</div></section>';
    }

    // 专题导航
    if (sb.topics && sb.topics.length) {
      html += '<section class="sidebar-panel">' +
        '<h2 class="panel-title"><i class="fa fa-compass" aria-hidden="true"></i>专题导航</h2>' +
        sb.topics.map(function (t) {
          return '<h3 style="font-size:.86rem;margin:12px 0 4px;color:var(--heading-color)">' +
            U.esc(t.title) + '</h3><ul class="topic-list">' +
            (t.items || []).map(function (i) {
              var b = i.board ? U.statOf(stats, i.board) : null;
              var cnt = b ? (b.count + ' ' + b.unit) : i.count;
              return '<li><a href="' + U.esc(i.href) + '"><span>' + U.esc(i.title) + '</span>' +
                (cnt ? '<span>' + U.esc(cnt) + '</span>' : '') + '</a></li>';
            }).join('') + '</ul>';
        }).join('') + '</section>';
    }

    // 外链
    if (sb.links && sb.links.length) {
      html += '<section class="sidebar-panel">' +
        '<h2 class="panel-title"><i class="fa fa-link" aria-hidden="true"></i>相关链接</h2>' +
        '<ul class="panel-links">' + sb.links.map(function (l) {
          return '<li><a href="' + U.esc(l.href) + '"' +
            (l.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            (l.icon ? '<i class="' + U.esc(l.icon) + '" aria-hidden="true"></i> ' : '') +
            U.esc(l.title) + '</a></li>';
        }).join('') + '</ul></section>';
    }

    return html;
  }

  function renderFooter(site, stats) {
    var s = site.site || {};
    var f = site.footer || {};
    var stat = (site.sidebar && site.sidebar.stat) || [];
    var year = new Date().getFullYear();

    return '<div class="footer-inner">' +
      (f.links && f.links.length ?
        '<ul class="footer-links">' + f.links.map(function (l) {
          return '<li><a href="' + U.esc(l.href) + '"' +
            (l.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            U.esc(l.title) + '</a></li>';
        }).join('') + '</ul>' : '') +
      (stat.length ? '<div class="footer-stats">' + stat.map(function (x) {
        var b = x.board ? U.statOf(stats, x.board) : null;
        return '<span><b>' + U.esc(b ? b.count : x.value) + '</b>' + U.esc(x.label) + '</span>';
      }).join('') + '</div>' : '') +
      (f.note ? '<p class="footer-disclaimer">' + U.esc(f.note) + '</p>' : '') +
      '<p class="footer-copy">© ' + (s.startYear || year) + ' – ' + year + ' ' +
      U.esc(s.name || '岐黄翰墨') + ' · ' + U.esc(s.author || '') +
      '　本站内容仅供传统医学知识学习参考，不构成诊疗建议。</p>' +
      '</div>';
  }

  /* ======================================================================
     4. 页面渲染器
     ====================================================================== */

  /** section 型页面（章节导航 + 分节正文） */
  function renderSectionPage(page) {
    var sections = page.sections || [];
    var html = '';

    if (sections.length) {
      html += '<nav class="section-nav" aria-label="本页目录">' + sections.map(function (s, i) {
        return '<a href="#sec-' + U.esc(s.id) + '" data-spy="' + U.esc(s.id) + '">' +
          U.esc(s.title) + '</a>';
      }).join('') + '</nav>';
    }

    html += sections.map(function (s) {
      return '<section class="content-section reveal" id="sec-' + U.esc(s.id) + '">' +
        '<div class="section-head">' +
        '<div class="section-icon" aria-hidden="true">' + U.esc(s.icon || '☯') + '</div>' +
        '<div><h2 class="section-title">' + U.esc(s.title) +
        (s.badge ? '<span class="section-badge">' + U.esc(s.badge) + '</span>' : '') + '</h2>' +
        (s.subtitle ? '<p class="section-sub">' + U.esc(s.subtitle) + '</p>' : '') +
        '</div></div>' +
        (s.summary ? '<div class="section-summary">' + U.esc(s.summary) + '</div>' : '') +
        '<div class="blocks">' + TCM.renderBlocks(s.blocks) + '</div>' +
        '</section>';
    }).join('');

    return html;
  }

  /** collection 型页面（卡片网格 + 展开详情） */
  function renderCollectionPage(page) {
    var items = page.items || [];
    var cats = [];
    items.forEach(function (it) {
      if (it.category && cats.indexOf(it.category) < 0) cats.push(it.category);
    });

    var html = '';

    if (cats.length > 1) {
      html += '<div class="toolbar"><div class="filter-chips" role="group" aria-label="分类筛选">' +
        '<button class="chip active" data-filter="__all" type="button">全部' +
        '<span class="count">' + items.length + '</span></button>' +
        cats.map(function (c) {
          var n = items.filter(function (i) { return i.category === c; }).length;
          return '<button class="chip" data-filter="' + U.esc(c) + '" type="button">' +
            U.esc(c) + '<span class="count">' + n + '</span></button>';
        }).join('') + '</div></div>';
    }

    html += '<div class="toolbar"><div class="search-box" role="search">' +
      '<span class="search-icon" aria-hidden="true"><i class="fa fa-search"></i></span>' +
      '<input type="search" id="collection-search" placeholder="搜索名称、功效、主治关键词…" ' +
      'aria-label="在当前页内搜索" autocomplete="off">' +
      '<button class="search-clear" type="button" aria-label="清除搜索"><i class="fa fa-times"></i></button>' +
      '</div></div>';

    html += '<p class="result-count" id="result-count"></p>';
    html += '<div class="card-grid" id="card-grid">' + items.map(cardHTML).join('') + '</div>';
    html += '<div class="empty-state" id="empty-state" style="display:none">' +
      '<i class="fa fa-search" aria-hidden="true"></i>未找到匹配内容，请尝试更换关键词或分类。</div>';

    return html;
  }

  function cardHTML(it, idx) {
    var kind = it.__kind || 'default';
    var img = it.image || TCM.placeholder(it.imageHint || it.title, it.id || it.title, kind);
    return '<article class="entry-card reveal" data-id="' + U.esc(it.id) + '" ' +
      'data-cat="' + U.esc(it.category || '') + '" ' +
      'data-search="' + U.esc(searchKey(it)) + '">' +
      '<div class="entry-media">' +
      (it.category ? '<span class="entry-cat">' + U.esc(it.category) + '</span>' : '') +
      '<img src="' + U.esc(img) + '" alt="' + U.esc(it.title) + '" loading="lazy" width="336" height="200">' +
      '</div>' +
      '<div class="entry-main">' +
      '<h3 class="entry-title"><a href="#" role="button" data-toggle="' + U.esc(it.id) + '">' +
      U.esc(it.title) + '</a></h3>' +
      (it.subtitle ? '<p class="entry-sub">' + U.esc(it.subtitle) + '</p>' : '') +
      '<p class="entry-excerpt">' + U.esc(it.summary || '') + '</p>' +
      U.metaList(it.meta) +
      (it.tags && it.tags.length ? '<div class="entry-tags">' + U.chips(it.tags) + '</div>' : '') +
      '<button class="entry-toggle" type="button" data-toggle="' + U.esc(it.id) + '">' +
      '<span class="toggle-text">展开详情</span><i class="fa fa-chevron-down" aria-hidden="true"></i>' +
      '</button>' +
      '</div>' +
      '<div class="entry-detail" id="detail-' + U.esc(it.id) + '"></div>' +
      '</article>';
  }

  function searchKey(it) {
    var parts = [it.title, it.subtitle, it.category, it.summary, (it.tags || []).join(' ')];
    (it.meta || []).forEach(function (m) { parts.push(m.label + ' ' + m.value); });
    return parts.join(' ').toLowerCase();
  }

  /* ======================================================================
     5. 首页
     ====================================================================== */
  function renderHome(site, bundle) {
    var nav = (site.nav || []).filter(function (n) {
      return n.key !== 'home' && n.key !== 'about';
    });

    // 模块描述来自 site.json（可自行编辑），其中的 {count} 会按实际条目数自动替换
    var moduleDesc = site.modules || {
      theory: '阴阳五行、藏象、气血津液、经络、病因病机与辨证论治',
      classics: '{count}部传世典籍：《黄帝内经》《伤寒论》《本草纲目》等',
      herbs: '{count}味常用中药的性味归经、功效主治、配伍与使用注意',
      formulas: '{count}首经典方剂的组成、方义、加减化裁与临床应用',
      acupuncture: '十二经脉、奇经八脉、腧穴主治与针刺灸法操作',
      diet: '药膳食谱、食材宜忌与按体质、按季节的调养方案',
      solar: '{count}节气气候物候、起居饮食、导引保健与易发疾病',
      constitution: '{count}种中医体质的形神特征、易病倾向与调养方案',
      diseases: '{count}个常见病种的辨证论治与调护方案'
    };

    var html = '' +
      '<section class="hero reveal">' +
      '<span class="hero-kicker">中 医 传 统 医 学 知 识 库</span>' +
      '<h1>' + U.esc(site.site.name || '岐黄翰墨') + '</h1>' +
      '<p>' + U.esc(U.fillCounts(site.site.description || '', null, bundle.stats)) + '</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-accent" href="theory.html"><i class="fa fa-book" aria-hidden="true"></i>从基础理论读起</a>' +
      '<a class="btn btn-ghost" href="herbs.html"><i class="fa fa-leaf" aria-hidden="true"></i>查阅本草图鉴</a>' +
      '</div></section>';

    // 模块入口
    html += '<nav class="module-grid reveal" aria-label="板块导航">' + nav.map(function (n) {
      return '<a class="module-card" href="' + U.esc(n.href) + '">' +
        '<span class="module-card-icon"><i class="' + U.esc(n.icon || 'fa fa-circle') + '" aria-hidden="true"></i></span>' +
        '<h3>' + U.esc(n.title) + '</h3>' +
        '<p>' + U.esc(U.fillCounts(moduleDesc[n.key] || '', n.key, bundle.stats)) + '</p>' +
        '<span class="arrow" aria-hidden="true"><i class="fa fa-arrow-right"></i></span></a>';
    }).join('') + '</nav>';

    // 两栏：典籍 + 节气
    var classics = (bundle.classics && bundle.classics.page && bundle.classics.page.items) || [];
    var solar = (bundle.solar && bundle.solar.page && bundle.solar.page.sections) || [];
    var herbs = (bundle.herbs && bundle.herbs.page && bundle.herbs.page.items) || [];

    // 新收录的条目（带 addedAt）排在前面，其余保持原有精选顺序
    function pickFresh(list, n) {
      if (!list || !list.length) return [];
      var fresh = list.filter(function (it) { return it && it.addedAt; })
        .sort(function (a, b) { return (b.addedAt || '').localeCompare(a.addedAt || ''); });
      var rest = list.filter(function (it) { return !it || !it.addedAt; });
      var out = [], seen = {};
      fresh.concat(rest).forEach(function (it) {
        if (!it) return;
        if (out.length < n && !seen[it.id]) { seen[it.id] = 1; out.push(it); }
      });
      return out;
    }

    html += '<div class="two-col">';
    html += '<div class="home-panel reveal"><div class="home-panel-head">' +
      '<span>传世典籍</span><a href="classics.html">查看全部</a></div><div class="home-panel-body">' +
      '<ul class="mini-list">' + pickFresh(classics, 8).map(function (c, i) {
        return '<li><a href="classics.html#' + U.esc(c.id) + '">' +
          '<span class="dot">◆</span><span>' + U.esc(c.title) + '</span>' +
          '<span class="idx">' + U.esc(c.subtitle || '') + '</span></a></li>';
      }).join('') + '</ul></div></div>';

    html += '<div class="home-panel reveal"><div class="home-panel-head">' +
      '<span>二十四节气</span><a href="solar.html">查看全部</a></div><div class="home-panel-body">' +
      '<ul class="mini-list">' + pickFresh(solar, 8).map(function (s, i) {
        return '<li><a href="solar.html#sec-' + U.esc(s.id) + '">' +
          '<span class="dot">◇</span><span>' + U.esc(s.title) + '</span>' +
          '<span class="idx">' + U.esc(s.subtitle || '') + '</span></a></li>';
      }).join('') + '</ul></div></div>';
    html += '</div>';

    // 三栏：药材 + 方剂 + 疾病
    html += '<div class="two-col">';
    html += '<div class="home-panel reveal"><div class="home-panel-head">' +
      '<span>常用药材</span><a href="herbs.html">查看全部</a></div><div class="home-panel-body">' +
      '<ul class="mini-list">' + pickFresh(herbs, 8).map(function (h) {
        return '<li><a href="herbs.html#' + U.esc(h.id) + '">' +
          '<span class="dot">●</span><span>' + U.esc(h.title) + '</span>' +
          '<span class="idx">' + U.esc(h.category || '') + '</span></a></li>';
      }).join('') + '</ul></div></div>';

    var formulas = (bundle.formulas && bundle.formulas.page && bundle.formulas.page.items) || [];
    var diseases = (bundle.diseases && bundle.diseases.page && bundle.diseases.page.items) || [];

    html += '<div class="home-panel reveal"><div class="home-panel-head">' +
      '<span>经典方剂</span><a href="formulas.html">查看全部</a></div><div class="home-panel-body">' +
      '<ul class="mini-list">' + pickFresh(formulas, 8).map(function (f) {
        return '<li><a href="formulas.html#' + U.esc(f.id) + '">' +
          '<span class="dot">■</span><span>' + U.esc(f.title) + '</span>' +
          '<span class="idx">' + U.esc(f.category || '') + '</span></a></li>';
      }).join('') + '</ul></div></div>';
    html += '</div>';

    html += '<div class="home-panel reveal"><div class="home-panel-head">' +
      '<span>常见病种调理</span><a href="diseases.html">查看全部</a></div><div class="home-panel-body">' +
      '<ul class="mini-list" style="columns:2;column-gap:26px">' + pickFresh(diseases, 14).map(function (d) {
        return '<li><a href="diseases.html#' + U.esc(d.id) + '">' +
          '<span class="dot">◆</span><span>' + U.esc(d.title) + '</span>' +
          '<span class="idx">' + U.esc(d.category || '') + '</span></a></li>';
      }).join('') + '</ul></div></div>';

    return html;
  }

  /* ======================================================================
     6. 交互
     ====================================================================== */
  var state = { items: [], currentFilter: '__all', keyword: '' };

  function initCollectionInteractions() {
    var grid = doc.getElementById('card-grid');
    if (!grid) return;

    var searchInput = doc.getElementById('collection-search');
    var searchBox = searchInput && searchInput.closest('.search-box');
    var countEl = doc.getElementById('result-count');
    var emptyEl = doc.getElementById('empty-state');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.entry-card'));

    function applyFilter() {
      var kw = state.keyword.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var catOk = state.currentFilter === '__all' ||
          card.getAttribute('data-cat') === state.currentFilter;
        var kwOk = !kw || (card.getAttribute('data-search') || '').indexOf(kw) >= 0;
        var vis = catOk && kwOk;
        card.style.display = vis ? '' : 'none';
        if (vis) shown++;
      });
      if (countEl) {
        countEl.textContent = '共 ' + shown + ' 条内容' +
          (state.currentFilter !== '__all' ? '（分类：' + state.currentFilter + '）' : '') +
          (kw ? '（关键词：' + kw + '）' : '');
      }
      if (emptyEl) emptyEl.style.display = shown ? 'none' : '';
    }

    if (searchInput) {
      searchInput.addEventListener('input', U.throttle(function () {
        state.keyword = searchInput.value;
        if (searchBox) searchBox.classList.toggle('has-value', !!searchInput.value);
        applyFilter();
      }, 180));

      var clearBtn = searchBox && searchBox.querySelector('.search-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          searchInput.value = '';
          state.keyword = '';
          searchBox.classList.remove('has-value');
          applyFilter();
          searchInput.focus();
        });
      }
    }

    // 分类筛选
    doc.querySelectorAll('.chip[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        doc.querySelectorAll('.chip[data-filter]').forEach(function (c) {
          c.classList.remove('active');
        });
        chip.classList.add('active');
        state.currentFilter = chip.getAttribute('data-filter');
        applyFilter();
      });
    });

    // 卡片展开
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-toggle]');
      if (!btn) return;
      e.preventDefault();
      var id = btn.getAttribute('data-toggle');
      var card = grid.querySelector('.entry-card[data-id="' + id + '"]');
      if (!card) return;

      var open = card.classList.contains('is-open');
      if (open) {
        card.classList.remove('is-open');
        var t = card.querySelector('.toggle-text');
        if (t) t.textContent = '展开详情';
        return;
      }

      // 懒渲染详情
      var detail = doc.getElementById('detail-' + id);
      if (detail && !detail.innerHTML.trim()) {
        var item = null;
        for (var i = 0; i < state.items.length; i++) {
          if (state.items[i].id === id) { item = state.items[i]; break; }
        }
        if (item) {
          detail.innerHTML = TCM.renderBlocks(item.blocks);
        }
      }
      card.classList.add('is-open');
      var t2 = card.querySelector('.toggle-text');
      if (t2) t2.textContent = '收起';
      if (window.scrollY > 0) {
        var top = card.getBoundingClientRect().top + window.pageYOffset - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });

    applyFilter();
  }

  /** 目录高亮（scroll spy） */
  function initScrollSpy() {
    var links = doc.querySelectorAll('.section-nav a[data-spy]');
    if (!links.length || !('IntersectionObserver' in global)) return;
    var map = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id.replace(/^sec-/, '');
          map[id] = true;
          links.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('data-spy') === id);
          });
        } else {
          delete map[en.target.id.replace(/^sec-/, '')];
        }
      });
    }, { rootMargin: '-12% 0px -70% 0px', threshold: 0 });
    doc.querySelectorAll('.content-section').forEach(function (s) { obs.observe(s); });
  }

  /** 回到顶部 + 进度百分比 */
  function initBackToTop() {
    var btn = doc.querySelector('.back-to-top');
    if (!btn) return;
    var pct = btn.querySelector('.percent');
    var up = U.throttle(function () {
      var h = doc.documentElement.scrollHeight - global.innerHeight;
      var p = h > 0 ? Math.min(100, Math.round((global.scrollY / h) * 100)) : 0;
      btn.classList.toggle('on', global.scrollY > 320);
      if (pct) pct.textContent = p + '%';
    }, 90);
    global.addEventListener('scroll', up, { passive: true });
    up();
    btn.addEventListener('click', function () {
      global.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /** 移动端抽屉导航 */
  function initMobileNav() {
    var toggle = doc.querySelector('.nav-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var open = doc.body.classList.toggle('nav-open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var dimmer = doc.querySelector('.sidebar-dimmer');
    if (dimmer) dimmer.addEventListener('click', function () {
      doc.body.classList.remove('nav-open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        doc.body.classList.remove('nav-open');
        toggle.classList.remove('open');
      }
    });
  }

  /** 滚动进场动画 */
  function initReveal() {
    var els = doc.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in global) ||
      global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ======================================================================
     7. 启动
     ====================================================================== */
  function setMeta(site, page, stats) {
    var s = site.site || {};
    var title = page && page.title ? (page.title + ' · ' + (s.name || '')) : (s.name || '岐黄翰墨');
    doc.title = title;
    var desc = (page && (page.description || page.lead)) || s.description || '';
    desc = U.fillCounts(desc, null, stats);
    var md = doc.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', desc);
    var og = doc.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute('content', title);
    var ogd = doc.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', desc);
  }

  function renderPageHead(page) {
    var html = '<div class="breadcrumb">' +
      '<a href="index.html">首页</a><span class="sep">/</span>' +
      '<span>' + U.esc(page.title) + '</span></div>' +
      '<header class="page-header">';
    if (page.icon) {
      html += '<span class="page-icon" aria-hidden="true"><i class="' + U.esc(page.icon) + '"></i></span>';
    }
    html += '<h2 class="page-title">' + U.esc(page.title) + '</h2>';
    if (page.subtitle) html += '<p class="page-subtitle">' + U.esc(page.subtitle) + '</p>';
    html += '</header>';
    if (page.lead) {
      html += '<div class="page-lead"><p>' + U.md(page.lead) + '</p></div>';
    }
    return html;
  }

  function boot() {
    var pageKey = doc.body.getAttribute('data-page') || 'home';
    var siteEl = doc.getElementById('sidebar');
    var contentEl = doc.getElementById('main-content');
    var footerEl = doc.getElementById('site-footer');

    // 首页需要多份数据
    var need = (pageKey === 'home')
      ? ['site', 'stats', 'classics', 'solar', 'herbs', 'formulas', 'diseases']
      : ['site', 'stats', pageKey];

    TCMData.loadAll(need).then(function (bundle) {
      var site = bundle.site;
      if (!site || site.__error) {
        contentEl.innerHTML = '<div class="error-state"><i class="fa fa-exclamation-circle"></i><br>' +
          '站点数据加载失败：' + U.esc(site && site.__error || '未知错误') +
          '<br><small>请确认已执行 <code>npm run build</code> 生成数据预构建包，或通过本地 HTTP 服务器打开。</small></div>';
        return;
      }

      setMeta(site, pageKey === 'home' ? null : (bundle[pageKey] && bundle[pageKey].page), bundle.stats);

      // 侧栏与页脚
      if (siteEl) siteEl.innerHTML = renderSidebar(site, pageKey, bundle.stats);
      if (footerEl) footerEl.innerHTML = renderFooter(site, bundle.stats);

      // 内容
      if (pageKey === 'home') {
        contentEl.innerHTML = renderHome(site, bundle);
      } else {
        var data = bundle[pageKey];
        if (!data || data.__error) {
          contentEl.innerHTML = '<div class="error-state"><i class="fa fa-exclamation-circle"></i><br>' +
            '页面数据 data/' + pageKey + '.json 加载失败：' +
            U.esc(data && data.__error || '未知错误') + '</div>';
          return;
        }
        var page = data.page;
        state.items = (page.items || []).slice();
        // 标记占位图风格
        var kindMap = {
          herbs: 'herb', classics: 'book', formulas: 'formula', diet: 'dish'
        };
        state.items.forEach(function (it) { it.__kind = kindMap[pageKey] || 'default'; });

        contentEl.innerHTML = renderPageHead(page) +
          (page.type === 'collection'
            ? renderCollectionPage(page)
            : renderSectionPage(page));
      }

      // 交互
      initCollectionInteractions();
      initScrollSpy();
      initBackToTop();
      initMobileNav();
      initReveal();

      // 页面内 hash 定位（首页/其他页跳转到具体条目）
      if (global.location.hash) {
        var target = doc.getElementById(global.location.hash.slice(1)) ||
          doc.querySelector('[data-id="' + global.location.hash.slice(1) + '"]');
        if (target) {
          setTimeout(function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (target.classList.contains('entry-card')) {
              var btn = target.querySelector('.entry-toggle');
              if (btn) btn.click();
            }
          }, 220);
        }
      }
    }).catch(function (err) {
      console.error(err);
      if (contentEl) {
        contentEl.innerHTML = '<div class="error-state"><i class="fa fa-exclamation-circle"></i><br>' +
          '页面初始化失败：' + U.esc(err.message) + '</div>';
      }
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
