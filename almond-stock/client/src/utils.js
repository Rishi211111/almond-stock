const pad = (n) => String(n).padStart(2, '0');

export function dateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const today = () => dateStr(new Date());
export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}
export function fmtDate(s, opts = { day: 'numeric', month: 'short' }) {
  return parseDate(s).toLocaleDateString('en-IN', opts);
}
export const n1 = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
export const kg = (n) => `${n1(n)} kg`;
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
