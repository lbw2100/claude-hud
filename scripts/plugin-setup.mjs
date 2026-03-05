#!/usr/bin/env node
/**
 * HUD Plugin Post-Install Setup
 *
 * Configures HUD statusline when plugin is installed.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
const HUD_DIR = join(CLAUDE_DIR, 'hud');
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');

console.log('[HUD] Running post-install setup...');

// 0. Auto-build: if dist/ doesn't exist, install deps and compile TypeScript
const packageDir = join(__dirname, '..');
const distCheck = join(packageDir, 'dist', 'hud', 'index.js');
if (!existsSync(distCheck)) {
  console.log('[HUD] dist/ not found — building from source...');
  try {
    // Install dependencies (typescript, @types/node)
    const hasTsc = existsSync(join(packageDir, 'node_modules', '.bin', 'tsc'));
    if (!hasTsc) {
      console.log('[HUD] Installing build dependencies...');
      execSync('npm install --ignore-scripts', {
        cwd: packageDir,
        stdio: 'pipe',
        timeout: 120000,
      });
    }
    // Compile TypeScript
    console.log('[HUD] Compiling TypeScript...');
    execSync('npx tsc', {
      cwd: packageDir,
      stdio: 'pipe',
      timeout: 120000,
    });
    console.log('[HUD] Build complete.');
  } catch (e) {
    console.log('[HUD] Warning: Auto-build failed:', e.message);
    console.log('[HUD] Run manually: cd "' + packageDir + '" && npm install && npm run build');
  }
}

// 1. Create HUD directory
if (!existsSync(HUD_DIR)) {
  mkdirSync(HUD_DIR, { recursive: true });
}

// 2. Create HUD wrapper script
const hudScriptPath = join(HUD_DIR, 'hud.mjs').replace(/\\/g, '/');
const hudScript = `#!/usr/bin/env node
/**
 * HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Semantic version comparison: returns negative if a < b, positive if a > b, 0 if equal
function semverCompare(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  const aHasPre = /-/.test(a);
  const bHasPre = /-/.test(b);
  if (aHasPre && !bHasPre) return -1;
  if (!aHasPre && bHasPre) return 1;
  return 0;
}

async function main() {
  const home = homedir();

  // 1. Try plugin cache first (marketplace: hud, plugin: claude-code-hud-plugin)
  const configDir = process.env.CLAUDE_CONFIG_DIR || join(home, ".claude");

  // Check multiple possible plugin cache locations
  const pluginCacheBases = [
    join(configDir, "plugins", "cache", "hud", "claude-code-hud-plugin"),
    join(configDir, "plugins", "cache", "omc", "claude-code-hud-plugin"),
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

  // 2. Also try oh-my-claudecode plugin cache (backward compatibility)
  const omcCacheBase = join(configDir, "plugins", "cache", "omc", "oh-my-claudecode");
  if (existsSync(omcCacheBase)) {
    try {
      const versions = readdirSync(omcCacheBase);
      if (versions.length > 0) {
        const builtVersions = versions.filter(v => {
          const hudPath = join(omcCacheBase, v, "dist/hud/index.js");
          return existsSync(hudPath);
        });
        if (builtVersions.length > 0) {
          const latestBuilt = builtVersions.sort(semverCompare).reverse()[0];
          const pluginPath = join(omcCacheBase, latestBuilt, "dist/hud/index.js");
          await import(pathToFileURL(pluginPath).href);
          return;
        }
      }
    } catch { /* continue */ }
  }

  // 3. npm package (global or local install)
  try {
    await import("claude-code-hud-plugin/dist/hud/index.js");
    return;
  } catch { /* continue */ }

  // 4. Fallback
  console.log("[HUD] Plugin not found. Run setup to install properly.");
}

