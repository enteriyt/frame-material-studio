# Frame · 素材制作工作室

Frame 提供模板浏览、图片上传、后台模拟制作和个人作品记录。Next.js 负责交互与请求转发，Java 负责校验、任务执行和 MySQL 持久化。模拟器在独立后台线程中依次执行素材检查、模拟生成、结果整理，生成结果为第一张输入图的独立文件副本。

## 一键运行

需要 Docker Engine 与 Docker Compose v2，首次构建需要访问镜像和依赖仓库。在项目根目录执行：

```sh
docker compose up --build
```

打开 http://localhost:3000 。MySQL 健康后启动 Java，Java 健康后启动前端。数据库结构与 4 个模板种子由 Spring SQL 初始化；种子可重复执行。上传图片和结果保存在 `assets` 数据卷，MySQL 使用 `mysql-data` 数据卷。

素材已经随源码提供，无需额外下载。`samples/sample-1.png` 至 `sample-3.png` 可以直接用于上传。

停止：`docker compose down`。保留数据卷即可再次恢复历史；开发环境重置可执行 `docker compose down -v`，该命令会删除本项目数据库和上传内容。

## 技术版本与结构

| 部分 | 版本 |
| --- | --- |
| Next.js / React | 15.5.28 / 19.3.1 |
| TypeScript / Node.js | 5.8.3 / 22 |
| pnpm | 11.25.0，锁文件格式 9 |
| Java / Maven | 21 / 3.9.9 |
| Spring Boot / MyBatis starter | 3.4.5 / 3.0.4 |
| MySQL | 8.4 |
| 前端测试 / 后端测试 | Vitest 3.2.4 / JUnit 5、Mockito、Spring Boot Test |

```text
frontend/src/app/          App Router：列表、详情制作、历史
frontend/src/components/ 身份与任务上下文、导航、任务卡片
frontend/src/lib/          API、类型、可取消的任务跟踪器及测试
backend/src/main/java/    API、MyBatis、存储、任务受理和后台执行
backend/src/main/resources/schema.sql / data.sql  建表、幂等模板种子
backend/src/main/resources/static/demo/           本地 SVG 模板封面
backend/src/test/          步骤顺序与失败中断测试、API 集成测试
samples/                  3 张可上传 PNG
tools/make_assets.py       使用 Python 标准库再生成全部演示素材
.github/workflows/ci.yml   push / pull_request 自动检查
compose.yaml              MySQL、Java、Next.js 三服务
```

## 本地开发与配置

原生开发需要 JDK 21、Maven 3.9+、Node.js 22、pnpm 11.25.0 和 MySQL 8.4。先创建空数据库 `studio`，授权数据库账号后，参考 `.env.example` 设置 Java 进程的环境变量。Spring 会执行 `schema.sql` 与 `data.sql`。

```sh
# 终端一
cd backend
mvn spring-boot:run

# 终端二
cd frontend
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Next.js 同源转发 `/api`、`/files`、`/demo` 至 Java；浏览器无需跨域访问数据库或 Java。原生开发默认上游 `http://localhost:8080`；容器构建固定为 `http://backend:8080`。`API_INTERNAL_URL` 是构建时配置，修改后重建前端。

| 变量 | 默认值 / 作用 |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/studio?serverTimezone=UTC` |
| `DB_USER` / `DB_PASSWORD` | `studio` / `studio-local`，仅供本地演示 |
| `STORAGE_DIR` | `./data`，Java 文件存储根目录；Compose 中为 `/data` |
| `ALLOWED_ORIGIN` | `http://localhost:3000`，Java CORS 允许来源 |
| `SIMULATION_ENABLED` | `true`，允许请求指定失败阶段和耗时 |
| `API_INTERNAL_URL` | `http://localhost:8080`，Next.js 构建时转发目标 |
| `STANDALONE` | `1` 时生成容器使用的 standalone 输出；原生构建使用普通输出 |

