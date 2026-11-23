// Formatting shared by the server render and the browser. Every timestamp prints in UTC, so the
// server and the visitor's browser always print the same string.

const COUNT = new Intl.NumberFormat('en-US');
const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const STAMP = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

/** 1059 -> "1,059" */
export const formatCount = (n: number): string => COUNT.format(n);

// The fetch already rejects malformed timestamps. These still never throw and never invent a
// time: bad input prints as an empty string (R33).
const valid = (iso: string): Date | null => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "Nov 23" */
export function shortDate(iso: string): string {
  const d = valid(iso);
  return d ? DAY.format(d) : '';
}

/** "Nov 23, 2026, 13:29 UTC" */
export function utcStamp(iso: string): string {
  const d = valid(iso);
  return d ? `${STAMP.format(d)} UTC` : '';
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago". A slightly future time reads as just now. */
export function timeAgo(iso: string, now: Date): string {
  const d = valid(iso);
  if (!d) return '';
  const age = now.getTime() - d.getTime();
  if (age < MINUTE) return 'just now';
  if (age < HOUR) return plural(Math.floor(age / MINUTE), 'minute');
  if (age < 48 * HOUR) return plural(Math.floor(age / HOUR), 'hour');
  return plural(Math.floor(age / (24 * HOUR)), 'day');
}
