/* ==========================================================================
   岐黄翰墨 · 数据加载器 (Data Loader)
   --------------------------------------------------------------------------
   加载策略（按优先级）：
     1) http/https 环境  → fetch('data/xxx.json')，改 JSON 刷新即生效（热改友好）
     2) 失败或 file:// 协议 → 回退到 assets/data/tcm-data.js 中的预构建包
   预构建包由 `node tools/build-data.js`（即 npm run build）生成。
   ========================================================================== */
(function (global) {
  'use strict';

  var DATA_FILES = [
    'site', 'stats', 'theory', 'classics', 'herbs', 'formulas',
    'acupuncture', 'diet', 'solar', 'constitution', 'diseases', 'about'
  ];

  var cache = {};

  function bundle() {
    return global.__TCM_DATA__ || null;
  }

  function fromBundle(name) {
    var b = bundle();
    return b && b[name] ? b[name] : null;
  }

  function fetchJSON(name) {
    // file:// 协议下 fetch 会被浏览器 CORS 策略拦截，直接跳过以免产生控制台报错
    if (global.location && global.location.protocol === 'file:') {
      return Promise.reject(new Error('file:// 协议不支持 fetch，改用预构建包'));
    }
    return fetch('data/' + name + '.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + name + '.json');
        return res.json();
      });
  }

  /**
   * 载入单个数据文件
   * @param {string} name  不含扩展名的文件名，如 'herbs'
   * @returns {Promise<object>}
   */
  function load(name) {
    if (cache[name]) return Promise.resolve(cache[name]);

    return fetchJSON(name)
      .then(function (data) {
        cache[name] = data;
        return data;
      })
      .catch(function (err) {
        var b = fromBundle(name);
        if (b) {
          cache[name] = b;
          return b;
        }
        throw new Error('无法加载数据文件 data/' + name + '.json：' + err.message);
      });
  }

  /**
   * 批量载入
   * @param {string[]} names
   * @returns {Promise<object>}  { name: data }
   */
  function loadAll(names) {
    names = names && names.length ? names : DATA_FILES;
    return Promise.all(
      names.map(function (n) {
        return load(n).catch(function (err) {
          return { __error: err.message };
        });
      })
    ).then(function (arr) {
      var out = {};
      names.forEach(function (n, i) { out[n] = arr[i]; });
      return out;
    });
  }

  global.TCMData = {
    DATA_FILES: DATA_FILES,
    load: load,
    loadAll: loadAll,
    hasBundle: function () { return !!bundle(); },
    clearCache: function () { cache = {}; }
  };
})(window);
