import { readFileSync } from 'fs';
/**
 * Check if running inside WSL (Windows Subsystem for Linux).
 * Checks WSLENV env var OR /proc/version containing "microsoft".
 */
export function isWSL() {
    if (process.env.WSLENV !== undefined) {
        return true;
    }
    try {
        const procVersion = readFileSync('/proc/version', 'utf8');
        return procVersion.toLowerCase().includes('microsoft');
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=index.js.map