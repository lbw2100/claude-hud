/**
 * HUD - Rate Limits Element
 *
 * Renders 5-hour and weekly rate limit usage display (built-in providers),
 * and custom rate limit buckets from the rateLimitsProvider command.
 */

import type { RateLimits, CustomProviderResult, CustomBucketUsage, UsageResult } from '../types.js';
import { RESET, getQuotaColor, quotaBar } from '../colors.js';

const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

/**
 * Format reset time as human-readable duration.
 * Returns null if date is null/undefined or in the past.
 */
function formatResetTime(date: Date | null | undefined): string | null {
  if (!date) return null;

  const now = Date.now();
  const resetMs = date.getTime();
  const diffMs = resetMs - now;

  // Already reset or invalid
  if (diffMs <= 0) return null;

  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return `${diffDays}d${remainingHours}h`;
  }

  const remainingMinutes = diffMinutes % 60;
  return `${diffHours}h${remainingMinutes}m`;
}

/**
 * Render rate limits display.
 * sevenDayThreshold: only show weekly bar when usage >= this value (default 80%).
 *
 * Format: 5h:45%(3h42m) wk:12%(2d5h) | ⚠ Limit reached (3h 15m)
 */
export function renderRateLimits(limits: RateLimits | null, sevenDayThreshold = 80): string | null {
  if (!limits) return null;

  const fiveHour = Math.min(100, Math.max(0, Math.round(limits.fiveHourPercent)));

  if (fiveHour >= 100) {
    const reset = formatResetTime(limits.fiveHourResetsAt);
    return `${RED}⚠ Limit reached${reset ? ` (${reset})` : ''}${RESET}`;
  }

  const fiveHourColor = getQuotaColor(fiveHour);
  const fiveHourReset = formatResetTime(limits.fiveHourResetsAt);
  const fiveHourPart = fiveHourReset
    ? `5h:${fiveHourColor}${fiveHour}%${RESET}${DIM}(${fiveHourReset})${RESET}`
    : `5h:${fiveHourColor}${fiveHour}%${RESET}`;

  const parts = [fiveHourPart];

  if (limits.weeklyPercent != null) {
    const weekly = Math.min(100, Math.max(0, Math.round(limits.weeklyPercent)));
    if (weekly >= 100) {
      const reset = formatResetTime(limits.weeklyResetsAt);
      parts.push(`${RED}⚠ wk limit${reset ? ` (${reset})` : ''}${RESET}`);
    } else if (weekly >= sevenDayThreshold) {
      const weeklyColor = getQuotaColor(weekly);
      const weeklyReset = formatResetTime(limits.weeklyResetsAt);
      const weeklyPart = weeklyReset
        ? `${DIM}wk:${RESET}${weeklyColor}${weekly}%${RESET}${DIM}(${weeklyReset})${RESET}`
        : `${DIM}wk:${RESET}${weeklyColor}${weekly}%${RESET}`;
      parts.push(weeklyPart);
    }
  }

  if (limits.monthlyPercent != null) {
    const monthly = Math.min(100, Math.max(0, Math.round(limits.monthlyPercent)));
    const monthlyColor = getQuotaColor(monthly);
    const monthlyReset = formatResetTime(limits.monthlyResetsAt);
    const monthlyPart = monthlyReset
      ? `${DIM}mo:${RESET}${monthlyColor}${monthly}%${RESET}${DIM}(${monthlyReset})${RESET}`
      : `${DIM}mo:${RESET}${monthlyColor}${monthly}%${RESET}`;
    parts.push(monthlyPart);
  }

  return parts.join(' ');
}

/**
 * Render compact rate limits (just percentages).
 *
 * Format: 45%/12% or 45%/12%/8% (with monthly)
 */
