---
name: hud
description: Configure HUD display options (layout, presets, display elements)
role: config-writer
scope: ~/.claude/**
---

# HUD Skill

Configure the HUD (Heads-Up Display) statusline for Claude Code.

Note: All `~/.claude/...` paths in this guide respect `CLAUDE_CONFIG_DIR` when that environment variable is set.

## Quick Commands

| Command | Description |
|---------|-------------|
| `/claude-code-hud-plugin:hud` | Show current HUD status (auto-setup if needed) |
| `/claude-code-hud-plugin:hud setup` | Install/repair HUD statusline |
| `/claude-code-hud-plugin:hud minimal` | Switch to minimal display |
| `/claude-code-hud-plugin:hud focused` | Switch to focused display (default) |
| `/claude-code-hud-plugin:hud full` | Switch to full display |
| `/claude-code-hud-plugin:hud status` | Show detailed HUD status |

## Auto-Setup

When you run `/claude-code-hud-plugin:hud` or `/claude-code-hud-plugin:hud setup`, the system will automatically:
1. Check if `~/.claude/hud/hud.mjs` exists
2. Check if `statusLine` is configured in `~/.claude/settings.json`
3. If missing, create the HUD wrapper script and configure settings
4. Report status and prompt to restart Claude Code if changes were made

**IMPORTANT**: If the argument is `setup` OR if the HUD script doesn't exist at `~/.claude/hud/hud.mjs`, you MUST create the HUD files directly using the instructions below.

### Setup Instructions (Run These Commands)

**Step 1:** Check if setup is needed:
```bash
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude');console.log(f.existsSync(p.join(d,'hud','hud.mjs'))?'EXISTS':'MISSING')"
```

**Step 2:** Verify the plugin is installed:
```bash
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude'),b=p.join(d,'plugins','cache','hud','claude-code-hud-plugin');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(v.length===0){console.log('Plugin not installed');process.exit()}const l=v[v.length-1],h=p.join(b,l,'dist','hud','index.js');console.log('Version:',l);console.log(f.existsSync(h)?'READY':'NOT_FOUND - try reinstalling')}catch{console.log('Plugin not installed')}"
```

**Step 3:** If hud.mjs is MISSING or argument is `setup`, create the HUD directory and script:

First, create the directory:
```bash
node -e "require('fs').mkdirSync(require('path').join(process.env.CLAUDE_CONFIG_DIR||require('path').join(require('os').homedir(),'.claude'),'hud'),{recursive:true})"
```

Then, use the Write tool to create `~/.claude/hud/hud.mjs` with this exact content:

```javascript
#!/usr/bin/env node
/**
 * HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function semverCompare(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

async function main() {
  const home = homedir();
  const configDir = process.env.CLAUDE_CONFIG_DIR || join(home, ".claude");

  // Check multiple possible plugin cache locations
  const pluginCacheBases = [
    join(configDir, "plugins", "cache", "hud", "claude-code-hud-plugin"),
    join(configDir, "plugins", "cache", "omc", "claude-code-hud-plugin"),
    join(configDir, "plugins", "cache", "omc", "oh-my-claudecode"),
  ];

  for (const pluginCacheBase of pluginCacheBases) {
    if (existsSync(pluginCacheBase)) {
      try {
        const versions = readdirSync(pluginCacheBase);
        if (versions.length > 0) {
          const builtVersions = versions.filter(v => {
            const hudPath = join(pluginCacheBase, v, "dist/hud/index.js");
            return existsSync(hudPath);
          });
          if (builtVersions.length > 0) {
            const latestBuilt = builtVersions.sort(semverCompare).reverse()[0];
            const pluginPath = join(pluginCacheBase, latestBuilt, "dist/hud/index.js");
            await import(pathToFileURL(pluginPath).href);
            return;
          }
        }
      } catch { /* continue */ }
    }
  }

  // npm package fallback
  try {
    await import("claude-code-hud-plugin/dist/hud/index.js");
    return;
  } catch { /* continue */ }

  console.log("[HUD] Plugin not found. Run /claude-code-hud-plugin:hud setup");
}

