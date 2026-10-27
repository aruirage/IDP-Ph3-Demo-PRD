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

## Vercel 部署

将仓库根目录作为 Vercel 项目目录。根目录的 `vercel.json` 会安装两部分依赖、构建工作台及原型，并发布 Node 问答与版本接口。首页 `/` 是 PRD 工作台；`/business-rules/master-data` 是独立原型。部署时无需运行本地的三个常驻进程。

在 Vercel 项目的环境变量中设置：

- `PRD_MODEL_API_KEY`：DeepSeek 密钥。默认模型 `deepseek-flash`，可通过 `PRD_MODEL_NAME` 调整。
- `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`：在 Vercel Storage/Marketplace 连接 Upstash Redis 后获取。也兼容 `KV_REST_API_URL`、`KV_REST_API_TOKEN`。
- `PRD_STORAGE_KEY`：可选的存储命名空间。未设置时，Preview 按 Git 分支隔离，Production 使用正式命名空间。

未配置 Redis 时可阅读、切换原型、下载、截图和检索原文，页面显示只读提示；编辑、评论和发布在接入持久化存储后启用。未配置模型密钥时使用原文检索。云端草稿、评论和版本保存在 Redis，重新部署会保留。GitHub 更新会刷新尚未被云端编辑的文档；已有云端编辑会继续保留，避免覆盖用户修改。

本地复核 Vercel 产物：

```sh
npm run vercel:build
npm run preview:vercel
# 另一个终端，默认预览端口 4190
npm run test:vercel
```