`.env.example` 是配置参考。Compose 使用 `compose.yaml` 中明确列出的环境变量；原生命令需自行导出变量，Java 不会自动读取根目录 `.env`。所有示例口令均为公开演示值。

## 演示流程

1. 在首页切换“旅行 / 人像 / 创意”分类，进入模板。每个模板要求 1、2 或 3 张图片。
2. 从 `samples/` 选择图片；可预览、替换和移除。客户端检查数量、MIME 和大小；Java 复核实际格式、解码、像素上限、5MB 限额、素材归属与数量。
3. 点击“开始制作”。接口先写入任务和素材关联，再投递到后台，返回 HTTP 202 与任务 ID。按钮恢复，可继续创建其他任务。
4. 打开“我的作品”，观察“素材检查 → 模拟生成 → 结果整理”，成功后点击图片预览。刷新页面会从 Java 恢复记录；关闭标签页不会取消后台任务。
5. 展开详情页“演示设置”，指定任一阶段失败，耗时选 5 秒或 10 秒后提交。失败任务保留失败阶段和原因，后续阶段不会执行。
6. 同时创建多份任务。线程池同时处理 2 份，剩余任务排队，各任务记录独立。
7. 点击右上角 `＋` 创建另一个演示用户，新用户历史为空；切回前一个用户可看到原有任务。
8. 验证查询异常：有任务处理中时停止 Java，等待下一次查询。页面保留上次任务状态，显示“状态查询暂时不可用”。恢复 Java 后点击“恢复查询”。服务重启中断的非终态任务属于下文说明的边界；也可以通过浏览器开发工具短暂阻止 `/api/tasks` 请求，在不中断 Java 的情况下完整演示查询恢复。

## 身份与个人记录

首次访问在浏览器通过 `crypto.getRandomValues` 创建 256 位随机 capability token，保存在 `localStorage`。每个演示用户拥有独立 token，支持在同一浏览器切换。请求在 `X-User-Token` 头携带 token；Java 保存其 SHA-256 摘要作为 owner，所有任务及上传素材查询检查 owner。

此方案适合本题的无外部身份服务演示。它以持有 token 作为身份依据；清除浏览器存储会失去原身份入口，不支持跨设备登录。页面中的用户名称仅为本地显示名。上传与结果通过随机 UUID 文件地址访问，链接持有者可以查看图片；若用于私密素材服务，应增加鉴权文件下载接口、HTTPS、正式账号与 token 生命周期管理。

## 数据、状态与异步边界

MySQL 包含 `templates`、`assets`、`tasks`、`task_assets`。任务表保存用户、模板快照标题、状态、阶段、模拟参数、结果、失败原因与 UTC 时间。历史按用户及创建时间倒序读取，最多返回最近 200 条。

状态：`QUEUED`（等待）、`RUNNING`（执行）、`SUCCEEDED`（完成）、`FAILED`（失败）。阶段：`WAITING`、`CHECK`、`GENERATE`、`FINALIZE`、`DONE`。失败时保留正在执行的阶段。

```text
请求校验 → 事务创建任务与素材关联 → 提交事务 → 投递有界线程池 → 返回任务
                                                 ↓
                     CHECK → GENERATE → FINALIZE → SUCCEEDED / DONE
                       └────────任一步失败────────→ FAILED / 当前阶段
```

`TaskService` 用 `TransactionTemplate` 在投递前完成提交，避免后台读取尚未提交的数据。`TaskWorker` 在每一步开始时单独写库，然后延迟并执行该步模拟。每一步是独立可查询边界；GET 接口始终只读取数据库。完成状态受到更新条件保护，不会被后续查询改回处理中。线程池使用 2 个线程、100 个等待位，队列拒绝会将已创建任务记为失败并记录原因。

