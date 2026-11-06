# 岐黄翰墨 · 中医药主题网站

> 一部可检索、可阅读、可无限扩展的中医药知识库。
> 覆盖**中医基础理论、经典医籍、本草图鉴、方剂大成、针灸经络、养生食疗、节气养生、体质辨识、疾病调理**九个板块，
> 正文合计约 **48 万字**真实中文内容。
>
> **不想写代码？** 打开 [`editor.html`](editor.html) 用图形化界面加内容，详见 **[编辑器使用手册](编辑器使用手册.md)**。

---

## 目录

1. [项目特性](#一项目特性)
2. [快速开始](#二快速开始)
3. [可视化内容编辑器](#三可视化内容编辑器只给作者用)
4. [目录结构概览](#四目录结构概览)
5. [内容数据规范](#五内容数据规范)
6. [如何新增内容与页面](#六如何新增内容与页面)
7. [如何自定义主题](#七如何自定义主题)
8. [部署到 GitHub Pages](#八部署到-github-pages)
9. [常见问题](#九常见问题)
10. [免责声明](#十免责声明)

---

## 一、项目特性

| 特性 | 说明 |
|---|---|
| **内容与样式彻底分离** | 正文全部存于 `data/*.json`，样式集中于 `assets/css/`，页面 HTML 不内联任何样式、不内嵌任何正文 |
| **零运行时依赖** | 无框架、无打包器、无 npm 依赖；仅用浏览器原生 `fetch` + 原生 JS |
| **零第三方构建依赖** | 构建脚本只用 Node.js 内置模块，Node 14+ 即可，`npm install` 都不需要 |
| **可视化编辑器** | `editor.html` 提供图形化内容编辑界面，填表即可加内容，**只有持有 GitHub 令牌的人能提交** |
| **数据即内容** | 新增一条药材、一种体质、一节节气，只改 JSON，不碰任何代码 |
| **双模式加载** | `http://` 下直接读取 JSON（改完刷新即生效）；`file://` 下自动回退到预构建包，双击 HTML 也能看 |
| **响应式** | 桌面为「左栏 + 内容区」双栏（1440/1200/991/767/480 五档断点），移动端侧栏转为抽屉，表格横向可滚动 |
| **交互完备** | 页内实时搜索、分类筛选、卡片懒加载展开、章节目录滚动高亮、回到顶部带进度、移动端抽屉 |
| **占位图自动生成** | 无需任何图片素材，按标题哈希确定性生成 SVG 配图；填 `image` 字段即可换成真实照片 |
| **数字自动更新** | 侧栏统计、专题计数、首页简介与模块描述里的数量全部从实际内容计算，加一条即变一次 |
| **防误删三重保险** | 编辑器保存前拦截 + 服务端条目数护栏 + 写入前自动备份到 `data/.backup/` |
| **GitHub Pages 就绪** | 自带 Actions 工作流，`push` 即自动校验、构建、发布 |

---

## 二、快速开始

### 方式 A：直接双击打开（零配置）

```
双击 TCM/index.html
```

浏览器会因安全策略禁止 `file://` 下的 `fetch`，此时自动使用 `assets/data/tcm-data.js` 预构建包渲染，**功能完全正常**。
前提是已经执行过一次 `npm run build`（仓库内已包含构建好的产物，通常无需再跑）。

> 提示：Chrome/Edge 对 `file://` 的限制更严格，建议用方式 B 获得完整体验（含搜索、筛选与热更新）。

### 方式 B：本地 HTTP 服务器（推荐）

```bash
cd TCM

# 方式 B1：使用项目自带的零依赖服务器
node tools/serve.js          # 默认 http://127.0.0.1:8080
node tools/serve.js 3000     # 指定端口

# 方式 B2：使用 Python
python -m http.server 8080

# 方式 B3：使用 Node 生态任意静态服务器
npx serve .
```

打开 `http://127.0.0.1:8080/` 即可。

### npm 脚本

```bash
npm run build     # 校验 data/*.json → 生成 assets/data/tcm-data.js，并同步 GH Actions 工作流
npm run check     # 只做校验与统计，不写任何文件
npm run pages     # 依据 data/site.json 重新生成 12 个页面 HTML 骨架
npm run serve     # 启动零依赖本地服务器（含编辑器写入接口）
npm run dev       # build + pages + serve 一步到位
```

---

## 三、可视化内容编辑器（只给作者用）

> **完全不懂编程也能加内容。** 打开 `editor.html`，填表、点按钮、保存，全过程不需要碰任何代码。
> 详细图文步骤见 **[编辑器使用手册.md](编辑器使用手册.md)**。

### 启动

```bash
node tools/serve.js
# 然后浏览器打开 http://127.0.0.1:8080/editor.html
```

### 界面

| 区域 | 作用 |
|---|---|
| 左栏 | ① 选板块 → ② 选条目（新增 / 修改 / 搜索 / 删除） |
| 中栏 | 基本信息表单 + 正文内容块编辑（10 种块：段落/小标题/列表/表格/引文/提示框/要点卡片/图文卡片/折叠面板/分隔线） |
| 右栏 | ③ **实时预览** —— 与线上排版完全一致（复用 `assets/js/render.js`） |

### 三种保存通道

| 通道 | 用途 | 门禁 |
|---|---|---|
| **保存到本地文件** | 改稿用，直接改写 `data/*.json` | 需本地服务器；仅本机可写 |
| **保存到 GitHub** | 让线上同步 | **需要 GitHub 个人访问令牌 —— 只有你有** |
| **下载 JSON 文件** | 完全离线 | 手动上传 |

### 本地 ↔ 云端双向同步

内容在磁盘上有两份：本地 `data/*.json` 与 GitHub 仓库里的 `data/*.json`。
若只改云端那份，关掉服务器再打开编辑器读到的仍是旧的本地文件，就会"看不到刚加的内容"。

因此编辑器实现了：

- **保存到 GitHub 成功后自动镜像回本地** —— 关掉服务器再打开，内容依然在；
- **↓ 从 GitHub 拉取** —— 把云端版本下载到本地并载入编辑器（换电脑 / 在 GitHub 网页上改过 / 本地文件丢失时用）；
- **状态栏实时显示**本地 N 条 / 云端 M 条是否一致；
- **远程改动检测** —— 云端文件在编辑期间被改过（另一台电脑 / 网页端）时，提交前会拦下来提醒，避免互相覆盖；
- **仓库信息自动记住**（用户名 / 仓库名 / 分支），令牌按「记住令牌」勾选决定是否保存。

详细操作见 [编辑器使用手册.md](编辑器使用手册.md) 第六章。

### 「只有我能加、别人不行」怎么保证

| 层次 | 机制 | 强度 |
|---|---|---|
| 1 | 编辑器**不出现在公开导航**中，访客无从得知 | 隐藏 |
| 2 | 顶栏「口令」设置本地口令锁，防随手打开 | 弱（仅防窥） |
| 3 | **GitHub 仓库写权限**：没有令牌谁也提交不了，令牌只存在你本机浏览器 | **强（真正的门禁）** |
| 4 | 部署时可不上传 `editor.html`，线上彻底不存在 | 最强 |

### 编辑器的技术要点

- **写入接口**：`tools/serve.js` 提供 `PUT /api/data/<file>`，只绑定 `127.0.0.1`；
- **三重防护**：校验 `Origin` / `Sec-Fetch-Site` 同源 → 校验随机会话令牌 → 条目数骤减护栏（骤降到一半以下直接 409 拒绝）；
- **自动备份**：每次写入前把原文件复制到 `data/.backup/`，写错了可一键恢复；
- **自动重建**：写入成功后自动重新生成 `assets/data/tcm-data.js`，`file://` 场景同步可用；
- **图片上传**：`POST /api/upload` 把本地图片存到 `assets/img/uploads/`。

---

## 四、目录结构概览

```
TCM/
├── index.html                 # ★ 首页（位于 TCM 根目录）
├── editor.html                # ★ 可视化内容编辑器（默认不公开，详见第三节）
├── theory.html                # 中医基础理论   （11 章）
├── classics.html              # 经典医籍       （19 部）
├── herbs.html                 # 本草图鉴       （60 味）
├── formulas.html              # 方剂大成       （36 首）
├── acupuncture.html           # 针灸经络       （8 章）
├── diet.html                  # 养生食疗       （36 道）
├── solar.html                 # 二十四节气     （24 节）
├── constitution.html          # 中医体质辨识   （10 章 / 9 种体质）
├── diseases.html              # 常见疾病调理   （28 病种）
├── about.html                 # 关于本站
├── 404.html                   # GitHub Pages 404 页
│
├── data/                      # ★ 内容与配置的唯一源（人工只改这里）
│   ├── _schema.md             #   数据规范说明书（写内容前必读）
│   ├── site.json              #   站点配置：名称、导航、侧栏、页脚、模块描述、数量口径
│   ├── stats.json             #   ⚙ 构建产物：各板块条目数（自动生成，勿手工编辑）
│   ├── theory.json            #   中医基础理论
│   ├── classics.json          #   经典医籍
│   ├── herbs.json             #   本草图鉴
│   ├── formulas.json          #   方剂大成
│   ├── acupuncture.json       #   针灸经络
│   ├── diet.json              #   养生食疗
│   ├── solar.json             #   二十四节气
│   ├── constitution.json      #   体质辨识
│   ├── diseases.json          #   常见疾病调理
│   ├── about.json             #   关于本站
│   └── .backup/               #   自动备份（写前留底，可恢复）
│
├── assets/                    # ★ 静态资源
│   ├── css/
│   │   ├── theme.css          #   设计令牌（配色/字体/间距/阴影）+ 基础排版
│   │   ├── main.css           #   布局与组件（侧栏/卡片/表格/提示框/响应式）
│   │   └── editor.css         #   编辑器专用样式
│   ├── js/
│   │   ├── render.js          #   ★ 公共渲染模块（工具/占位图/内容块）—— 站点与编辑器共用
│   │   ├── data-loader.js     #   数据加载器：fetch 优先，失败回退预构建包
│   │   ├── app.js             #   站点渲染引擎 + 全部交互逻辑
│   │   └── editor.js          #   编辑器逻辑（表单/预览/三种保存通道）
│   ├── data/
│   │   └── tcm-data.js        #   ⚙ 构建产物：data/*.json 的打包（勿手工编辑）
│   ├── img/
│   │   ├── favicon.svg        #   站点图标
│   │   └── uploads/           #   编辑器上传的图片
│   └── README.txt             #   依赖说明
│
├── tools/                     # ★ 构建与开发工具（Node 脚本，零依赖）
│   ├── build-data.js          #   校验 JSON + 生成 tcm-data.js + 同步工作流
│   ├── gen-pages.js           #   依据 site.json 生成 12 个页面骨架
│   └── serve.js               #   零依赖本地服务器（含编辑器写入接口）
│
├── .github/workflows/
│   └── pages.yml              #   GitHub Pages 自动部署工作流
├── .nojekyll                  #   禁用 Jekyll 处理（Pages 必需）
├── package.json               #   npm 脚本与元信息
├── 编辑器使用手册.md           # ★ 面向非技术用户的图文操作手册
├── LICENSE                    # MIT + 古籍版权说明
└── README.md                  #   本文件
```

**体量**：站点总计约 3.6 MB（其中 `data/` 1.9 MB 为正文数据，`assets/data/tcm-data.js` 1.5 MB 为其预构建副本）。

---

## 五、内容数据规范

### 5.1 两层页面模型

| 页面类型 | `page.type` | 渲染形态 | 适用板块 |
|---|---|---|---|
| 分节型 | `section` | 顶部目录胶囊 + 分节正文 | 基础理论、针灸经络、节气养生、体质辨识 |
| 集合型 | `collection` | 卡片网格 + 点击展开详情 + 搜索 + 分类筛选 | 经典医籍、本草图鉴、方剂大成、养生食疗、疾病调理 |

### 5.2 内容块（blocks）类型

正文不是一整段字符串，而是由「内容块」数组拼装而成。渲染引擎支持 10 种块：

| `type` | 用途 | 关键字段 |
|---|---|---|
| `paragraph` | 正文段落 | `text` |
| `heading` | 小标题 | `level`(3/4)、`text` |
| `list` | 有序/无序列表 | `ordered`、`items[]` |
| `table` | 表格 | `caption`、`head[]`、`rows[][]` |
| `quote` | 古籍引文 | `text`、`source` |
| `callout` | 提示框 | `variant`(info/success/warning/danger/default)、`title`、`text` |
| `keypoints` | 要点卡片 | `title`、`items[]` |
| `cards` | 图文卡片组 | `columns`(2/3)、`items[]{icon,title,text,bullets[]}` |
| `divider` | 分隔线 | — |
| `accordion` | 折叠面板 | `items[]{title,text}` |

段落内支持行内 Markdown：`**粗体**`、`*斜体*`、`` `代码` ``。

完整字段说明与示例见 **[`data/_schema.md`](data/_schema.md)**，写内容前请先读该文件。

### 5.3 数据加载机制

```
浏览器打开页面
   │
   ├─ 页面协议是 http/https？
   │     ├─ 是 → fetch('data/xxx.json')  ← 改 JSON 刷新即生效
   │     └─ 否 / fetch 失败
   │            └─ 读取 assets/data/tcm-data.js 中的 window.__TCM_DATA__
   │
   └─ 渲染引擎 app.js 按 page.type 组装 DOM
```

因此：

- **用 HTTP 方式预览时**，改完 `data/*.json` 刷新页面即可看到变化，**无需重新构建**；
- **双击 HTML 直接打开时**，改完 JSON 需要执行 `npm run build` 重新生成预构建包。

### 5.4 数据校验

`npm run build` 会做完整校验，发现问题会**以非零退出码失败**（CI 中会直接中断部署）：

- JSON 语法合法性；
- 页面 `key` / `title` / `type` 是否齐备；
- `section` / `item` 的 `id` 是否存在且**全局唯一**；
- 每个条目 `blocks` 是否非空；
- 表格 `head` 与每行 `rows` 的**列数是否一致**；
- 内容块 `type` 是否在允许白名单内；
- `cards` / `keypoints` 等必填子字段是否存在。

只校验不写文件：

```bash
npm run check
```

输出示例：

```
▶ 岐黄翰墨 · 数据构建
  ✔ site.json          导航 11 项
  ✔ theory.json             11 章节　  31k 字
  ✔ classics.json           19 条目　  44k 字
  ...
✔ 校验通过，正文合计约 487k 字
```

---

### 数字自动更新（无需手工维护）

站点上所有「数量」都从实际内容计算，加一条内容就自动变一次：

| 位置 | 内容 | 来源 |
|---|---|---|
| 侧栏「内容统计」 | 典籍 / 药材 / 方剂 / 病种 / 节气 / 体质的数字 | `data/stats.json` |
| 侧栏「专题导航」 | 每个专题后面的「60 味」「36 首」等 | `data/stats.json` |
| 首页 Hero 简介 | 「…十九部传世典籍、六十味常用中药…」 | `site.json` 模板 + 实际数量 |
| 首页模块卡片描述 | 「六十味常用中药的性味归经…」 | `site.json` 的 `modules` 段 + 实际数量 |
| 首页各面板 | 新收录的条目优先展示 | 条目的 `addedAt` 字段 |
| 页脚统计条 | 与侧栏一致 | `data/stats.json` |

**`data/stats.json` 是构建产物**，由 `tools/build-data.js` 自动生成，不要手工编辑。

#### 三种更新路径

| 你怎么改的 | 统计会不会跟着变 |
|---|---|
| 用**编辑器**加内容并保存 | ✅ 会（保存时服务器自动重建） |
| 用 **VS Code 等直接改** `data/*.json` | ✅ 会（服务器检测到文件变动，下次请求时自动重建） |
| **部署到 GitHub Pages** | ✅ 会（Actions 在发布前自动执行 `npm run build`） |

> 💡 本地预览时，服务器每 1.2 秒检查一次 `data/` 目录的修改时间，
> 发现数据文件变了就自动重建统计与数据包 —— 所以您用文本编辑器直接改 JSON 也完全没问题。

#### 想改数量口径？

编辑 `data/site.json` 的 `stats` 段：

```json
"stats": {
  "herbs":  { "unit": "味" },
  "constitution": { "unit": "种", "count": 9 }
}
```

- `unit`：显示单位（味 / 部 / 首 / 章 / 节 / 道 / 病 / 种）；
- `count`：**可选**的固定值，仅在「数量不等于条目数」时才需要写。
  例如「九种体质」是固定的分类法（体质总论 + 9 种体质 = 10 个章节），
  所以写 `"count": 9`，统计按「种」计。

#### 想改首页简介与模块描述？

编辑 `data/site.json`：

- `site.description` —— 首页简介，可用 `{classics}` `{herbs}` `{formulas}` 等占位符引用各板块数量；
- `modules` —— 首页九张模块卡片的描述，`{count}` 代表该板块自己的数量。

例如把药材描述改成：

```json
"herbs": "{count}味常用中药，涵盖性味归经、功效主治、配伍与禁忌"
```

加一味药后首页会自动变成「六十一味常用中药，涵盖…」。

---

## 六、如何新增内容与页面

### 6.1 在已有板块新增一条内容（最常用）

以「本草图鉴」新增一味药材为例：

1. 打开 `data/herbs.json`，找到 `page.items` 数组；
2. 在数组中追加一个对象（注意上一项末尾要补逗号）：

```json
{
  "id": "fu-pen-zi",
  "title": "覆盆子",
  "subtitle": "Rubus chingii Hu ｜ 覆盆、乌泡",
  "category": "收涩药",
  "tags": ["益肾固精", "缩尿", "养肝明目"],
  "meta": [
    { "label": "性味归经", "value": "甘、酸，温；归肝、肾、膀胱经" },
    { "label": "功效", "value": "益肾固精缩尿，养肝明目" },
    { "label": "主治", "value": "遗精滑精、遗尿尿频、肝肾不足之目暗不明" },
    { "label": "用法用量", "value": "煎服，6–12 g" },
    { "label": "使用注意", "value": "尿涩不利者不宜多服" }
  ],
  "image": "",
  "imageHint": "覆",
  "summary": "覆盆子为蔷薇科植物华东覆盆子的成熟聚合果……（120–200 字）",
  "blocks": [
    { "type": "paragraph", "text": "……" },
    { "type": "table", "caption": "配伍宜忌", "head": ["配伍", "作用"], "rows": [["桑螵蛸", "固肾缩尿"]] },
    { "type": "quote", "text": "……", "source": "《本草纲目·草部》" },
    { "type": "callout", "variant": "warning", "title": "使用注意", "text": "……" },
    { "type": "keypoints", "title": "掌握要点", "items": ["……", "……"] }
  ]
}
```

3. 保存 → **用 HTTP 方式打开 `herbs.html` 刷新**，新条目立即出现在卡片网格中（分类胶囊会自动多出「收涩药」一组）。

> 若 `category` 是新分类，分类筛选胶囊会自动生成，无需改任何代码。

### 6.2 在分节型板块新增一章

1. 打开对应 JSON（如 `data/solar.json`）；
2. 在 `page.sections` 数组中追加：

```json
{
  "id": "new-term",
  "title": "新章节名",
  "subtitle": "副标题（可选）",
  "icon": "🌿",
  "summary": "一句话摘要（40–80 字）",
  "blocks": [ { "type": "paragraph", "text": "……" } ]
}
```

3. 刷新页面 —— 顶部目录胶囊会自动出现新章节，滚动高亮同步生效。

### 6.3 新增一个全新页面

**三步，不写一行前端代码：**

1. **新建数据文件** `data/xxx.json`：

```json
{
  "page": {
    "key": "xxx",
    "title": "新页面标题",
    "subtitle": "副标题",
    "description": "SEO 描述",
    "lead": "页面导语（100–200 字）",
    "type": "section",
    "icon": "fa fa-leaf",
    "sections": [ { "id": "intro", "title": "开篇", "blocks": [] } ]
  }
}
```

2. **在 `data/site.json` 的 `nav` 数组登记**（同时也会自动出现在左侧导航与页脚）：

```json
{ "key": "xxx", "title": "新页面", "href": "xxx.html", "icon": "fa fa-leaf" }
```

3. **生成页面骨架并构建**：

```bash
npm run build     # 校验 + 生成数据预构建包
npm run pages     # 依据 site.json 生成 xxx.html
```

4. 把 `data/xxx.json` 加入 `tools/build-data.js` 与 `assets/js/data-loader.js` 的 `DATA_FILES` 数组（保证预构建包包含该页）。

完成。`xxx.html` 会自动出现在 TCM 根目录，导航可跳转，页脚同步更新。

### 6.4 替换占位图为真实图片

每个条目都支持 `image` 字段：

```json
"image": "assets/img/herbs/fu-pen-zi.jpg"
```

- 留空 `""` → 引擎按 `imageHint` 与 `id` 哈希**确定性生成** SVG 配图（颜色稳定、可复现）；
- 填入路径 → 直接使用你的图片；图片缺失时会自动回退到 SVG 占位图，不会出现破图。

建议尺寸：宽高比 **16:9**，宽度 ≥ 640 px。

---

## 七、如何自定义主题

### 7.1 改配色、字体、间距

只改 `assets/css/theme.css` **顶部的 `:root` 变量**，不触碰任何内容文件：

```css
:root {
  --body-bg-color: #f1ece1;   /* 页面底色（宣纸） */
  --content-bg-color: #fffdf9; /* 内容卡片底色 */
  --text-color: #4b463d;       /* 正文色 */
  --heading-color: #26332b;    /* 标题色 */
  --link-color: #9c3b2b;       /* 链接色（朱砂） */
  --brand-bg: #26332b;         /* 侧栏品牌块深色 */
  --brand-accent: #c49a4f;     /* 金色点缀 */
  --font-serif: "Noto Serif SC", "Songti SC", serif;  /* 中文标题字体 */
  --font-sans:  "Lato", "PingFang SC", "Microsoft YaHei", sans-serif;
  --sidebar-width: 262px;      /* 侧栏宽度 */
  --content-max: 1200px;       /* 内容区最大宽度 */
  /* …… 还有圆角、阴影、动效时长等 */
}
```

当前主题取自传统中医配色：**宣纸米白底 + 墨绿品牌块 + 朱砂链接 + 赭金点缀**，标题用衬线（宋体族）以贴合古籍气质。

### 7.2 改布局与组件

改 `assets/css/main.css`。主要类名：

| 类名 | 用途 |
|---|---|
| `.site-layout` / `.sidebar` / `.content` | 整体两栏骨架 |
| `.site-brand` / `.site-nav` / `.nav-link` | 品牌块与导航 |
| `.sidebar-panel` / `.panel-title` / `.stat-grid` | 侧栏面板 |
| `.content-card` / `.page-header` / `.page-title` | 内容卡片与页头 |
| `.card-grid` / `.entry-card` / `.entry-detail` | 集合页卡片 |
| `.block-table` / `.block-quote` / `.callout` / `.keypoints` / `.mini-card` | 内容块样式 |
| `.hero` / `.module-grid` / `.home-panel` | 首页专属模块 |

### 7.3 改导航与站点信息

全部在 `data/site.json`：

- `site`：站点名、副标题、简介、作者、起始年份；
- `nav`：左侧主导航（顺序即显示顺序）；
- `sidebar`：侧栏介绍、统计数字、专题导航、外链；
- `footer`：页脚说明与链接；
- `disclaimer`：免责声明文案。

---

## 八、部署到 GitHub Pages

### 8.1 两种仓库形态

| 形态 | 仓库结构 | 站点地址 | 适用 |
|---|---|---|---|
| **A. 独立仓库**（推荐） | TCM 内的文件直接作为仓库根目录 | `https://<user>.github.io/<repo>/` | 把本站作为独立站点 |
| **B. 单仓库多站点** | 仓库根目录同时含 `TCM/` 子目录 | `https://<user>.github.io/<repo>/TCM/` | 与其他站点共存 |

本仓库当前采用**形态 B**：`TCM/` 位于仓库内，站点将发布在 `.../TCM/`。
由于全站使用**相对路径**（`assets/...`、`data/...`、`theory.html`），两种形态都**无需修改任何链接**。

### 8.2 仓库名建议

| 用途 | 推荐仓库名 | 站点地址 |
|---|---|---|
| 独立站 | `tcm-site` / `qihuang-meng` / `tcm-knowledge` | `https://<user>.github.io/tcm-site/` |
| 个人主站子目录 | `<user>.github.io`（已有）+ `TCM/` | `https://<user>.github.io/TCM/` |

### 8.3 部署步骤（GitHub Actions，推荐）

1. **新建仓库**，例如 `tcm-site`（形态 A）或使用已有仓库（形态 B）。

2. **上传文件**：

   - 形态 A：把 `TCM/` 目录内的**全部内容**（含 `assets/`、`data/`、`tools/`、`.github/`、`.nojekyll`、`*.html`）复制到仓库根目录；
   - 形态 B：整个 `TCM/` 目录原样放进仓库根目录。

   > 注意：`assets/data/tcm-data.js` 是构建产物，**体积约 1.5 MB**，建议一并提交（这样即使 Actions 未运行，站点也能工作）；若仓库体积敏感，可在 `.gitignore` 中忽略它，由 Actions 每次构建生成。

3. **复制 GitHub Actions 工作流到仓库根目录**（GitHub 只识别根目录下的 `.github/workflows/`）：

   ```bash
   mkdir -p .github/workflows
   cp TCM/.github/workflows/pages.yml .github/workflows/pages.yml
   # 形态 A（TCM 内容即仓库根目录）时：
   cp TCM/.github/workflows/pages.yml .github/workflows/pages.yml
   ```

   > 项目内置 `tools/build-data.js` 会在每次构建时**自动把 `TCM/.github/workflows/pages.yml` 同步到仓库根目录**，因此只需复制这一次，后续改动会自动同步。

   **如果你不想让可视化编辑器出现在网上**（更保险的做法），可以在仓库根目录新建 `.gitignore` 并写入：

   ```
   TCM/editor.html
   ```

   这样 `editor.html` 就只存在于你自己的电脑上，线上完全看不到，**绝对安全**。

4. **在仓库 Settings → Pages 中把 Source 设为 `GitHub Actions`**。

5. **推送触发部署**：

   ```bash
   git add -A
   git commit -m "feat: 初始化中医药主题站点"
   git push origin main
   ```

   Actions 会自动执行：**校验数据 → 生成数据包 → 生成页面 → 上传 → 发布**。
   仓库首页的 **Actions** 标签页可查看进度，部署成功后站点地址显示在 `environment.url`。

6. **访问**：形态 A 为 `https://<user>.github.io/tcm-site/`，形态 B 为 `https://<user>.github.io/<repo>/TCM/`。

### 8.4 部署步骤（分支直发，备选）

若不想用 Actions：

1. Settings → Pages → Source 选 **`main` 分支 / `/ (root)`**；
2. 把 `TCM/` 内的文件放到仓库根目录（形态 A）；
3. 仓库中**必须**保留 `.nojekyll`（已内置），否则 Jekyll 会忽略以下划线开头的文件；
4. 推送后约 1–2 分钟生效。

> 注意：分支直发模式下，`assets/data/tcm-data.js` 必须是**已提交**的构建产物，否则 `file://` 场景无法工作。

### 8.5 日常更新流程

```bash
# 1. 编辑内容（只改 data/*.json）
vim data/herbs.json

# 2. 本地校验（必须通过，否则 CI 会失败）
npm run check

# 3. 生成数据包与页面骨架
npm run build && npm run pages

# 4. 提交推送
git add -A && git commit -m "content: 新增覆盆子等 3 味药材" && git push origin main
```

推送后 Actions 自动重新发布，通常 **1–2 分钟**内线上生效。

> 若仓库根目录即为站点内容（形态 A），`npm run build` 生成的 `assets/data/tcm-data.js` 需随提交一起更新；
> 若采用形态 B，Actions 会在发布前自动重新构建，无需手动提交构建产物。

### 8.6 自定义域名

在仓库 Settings → Pages → Custom domain 填入域名，并在域名服务商处添加 CNAME 记录指向 `<user>.github.io`。
仓库根目录建议添加 `CNAME` 文件（如 `CNAME` 内容为 `tcm.example.com`）以保证每次发布不被清空。

---

## 九、常见问题

**Q：双击 `index.html` 打开后页面空白？**
A：多半是浏览器在 `file://` 下阻止了 `fetch` 且预构建包不存在。执行 `npm run build` 重新生成 `assets/data/tcm-data.js` 即可；若仍有问题，请改用 `npm run serve` 启动本地服务器。

**Q：页面没有内容，控制台报「无法加载数据文件」？**
A：`data/` 目录缺失或 JSON 语法有误。运行 `npm run check` 查看具体错误。

**Q：修改了 JSON 但页面没变化？**
A：若你是**双击 HTML** 打开的，需要 `npm run build`；若是通过 **HTTP 服务器**打开的，**刷新即可**（必要时用 `Ctrl+F5` 强制刷新）。

**Q：表格在手机上显示不全？**
A：表格已做横向滚动处理（`.table-wrap` 容器），可左右滑动查看。列特别多时建议在数据中精简列数。

**Q：想加一个全新的板块（比如「中医诊断学」）？**
A：见 §6.3，三步：新建 JSON → `site.json` 的 `nav` 登记 → `npm run build && npm run pages`。
另外记得把新文件名加入 `tools/build-data.js` 和 `assets/js/data-loader.js` 的 `DATA_FILES` 数组。

**Q：怎么把占位图换成真实药材照片？**
A：在对应 JSON 条目中填 `"image": "assets/img/herbs/xxx.jpg"`，把图片放进 `assets/img/herbs/` 目录即可。见 §6.4。

**Q：图片存在哪里比较好？**
A：建议放在 `assets/img/` 下按板块建子目录（如 `assets/img/herbs/`、`assets/img/classics/`），保持 16:9 比例，单张控制在 200 KB 以内。

**Q：部署后 404？**
A：检查三点 —— ① Pages 的 Source 是否设为 GitHub Actions 或 `main` 分支根目录；② 仓库根目录是否有 `.nojekyll`；③ 若为形态 B，确认发布根目录识别为 `TCM`（可在 Actions 日志中查看「识别发布根目录」这一步的输出）。

**Q：如何更新站点标题、导航、页脚？**
A：只改 `data/site.json`，然后 `npm run pages` 重新生成页面骨架（`<title>`、`<meta description>` 是生成时写入的）。

---

## 十、免责声明

本站内容整理自中医经典文献与公开教材资料，**仅供传统医学知识学习、学术参考与文化传播之用，不构成任何医疗诊断、治疗方案或用药建议**，不能替代执业医师的面诊与处方。

- 所有药物剂量、针灸操作、食疗配方的具体应用，须由具备相应执业资质的医师结合患者年龄、性别、体质、合并症与用药史辨证确定；
- 文中标注的**十八反、十九畏**配伍禁忌、妊娠禁忌与含毒性药材警示，均已写入对应条目，但实际配伍仍须经专业审核；
- 出现高热、意识障碍、胸痛、呼吸困难、大出血、剧烈头痛、持续呕吐腹泻等**红旗征象**时，请立即就医，切勿延误。

引用的古籍正文均为公有领域文献；现代教材部分为版权保护内容，本站仅作要点式转述并标注出处，不作全文转载。若您为相关内容的权利人并认为本站的使用方式不妥，可通过仓库 Issue 与我们联系，我们会及时调整或下线相关内容。

---

## 许可

代码部分采用 MIT 许可。引用的古籍正文属公有领域文献。详见 `LICENSE`。
