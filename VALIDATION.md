# 验证记录

日期：2026-10-29（Asia/Shanghai）。首轮实现、检查与整理约 50 分钟（约 11:25～12:15，含工具下载与依赖安装）。后续修改与复核的投入另行记录。

## 已执行

| 检查 | 结果 | 环境与范围 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | 通过 | Windows，Node.js 22，pnpm 11.25.0 |
| `pnpm lint` | 通过，无错误 | ESLint 与 Next.js 配置 |
| `pnpm typecheck` | 通过 | TypeScript 严格类型检查 |
| `pnpm test` | 通过，5 项 | 多任务、终态停止轮询、查询异常、取消与迟到响应 |
| `pnpm build` | 通过 | Next.js 15.5.28，4 个页面路由，普通生产输出 |
| `mvn -B verify` | BUILD SUCCESS | Microsoft JDK 21.0.13、Maven 3.9.9，7 项测试，无失败或跳过 |
| API 集成测试 | 通过，3 项 | 真实 Spring/MyBatis，H2 MySQL 兼容模式，图片校验、归属、独立执行和结果读取 |
| 后台步骤单元测试 | 通过，4 项 | 成功顺序、三个阶段失败中断、终态保护、缺失素材 |
| `python tools/smoke.py` | 通过 | 实际 Next.js → Java HTTP 链路，H2 MySQL 兼容模式；成功、三阶段失败、结果字节一致、用户隔离 |
| 浏览器操作 | 通过 | 首页、详情、真实 PNG 上传、受理、成功结果、历史刷新恢复、新用户空历史与切回原用户 |
| 桌面视觉检查 | 通过 | 首页与历史页面截图见 `screenshots/` |

## 尚未执行

- 本机没有 Docker Engine 和 MySQL 服务，因此未运行 `docker compose up --build` 和真实 MySQL 8.4 集成验收。
- Linux standalone 镜像构建及 GitHub 托管 CI 尚未执行。CI 包含真实 Compose 构建与 `tools/smoke.py`，可在上传仓库后自动验证。
- 小屏样式已实现媒体查询，未进行完整移动端浏览器操作验收。

## 验证中的修正

- Next.js 从初始旧版本升级至 15.5.28，React 使用 19.3.1。
- 修正 pnpm 严格依赖布局下 ESLint 插件解析路径。
- 将 Windows 普通生产构建与 Linux 容器 standalone 构建分开，避免 Windows 创建符号链接的权限限制。
- Docker 构建阶段同时复制 pnpm 构建脚本许可配置，确保 esbuild、sharp、unrs-resolver 正常安装。
- MySQL 健康检查使用业务用户经 TCP 查询实际数据库，避免初始化期间只检测到临时 socket 服务。

## 要求与源码位置

| 要求 | 实现位置 |
| --- | --- |
| R-01 技术职责 | `frontend/`、`backend/pom.xml`、`StudioMapper.java` |
| R-02 模板列表 | `data.sql`、`ApiController.java`、`frontend/src/app/page.tsx` |
| R-03 上传校验 | `Storage.java`、`TaskService.java`、`templates/[id]/page.tsx` |
| R-04 异步受理 | `TaskService.java`、`StudioApplication.java` |
| R-05 多步骤持久化 | `TaskWorker.java`、`StudioMapper.java`、`schema.sql` |
| R-06 可控模拟 | `Models.CreateTask`、`TaskService.java`、详情页演示设置 |
| R-07 请求异常与任务失败 | `frontend/src/lib/tracker.ts`、`history/page.tsx` |
| R-08 多任务与生命周期 | `tracker.ts`、`studio-provider.tsx`、`tracker.test.ts` |
| R-09 刷新与历史 | `ApiController.java`、`studio-provider.tsx`、`history/page.tsx` |
| R-10 用户身份 | `ApiController.owner`、`studio-provider.tsx` |
| R-11 视觉与语义 | `globals.css`、页面组件、`screenshots/` |
| R-12 CI 与关键测试 | `.github/workflows/ci.yml`、前后端测试、`tools/smoke.py` |
| R-13 交付与说明 | `README.md`、本文件、依赖锁文件、SQL 与素材 |
| R-14 容器配置 | `compose.yaml`、前后端 Dockerfile |
