/** Local 'YYYY-MM-DD' for today — deliberately not UTC, so day boundaries match the user's own day. */
export function todayStr(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole-day gap between two 'YYYY-MM-DD' strings (b - a). */
export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Whether a timestamp falls on today's local date. */
export function isToday(ts: number | undefined) {
  return ts !== undefined && todayStr(new Date(ts)) === todayStr();
}
