## 方块战国 (Block States)

<h1 align="center">
  <img src="client/public/img/favicon.png" style="height: 90px;"alt="方块战国">
  <br>
  <img src="client/public/img/block-states-logo.png" style="height: 30px;"alt="方块战国">
</h1>

<h5 align="center">
<img src="block-states-pc.png" width="400" >

方块战国 PC 端演示

<img src="block-states-mobile.png" width="300" >

方块战国移动端演示

</h5>

什么是方块战国？

- 一款实时多人策略游戏，目标是占领敌方主将同时保护自己的主将
- 使用 React/Next.js/Socket/Express 技术栈

## 游戏玩法

你的目标是占领其他玩家的主将。

- 平原每 25 回合生产一个单位
- 城市和主将每回合生产一个单位
- 你每回合可以移动两次
- 当你占领敌方主将时，其所有领土归你所有，其军队数量减半后加入你的部队

| 功能               | 键盘操作        |
| ------------------ | --------------- |
| 移动               | WSAD            |
| 移动端操作         | 触摸拖拽        |
| 打开聊天           | Enter           |
| 撤销移动           | e               |
| 清空队列移动       | q               |
| 选择主将           | g               |
| 居中显示基地       | h               |
| 居中显示地图       | c               |
| 切换50%移动        | z               |
| 设置缩放级别       | 1 / 2 / 3       |
| 放大/缩小          | 鼠标滚轮        |
| 投降               | Escape          |

## 支持的功能

### 基础功能

- [x] 创建自定义地图
- [x] [游戏机器人](https://github.com/01MVP/BlockStates)
- [x] 游戏回放
- [x] 移动端支持（拖拽攻击）
- [x] 大厅 & 自定义游戏
- [x] 房间聊天
- [ ] 团队模式

### 游戏修饰符

- [x] 战争迷雾
- [x] 观战模式
- [x] 春秋战国模式（显示所有主将）
- [ ] 移动所有军队
- [ ] 可移动主将

## 开发

### 客户端：Next.js

首先，运行开发服务器：

```bash
cd client/
pnpm install
pnpm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

#### 数据库

我们使用 PostgreSQL + Prisma

- 查看 `.env.example` 来正确配置 Prisma 环境变量
- 如果你初始化仓库或编辑 Prisma schema，运行 `pnpx prisma migrate dev` 来确保更新数据库架构和 Prisma 客户端

```
npx prisma generate # 生成 Prisma 客户端代码
npx prisma migrate dev # 运行迁移
pnpm dlx prisma studio # 打开数据库 UI
```

### 服务端：Express + Socket.io


```bash
cd server/
pnpm install
pnpm dlx prisma migrate dev
pnpm run dev
```

#### Docker

- 本仓库的 Docker 镜像同时包含 server（Express + Socket.io）和 client（Next.js standalone）。容器启动时将自动启动两个进程：`dist/src/server.js`（监听 `SERVER_PORT`，默认 3001）和 Next.js standalone server（监听 3000）。
- 必需环境变量：
  - `DATABASE_URL`：PostgreSQL 连接串，根据部署环境自行配置。
  - `CLIENT_URL`：允许的前端域名（空格分隔，`*` 表示任意域名；默认 `*`）。
  - `SERVER_PORT`：后端监听端口（默认 3001）。
  - `NEXT_PUBLIC_SERVER_API`（构建时 / 运行时可同时传入）：前端访问后端的基础地址，默认 `http://127.0.0.1:3001`。
  - 可选 `RUN_DB_MIGRATIONS`：是否在启动时执行 `prisma migrate deploy`（默认 `true`）。

##### 本地构建镜像

```bash
# 在仓库根目录执行
docker build \
  -t blockstates:local \
  --build-arg NEXT_PUBLIC_SERVER_API="http://localhost:3001" \
  .
```

##### 本地运行

```bash
docker run --rm -p 3000:3000 -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
  -e CLIENT_URL="http://localhost:3000" \
  -e SERVER_PORT=3001 \
  blockstates:local
```

- 首次启动会自动运行 `prisma migrate deploy`。若不希望容器自动迁移，可额外传入 `-e RUN_DB_MIGRATIONS=false`。
- 若容器需要访问公司内网数据库，请确保宿主机网络策略允许容器访问目标地址。

##### 使用 GitHub Actions 构建的镜像

- GitHub Actions 会在推送到 `main` 分支时自动构建并推送到 GitHub Container Registry（`ghcr.io/<owner>/<repo>:<tag>`）。
- 必需的 GitHub Secrets：
  - `NEXT_PUBLIC_SERVER_API`（可选，用于覆盖默认的前端 API 地址）
- 手动拉取和运行：

```bash
# 假设仓库为 github.com/01MVP/BlockStates
docker pull ghcr.io/01mvp/blockstates:latest
docker run --rm -p 3000:3000 -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" \
  -e CLIENT_URL="https://your-domain.com" \
  -e SERVER_PORT=3001 \
  ghcr.io/01mvp/blockstates:latest
```

- 生产环境下建议将 `CLIENT_URL` 配置为具体站点域名，并通过反向代理（Nginx/Caddy 等）暴露 `3000`、`3001` 或将两个端口整合。
- 如果希望前端访问其他后端地址，可在运行时设置 `NEXT_PUBLIC_SERVER_API` 环境变量覆盖镜像构建时的默认值。

## 部署

- [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) 是 Node.js 应用的生产进程管理器，非常容易使用
- docker-compose：用于设置数据库

- 查看 Makefile 中的 `make deploy` 和 `make restart`
- 设置应用开机自启请参考：https://pm2.keymetrics.io/docs/usage/startup/

## [开发路线图](https://github.com/01MVP/BlockStates/projects)

## 加入我们

- QQ 群：374889821
- [Discord](https://discord.gg/p9BfpwBF)

## 许可证

基于 GNU GENERAL PUBLIC LICENSE VERSION 3 许可证发布。详情请参见 `LICENSE.txt`。