main();
```

**Step 4:** Make it executable (Unix only, skip on Windows):
```bash
node -e "if(process.platform==='win32'){console.log('Skipped (Windows)')}else{require('fs').chmodSync(require('path').join(process.env.CLAUDE_CONFIG_DIR||require('path').join(require('os').homedir(),'.claude'),'hud','hud.mjs'),0o755);console.log('Done')}"
```

**Step 5:** Update settings.json to use the HUD:

Read `~/.claude/settings.json`, then update/add the `statusLine` field.

**IMPORTANT:** The command must use an absolute path, not `~`, because Windows does not expand `~` in shell commands.

First, determine the correct path:
```bash
node -e "const p=require('path').join(require('os').homedir(),'.claude','hud','hud.mjs').split(require('path').sep).join('/');console.log(JSON.stringify(p))"
```

**IMPORTANT:** The command path MUST use forward slashes on all platforms. Claude Code executes statusLine commands via bash, which interprets backslashes as escape characters and breaks the path.

Then set the `statusLine` field using the resolved path. On Unix it will look like:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/username/.claude/hud/hud.mjs"
  }
}
```

On Windows the path uses forward slashes (not backslashes):
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/username/.claude/hud/hud.mjs"
  }
}
```

Use the Edit tool to add/update this field while preserving other settings.

**Step 6:** Tell the user to restart Claude Code for changes to take effect.

## Display Presets

### Minimal
Shows only the essentials:
```
[water] ralph | ultrawork | todos:2/5
```

### Focused (Default)
Shows all relevant elements:
```
[water] branch:main | ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | bg:3/5 | todos:2/5
```

### Full
Shows everything including multi-line agent details:
```
[water] repo:project branch:main | ralph:3/10 | US-002 (2/5) | ultrawork | ctx:[████░░]67% | agents:3 | bg:3/5 | todos:2/5
├─ O architect    2m   analyzing architecture patterns...
├─ e explore     45s   searching for test files
└─ s executor     1m   implementing validation logic
```

## Multi-Line Agent Display

When agents are running, the HUD shows detailed information on separate lines:
- **Tree characters** (`├─`, `└─`) show visual hierarchy
- **Agent code** (O, e, s) indicates agent type with model tier color
- **Duration** shows how long each agent has been running
- **Description** shows what each agent is doing (up to 45 chars)

## Display Elements

| Element | Description |
|---------|-------------|
| `[water]` | Mode identifier |
| `repo:name` | Git repository name (cyan) |
| `branch:name` | Git branch name (cyan) |
| `ralph:3/10` | Ralph loop iteration/max |
| `US-002` | Current PRD story ID |
| `ultrawork` | Active mode badge |
| `skill:name` | Last activated skill (cyan) |
| `ctx:67%` | Context window usage |
| `agents:2` | Running subagent count |
| `bg:3/5` | Background task slots |
| `todos:2/5` | Todo completion |

## Color Coding

- **Green**: Normal/healthy
- **Yellow**: Warning (context >70%, ralph >7)
- **Red**: Critical (context >85%, ralph at max)

## Configuration Location

HUD config is stored at: `~/.claude/hud/hud-config.json`

## Manual Configuration

You can manually edit the config file. Each option can be set individually - any unset values will use defaults.

```json
{
  "preset": "focused",
  "elements": {
    "omcLabel": true,
    "ralph": true,
    "prdStory": true,
    "activeSkills": true,
    "lastSkill": true,
    "contextBar": true,
    "agents": true,
    "backgroundTasks": true,
    "todos": true,
    "showCache": true,
    "showCost": true,
    "maxOutputLines": 4
  },
  "thresholds": {
    "contextWarning": 70,
    "contextCritical": 85,
    "ralphWarning": 7
  }
}
```

## Troubleshooting

If the HUD is not showing:
1. Run `/claude-code-hud-plugin:hud setup` to auto-install and configure
2. Restart Claude Code after setup completes
3. Verify settings.json has the statusLine configured

**Legacy string format migration:** Older versions wrote `statusLine` as a plain string. Modern Claude Code (v2.1+) requires an object format. Running setup will auto-migrate legacy strings to the correct object format:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/username/.claude/hud/hud.mjs"
  }
}
```

**Node 24+ compatibility:** The HUD wrapper script imports `homedir` from `node:os` (not `node:path`). If you encounter `SyntaxError: The requested module 'path' does not provide an export named 'homedir'`, re-run setup to regenerate `hud.mjs`.

Manual verification:
- HUD script: `~/.claude/hud/hud.mjs`
- Settings: `~/.claude/settings.json` should have `statusLine` configured as an object with `type` and `command` fields

---

*The HUD updates automatically every ~300ms during active sessions.*
