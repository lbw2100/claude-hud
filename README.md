# Claude Code HUD Plugin

实时状态栏插件，在 Claude Code 会话中显示关键运行信息。

```
[water] | 5h:3%(2h59m) wk:3%(6d4h) | session:12m | ctx:45%
```

## 功能

### 显示元素

| 元素 | 说明 |
|------|------|
| `[water]` | 插件标识 |
| `5h:3%(2h59m)` | 5 小时速率限制用量与剩余时间 |
| `wk:3%(6d4h)` | 每周速率限制用量与剩余时间 |
| `session:12m` | 当前会话持续时间 |
| `ctx:45%` | 上下文窗口使用率（绿/黄/红三色） |
| `branch:main` | 当前 Git 分支 |
| `agents:2` | 运行中的子代理数量 |
| `bg:3/5` | 后台任务槽位 |
| `todos:2/5` | Todo 完成进度 |
| `ralph:3/10` | Ralph Loop 迭代进度 |
| `skill:planner` | 最近激活的 Skill |
| `US-002` | 当前 PRD 用户故事 |
| `thinking` | 思考状态指示 |
| `calls:T12/A3/S2` | 工具/代理/技能调用计数 |

### 多行代理详情

当有子代理运行时，显示详细信息：

```
[water] | 5h:8% wk:2% | branch:main | ctx:67% | agents:3 | todos:2/5
├─ O architect    2m   analyzing architecture patterns...
├─ e explore     45s   searching for test files
└─ s executor     1m   implementing validation logic
```

### 颜色编码

- **绿色**：正常（ctx < 70%）
- **黄色**：警告（ctx 70-85%、ralph > 7）
- **红色**：危险（ctx > 85%、ralph 达到上限）

### 三种显示预设

| 预设 | 说明 |
|------|------|
| `minimal` | 仅显示核心信息 |
| `focused` | 默认，显示常用信息 |
| `full` | 显示所有信息含多行代理 |

## 安装

### 方式一：Claude Code Marketplace（推荐）

```bash
# 1. 添加插件仓库
/plugin marketplace add <github-repo-url>

# 2. 安装插件
/plugin install claude-code-hud-plugin

# 3. 重启 Claude Code
```

插件会自动完成：
- 编译 TypeScript 源码
- 创建 `~/.claude/hud/hud.mjs` 包装脚本
- 配置 `~/.claude/settings.json` 的 `statusLine`

### 方式二：本地安装

```bash
# 1. 克隆到本地
git clone <repo-url> ~/claude-code-hud-plugin
cd ~/claude-code-hud-plugin

# 2. 安装依赖并构建
npm install
```

然后在 Claude Code 会话中运行：

```
/plugin install ~/claude-code-hud-plugin
```

重启 Claude Code 即可。

### 验证安装

安装后在 Claude Code 中运行：

```
/claude-code-hud-plugin:hud status
```

## 配置

在 `~/.claude/settings.json` 中通过 `hud` 键配置：

```json
{
  "hud": {
    "preset": "focused",
    "elements": {
      "rateLimits": true,
      "contextBar": true,
      "agents": true,
      "todos": true,
      "gitBranch": true,
      "model": false
    },
    "thresholds": {
      "contextWarning": 70,
      "contextCritical": 85
    }
  }
}
```

### Skill 命令

| 命令 | 说明 |
|------|------|
| `/claude-code-hud-plugin:hud` | 查看状态，自动修复 |
| `/claude-code-hud-plugin:hud setup` | 安装/修复 HUD |
| `/claude-code-hud-plugin:hud minimal` | 切换到精简模式 |
| `/claude-code-hud-plugin:hud focused` | 切换到聚焦模式 |
| `/claude-code-hud-plugin:hud full` | 切换到完整模式 |

## 系统要求

- Node.js >= 18
- Claude Code（支持 `statusLine` 功能）

## 文件结构

```
~/.claude/
├── hud/
│   ├── hud.mjs                  # 包装脚本（自动生成）
│   ├── hud-config.json          # HUD 配置（可选）
│   └── projects/                # 按项目隔离的状态
├── settings.json                # statusLine 配置
└── plugins/cache/hud/
    └── claude-code-hud-plugin/  # 插件缓存
        └── <version>/
            ├── dist/            # 编译产物
            └── src/             # TypeScript 源码
```

## License

MIT
