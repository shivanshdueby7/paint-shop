import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiSend, clearPublicCache, useApi, type Catalog, type ShadesPayload } from '../lib/api';
import { inr } from '../lib/format';
import { ErrorLine, Loading, PageHead, useAction } from './ui';
import type { Customer } from './types';

type Line = {
  key: string;
  variantId: number;
  name: string;
  packSize: string;
  rate: number;
  qty: number;
  shadeCode: string;
  tintFormula: string;
  isPaint: boolean;
};

type Held = { id: string; at: string; lines: Line[]; customerName: string; discount: number };

const HELD_KEY = 'rg-held-bills';

function readHeld(): Held[] {
  try {
    const raw = localStorage.getItem(HELD_KEY);
    return raw ? (JSON.parse(raw) as Held[]) : [];
  } catch {
    return [];
  }
}

const PAINT_CATEGORIES = ['interior', 'exterior', 'enamel'];

export default function Counter() {
  const navigate = useNavigate();
  const catalog = useApi<Catalog>('/api/catalog');
  const shadesPayload = useApi<ShadesPayload>('/api/shades');
  const customersApi = useApi<{ customers: Customer[] }>('/api/admin/customers');

  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [walkName, setWalkName] = useState('');
  const [walkPhone, setWalkPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [billType, setBillType] = useState<'memo' | 'invoice'>('memo');
  const [mode, setMode] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [held, setHeld] = useState<Held[]>(() => readHeld());
  const [showHeld, setShowHeld] = useState(false);
  const [lastBill, setLastBill] = useState<{ id: number; billNo: string; total: number } | null>(null);
  const action = useAction();

  const products = catalog.data?.products ?? [];
  const shades = shadesPayload.data?.shades ?? [];
  const customers = customersApi.data?.customers ?? [];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: { variantId: number; name: string; packSize: string; price: number; stock: number; isPaint: boolean }[] = [];
    for (const p of products) {
      const hay = `${p.name} ${p.brandName} ${p.categoryName} ${p.finish}`.toLowerCase();
      if (!hay.includes(q)) continue;
      for (const v of p.variants) {
        out.push({
          variantId: v.id,
          name: `${p.name} · ${p.brandName}`,
          packSize: v.packSize,
          price: v.price,
          stock: v.stock,
          isPaint: PAINT_CATEGORIES.includes(p.categorySlug),
        });
        if (out.length >= 12) return out;
      }
    }
    return out;
  }, [products, query]);

  const addLine = (r: { variantId: number; name: string; packSize: string; price: number; isPaint: boolean }) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === r.variantId);
      if (existing) return prev.map((l) => (l.variantId === r.variantId ? { ...l, qty: l.qty + 1 } : l));
      return [
        ...prev,
        {
          key: `${r.variantId}-${Date.now()}`,
          variantId: r.variantId,
          name: r.name,
          packSize: r.packSize,
          rate: r.price,
          qty: 1,
          shadeCode: '',
          tintFormula: '',
          isPaint: r.isPaint,
        },
      ];
    });
    setQuery('');
    setLastBill(null);
  };

  const update = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const disc = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const total = Math.max(0, subtotal - disc);
  const taxable = total / 1.18;
  const gst = total - taxable;

  const reset = () => {
    setLines([]);
    setDiscount('');
    setNotes('');
    setCustomerId('');
    setWalkName('');
    setWalkPhone('');
    setMode('cash');
    setBillType('memo');
  };

  const save = async () => {
    if (!lines.length) return;
    if (mode === 'credit' && !customerId && walkPhone.replace(/\D/g, '').length < 10) {
      action.setError('A khata bill needs a phone number for the account.');
      return;
    }
    await action.run(async () => {
      const res = await apiSend<{ id: number; billNo: string; total: number }>('/api/admin/sales', 'POST', {
        customerId: customerId ? Number(customerId) : null,
        customerName: walkName,
        customerPhone: walkPhone,
        billType,
        paymentMode: mode,
        discount: disc,
        notes,
        items: lines.map((l) => ({
          variantId: l.variantId,
          qty: l.qty,
          rate: l.rate,
          shadeCode: l.shadeCode,
          tintFormula: l.tintFormula,
        })),
      });
      setLastBill(res);
      clearPublicCache('/api/catalog');
      reset();
      customersApi.reload();
      return `Bill ${res.billNo} saved — ${inr(res.total)}.`;
    });
  };

  const holdBill = () => {
    if (!lines.length) return;
    const entry: Held = {
      id: `${Date.now()}`,
      at: new Date().toISOString(),
      lines,
      customerName: walkName || customers.find((c) => String(c.id) === customerId)?.name || 'Walk-in',
      discount: disc,
    };
    const next = [entry, ...held].slice(0, 12);
    setHeld(next);
    localStorage.setItem(HELD_KEY, JSON.stringify(next));
    reset();
  };

  const resume = (entry: Held) => {
    setLines(entry.lines);
    setDiscount(entry.discount ? String(entry.discount) : '');
    setShowHeld(false);
    const next = held.filter((h) => h.id !== entry.id);
    setHeld(next);
    localStorage.setItem(HELD_KEY, JSON.stringify(next));
  };

  const removeHeld = (id: string) => {
    const next = held.filter((h) => h.id !== id);
    setHeld(next);
    localStorage.setItem(HELD_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <PageHead
        title="New bill"
        note="Search by product or brand, add the pack, pick the shade. Rates are editable for a negotiated price."
        actions={
          <>
            <button type="button" onClick={() => setShowHeld((v) => !v)} className="btn btn-sm btn-quiet">
              Held bills ({held.length})
            </button>
            <button type="button" onClick={reset} className="btn btn-sm btn-quiet" disabled={!lines.length}>
              Clear
            </button>
          </>
        }
      />

      <datalist id="shade-codes">
        {shades.map((s) => (
          <option key={s.id} value={s.code}>
            {s.name}
          </option>
        ))}
      </datalist>

      {lastBill ? (
        <div className="border border-open bg-open/5 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-open">Saved</p>
              <p className="mt-0.5 text-sm">
                Bill <span className="font-mono">{lastBill.billNo}</span> · {inr(lastBill.total)}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate(`/admin/sales/${lastBill.id}?print=1`)} className="btn btn-sm btn-solid">
                Print bill
              </button>
              <button type="button" onClick={() => setLastBill(null)} className="btn btn-sm btn-quiet">
                Next customer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showHeld ? (
        <div className="border border-rule bg-white/50 p-3">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Bills on hold</p>
          {held.length ? (
            <ul className="mt-2 divide-y divide-rule/70">
              {held.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-[0.8rem]">
                    {h.customerName} · {h.lines.length} item{h.lines.length > 1 ? 's' : ''} ·{' '}
                    <span className="font-mono text-[0.72rem]">
                      {inr(h.lines.reduce((s, l) => s + l.qty * l.rate, 0) - h.discount)}
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => resume(h)} className="btn btn-sm btn-quiet">
                      Resume
                    </button>
                    <button type="button" onClick={() => removeHeld(h.id)} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-shut">
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[0.8rem] text-ink-3">Nothing on hold. A held bill stays in this browser only.</p>
          )}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          <div className="border border-rule bg-white/50 p-3">
            <label htmlFor="bill-search" className="label">
              Add an item
            </label>
            <input
              id="bill-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Royale, Apex Ultima, putty, 20 L…"
              className="input"
              autoComplete="off"
            />
            {query && !results.length ? <p className="mt-2 text-[0.75rem] text-ink-3">Nothing on the shelf matches that.</p> : null}
            {results.length ? (
              <ul className="mt-2 max-h-64 divide-y divide-rule/70 overflow-y-auto border border-rule">
                {results.map((r) => (
                  <li key={r.variantId}>
                    <button
                      type="button"
                      onClick={() => addLine(r)}
                      className="flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left hover:bg-paper-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[0.8rem]">{r.name}</span>
                        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink-3">
                          {r.packSize} · stock {r.stock}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.75rem]">{inr(r.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="border border-rule bg-white/50">
            <div className="flex items-center justify-between border-b border-rule px-3 py-2">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Bill items</p>
              <p className="font-mono text-[0.625rem] text-ink-3">
                {lines.length} line{lines.length === 1 ? '' : 's'}
              </p>
            </div>

            {!lines.length ? (
              <p className="px-3 py-6 text-[0.8rem] text-ink-3">
                No items yet. Search above, or ask the customer for the shade code first.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table min-w-[38rem]">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="w-16 text-right">Qty</th>
                      <th className="w-20 text-right">Rate</th>
                      <th className="w-24 text-right">Amount</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.key}>
                        <td>
                          <p className="text-[0.8rem] leading-tight">{l.name}</p>
                          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.1em] text-ink-3">{l.packSize}</p>
                          {l.isPaint ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              <input
                                list="shade-codes"
                                value={l.shadeCode}
                                onChange={(e) => update(l.key, { shadeCode: e.target.value.toUpperCase() })}
                                placeholder="Shade code"
                                className="w-24 border border-rule bg-white px-1 py-0.5 font-mono text-[0.625rem]"
                              />
                              {shades.find((s) => s.code === l.shadeCode) ? (
                                <span className="text-[0.625rem] text-ink-2">
                                  {shades.find((s) => s.code === l.shadeCode)?.name}
                                </span>
                              ) : null}
                              <input
                                value={l.tintFormula}
                                onChange={(e) => update(l.key, { tintFormula: e.target.value })}
                                placeholder="Tint formula / batch"
                                className="w-32 border border-rule bg-white px-1 py-0.5 font-mono text-[0.625rem]"
                              />
                            </div>
                          ) : null}
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={l.qty}
                            onChange={(e) => update(l.key, { qty: Math.max(0, Number(e.target.value)) })}
                            className="w-14 border border-rule bg-white px-1 py-0.5 text-right font-mono text-[0.7rem]"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={l.rate}
                            onChange={(e) => update(l.key, { rate: Math.max(0, Number(e.target.value)) })}
                            className="w-20 border border-rule bg-white px-1 py-0.5 text-right font-mono text-[0.7rem]"
                          />
                        </td>
                        <td className="text-right font-mono text-[0.75rem] tabular-nums">{inr(l.qty * l.rate)}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                            className="font-mono text-[0.65rem] text-ink-3 hover:text-shut"
                            aria-label="Remove line"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-rule bg-white/50 p-3">
              <label htmlFor="bill-customer" className="label">
                Customer
              </label>
              <select
                id="bill-customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input"
              >
                <option value="">Walk-in / new</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.balance > 0 ? ` — owes ${inr(c.balance)}` : ''}
                  </option>
                ))}
              </select>
              {!customerId ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={walkName}
                    onChange={(e) => setWalkName(e.target.value)}
                    placeholder="Name"
                    className="input"
                    aria-label="Customer name"
                  />
                  <input
                    value={walkPhone}
                    onChange={(e) => setWalkPhone(e.target.value)}
                    placeholder="Phone"
                    inputMode="tel"
                    className="input"
                    aria-label="Customer phone"
                  />
                </div>
              ) : (
                <p className="mt-1 font-mono text-[0.625rem] text-ink-3">
                  {customers.find((c) => String(c.id) === customerId)?.phone}
                </p>
              )}
            </div>

            <div className="border border-rule bg-white/50 p-3">
              <label htmlFor="bill-notes" className="label">
                Note on the bill
              </label>
              <input
                id="bill-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Site: Jhalwa, 3rd floor"
                className="input"
              />
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <label htmlFor="bill-discount" className="label">
                    Discount ₹
                  </label>
                  <input
                    id="bill-discount"
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="input text-right font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-3 lg:sticky lg:top-[104px]">
          <div className="border border-ink bg-white/60">
            <div className="border-b border-rule px-3 py-2">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Bill</p>
            </div>
            <div className="space-y-2 px-3 py-3">
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-ink-2">Subtotal</span>
                <span className="font-mono tabular-nums">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-ink-2">Discount</span>
                <span className="font-mono tabular-nums text-oxide">− {inr(disc)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-rule pt-2">
                <span className="text-[0.9rem] font-semibold">Total</span>
                <span className="font-mono text-lg tabular-nums">{inr(total)}</span>
              </div>
              {billType === 'invoice' ? (
                <p className="font-mono text-[0.5625rem] text-ink-3">
                  taxable {inr(taxable, { paise: true })} · CGST {inr(gst / 2, { paise: true })} · SGST {inr(gst / 2, { paise: true })}
                </p>
              ) : (
                <p className="font-mono text-[0.5625rem] text-ink-3">Cash memo · GST not shown on the print</p>
              )}
            </div>

            <div className="border-t border-rule px-3 py-2">
              <p className="label">Bill type</p>
              <div className="flex gap-1.5">
                {(['memo', 'invoice'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBillType(t)}
                    className={`flex-1 border px-2 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.1em] ${
                      billType === t ? 'border-ink bg-ink text-paper' : 'border-rule text-ink-2 hover:border-ink'
                    }`}
                  >
                    {t === 'memo' ? 'Cash memo' : 'GST invoice'}
                  </button>
                ))}
              </div>

              <p className="label mt-3">Payment</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(['cash', 'upi', 'card', 'credit'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`border px-1 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.08em] ${
                      mode === m ? 'border-ink bg-ink text-paper' : 'border-rule text-ink-2 hover:border-ink'
                    }`}
                  >
                    {m === 'credit' ? 'Khata' : m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-rule px-3 py-3">
              <ErrorLine message={action.error} />
              <button type="button" onClick={save} disabled={!lines.length || action.busy} className="btn btn-solid w-full">
                {action.busy ? 'Saving…' : `Save bill · ${inr(total)}`}
              </button>
              <button type="button" onClick={holdBill} disabled={!lines.length} className="btn btn-quiet w-full">
                Hold this bill
              </button>
              {action.ok ? <p className="text-[0.7rem] text-open">{action.ok}</p> : null}
            </div>
          </div>

          <div className="border border-rule px-3 py-2">
            <p className="text-[0.68rem] leading-relaxed text-ink-3">
              Khata bills need a phone number — that is what the account is filed under. Returns and part payments live on
              the bill page.
            </p>
            <Link to="/admin/sales" className="mt-1.5 inline-block font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-oxide hover:underline">
              Today&apos;s bills →
            </Link>
          </div>
        </aside>
      </div>

      {catalog.loading ? <Loading label="Loading the shelf" /> : null}
      {catalog.error ? <p className="text-[0.75rem] text-shut">Catalogue did not load: {catalog.error}</p> : null}
    </div>
  );
}