客户端只有一个当前用户跟踪器，批量查询其历史：有未完成任务时每 1.5 秒查询一次；全部结束时停止；查询错误时暂停，允许手动恢复。不同任务按 ID 存储；替换刷新和销毁跟踪器时取消请求并递增代次，忽略迟到响应。用户切换会清空旧数据、销毁旧跟踪器并重建。上传、提交请求也在离开页面时取消，后端已受理的任务继续运行。

## API

业务错误统一返回 `{ "message": "可理解的原因" }`。身份格式错误返回 401；无记录或跨用户查询任务返回 404；校验错误返回 400；上传体过大返回 413。文件和模板封面可直接 GET。

| 方法与路径 | 请求 | 响应 |
| --- | --- | --- |
| `GET /api/health` | 无 | `{status:"ok"}`，进程存活探针 |
| `GET /api/templates?category=旅行` | category 可选 | Template 数组 |
| `GET /api/templates/{id}` | 模板 ID | Template 或 404 |
| `POST /api/assets` | 身份头；multipart `file` | 201，Asset |
| `POST /api/tasks` | 身份头；JSON，见下例 | 202，已持久化 Task |
| `GET /api/tasks` | 身份头 | 当前用户最近 200 条 Task |
| `GET /api/tasks/{id}` | 身份头 | 当前用户单个 Task |
| `GET /files/uploads/{uuid}.png` | 文件地址 | 持久化上传图片 |
| `GET /files/results/{uuid}.png` | 文件地址 | 持久化结果图片 |
| `GET /demo/{name}.svg` | 封面地址 | 本地模板封面 |

Template 字段：`id,title,category,description,coverUrl,requiredImageCount,acceptedMimeTypes,maxFileSizeBytes`。
Asset 字段：`id,ownerId,url,sizeBytes,mimeType,createdAt`。
Task 字段：`id,ownerId,templateId,templateTitle,status,stage,resultUrl,error,failStage,delayMs,createdAt,updatedAt`。可空字段在 JSON 中省略。

```json
{
  "templateId": "portrait",
  "assetIds": ["上传返回的 asset.id"],
  "failStage": "GENERATE",
  "delayMs": 1500
}
```

`failStage` 可省略或为 null，表示成功；允许值为 `CHECK / GENERATE / FINALIZE`。`delayMs` 是每步耗时，范围 100～15000，默认 1500。关闭模拟控制后可省略这两个字段使用默认成功流程；当前演示页面会显式发送耗时参数，因此展示演示页面时保持该配置开启。

接口演示（POSIX shell）：

```sh
TOKEN=$(openssl rand -hex 32)
curl -H "X-User-Token: $TOKEN" -F file=@samples/sample-1.png http://localhost:8080/api/assets
# 复制响应中的 id 后，将下方 ASSET_ID 替换成实际值
curl -H "X-User-Token: $TOKEN" -H 'Content-Type: application/json' \
  -d '{"templateId":"portrait","assetIds":["ASSET_ID"],"delayMs":1500}' \
  http://localhost:8080/api/tasks
curl -H "X-User-Token: $TOKEN" http://localhost:8080/api/tasks
```

## 构建与测试

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# 原生生产预览
pnpm start

