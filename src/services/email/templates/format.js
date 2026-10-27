/**
 * Rendering helpers shared by every email template.
 * Timestamps are shown in the reader's local timezone (ALERT_TIMEZONE);
 * the raw UTC value stays available in the "Technical details" block.
 */

const FALLBACK_TIME_ZONE = 'UTC';

function safeTimeZone(timeZone) {
  if (!timeZone) return FALLBACK_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

/** `2026-10-27 12:51:09 UTC` — used for the technical details block. */
export function formatUtcTimestamp(epochMs) {
  return new Date(epochMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

/** `Tue 27 Oct, 3:51 PM` — what a human reads first. */
export function formatLocalTimestamp(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTimeZone(timeZone),
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(epochMs));

  const pick = (type) => parts.find((part) => part.type === type)?.value ?? '';
  const dayPeriod = pick('dayPeriod').toUpperCase();

  return `${pick('weekday')} ${pick('day')} ${pick('month')}, ${pick('hour')}:${pick('minute')} ${dayPeriod}`.trim();
}

/** `GMT+3` for the timezone caption. */
export function timeZoneOffsetLabel(timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTimeZone(timeZone),
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date());

  return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}

function plural(value, unit) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

/** `6 minutes` / `1 hour 20 minutes` / `2 days 3 hours` — never `86 min`. */
export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  if (totalMinutes < 60) return plural(totalMinutes, 'minute');

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 24) {
    return minutes === 0
      ? plural(totalHours, 'hour')
      : `${plural(totalHours, 'hour')} ${plural(minutes, 'minute')}`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? plural(days, 'day') : `${plural(days, 'day')} ${plural(hours, 'hour')}`;
}
