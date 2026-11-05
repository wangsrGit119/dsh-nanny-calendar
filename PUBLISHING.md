# 把 dsh-nanny-calendar 发布到 DSH 插件市场

> 本文件记录本次发布实际做了什么、还差什么，以及以后更新版本的步骤。

## 一、市场是怎么收录插件的（结论）

1. **列表来源**：市场（`dshmarket`）的目录来自精选仓库
   [`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)，
   不是 dshmarket 自己的仓库。
2. **上架唯一入口**：给那个仓库提 PR，**只新增一个文件**
   `data/plugins/<owner>__<repo>.yml`。两个 README 由脚本从这些 yml 生成，**不要手改**。
3. **硬性门槛**（CI 自动检查，按顺序）：
   | 检查 | 要求 |
   | --- | --- |
   | 条目数 | 一个 PR 最多 3 条 |
   | `dsh.bundle` | 仓库 `package.json` 必须声明（只有 `dsh.client` 不可安装，会被拒） |
   | 仓库年龄 | 创建满 1 天（**刚建的仓库会被这条挡住，等几小时或次日重跑即可**） |
   | `awesome-lint` + 站点构建 | 双语、分隔符、日期、截图等格式 |
4. **另外要求**：仓库里有真实可用的代码；加 `dsh-plugin` topic；描述只写功能、不带营销词，且必须与代码相符。

## 二、本次已完成的部分

### 1. 仓库与代码

- 仓库：<https://github.com/wangsrGit119/dsh-nanny-calendar>（公开，main 分支）
- 首次提交 `9794781`：插件全部源码（client.js / index.js / cordis.patch.yml / locale / icon.svg / README）
- 第二次提交 `8b71b70`：README 补充安装命令与资源说明
- topic 已加：`dsh-plugin`、`deepseek-harness`、`calendar`、`nanny`

### 2. `package.json` 为发布做的调整

- 删掉 `"private": true`（否则 `npm publish` 直接拒绝）。
- 补 `keywords`、`repository`、`homepage`、`bugs`、`author`。
- `engines.dsh` 写成
  `">=0.2.1-rc.1 <0.3.0-0 || >=0.2.2-rc.1 <0.3.0-0"`。
  **为什么要 `||`**：node-semver 的预发布规则下，`>=0.2.1-rc.1` 匹配不到 `0.2.2-rc.1`
  （本机 DSH 核心包正是 0.2.2-rc.1）。只有把带预发布标签的比较符放到同一条 `major.minor.patch`
  上，预发布版才会被放行。
- `dsh.bundle.patch` 指向 `cordis.patch.yml`，`dsh.client` 声明 `platform: web`。

### 3. 市场展示素材

- `assets/icon-180.png`：180×180 卡片图标（蓝紫渐变 + 日历 + 红/绿/金三色圆点，对应休假/上户/工资）。
- `assets/screenshot-1.png`：真机截图（DSH 桌面端面板，123 KB）。
- `screenshots.json`：声明 `["assets/screenshot-1.png"]`。
  放在**自己仓库**的 `package.json` 旁，路径相对该文件，之后换图直接推自己的仓库即可，不用再提 PR。
  （市场也接受绝对 URL，但必须是 GitHub 托管的 https，第三方图床会被拒。）

### 4. 提交的市场条目

文件：`data/plugins/wangsrGit119__dsh-nanny-calendar.yml`

```yaml
url: https://github.com/wangsrGit119/dsh-nanny-calendar
name: wangsrGit119/dsh-nanny-calendar
category: ui
description:
  en: 'Sidebar calendar board for tracking a nanny or caregiver: onboarding and offboarding dates, leave days and salary payouts, with per-month and all-time totals and automatic payday markers on a 30-day cycle.'
  zh: '育儿嫂日历看板：记录上户、下户、休假与工资发放，按月汇总，并统计从首次上户到今天的累计在岗与休假天数，同时按 30 天周期在日历上自动标出发薪日。'
icon: https://raw.githubusercontent.com/wangsrGit119/dsh-nanny-calendar/main/assets/icon-180.png
```

要点：描述里含 `: `（冒号+空格）必须整行加引号，否则 YAML 会当成嵌套键。
分类选 `ui`（插件做的事是给侧边栏加一个面板）；分类选偏了维护者会直接改，不会打回。

- Fork：`wangsrGit119/awesome-dsh-plugin`
- 分支：`add-wangsrGit119-dsh-nanny-calendar`
- **PR #12221**：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/12221>

## 三、状态（截至 2026-11-05 15:20）

两个 CI 检查，一绿一红，红的那条是**唯一且预期内**的原因：

| 检查 | 结论 | 说明 |
| --- | --- | --- |
| `check`（PR check 工作流） | ✅ `success` | 15 步全过：stale-fork guard、文件名/目录、README 一致性、awesome-lint、added-date / capability-disclosure / discussion-adoption / entry-path 四组回归测试、`node scripts/build-site.mjs`（8880 条目 × 2 语言，站点构建成功） |
| `Submission gate` | ❌ `failure` | 原文：`repository is 0.0 days old (needs 1) — nothing to do: this check re-runs by itself and should clear in about 24h. No need to resubmit, push, or close and reopen; the age bar is the only thing failing here.` |

即：**除了「仓库满 1 天」这条，其它全部通过**。这条不需要做任何事——
gate 的结论是快照，会自动重跑，约 24 小时后自己变绿。

**PR 状态**：`open`、只改了 1 个文件（`+7/-0`）、无冲突、无 `held: author` 标签。

| 事项 | 状态 | 说明 |
| --- | --- | --- |
| 仓库年龄门槛 | **等 ~24 小时自动放行** | 不用推空提交、不用重开 PR |
| PR 合并 | 等维护者 | 绿了之后进合并队列，合并后站点自动重建，条目出现在 `ui` 分类 |
| npm 发布 | **未做** | `npm whoami` 仍返回 E401，本地 token 已失效，需要先 `npm login` |
| 下载量展示 | 依赖 npm | 不发 npm 不影响收录，只是市场没有下载数字 |

### npm 发布（可选，做了体验更好）

```sh
cd D:\dsh-workspace\dsh-nanny-calendar
npm login --registry=https://registry.npmjs.org     # 需要交互输入，token 已失效必须重登
npm publish --registry=https://registry.npmjs.org  # 包名 dsh-nanny-calendar 未被占用
```

发布 npm 的两个好处：市场能显示下载量；用户安装时走预构建包，免掉 `allowBuilds` 构建授权。
`repository` 字段已指回被收录的仓库，所以两者会自动关联，**不需要**在 yml 里加任何 `npm:` 字段
（手写会被校验拒绝）。

不发 npm 的替代方案：把 `npm pack` 产出的 `.tgz` 挂到 GitHub Release，在 yml 里加
`tarball: https://github.com/wangsrGit119/dsh-nanny-calendar/releases/latest/download/dsh-nanny-calendar.tgz`
（`latest/download/` 只解析 `latest`，文件名照字面取——**文件名不能带版本号**，否则下次发版就 404）。

## 四、用户怎么装

```sh
dsh plugin add github:wangsrGit119/dsh-nanny-calendar
```

## 五、以后发新版本

1. 改代码，`npm version patch`（或手改 `package.json` 的 version）。
2. `git push`。
3. 如果发了 npm：`npm publish`；没发 npm 就在 GitHub 上打个 Release（tag 用 `v1.2.3`）。
4. 市场不需要改动——条目指向仓库，安装时拉最新；截图推自己仓库即生效。
   只有**描述/分类/图标**变了才需要再来提 PR（仍然只改自己那一个 yml）。

## 六、踩过的坑（值得记）

- `git push` 到 GitHub 间歇性 `Connection was reset` / 连不上 443，重试 4 次才成功；
  最后 README 那次改动改用 GitHub Contents API 提交，绕过 git 传输。
- `awesome-dsh-plugin` 的 `data/screenshots.json` 是**旧条目**的截图登记处，已冻结，**不要再往里面加键**；
  新条目一律在自己仓库放 `screenshots.json`。
- 本机 `dsh` CLI 是 0.1.0-rc.5，比核心包 0.2.2-rc.1 旧；`dsh plugin` 子命令会初始化一个无关 profile，
  别用它来验证安装。
