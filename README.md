# NeosAI IDP 三期 · PRD 与原型

可编辑 PRD、交互原型、审阅评论、发布版本对比与原文问答。

## 本地启动

使用 Node.js 22 或更高版本：

```sh
npm install
npm run setup
cp .env.example .env.local
npm run dev
```

打开 http://127.0.0.1:4176/ 。完整原型可单独打开 http://127.0.0.1:5174/business-rules/master-data 。运行期间占用 4173、4176、5174 三个端口。

在 `.env.local` 填写 `PRD_MODEL_API_KEY`，默认模型为 DeepSeek `deepseek-flash`。密钥仅由服务端读取；修改配置后重启服务。未配置时仍可检索原文。模型仅筛选原文段落，页面引用由服务端返回原始文本。

## 文件与数据

- `PRD.zh-CN.md`：完整需求文档，页面编辑会同步到此文件。
- `prototype/`：Vue 交互原型及 mock 场景。
- `interaction-prd/`：文档与原型工作台。
- `scripts/`：服务、文档生成和验证脚本。
- `.prd-history/`：本机草稿历史、发布版本与评论，首次运行自动创建，未纳入仓库。部署时请使用持久化存储并备份。

评论、编辑、历史和问答需要 Node 服务；仅部署静态页面无法使用这些功能。当前工作台适用于受信任的内部网络，公开部署前应配置访问认证。

## 验证与构建

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

浏览器验证需先启动 `npm run dev`。可用 `PLAYWRIGHT_EXECUTABLE_PATH` 指定已有浏览器。部分历史交互检查脚本保留用于参考，默认浏览器验证覆盖当前工作台、下载和照合场景。
