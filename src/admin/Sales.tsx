import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/api';
import { daysAgoInput, inr, todayInput, when } from '../lib/format';
import { Loading, MODE_LABEL, PageHead, STATUS_LABEL, statusClass } from './ui';
import type { SaleRow } from './types';

export default function Sales() {
  const [from, setFrom] = useState(daysAgoInput(6));
  const [to, setTo] = useState(todayInput());
  const [q, setQ] = useState('');
  const [payment, setPayment] = useState('');
  const [status, setStatus] = useState('');

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (q) params.set('q', q);
  if (payment) params.set('payment', payment);
  if (status) params.set('status', status);

  const { data, loading, error, reload } = useApi<{ sales: SaleRow[]; totals: { bills: number; total: number; discount: number } }>(
    `/api/admin/sales?${params.toString()}`,
  );
  const rows = data?.sales ?? [];

  return (
    <div className="space-y-4">
      <PageHead
        title="Sales book"
        note="Every bill written at the counter, newest first. Filter by date, mode or customer; open a bill to print it or take a return."
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

      <div className="grid gap-2 border border-rule bg-white/50 p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="from" className="label">
            From
          </label>
          <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">
            To
          </label>
          <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="s-q" className="label">
            Bill no. / customer
          </label>
          <input id="s-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="RG-221126 or name" className="input" />
        </div>
        <div>
          <label htmlFor="s-pay" className="label">
            Mode
          </label>
          <select id="s-pay" value={payment} onChange={(e) => setPayment(e.target.value)} className="input">
            <option value="">Any</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Khata</option>
          </select>
        </div>
        <div>
          <label htmlFor="s-status" className="label">
            Status
          </label>
          <select id="s-status" value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            <option value="">Any</option>
            <option value="paid">Paid</option>
            <option value="credit">On khata</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {data ? (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rule pb-2 text-[0.75rem]">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">Totals</span>
          <span>
            {data.totals.bills} bill{data.totals.bills === 1 ? '' : 's'}
          </span>
          <span className="font-mono">{inr(data.totals.total)}</span>
          <span className="text-ink-3">discount given {inr(data.totals.discount)}</span>
        </div>
      ) : null}

      {loading && !data ? <Loading label="Opening the book" /> : null}
      {error ? <p className="border-l-2 border-shut pl-2 text-[0.78rem] text-shut">{error}</p> : null}

      {data ? (
        <div className="overflow-x-auto border border-rule bg-white/40">
          <table className="admin-table min-w-[44rem]">
            <thead>
              <tr>
                <th>Bill</th>
                <th>When</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Mode</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/admin/sales/${r.id}`} className="font-mono text-[0.72rem] hover:text-oxide">
                      {r.bill_no}
                    </Link>
                  </td>
                  <td className="font-mono text-[0.625rem] text-ink-3">{when(r.sold_at)}</td>
                  <td>
                    <span className="block max-w-[12rem] truncate text-[0.8rem]">{r.customer_name}</span>
                    {r.customer_phone ? <span className="font-mono text-[0.5625rem] text-ink-3">{r.customer_phone}</span> : null}
                  </td>
                  <td className="font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-3">
                    {r.bill_type === 'invoice' ? 'GST' : 'Memo'}
                  </td>
                  <td className={`font-mono text-[0.625rem] uppercase tracking-[0.08em] ${statusClass(r.status)}`}>
                    {MODE_LABEL[r.payment_mode] ?? r.payment_mode}
                    {r.status === 'returned' ? ' · returned' : ''}
                  </td>
                  <td className="text-right font-mono text-[0.7rem]">{r.total ? inr(r.subtotal) : '—'}</td>
                  <td className="text-right font-mono text-[0.78rem] tabular-nums">{inr(r.total)}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="py-5 text-[0.8rem] text-ink-3">
                    No bills in that range. Widen the dates or clear the filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-[0.68rem] text-ink-3">
        Showing up to 200 bills. {STATUS_LABEL.returned} bills stay in the book but are left out of the totals.
      </p>
    </div>
  );
}