export function renderRateLimitsCompact(limits: RateLimits | null, sevenDayThreshold = 80): string | null {
  if (!limits) return null;

  const fiveHour = Math.min(100, Math.max(0, Math.round(limits.fiveHourPercent)));
  const fiveHourColor = getQuotaColor(fiveHour);

  const parts = [`${fiveHourColor}${fiveHour}%${RESET}`];

  if (limits.weeklyPercent != null) {
    const weekly = Math.min(100, Math.max(0, Math.round(limits.weeklyPercent)));
    if (weekly >= sevenDayThreshold) {
      const weeklyColor = getQuotaColor(weekly);
      parts.push(`${weeklyColor}${weekly}%${RESET}`);
    }
  }

  if (limits.monthlyPercent != null) {
    const monthly = Math.min(100, Math.max(0, Math.round(limits.monthlyPercent)));
    const monthlyColor = getQuotaColor(monthly);
    parts.push(`${monthlyColor}${monthly}%${RESET}`);
  }

  return parts.join('/');
}

/**
 * Render rate limits with visual progress bars using quota-specific colors.
 * sevenDayThreshold: only show weekly bar when usage >= this value (default 80%).
 *
 * Format: 5h:[████░░░░]45%(3h42m) wk:[█░░░░░░░]12%(2d5h) | ⚠ Limit reached (3h 15m)
 */
export function renderRateLimitsWithBar(
  limits: RateLimits | null,
  barWidth: number = 8,
  sevenDayThreshold = 80
): string | null {
  if (!limits) return null;

  const fiveHour = Math.min(100, Math.max(0, Math.round(limits.fiveHourPercent)));

  if (fiveHour >= 100) {
    const reset = formatResetTime(limits.fiveHourResetsAt);
    return `${RED}⚠ Limit reached${reset ? ` (${reset})` : ''}${RESET}`;
  }

  const fiveHourBar = quotaBar(fiveHour, barWidth);
  const fiveHourColor = getQuotaColor(fiveHour);
  const fiveHourReset = formatResetTime(limits.fiveHourResetsAt);
  const fiveHourPart = fiveHourReset
    ? `5h:[${fiveHourBar}]${fiveHourColor}${fiveHour}%${RESET}${DIM}(${fiveHourReset})${RESET}`
    : `5h:[${fiveHourBar}]${fiveHourColor}${fiveHour}%${RESET}`;

  const parts = [fiveHourPart];

  if (limits.weeklyPercent != null) {
    const weekly = Math.min(100, Math.max(0, Math.round(limits.weeklyPercent)));
    if (weekly >= 100) {
      const reset = formatResetTime(limits.weeklyResetsAt);
      parts.push(`${RED}⚠ wk limit${reset ? ` (${reset})` : ''}${RESET}`);
    } else if (weekly >= sevenDayThreshold) {
      const weeklyBar = quotaBar(weekly, barWidth);
      const weeklyColor = getQuotaColor(weekly);
      const weeklyReset = formatResetTime(limits.weeklyResetsAt);
      const weeklyPart = weeklyReset
        ? `${DIM}wk:${RESET}[${weeklyBar}]${weeklyColor}${weekly}%${RESET}${DIM}(${weeklyReset})${RESET}`
        : `${DIM}wk:${RESET}[${weeklyBar}]${weeklyColor}${weekly}%${RESET}`;
      parts.push(weeklyPart);
    }
  }

  if (limits.monthlyPercent != null) {
    const monthly = Math.min(100, Math.max(0, Math.round(limits.monthlyPercent)));
    const monthlyBar = quotaBar(monthly, barWidth);
    const monthlyColor = getQuotaColor(monthly);
    const monthlyReset = formatResetTime(limits.monthlyResetsAt);
    const monthlyPart = monthlyReset
      ? `${DIM}mo:${RESET}[${monthlyBar}]${monthlyColor}${monthly}%${RESET}${DIM}(${monthlyReset})${RESET}`
      : `${DIM}mo:${RESET}[${monthlyBar}]${monthlyColor}${monthly}%${RESET}`;
    parts.push(monthlyPart);
  }

  if (limits.sonnetWeeklyPercent != null) {
    const sonnet = Math.min(100, Math.max(0, Math.round(limits.sonnetWeeklyPercent)));
    const sonnetBar = quotaBar(sonnet, barWidth);
    const sonnetColor = getQuotaColor(sonnet);
    const sonnetReset = formatResetTime(limits.sonnetWeeklyResetsAt);
    const sonnetPart = sonnetReset
      ? `${DIM}son:${RESET}[${sonnetBar}]${sonnetColor}${sonnet}%${RESET}${DIM}(${sonnetReset})${RESET}`
      : `${DIM}son:${RESET}[${sonnetBar}]${sonnetColor}${sonnet}%${RESET}`;
    parts.push(sonnetPart);
  }

  if (limits.opusWeeklyPercent != null) {
    const opus = Math.min(100, Math.max(0, Math.round(limits.opusWeeklyPercent)));
    const opusBar = quotaBar(opus, barWidth);
    const opusColor = getQuotaColor(opus);
    const opusReset = formatResetTime(limits.opusWeeklyResetsAt);
    const opusPart = opusReset
      ? `${DIM}op:${RESET}[${opusBar}]${opusColor}${opus}%${RESET}${DIM}(${opusReset})${RESET}`
      : `${DIM}op:${RESET}[${opusBar}]${opusColor}${opus}%${RESET}`;
    parts.push(opusPart);
  }

  return parts.join(' ');
}

