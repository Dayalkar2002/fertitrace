const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function rowVal(row: Record<string, unknown>, ...keys: string[]): string {
  const lookup = new Map(Object.keys(row).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const actual = lookup.get(key.toLowerCase());
    if (actual === undefined) continue;
    const value = row[actual];
    if (value === undefined || value === null || value === '') continue;
    return String(value);
  }
  return '';
}

export function rowNum(row: Record<string, unknown>, ...keys: string[]): number {
  const raw = rowVal(row, ...keys);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toInputDate(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatSmartDate(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

export function parseFormDate(value: string): Date {
  if (!value) return new Date();
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;
  const smart = new Date(value);
  return Number.isNaN(smart.getTime()) ? new Date() : smart;
}
