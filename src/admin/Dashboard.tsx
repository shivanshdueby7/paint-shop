import { Link } from 'react-router-dom';
import { useApi } from '../lib/api';
import { inr, when } from '../lib/format';
import { Loading, PageHead, Stat, statusClass, MODE_LABEL, STATUS_LABEL } from './ui';
import type { Overview } from './types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Dashboard() {
  const { data, loading, error, reload } = useApi<Overview>('/api/admin/overview');

  const week = data?.week ?? [];
  const max = Math.max(1, ...week.map((w) => w.total));
  const days = [...week];
  // Always show seven columns even when a day had no bills.
  const filled: { day: string; total: number; bills: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const hit = days.find((x) => x.day === key);
    filled.push({ day: key, total: hit?.total ?? 0, bills: hit?.bills ?? 0 });
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Today at the counter"
        note="Live from the billing book. Figures are in rupees and include GST."
        actions={
          <>
            <button type="button" onClick={reload} className="btn btn-sm btn-quiet">
              Refresh
            </button>
            <Link to="/admin/new-bill" className="btn btn-sm btn-solid">
              New bill
            </Link>
          </>
        }
      />

      {loading && !data ? <Loading label="Counting the day" /> : null}
      {error ? <p className="border-l-2 border-shut pl-2 text-[0.78rem] text-shut">{error}</p> : null}

      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Sale today" value={inr(data.today.total)} sub={`${data.today.bills} bill${data.today.bills === 1 ? '' : 's'} so far`} />
            <Stat
              label="Cash / UPI"
              value={inr(data.split.find((s) => s.mode === 'cash')?.total ?? 0)}
              sub={`UPI ${inr(data.split.find((s) => s.mode === 'upi')?.total ?? 0)} · Card ${inr(
                data.split.find((s) => s.mode === 'card')?.total ?? 0,
              )}`}
            />
            <Stat label="Khata outstanding" value={inr(data.khata.total)} sub={`${data.khata.n} account${data.khata.n === 1 ? '' : 's'} with a balance`} accent={data.khata.total > 0} />
            <Stat label="Last 7 days" value={inr(data.weekTotal)} sub="Excludes returned bills" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="border border-rule bg-white/40">
              <div className="flex items-center justify-between border-b border-rule px-4 py-2">
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Seven days</p>
                <p className="font-mono text-[0.625rem] text-ink-3">peak {inr(max)}</p>
              </div>
              <div className="flex h-44 items-end gap-2 px-4 pb-3 pt-4">
                {filled.map((d) => {
                  const h = Math.max(2, Math.round((d.total / max) * 100));
                  const date = new Date(`${d.day}T00:00:00`);
                  return (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="font-mono text-[0.5625rem] text-ink-3">{d.total ? inr(d.total) : '—'}</span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full ${d.day === filled[6].day ? 'bg-oxide' : 'bg-ink/70'}`}
                          style={{ height: `${h}%` }}
                          title={`${d.bills} bills`}
                        />
                      </div>
                      <span className="font-mono text-[0.5625rem] uppercase text-ink-3">{DAY_SHORT[date.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border border-rule bg-white/40">
              <div className="flex items-center justify-between border-b border-rule px-4 py-2">
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Low stock</p>
                <Link to="/admin/stock" className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-oxide hover:underline">
                  Stock page →
                </Link>
              </div>
              {data.lowStock.length ? (
                <ul className="divide-y divide-rule/60">
                  {data.lowStock.slice(0, 7).map((l) => (
                    <li key={l.variantId} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[0.8rem]">{l.name}</span>
                        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink-3">{l.packSize}</span>
                      </span>
                      <span className={`font-mono text-[0.8rem] ${l.stock <= 0 ? 'text-shut' : 'text-oxide'}`}>
                        {l.stock <= 0 ? 'out' : l.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-4 text-[0.8rem] text-ink-3">Nothing below its low-stock mark.</p>
              )}
            </section>
          </div>

          <section className="border border-rule bg-white/40">
            <div className="flex items-center justify-between border-b border-rule px-4 py-2">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Last bills</p>
              <Link to="/admin/sales" className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-oxide hover:underline">
                All sales →
              </Link>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Customer</th>
                  <th>Mode</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/admin/sales/${r.id}`} className="font-mono text-[0.72rem] hover:text-oxide">
                        {r.bill_no}
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate">{r.customer_name}</td>
                    <td className={`font-mono text-[0.625rem] uppercase tracking-[0.08em] ${statusClass(r.status)}`}>
                      {MODE_LABEL[r.payment_mode] ?? r.payment_mode}
                      {r.status === 'returned' ? ` · ${STATUS_LABEL.returned}` : ''}
                    </td>
                    <td className="text-right font-mono text-[0.75rem] tabular-nums">{inr(r.total)}</td>
                    <td className="text-right font-mono text-[0.625rem] text-ink-3">{when(r.sold_at)}</td>
                  </tr>
                ))}
                {!data.recent.length ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-[0.8rem] text-ink-3">
                      No bills yet. Open a new bill to start the day.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { to: '/admin/enquiries', k: data.counts.enquiries, l: 'new enquiries' },
              { to: '/admin/khata', k: data.khata.n, l: 'khata accounts' },
              { to: '/admin/catalogue', k: data.counts.products, l: 'products listed' },
              { to: '/admin/catalogue?tab=shades', k: data.counts.shades, l: 'shades on the card' },
            ].map((q) => (
              <Link key={q.to + q.l} to={q.to} className="flex items-baseline justify-between border border-rule px-3 py-2 hover:border-ink">
                <span className="text-[0.75rem] text-ink-2">{q.l}</span>
                <span className="font-mono text-sm">{q.k}</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