/**
 * Render an error indicator when the built-in rate limit API call fails.
 *
 * - 'network': API timeout, HTTP error, or parse failure → null (silent)
 * - 'auth': credentials expired, refresh failed → [API auth]
 * - 'no_credentials': no OAuth credentials (expected for API key users) → null (no display)
 */
export function renderRateLimitsError(result: UsageResult | null): string | null {
  if (!result?.error) return null;
  if (result.error === 'no_credentials') return null;
  if (result.error === 'auth') return `${YELLOW}[API auth]${RESET}`;
  if (result.error === 'rate_limit') {
    const code = result.apiError?.startsWith('http-') ? result.apiError.slice(5) : '';
    return `${YELLOW}⚠${code ? `(${code})` : '[RL]'}${RESET}`;
  }
  return null;
}

// ============================================================================
// Custom provider bucket rendering
// ============================================================================

/**
 * Compute a 0-100 usage percentage for threshold checks.
 * Returns null for string usage (no numeric basis).
 */
function bucketUsagePercent(usage: CustomBucketUsage): number | null {
  if (usage.type === 'percent') return usage.value;
  if (usage.type === 'credit' && usage.limit > 0) return (usage.used / usage.limit) * 100;
  return null;
}

/**
 * Render a bucket usage value as a display string.
 *   percent  → "32%"
 *   credit   → "250/300"
 *   string   → value as-is
 */
function renderBucketUsageValue(usage: CustomBucketUsage): string {
  if (usage.type === 'percent') return `${Math.round(usage.value)}%`;
  if (usage.type === 'credit') return `${usage.used}/${usage.limit}`;
  return usage.value;
}

/**
 * Render custom rate limit buckets from the rateLimitsProvider command.
 *
 * Format (normal):  label:32%  label2:250/300  label3:as-is
 * Format (stale):   label:32%*  (asterisk marks stale/cached data)
 * Format (error):   [cmd:err]
 *
 * resetsAt is shown only when usage exceeds thresholdPercent (default 85).
 */
export function renderCustomBuckets(
  result: CustomProviderResult,
  thresholdPercent: number = 85,
): string | null {
  // Command failed and no cached data
  if (result.error && result.buckets.length === 0) {
    return `${YELLOW}[cmd:err]${RESET}`;
  }

  if (result.buckets.length === 0) return null;

  const staleMarker = result.stale ? `${DIM}*${RESET}` : '';

  const parts = result.buckets.map((bucket) => {
    const pct = bucketUsagePercent(bucket.usage);
    const color = pct != null ? getQuotaColor(pct) : '';
    const colorReset = pct != null ? RESET : '';
    const usageStr = renderBucketUsageValue(bucket.usage);

    // Show resetsAt only above threshold (string usage never shows it)
    let resetPart = '';
    if (bucket.resetsAt && pct != null && pct >= thresholdPercent) {
      const d = new Date(bucket.resetsAt);
      if (!isNaN(d.getTime())) {
        const str = formatResetTime(d);
        if (str) resetPart = `${DIM}(${str})${RESET}`;
      }
    }

    return `${DIM}${bucket.label}:${RESET}${color}${usageStr}${colorReset}${staleMarker}${resetPart}`;
  });

  return parts.join(' ');
}