main();
`;

writeFileSync(hudScriptPath, hudScript);
try {
  chmodSync(hudScriptPath, 0o755);
} catch { /* Windows doesn't need this */ }
console.log('[HUD] Installed HUD wrapper script');

// 3. Configure settings.json
try {
  let settings = {};
  if (existsSync(SETTINGS_FILE)) {
    settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
  }

  // Use the absolute node binary path so nvm/fnm users don't get
  // "node not found" errors in non-interactive shells.
  const nodeBin = process.execPath || 'node';

  // Only update statusLine if not already configured or if it's our own
  const existingStatusLine = settings.statusLine;
  const isOurs = !existingStatusLine
    || (typeof existingStatusLine === 'string' && (existingStatusLine.includes('hud.mjs') || existingStatusLine.includes('omc-hud')))
    || (typeof existingStatusLine === 'object' && typeof existingStatusLine.command === 'string'
        && (existingStatusLine.command.includes('hud.mjs') || existingStatusLine.command.includes('omc-hud')));

  if (isOurs) {
    settings.statusLine = {
      type: 'command',
      command: `"${nodeBin}" "${hudScriptPath.replace(/\\/g, "/")}"`
    };
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('[HUD] Configured HUD statusLine in settings.json');
  } else {
    console.log('[HUD] statusLine owned by another tool, preserving (use manual edit to override)');
  }

  // Persist the node binary path to hud-config.json for use by hooks
  try {
    const configPath = join(CLAUDE_DIR, 'hud', 'hud-node-config.json');
    let hudNodeConfig = {};
    if (existsSync(configPath)) {
      hudNodeConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    }
    if (nodeBin !== 'node') {
      hudNodeConfig.nodeBinary = nodeBin;
      writeFileSync(configPath, JSON.stringify(hudNodeConfig, null, 2));
      console.log(`[HUD] Saved node binary path: ${nodeBin}`);
    }
  } catch (e) {
    console.log('[HUD] Warning: Could not save node binary path (non-fatal):', e.message);
  }
} catch (e) {
  console.log('[HUD] Warning: Could not configure settings.json:', e.message);
}

// 4. Patch hooks.json to use the absolute node binary path
try {
  const hooksJsonPath = join(__dirname, '..', 'hooks', 'hooks.json');
  if (existsSync(hooksJsonPath)) {
    const data = JSON.parse(readFileSync(hooksJsonPath, 'utf-8'));
    let patched = false;

    const runCjsPattern =
      /^node ("\\$\\{CLAUDE_PLUGIN_ROOT\\}\/scripts\/run\.cjs".*)$/;

    for (const groups of Object.values(data.hooks ?? {})) {
      for (const group of groups) {
        for (const hook of (group.hooks ?? [])) {
          if (typeof hook.command !== 'string') continue;
          const m1 = hook.command.match(runCjsPattern);
          if (m1) {
            const nodeBin = process.execPath || 'node';
            hook.command = `"${nodeBin}" ${m1[1]}`;
            patched = true;
          }
        }
      }
    }

    if (patched) {
      writeFileSync(hooksJsonPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`[HUD] Patched hooks.json with absolute node path`);
    }
  }
} catch (e) {
  console.log('[HUD] Warning: Could not patch hooks.json:', e.message);
}

// 5. Register in installed_plugins.json (enables skill discovery for manual installs)
try {
  const installedPluginsFile = join(CLAUDE_DIR, 'plugins', 'installed_plugins.json');
  let registry = { version: 2, plugins: {} };
  if (existsSync(installedPluginsFile)) {
    registry = JSON.parse(readFileSync(installedPluginsFile, 'utf-8'));
  }

  const pluginKey = 'claude-code-hud-plugin@local';
  const pkgJsonPath = join(packageDir, 'package.json');
  const pkgVersion = existsSync(pkgJsonPath)
    ? JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version || '1.0.0'
    : '1.0.0';
  const now = new Date().toISOString();

  // Only register if not already registered via marketplace
  const alreadyInstalled = Object.keys(registry.plugins || {}).some(
    k => k.startsWith('claude-code-hud-plugin@') && k !== pluginKey
  );

  if (!alreadyInstalled) {
    registry.plugins[pluginKey] = [
      {
        scope: 'user',
        installPath: packageDir,
        version: pkgVersion,
        installedAt: now,
        lastUpdated: now,
      }
    ];
    // Ensure plugins directory exists
    const pluginsDir = join(CLAUDE_DIR, 'plugins');
    if (!existsSync(pluginsDir)) {
      mkdirSync(pluginsDir, { recursive: true });
    }
    writeFileSync(installedPluginsFile, JSON.stringify(registry, null, 2));
    console.log('[HUD] Registered plugin in installed_plugins.json');
  } else {
    console.log('[HUD] Plugin already registered via marketplace, skipping local registration');
  }
} catch (e) {
  console.log('[HUD] Warning: Could not register plugin:', e.message);
}

console.log('[HUD] Setup complete! Restart Claude Code to activate HUD.');
