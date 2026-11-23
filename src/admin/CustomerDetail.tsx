import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiGet, apiSend } from '../lib/api';
import { inr, when, dayOf } from '../lib/format';
import { site } from '../site.config';
import { ErrorLine, Loading, OkLine, PageHead, useAction } from './ui';
import type { Customer, SaleRow } from './types';

type Payment = { id: number; sale_id: number | null; amount: number; mode: string; note: string; created_at: string };
type Payload = { customer: Customer; sales: SaleRow[]; payments: Payment[] };

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('cash');
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState('');
  const [notes, setNotes] = useState('');
  const action = useAction();

  const load = () => {
    if (!id) return;
    apiGet<Payload>(`/api/admin/customers/${id}`)
      .then((d) => {
        setData(d);
        setLimit(String(d.customer.credit_limit));
        setNotes(d.customer.notes);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load this khata'));
  };

  useEffect(load, [id]);

  const receive = async () => {
    const value = Number(amount);
    if (!value) {
      action.setError('Enter the amount received.');
      return;
    }
    await action.run(async () => {
      await apiSend(`/api/admin/customers/${id}/payment`, 'POST', { amount: value, mode, note });
      setAmount('');
      setNote('');
      load();
      return `${inr(value)} received.`;
    });
  };

  const saveTerms = async () => {
    await action.run(async () => {
      await apiSend(`/api/admin/customers/${id}`, 'PATCH', { creditLimit: Number(limit) || 0, notes });
      load();
      return 'Terms updated.';
    });
  };

  if (error) {
    return (
      <div className="border border-rule p-5">
        <p className="text-sm text-shut">{error}</p>
        <Link to="/admin/khata" className="btn btn-sm btn-quiet mt-3">
          Back to khata
        </Link>
      </div>
    );
  }

  if (!data) return <Loading label="Opening the ledger" />;

  const { customer, sales, payments } = data;
  const entries = [
    ...sales.map((s) => ({
      key: `s-${s.id}`,
      at: s.sold_at,
      label: `Bill ${s.bill_no}`,
      sub: s.bill_type === 'invoice' ? 'GST invoice' : 'Cash memo',
      debit: s.status === 'returned' ? 0 : s.total,
      credit: 0,
      link: `/admin/sales/${s.id}`,
    })),
    // A charge is already a row from the sales list; the negative "bill on
    // khata" payment some older records carry would list it twice.
    ...payments.filter((p) => p.amount > 0).map((p) => ({
      key: `p-${p.id}`,
      at: p.created_at,
      label: p.amount < 0 ? 'Bill on khata' : p.note || 'Payment received',
      sub: p.mode,
      debit: 0,
      credit: p.amount < 0 ? 0 : p.amount,
      link: p.sale_id ? `/admin/sales/${p.sale_id}` : '',
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  // Running udhaar: charge adds, payment takes down. Built oldest-first so each
  // row carries the balance as it stood on that date. If the account carries a
  // figure the itemised rows do not explain (an older part payment), it opens
  // with that difference so the last line always equals the balance.
  const net = entries.reduce((s, e) => s + e.debit - e.credit, 0);
  const diff = Math.round((customer.balance - net) * 100) / 100;
  const opening =
    diff === 0
      ? null
      : {
          key: 'opening',
          at: '',
          label: diff > 0 ? 'Opening balance — brought forward' : 'Payments on account',
          sub: 'before the bills listed',
          debit: diff > 0 ? diff : 0,
          credit: diff > 0 ? 0 : -diff,
          link: '',
        };
  let running = 0;
  const rows = unshiftOpening(entries).map((e) => {
    running += e.debit - e.credit;
    return { ...e, balance: running };
  }).reverse();

  function unshiftOpening<T>(list: T[]): T[] {
    const oldestFirst = [...list].reverse();
    return (opening ? [opening as unknown as T, ...oldestFirst] : oldestFirst);
  }

  const statementText = () =>
    [
      `${site.fullName} — khata statement`,
      `${customer.name} · ${customer.phone}`,
      '',
      ...rows.map((r) =>
        [when(r.at), r.label, r.debit ? `charge ${inr(r.debit)}` : '', r.credit ? `paid ${inr(r.credit)}` : '', `balance ${inr(r.balance)}`]
          .filter(Boolean)
          .join(' · '),
      ),
      '',
      `Balance now: ${inr(customer.balance)}`,
    ].join('\n');

  const copyStatement = async () => {
    await action.run(async () => {
      await navigator.clipboard.writeText(statementText());
      return 'Statement copied to the clipboard.';
    });
  };

  return (
    <>
    <div className="no-print space-y-4">
      <PageHead
        title={customer.name}
        note={`${customer.type === 'contractor' ? 'Contractor' : 'Retail'} · ${customer.phone}${customer.address ? ` · ${customer.address}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()} className="btn btn-sm btn-quiet">
              Print statement
            </button>
            <button type="button" onClick={copyStatement} disabled={action.busy} className="btn btn-sm btn-quiet">
              Copy
            </button>
            <Link to="/admin/khata" className="btn btn-sm btn-quiet">
              ← Khata
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-ink bg-white/60 px-3 py-2">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Balance now</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{inr(customer.balance)}</p>
        </div>
        <div className="border border-rule bg-white/40 px-3 py-2">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Credit limit</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{customer.credit_limit ? inr(customer.credit_limit) : '—'}</p>
        </div>
        <div className="border border-rule bg-white/40 px-3 py-2">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Bills</p>
          <p className="mt-1 font-mono text-xl tabular-nums">{sales.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-x-auto border border-rule bg-white/40">
          <div className="border-b border-rule px-3 py-2">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Ledger</p>
          </div>
          <table className="admin-table min-w-[30rem]">
            <thead>
              <tr>
                <th>When</th>
                <th>Particular</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.key}>
                  <td className="whitespace-nowrap font-mono text-[0.6rem] text-ink-3">{when(e.at)}</td>
                  <td>
                    {e.link ? (
                      <Link to={e.link} className="text-[0.78rem] hover:text-oxide">
                        {e.label}
                      </Link>
                    ) : (
                      <span className="text-[0.78rem]">{e.label}</span>
                    )}
                    <span className="block font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">{e.sub}</span>
                  </td>
                  <td className="text-right font-mono text-[0.72rem]">{e.debit ? inr(e.debit) : ''}</td>
                  <td className="text-right font-mono text-[0.72rem] text-open">{e.credit ? inr(e.credit) : ''}</td>
                  <td className="text-right font-mono text-[0.72rem] tabular-nums text-ink-2">{inr(e.balance)}</td>
                </tr>
              ))}
              {!entries.length ? (
                <tr>
                  <td colSpan={5} className="py-4 text-[0.8rem] text-ink-3">
                    Nothing on this ledger yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="border border-rule bg-white/50 p-3">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Receive a payment</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="label" htmlFor="c-amt">
                  Amount
                </label>
                <input
                  id="c-amt"
                  className="input text-right font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                  placeholder={String(Math.round(customer.balance) || 0)}
                />
              </div>
              <div>
                <label className="label" htmlFor="c-mode">
                  Mode
                </label>
                <select id="c-mode" className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <input
              className="input mt-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note — e.g. settled Saturday"
              aria-label="Payment note"
            />
            <button type="button" onClick={receive} disabled={action.busy} className="btn btn-sm btn-solid mt-2 w-full">
              Record payment
            </button>
          </div>

          <div className="border border-rule bg-white/50 p-3">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Terms</p>
            <div className="mt-2">
              <label className="label" htmlFor="c-limit">
                Credit limit ₹
              </label>
              <input id="c-limit" className="input text-right font-mono" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
            <div className="mt-2">
              <label className="label" htmlFor="c-notes">
                Note
              </label>
              <input id="c-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="button" onClick={saveTerms} disabled={action.busy} className="btn btn-sm btn-quiet mt-2 w-full">
              Save terms
            </button>
          </div>

          <div className="space-y-1">
            <ErrorLine message={action.error} />
            <OkLine message={action.ok} />
            <p className="text-[0.65rem] leading-relaxed text-ink-3">
              A khata bill adds to the balance; a payment takes it down. Returns reverse themselves automatically.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="print-sheet hidden print:block">
      <div className="flex items-start justify-between border-b border-ink pb-2">
        <div>
          <p className="text-lg font-bold tracking-[-0.02em]">{site.fullName}</p>
          <p className="text-[0.7rem]">{site.address.lines.join(', ')}</p>
          <p className="font-mono text-[0.65rem]">
            {site.phoneDisplay} · GSTIN {site.gstin}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em]">Khata statement</p>
          <p className="font-mono text-[0.65rem]">{dayOf(new Date().toISOString())}</p>
        </div>
      </div>
      <p className="mt-2 text-[0.85rem] font-semibold">
        {customer.name} · {customer.phone}
        {customer.address ? <span className="font-normal"> · {customer.address}</span> : null}
      </p>
      <table className="mt-3 w-full border-collapse text-[0.7rem]">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="py-1 font-mono text-[0.55rem] font-normal uppercase tracking-[0.1em]">Date</th>
            <th className="py-1 font-mono text-[0.55rem] font-normal uppercase tracking-[0.1em]">Particular</th>
            <th className="py-1 text-right font-mono text-[0.55rem] font-normal uppercase tracking-[0.1em]">Charge</th>
            <th className="py-1 text-right font-mono text-[0.55rem] font-normal uppercase tracking-[0.1em]">Paid</th>
            <th className="py-1 text-right font-mono text-[0.55rem] font-normal uppercase tracking-[0.1em]">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-rule/60">
              <td className="whitespace-nowrap py-1 font-mono text-[0.6rem]">{when(r.at)}</td>
              <td className="py-1">{r.label}</td>
              <td className="py-1 text-right font-mono">{r.debit ? inr(r.debit) : ''}</td>
              <td className="py-1 text-right font-mono">{r.credit ? inr(r.credit) : ''}</td>
              <td className="py-1 text-right font-mono">{inr(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex justify-between border-t border-ink pt-2">
        <p className="text-[0.6rem]">30-day terms on khata bills. This is a statement of account, not a tax invoice.</p>
        <p className="font-mono text-[0.85rem] font-semibold">Balance now: {inr(customer.balance)}</p>
      </div>
    </div>
    </>
  );
}
