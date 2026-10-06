// Dates are stored as plain "YYYY-MM-DD" strings so there are no time zone surprises.
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(s, n) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function todayStr() {
  const timeZone = process.env.TZ_NAME || 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function daysBetween(from, to) {
  const out = [];
  for (let s = from; s <= to; s = addDays(s, 1)) out.push(s);
  return out;
}

export function weekday(s) {
  return new Date(`${s}T00:00:00Z`).getUTCDay();
}
