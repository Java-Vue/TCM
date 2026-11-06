# TCM 站点数据规范（Data Schema）

> 本文件是**内容数据**的唯一契约。所有 `data/*.json` 必须严格遵守此结构，
> 渲染引擎 `assets/js/app.js` 才能正确解析。新增页面 / 新增内容均以本规范为准。

---

## 1. 文件与加载机制

| 目录 | 说明 |
|---|---|
| `data/*.json` | **内容的唯一源文件**（人工编辑）。10 份页面数据 + 1 份站点配置。 |
| `assets/data/tcm-data.js` | **构建产物**。由 `node tools/build-data.js` 从 `data/*.json` 打包生成，供 `file://` 直接双击打开时使用。**不要手工编辑**。 |
| `assets/js/data-loader.js` | 运行时加载器。优先 `fetch()` 读取 `data/*.json`（http/https 场景，改 JSON 立即生效）；失败时回退到 `assets/data/tcm-data.js` 预构建包。 |

> **新增页面文件时**，请同时把新文件名加入 `tools/build-data.js` 与 `assets/js/data-loader.js` 中的 `DATA_FILES` 数组，
> 预构建包才会包含该页。当前清单：
> `site, theory, classics, herbs, formulas, acupuncture, diet, solar, constitution, diseases, about`。

**加载优先级**
1. `location.protocol` 为 `http:`/`https:` → `fetch('data/xxx.json')`（支持热改）
2. 上述 fetch 失败或为 `file:` → 读取 `assets/data/tcm-data.js` 里的 `window.__TCM_DATA__`

> 因此：**改完 JSON 后，若在本地 http 服务器上浏览，刷新即可生效；若双击 html 直接打开，需要执行 `npm run build`（或 `node tools/build-data.js`）重新生成 bundle。**

---

## 2. 顶层文件结构

### 2.1 `data/site.json` — 站点配置

```jsonc
{
  "site": {
    "name": "岐黄翰墨",
    "shortName": "岐黄",
    "subtitle": "中华医药传统知识库",
    "description": "……站点一句话简介……",
    "author": "……",
    "keywords": ["中医药", "中医基础理论", "中药", "方剂", "针灸"],
    "repo": "https://github.com/<user>/<repo>",
    "startYear": 2026
  },
  "nav": [
    { "key": "home",     "title": "首页",     "href": "index.html",            "icon": "fa fa-home" },
    { "key": "theory",   "title": "理论基础", "href": "theory.html",           "icon": "fa fa-book" },
    { "key": "classics", "title": "经典医籍", "href": "classics.html",         "icon": "fa fa-scroll" },
    { "key": "herbs",    "title": "本草图鉴", "href": "herbs.html",            "icon": "fa fa-leaf" },
    { "key": "formulas", "title": "方剂大成", "href": "formulas.html",         "icon": "fa fa-flask" },
    { "key": "acupuncture","title":"针灸经络","href": "acupuncture.html",       "icon": "fa fa-mountain" },
    { "key": "diet",     "title": "养生食疗", "href": "diet.html",             "icon": "fa fa-mortar-pestle" },
    { "key": "solar",    "title": "节气养生", "href": "solar.html",            "icon": "fa fa-sun" },
    { "key": "constitution","title":"体质辨识","href":"constitution.html",     "icon": "fa fa-id-card" },
    { "key": "diseases", "title": "疾病调理", "href": "diseases.html",         "icon": "fa fa-heartbeat" },
    { "key": "about",    "title": "关于本站", "href": "about.html",           "icon": "fa fa-info-circle" }
  ],
  "sidebar": {
    "intro": "……侧栏站点介绍……",
    "stat": [ { "label": "典籍", "value": "19" }, { "label": "药材", "value": "60" } ],
    "topics": [ { "title": "……", "items": [ { "title": "……", "href": "……" } ] } ]
  },
  "footer": {
    "note": "……页脚说明……",
    "links": [ { "title": "……", "href": "……" } ]
  },
  "disclaimer": "本站内容仅供传统医学知识学习参考，不构成诊疗建议……"
}
```

### 2.2 内容页文件（`theory/classics/herbs/formulas/acupuncture/diet/solar/constitution/diseases`）

每个文件都是**同一种外壳**，只是内部 `page.type` 不同：

```jsonc
{
  "page": {
    "key": "theory",                 // 与 site.json nav 的 key 对应
    "title": "中医基础理论",         // 页标题
    "subtitle": "阴阳·五行·藏象·气血·经络·辨证",
    "description": "……SEO 描述……",
    "lead": "……页面导语（100–200 字）……",
    "type": "section",               // "section" | "collection"
    "icon": "fa fa-book",
    "sections": [ /* 见 §3 */ ],
    "items":   [ /* 见 §4，仅 collection 型使用 */ ]
  }
}
```

- `type: "section"` → 渲染为「章节导航 + 分节正文」，适合理论、经络、节气、体质。
- `type: "collection"` → 渲染为「卡片网格 + 展开详情」，适合典籍、药材、方剂、食疗、疾病。

> `type` 为 `collection` 时 `sections` 可省略；为 `section` 时 `items` 可省略。

---

## 3. Section 对象（章节型页面）

