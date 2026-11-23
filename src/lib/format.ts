const inrWhole = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function inr(value: number, opts: { paise?: boolean } = {}): string {
  const n = Number.isFinite(value) ? value : 0;
  return `₹${opts.paise ? inrPaise.format(n) : inrWhole.format(Math.round(n))}`;
}

export function num(value: number, digits = 0): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
}

const dt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

const dayOnly = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dt.format(d).replace(',', '');
}

export function dayOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dayOnly.format(d);
}

export function todayInput(): string {
  const now = new Date(Date.now() + 330 * 60000 - new Date().getTimezoneOffset() * 60000);
  return now.toISOString().slice(0, 10);
}

export function daysAgoInput(days: number): string {
  const now = new Date(Date.now() - days * 86400000 + 330 * 60000 - new Date().getTimezoneOffset() * 60000);
  return now.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function stockLabel(stock: number): { text: string; className: string } {
  if (stock <= 0) return { text: 'Out of stock', className: 'text-shut' };
  if (stock <= 4) return { text: `Only ${stock} left`, className: 'text-oxide' };
  return { text: 'In stock', className: 'text-ink-3' };
}