cd ../backend
mvn -B verify
java -jar target/studio-1.0.0.jar
```

CI 在 push 和 pull_request 时运行前端 lint、类型检查、测试、生产构建，以及 Java 测试与打包。另一个 CI 作业执行 Compose 构建、等待服务健康，再通过 `python3 tools/smoke.py` 验证真实 MySQL 的完整链路。Java API 集成测试使用 H2 MySQL 模式便于隔离执行；正式运行使用 MySQL 驱动与 MySQL 数据库。H2 不能替代 MySQL 容器兼容性验证，具体本次执行结果见 `VALIDATION.md`。

前端测试覆盖：两个任务状态独立、全部终态停止轮询、请求错误保持任务状态并可恢复、旧用户迟到响应失效、较新的查询优先、连续受理多个任务不覆盖。后端测试覆盖：三个步骤顺序、每一阶段失败中断、终态不重复执行、素材缺失、真实图片上传、跨用户隔离、数量与格式校验、任务在无查询情况下独立完成、结果文件可读取。

## 完成情况与取舍

已提供前后端、MySQL 配置、模板接口、上传校验、持久化异步步骤、可控模拟、独立任务状态、请求异常恢复、刷新恢复、演示身份、响应式页面、关键测试、CI 及 Compose。已执行的检查与尚未运行的环境检查分别记录在 `VALIDATION.md`；容器配置、真实 MySQL 链路及小屏操作仍需按该文件完成验收。

已知边界集中如下：

- 队列仅保存在单实例进程内，服务异常退出后，数据库保留任务与已完成结果，但原来的 QUEUED / RUNNING 任务不会自动续跑。没有跨进程调度或启动恢复；页面刷新恢复与服务重启恢复是两种不同情况。
- 受理接口没有幂等键。若提交响应丢失，先查看历史再重新提交；前端仅阻止同一次提交的重复点击。
- 本地演示采用随机 token 身份、公开 UUID 文件地址；未实现生产账号、配额、孤立素材清理、素材删除、分页、自动重试和重启续跑。
- 模拟生成器以输入图副本作为结果，不执行图像风格转换。三个阶段和结果保存均由 Java 执行。
- 200 条历史上限意味着更早的任务不会在前端继续跟踪，适用于小规模演示。大规模使用应将活跃任务查询与分页历史分开。
- 数据库结构采用启动建表，适合初始部署；后续表结构升级应引入 Flyway 或 Liquibase 迁移脚本。

## 部署与回滚

1. 保存当前源码版本或压缩包，备份 MySQL 和 `assets` 卷；部署环境使用独立口令并限制 8080 端口访问。
2. 执行 `docker compose build`，再执行 `docker compose up -d`。
3. 检查 `docker compose ps` 与 `docker compose logs backend`，访问首页，上传示例图片并确认历史中得到结果。
4. 回滚时恢复上一个源码包并重新构建启动；如涉及结构升级，同时恢复兼容数据库备份。当前版本不包含表结构升级操作。
5. 停机前等待活动任务完成，保留 MySQL 与文件卷。容器收到关闭信号时最多等待后台任务 30 秒；超长任务仍可能被中断。

## 设计取舍与工具使用

本项目使用 AI 编程工具辅助需求拆解、代码实现、测试补充和问题排查。工作流为：按 R-01～R-14 整理验收点，将技术栈、接口字段、状态机与文件结构作为上下文，分模块生成或修改代码，再通过 lint、类型检查、单元测试、接口联调及浏览器操作验证结果。依据实际日志修正问题，保留已验证范围和已知限制。

主要设计取舍：Java 负责事务受理和后台执行，MySQL 保存业务状态；两线程有界队列控制并发；前端采用可取消轮询与请求代次保护；演示身份使用随机 token，减少外部身份服务依赖。以上方案以业务闭环、可观察性和易于验收为优先。

一个具体例子是任务查询异常处理：保留服务端已知任务状态，将请求错误单独展示，并用测试验证旧请求迟到时不能覆盖新结果。另一个修正是根据构建提示更新 Next.js 版本，并解决严格依赖布局下的 ESLint 插件解析问题。

## 素材来源与实际投入

页面、Java/TypeScript 业务代码、本地 SVG 与 PNG 演示素材均在本次任务中创建。SVG 与 PNG 生成脚本为 `tools/make_assets.py`；未复用第三方业务脚手架、品牌素材或付费服务。依赖框架来源为 Next.js、React、Spring Boot、MyBatis 等官方发行包，版本由 package.json、pnpm-lock.yaml、pom.xml 固定。Next.js 更新依据：[官方安全公告](https://github.com/vercel/next.js/security/advisories)。

实现与验证的时间记录、本机检查结果见 `VALIDATION.md`。
