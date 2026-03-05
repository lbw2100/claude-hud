/**
 * HUD - Git Elements
 *
 * Renders git repository name and branch information.
 */
/**
 * Get git repository name from remote URL.
 * Extracts the repo name from URLs like:
 * - https://github.com/user/repo.git
 * - git@github.com:user/repo.git
 *
 * @param cwd - Working directory to run git command in
 * @returns Repository name or null if not available
 */
export declare function getGitRepoName(cwd?: string): string | null;
/**
 * Get current git branch name.
 *
 * @param cwd - Working directory to run git command in
 * @returns Branch name or null if not available
 */
export declare function getGitBranch(cwd?: string): string | null;
/**
 * Check if the working tree has uncommitted changes.
 */
export declare function getGitDirty(cwd?: string): boolean;
/**
 * Get ahead/behind counts relative to upstream.
 * Returns null if no upstream is configured.
 */
export declare function getGitAheadBehind(cwd?: string): {
    ahead: number;
    behind: number;
} | null;
/**
 * Render git repository name element.
 *
 * @param cwd - Working directory
 * @returns Formatted repo name or null
 */
export declare function renderGitRepo(cwd?: string): string | null;
/**
 * Render git branch element with dirty indicator and ahead/behind counts.
 *
 * Format: branch:main* ↑2 ↓1
 *
 * @param cwd - Working directory
 * @returns Formatted branch name or null
 */
export declare function renderGitBranch(cwd?: string): string | null;
//# sourceMappingURL=git.d.ts.map