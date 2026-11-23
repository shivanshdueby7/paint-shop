import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiSend, useApi } from '../lib/api';
import { inr, when } from '../lib/format';
import { Empty, ErrorLine, Loading, PageHead, useAction } from './ui';
import type { Customer } from './types';

export default function Khata() {
  const { data, loading, error, reload } = useApi<{ customers: Customer[] }>('/api/admin/customers');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', type: 'contractor', gstin: '', address: '', creditLimit: '', notes: '' });
  const action = useAction();

  const customers = data?.customers ?? [];
  const totalOut = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const overLimit = customers.filter((c) => c.credit_limit > 0 && c.balance > c.credit_limit);

  const create = async () => {
    const ok = await action.run(async () => {
      await apiSend('/api/admin/customers', 'POST', {
        ...form,
        creditLimit: Number(form.creditLimit) || 0,
      });
      setForm({ name: '', phone: '', type: 'contractor', gstin: '', address: '', creditLimit: '', notes: '' });
      setShowNew(false);
      reload();
      return 'Account opened.';
    });
    return ok;
  };

  return (
    <div className="space-y-4">
      <PageHead
        title="Khata"
        note="Contractor and customer ledgers. Balance is what they owe the shop right now — bills added, payments taken off."
        actions={
          <button type="button" onClick={() => setShowNew((v) => !v)} className="btn btn-sm btn-solid">
            {showNew ? 'Close' : '+ New account'}
          </button>
        }
      />

      {overLimit.length ? (
        <p className="border-l-2 border-oxide bg-oxide/5 px-2 py-1.5 text-[0.75rem] text-oxide">
          {overLimit.length} account{overLimit.length > 1 ? 's' : ''} above the agreed limit:{' '}
          {overLimit.map((c) => c.name).join(', ')}.
        </p>
      ) : null}

      {showNew ? (
        <div className="border border-rule bg-white/50 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="k-name">
                Name
              </label>
              <input id="k-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="k-phone">
                Phone
              </label>
              <input id="k-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
            </div>
            <div>
              <label className="label" htmlFor="k-type">
                Type
              </label>
              <select id="k-type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="contractor">Contractor / painter</option>
                <option value="retail">Retail</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="k-gstin">
                GSTIN
              </label>
              <input id="k-gstin" className="input" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="label" htmlFor="k-limit">
                Credit limit ₹
              </label>
              <input
                id="k-limit"
                className="input text-right font-mono"
                value={form.creditLimit}
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="label" htmlFor="k-addr">
                Address / site
              </label>
              <input id="k-addr" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-2">
            <label className="label" htmlFor="k-notes">
              Note
            </label>
            <input id="k-notes" className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={create} disabled={action.busy} className="btn btn-sm btn-solid">
              Open account
            </button>
            <ErrorLine message={action.error} />
          </div>
        </div>
      ) : null}

      {loading && !data ? <Loading label="Opening the khata book" /> : null}
      {error ? <p className="border-l-2 border-shut pl-2 text-[0.78rem] text-shut">{error}</p> : null}

      {data ? (
        <div className="overflow-x-auto border border-rule bg-white/40">
          <table className="admin-table min-w-[42rem]">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Phone</th>
                <th className="text-right">Bills</th>
                <th className="text-right">Last bill</th>
                <th className="text-right">Limit</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/admin/khata/${c.id}`} className="text-[0.82rem] font-medium hover:text-oxide">
                      {c.name}
                    </Link>
                    {c.gstin ? <span className="block font-mono text-[0.5rem] text-ink-3">{c.gstin}</span> : null}
                  </td>
                  <td className="font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-3">{c.type}</td>
                  <td className="font-mono text-[0.65rem]">{c.phone}</td>
                  <td className="text-right font-mono text-[0.65rem]">{c.bill_count}</td>
                  <td className="text-right font-mono text-[0.6rem] text-ink-3">{c.last_sale_at ? when(c.last_sale_at) : '—'}</td>
                  <td className="text-right font-mono text-[0.65rem] text-ink-3">{c.credit_limit ? inr(c.credit_limit) : '—'}</td>
                  <td
                    className={`text-right font-mono text-[0.78rem] ${
                      c.balance > 0 ? (c.credit_limit && c.balance > c.credit_limit ? 'text-shut' : 'text-oxide') : 'text-ink-3'
                    }`}
                  >
                    {inr(c.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!customers.length ? <Empty>No accounts yet. Open one for a contractor who buys on terms.</Empty> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2 text-[0.75rem]">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">Outstanding</span>
        <span className="font-mono text-[0.95rem]">{inr(totalOut)}</span>
      </div>
    </div>
  );
}
