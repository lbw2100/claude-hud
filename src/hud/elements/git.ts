/**
 * HUD - Git Elements
 *
 * Renders git repository name and branch information.
 */

import { execSync } from 'node:child_process';
import { dim, cyan } from '../colors.js';

/**
 * Get git repository name from remote URL.
 * Extracts the repo name from URLs like:
 * - https://github.com/user/repo.git
 * - git@github.com:user/repo.git
 *
 * @param cwd - Working directory to run git command in
 * @returns Repository name or null if not available
 */
export function getGitRepoName(cwd?: string): string | null {
  try {
    const url = execSync('git remote get-url origin', {
      cwd,
      encoding: 'utf-8',
      timeout: 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
    }).trim();

    if (!url) return null;

    // Extract repo name from URL
    // Handles: https://github.com/user/repo.git, git@github.com:user/repo.git
    const match = url.match(/\/([^/]+?)(?:\.git)?$/) || url.match(/:([^/]+?)(?:\.git)?$/);
    return match ? match[1].replace(/\.git$/, '') : null;
  } catch {
    return null;
  }
}

/**
 * Get current git branch name.
 *
 * @param cwd - Working directory to run git command in
 * @returns Branch name or null if not available
 */
export function getGitBranch(cwd?: string): string | null {
  try {
    const branch = execSync('git branch --show-current', {
      cwd,
      encoding: 'utf-8',
      timeout: 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
    }).trim();

    return branch || null;
  } catch {
    return null;
  }
}

/**
 * Check if the working tree has uncommitted changes.
 */
export function getGitDirty(cwd?: string): boolean {
  try {
    const result = execSync('git --no-optional-locks status --porcelain', {
      cwd, encoding: 'utf-8', timeout: 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
    }).trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get ahead/behind counts relative to upstream.
 * Returns null if no upstream is configured.
 */
export function getGitAheadBehind(cwd?: string): { ahead: number; behind: number } | null {
  try {
    const result = execSync('git rev-list --count --left-right @{upstream}...HEAD', {
      cwd, encoding: 'utf-8', timeout: 1000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
    }).trim();
    const parts = result.split('\t');
    if (parts.length !== 2) return null;
    return { behind: parseInt(parts[0], 10) || 0, ahead: parseInt(parts[1], 10) || 0 };
  } catch {
    return null;
  }
}

/**
 * Render git repository name element.
 *
 * @param cwd - Working directory
 * @returns Formatted repo name or null
 */
export function renderGitRepo(cwd?: string): string | null {
  const repo = getGitRepoName(cwd);
  if (!repo) return null;
  return `${dim('repo:')}${cyan(repo)}`;
}

/**
 * Render git branch element with dirty indicator and ahead/behind counts.
 *
 * Format: branch:main* ↑2 ↓1
 *
 * @param cwd - Working directory
 * @returns Formatted branch name or null
 */
export function renderGitBranch(cwd?: string): string | null {
  const branch = getGitBranch(cwd);
  if (!branch) return null;

  const dirty = getGitDirty(cwd);
  const aheadBehind = getGitAheadBehind(cwd);

  const branchDisplay = dirty ? `${branch}*` : branch;
  let result = `${dim('branch:')}${cyan(branchDisplay)}`;

  if (aheadBehind) {
    const indicators: string[] = [];
    if (aheadBehind.ahead > 0) indicators.push(`↑${aheadBehind.ahead}`);
    if (aheadBehind.behind > 0) indicators.push(`↓${aheadBehind.behind}`);
    if (indicators.length > 0) result += ` ${dim(indicators.join(' '))}`;
  }

  return result;
}
