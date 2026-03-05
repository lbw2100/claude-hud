/**
 * Compare semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a, b) {
    // Remove 'v' prefix if present
    const cleanA = a.replace(/^v/, '');
    const cleanB = b.replace(/^v/, '');
    const partsA = cleanA.split('.').map(n => parseInt(n, 10) || 0);
    const partsB = cleanB.split('.').map(n => parseInt(n, 10) || 0);
    const maxLength = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < maxLength; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA < numB)
            return -1;
        if (numA > numB)
            return 1;
    }
    return 0;
}
//# sourceMappingURL=auto-update.js.map