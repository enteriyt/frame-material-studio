# 验证记录

首轮日期：2026-10-29；补验日期：2026-10-30（Asia/Shanghai）。首轮实现、检查与整理约 50 分钟（约 11:25～12:15，含工具下载与依赖安装）。补验包含小屏操作、GitHub 托管 CI、真实 Docker/MySQL 联调和本机容器环境安装。

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

## 2026-10-30 补验结果

私有源码仓库：<https://github.com/enteriyt/frame-material-studio>。

首轮托管验收提交：`d83fde8f0923d951648c3eba0e7d090045da8ea5`。

真实运行链接：[GitHub Actions / Verify #1](https://github.com/enteriyt/frame-material-studio/actions/runs/40993619768)。三项作业均为 `success`：

| 作业 | 真实执行内容 | 结果 |
| --- | --- | --- |
| frontend | Ubuntu runner 安装锁定依赖，执行 lint、类型检查、5 项测试和生产构建 | 通过 |
| backend | Ubuntu runner 使用 JDK 21 执行 Maven verify、7 项测试与打包 | 通过 |
| compose-smoke | 构建前后端 Linux 镜像，启动 MySQL 8.4、Java、Next.js，等待健康检查，通过 HTTP 执行 `tools/smoke.py` | 通过 |

容器验收覆盖：MySQL 实际建表与模板种子、真实 PNG 上传、成功任务、三个指定阶段失败、结果文件字节一致、用户记录隔离。前端 Linux standalone 镜像也已实际构建和启动。本地 H2 测试与真实 MySQL 容器验收分别执行，结果均通过。

小屏使用 `tools/mobile-harness.html` 中的真实 iframe 页面，分别设置 320、375、390 像素框架宽度，检查列表、三图详情、历史页共 9 组布局，均无横向溢出。桌面滚动条占 15 像素，因此对应内容宽度为 305、360、375；每组的 `scrollWidth` 都等于 `clientWidth`，原始结果见 `screenshots/mobile-layout-results.json`。

375 像素下已通过键盘实际操作分类筛选、进入三图模板、逐张选择本地 PNG、移除图片后禁止提交、重新上传后恢复提交、调整模拟耗时、提交任务、后台成功以及历史结果查看。截图见 `mobile-375-filter.png`、`mobile-375-submitted.png`、`mobile-375-history.png`。这是浏览器小屏与键盘验收，未进行真实手机设备触控验收。

可复现小屏环境：先启动项目，再在源码根目录执行 `python -m http.server 8091 --bind 127.0.0.1 --directory tools`，打开 `http://localhost:8091/mobile-harness.html`。工具支持选择页面与宽度，以及重新载入当前页面。

## 本机容器环境状态

本机已安装 Docker Desktop 4.97.0、Docker CLI 29.9.2、Compose 5.6.1、WSL 2.7.14。WSL 离线安装包的微软签名为 Valid，SHA-256 与微软发布元数据一致。Windows 的 VirtualMachinePlatform 与 WSL 组件已启用，系统返回 3010，需重启生效；没有自动重启。本机 `docker compose config --quiet` 已通过。本机引擎运行仍待重启验收；项目的真实容器与 MySQL 流程已经在 GitHub 托管 Linux 环境验证通过。

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
