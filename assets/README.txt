# 依赖说明

本站为纯静态站点，无需安装任何第三方依赖。

- `npm run build`   校验 data/*.json 并生成 assets/data/tcm-data.js
- `npm run check`   只校验，不写文件
- `npm run pages`   依据 site.json 重新生成各页面 HTML 骨架
- `npm run serve`   启动零依赖本地预览服务器（默认 8080 端口）

所有脚本仅使用 Node.js 内置模块，Node 14+ 即可运行。
