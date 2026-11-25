const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const todayISO = () => toISO(new Date());

function parse(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(iso, n) {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function fmtLong(iso) {
  return parse(iso).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
export function fmtWeekday(iso) {
  return parse(iso).toLocaleDateString(undefined, { weekday: 'short' });
}
export function fmtTime(isoDateTime) {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export function isValidISO(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s).getTime());
}

export function fmtShort(iso) {
  return parse(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
export function fmtDateTime(isoDateTime) {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export const monthStart = (iso) => `${iso.slice(0, 7)}-01`;
export function prevMonthRange(iso) {
  const [y, m] = iso.split('-').map(Number);
  const first = new Date(y, m - 2, 1);
  const last = new Date(y, m - 1, 0);
  return { from: toISO(first), to: toISO(last) };
}
export function daysBetween(fromIso, toIso) {
  const out = [];
  for (let d = fromIso; d <= toIso && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