```jsonc
{
  "id": "yinyang-wuxing",            // 唯一 slug，用于锚点导航
  "title": "阴阳五行学说",
  "subtitle": "……副标题，可选……",
  "icon": "☯",                        // emoji 或 FontAwesome class，可选
  "summary": "……一句话摘要（40–80 字）……",
  "badge": "核心",                    // 可选的小标签
  "blocks": [ /* 见 §5 内容块 */ ]
}
```

## 4. Item 对象（集合型页面）

```jsonc
{
  "id": "huangqi",
  "title": "黄芪",
  "subtitle": "Astragalus membranaceus (Fisch.) Bunge",  // 可选：拉丁名/英文名/别名
  "category": "补虚药",                // 用于筛选分组
  "tags": ["补气", "固表止汗", "利水消肿"],   // 用于标签云
  "meta": [                           // 结构化要点（表格形式展示）
    { "label": "性味归经", "value": "甘，微温；归脾、肺经" },
    { "label": "功效",     "value": "补气升阳，固表止汗，利水消肿，生津养血，行滞通痹，托毒排脓，敛疮生肌" }
  ],
  "image": "",                          // 可选：真实图片路径；留空则由 JS 生成占位图
  "imageHint": "黄芪",                   // 占位图上显示的字（建议填）
  "summary": "……100–200 字概要……",
  "blocks": [ /* 见 §5 内容块 */ ]
}
```

---

## 5. 内容块（blocks）— 渲染引擎的核心

`blocks` 是一个数组，每个元素通过 `type` 字段决定渲染方式。**只允许使用下列类型**：

### 5.1 段落
```json
{ "type": "paragraph", "text": "正文段落，**支持** `行内 Markdown`（粗体、斜体、`代码`）。" }
```

### 5.2 标题（章节内部小标题）
```json
{ "type": "heading", "level": 3, "text": "一、阴阳的基本概念" }
```
`level` 可为 3 或 4（2 级用于 section 主标题，引擎自动处理）。

### 5.3 列表
```json
{ "type": "list", "ordered": false, "items": ["条目一", "条目二"] }
```

### 5.4 表格
```json
{
  "type": "table",
  "caption": "四气五味对照表",
  "head": ["项目", "含义", "举例"],
  "rows": [
    ["寒", "清热泻火", "石膏、黄连"],
    ["热", "温里散寒", "附子、干姜"]
  ]
}
```
- `head` 与每行 `rows` 的列数必须一致。
- 单元格内可写纯文本，不要用 HTML 标签。

### 5.5 引文（古籍原文）
```json
{ "type": "quote", "text": "阴阳者，天地之道也，万物之纲纪，变化之父母。", "source": "《黄帝内经·素问·阴阳应象大论》" }
```

### 5.6 提示框
```json
{ "type": "callout", "variant": "info", "title": "提示", "text": "……" }
```
`variant` 可选：`info`（靛青）、`success`（青绿）、`warning`（赭黄）、`danger`（朱红）、`default`（灰）。

### 5.7 要点卡片
```json
{ "type": "keypoints", "title": "掌握要点", "items": ["要点一", "要点二", "要点三"] }
```

### 5.8 图文卡片组
```json
{
  "type": "cards",
  "columns": 3,
  "items": [
    { "icon": "🌿", "title": "卡片标题", "text": "卡片描述文字", "bullets": ["可选要点1", "可选要点2"] }
  ]
}
```
`columns` 可为 2 或 3（移动端自动降为 1）。

### 5.9 分隔线
```json
{ "type": "divider" }
```

### 5.10 折叠面板
```json
{
  "type": "accordion",
  "items": [
    { "title": "折叠标题", "text": "折叠正文" },
    { "title": "折叠标题2", "text": "折叠正文2" }
  ]
}
```

---

## 6. 内容质量要求（硬性）

1. **真实准确**：中医术语、药性、方义、经络循行必须符合中医经典与现行教材表述，不得杜撰。
2. **禁止空壳**：每个 section / item 的 `blocks` 至少 4 个块，正文总字数：section ≥ 800 字，item ≥ 350 字。
3. **来源可溯**：引用古籍原文必须准确，并写明出处（书名·篇名）。
4. **免责声明意识**：涉及疾病调理的内容，使用「辨证需由医师完成」「具体剂量须遵医嘱」等表述。
5. **JSON 合法性**：文件必须是**严格合法 JSON**（双引号、无注释、无尾逗号）。
6. **不写 HTML**：正文一律用纯文本 + §5 定义的块类型，HTML 标签会被转义。

---

## 7. 新增内容 / 新增页面的标准流程

### 7.1 在已有页面中新增一条内容
1. 打开对应的 `data/xxx.json`；
2. 在 `page.items`（或 `page.sections`）数组里追加一个对象；
3. `id` 必须唯一（英文小写短横线）；
4. 保存 → 刷新页面（http 场景即时生效；file:// 场景执行 `npm run build`）。

### 7.2 新增一个全新页面
1. 在 `data/` 下新建 `yours.json`，内容按 §2.2 组织，`page.key` 设为你想要的新 key；
2. 在 `data/site.json` 的 `nav` 数组里加一条 `{ "key", "title", "href", "icon" }`；
3. 在站点根目录新建 `yours.html`，复制任意现有页面的骨架（见 §8）；
4. 执行 `npm run build`（生成 bundle），提交 4 个文件即可。

### 7.3 修改配色 / 字体
只改 `assets/css/theme.css` 顶部的 CSS 变量，**不影响任何内容文件**。
