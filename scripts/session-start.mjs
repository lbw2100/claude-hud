#!/usr/bin/env node

/**
 * HUD Session Start Hook
 * Checks HUD installation health when Claude Code session starts
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Claude config directory (respects CLAUDE_CONFIG_DIR env var) */
const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');

// Import timeout-protected stdin reader
let readStdin;
try {
  const mod = await import(pathToFileURL(join(__dirname, 'lib', 'stdin.mjs')).href);
  readStdin = mod.readStdin;
} catch {
  // Fallback: inline timeout-protected readStdin if lib module is missing
  readStdin = (timeoutMs = 5000) => new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) { settled = true; process.stdin.removeAllListeners(); process.stdin.destroy(); resolve(Buffer.concat(chunks).toString('utf-8')); }
    }, timeoutMs);
    process.stdin.on('data', (chunk) => { chunks.push(chunk); });
    process.stdin.on('end', () => { if (!settled) { settled = true; clearTimeout(timeout); resolve(Buffer.concat(chunks).toString('utf-8')); } });
    process.stdin.on('error', () => { if (!settled) { settled = true; clearTimeout(timeout); resolve(''); } });
    if (process.stdin.readableEnded) { if (!settled) { settled = true; clearTimeout(timeout); resolve(Buffer.concat(chunks).toString('utf-8')); } }
  });
}

// Check if HUD is properly installed (with retry for race conditions)
async function checkHudInstallation(retryCount = 0) {
  const hudDir = join(configDir, 'hud');
  const hudScript = join(hudDir, 'hud.mjs');
  const settingsFile = join(configDir, 'settings.json');

  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 100;

  // Check if HUD script exists
  if (!existsSync(hudScript)) {
    return { installed: false, reason: 'HUD script missing' };
  }

  // Check if statusLine is configured (with retry for race conditions)
  try {
    if (existsSync(settingsFile)) {
      const content = readFileSync(settingsFile, 'utf-8');
      if (!content || !content.trim()) {
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkHudInstallation(retryCount + 1);
        }
        return { installed: false, reason: 'settings.json empty (possible race condition)' };
      }
      const settings = JSON.parse(content);
      if (!settings.statusLine) {
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return checkHudInstallation(retryCount + 1);
        }
        return { installed: false, reason: 'statusLine not configured' };
      }
    } else {
      return { installed: false, reason: 'settings.json missing' };
    }
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return checkHudInstallation(retryCount + 1);
    }
    return { installed: false, reason: 'Could not read settings' };
  }

  return { installed: true };
}

// Main
async function main() {
  try {
    const input = await readStdin();
    const messages = [];

    // Check HUD installation
    const hudCheck = await checkHudInstallation();
    if (!hudCheck.installed) {
      messages.push(`<system-reminder>
[HUD] HUD not configured (${hudCheck.reason}). Run /claude-code-hud-plugin:hud setup then restart Claude Code.
</system-reminder>`);
    }

    if (messages.length > 0) {
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: messages.join('\n')
        }
      }));
    } else {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    }
  } catch (error) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  }
}

main();
