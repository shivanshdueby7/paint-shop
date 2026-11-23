import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiSend, clearPublicCache } from '../lib/api';
import { apiGet } from '../lib/api';
import { inr, when } from '../lib/format';
import { site } from '../site.config';
import { ErrorLine, Loading, MODE_LABEL, OkLine, STATUS_LABEL, useAction } from './ui';
import type { SaleItem, SaleRow } from './types';

type Payload = { sale: SaleRow; items: SaleItem[] };

export default function SaleDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pay, setPay] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const action = useAction();

  const load = () => {
    if (!id) return;
    apiGet<Payload>(`/api/admin/sales/${id}`)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the bill'));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (params.get('print') === '1' && data) {
      const t = window.setTimeout(() => window.print(), 250);
      return () => window.clearTimeout(t);
    }
  }, [params, data]);

  const doReturn = async () => {
    if (!data) return;
    if (!window.confirm(`Take a return on ${data.sale.bill_no}? Stock goes back in and the khata is reversed.`)) return;
    await action.run(async () => {
      await apiSend(`/api/admin/sales/${data.sale.id}/return`, 'POST', {});
      clearPublicCache('/api/catalog');
      load();
      return 'Return recorded.';
    });
  };

  const receive = async () => {
    if (!data) return;
    const amount = Number(pay);
    if (!amount) {
      action.setError('Enter the amount received.');
      return;
    }
    await action.run(async () => {
      await apiSend(`/api/admin/sales/${data.sale.id}/payment`, 'POST', { amount, mode: payMode });
      setPay('');
      load();
      return `${inr(amount)} received.`;
    });
  };

  if (error) {
    return (
      <div className="border border-rule p-5">
        <p className="text-sm text-shut">{error}</p>
        <Link to="/admin/sales" className="btn btn-sm btn-quiet mt-3">
          Back to sales
        </Link>
      </div>
    );
  }

  if (!data) return <Loading label="Opening the bill" />;

  const { sale, items } = data;
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxable = sale.total / 1.18;
  const gst = sale.total - taxable;
  const invoice = sale.bill_type === 'invoice';

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-ink pb-3">
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-3">Bill</p>
          <h1 className="text-xl font-bold tracking-[-0.02em]">{sale.bill_no}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/sales" className="btn btn-sm btn-quiet">
            ← Sales
          </Link>
          <button type="button" onClick={() => window.print()} className="btn btn-sm btn-solid">
            Print
          </button>
          {sale.status !== 'returned' ? (
            <button type="button" onClick={doReturn} className="btn btn-sm btn-quiet">
              Take a return
            </button>
          ) : null}
        </div>
      </div>

      <div className="no-print space-y-2">
        <ErrorLine message={action.error} />
        <OkLine message={action.ok} />
      </div>

      <div className="print-sheet mx-auto max-w-[46rem] border border-rule bg-white px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-3">
          <div>
            <p className="text-lg font-extrabold tracking-[-0.02em]">{site.fullName}</p>
            <p className="mt-1 text-[0.7rem] leading-snug text-ink-2">
              {site.address.lines.join(', ')}
            </p>
            <p className="mt-0.5 font-mono text-[0.65rem] text-ink-2">
              {site.phoneDisplay}
              {invoice ? ` · GSTIN ${site.gstin}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ink-3">
              {invoice ? 'Tax invoice' : 'Cash memo'}
            </p>
            <p className="mt-1 font-mono text-[0.8rem] font-medium">{sale.bill_no}</p>
            <p className="font-mono text-[0.65rem] text-ink-3">{when(sale.sold_at)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4 text-[0.75rem]">
          <div>
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-3">Billed to</p>
            <p className="mt-0.5 font-medium">{sale.customer_name || 'Walk-in'}</p>
            {sale.customer_phone ? <p className="font-mono text-[0.65rem] text-ink-2">{sale.customer_phone}</p> : null}
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-3">Payment</p>
            <p className="mt-0.5">
              {MODE_LABEL[sale.payment_mode] ?? sale.payment_mode} · {STATUS_LABEL[sale.status] ?? sale.status}
            </p>
          </div>
        </div>

        <table className="mt-4 w-full border-collapse text-[0.75rem]">
          <thead>
            <tr className="border-y border-ink">
              <th className="py-1.5 text-left font-mono text-[0.5625rem] font-normal uppercase tracking-[0.12em]">Item</th>
              <th className="py-1.5 text-left font-mono text-[0.5625rem] font-normal uppercase tracking-[0.12em]">Shade</th>
              <th className="py-1.5 text-right font-mono text-[0.5625rem] font-normal uppercase tracking-[0.12em]">Qty</th>
              <th className="py-1.5 text-right font-mono text-[0.5625rem] font-normal uppercase tracking-[0.12em]">Rate</th>
              <th className="py-1.5 text-right font-mono text-[0.5625rem] font-normal uppercase tracking-[0.12em]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-rule/60">
                <td className="py-1.5">
                  <span className="block">{i.product_name}</span>
                  <span className="font-mono text-[0.5625rem] text-ink-3">{i.pack_size}</span>
                </td>
                <td className="py-1.5 font-mono text-[0.625rem]">
                  {i.shade_code || '—'}
                  {i.shade_name ? <span className="block font-sans text-[0.625rem] text-ink-2">{i.shade_name}</span> : null}
                  {i.tint_formula ? <span className="block text-[0.5rem] text-ink-3">{i.tint_formula}</span> : null}
                </td>
                <td className="py-1.5 text-right font-mono">{i.qty}</td>
                <td className="py-1.5 text-right font-mono">{inr(i.rate)}</td>
                <td className="py-1.5 text-right font-mono">{inr(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end">
          <table className="w-full max-w-[16rem] text-[0.75rem]">
            <tbody>
              <tr>
                <td className="py-0.5 text-ink-2">Subtotal</td>
                <td className="py-0.5 text-right font-mono">{inr(subtotal)}</td>
              </tr>
              {sale.discount ? (
                <tr>
                  <td className="py-0.5 text-ink-2">Discount</td>
                  <td className="py-0.5 text-right font-mono">− {inr(sale.discount)}</td>
                </tr>
              ) : null}
              {invoice ? (
                <>
                  <tr>
                    <td className="py-0.5 text-ink-2">Taxable value</td>
                    <td className="py-0.5 text-right font-mono">{inr(taxable, { paise: true })}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-ink-2">CGST 9%</td>
                    <td className="py-0.5 text-right font-mono">{inr(gst / 2, { paise: true })}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-ink-2">SGST 9%</td>
                    <td className="py-0.5 text-right font-mono">{inr(gst / 2, { paise: true })}</td>
                  </tr>
                </>
              ) : null}
              <tr className="border-t border-ink">
                <td className="py-1.5 text-[0.85rem] font-semibold">Total</td>
                <td className="py-1.5 text-right font-mono text-[0.95rem] font-semibold">{inr(sale.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {sale.notes ? <p className="mt-3 text-[0.7rem] text-ink-2">Note: {sale.notes}</p> : null}

        <div className="mt-5 flex items-end justify-between border-t border-rule pt-3">
          <p className="max-w-[22rem] text-[0.6rem] leading-relaxed text-ink-3">
            Tinted packs are not returnable. Shade codes are recorded above — bring the bill if you need the same shade
            mixed again. Colours on a screen are approximate.
          </p>
          <p className="font-mono text-[0.6rem] text-ink-3">For {site.fullName}</p>
        </div>
      </div>

      {sale.status === 'credit' && sale.customer_id ? (
        <div className="no-print border border-rule bg-white/50 p-3">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Receive payment against this bill</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="pay-amt" className="label">
                Amount
              </label>
              <input
                id="pay-amt"
                type="number"
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="input w-32 text-right font-mono"
                placeholder={String(Math.round(sale.total))}
              />
            </div>
            <div>
              <label htmlFor="pay-mode" className="label">
                Mode
              </label>
              <select id="pay-mode" value={payMode} onChange={(e) => setPayMode(e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
            <button type="button" onClick={receive} disabled={action.busy} className="btn btn-sm btn-solid">
              Record
            </button>
            <Link to={`/admin/khata/${sale.customer_id}`} className="btn btn-sm btn-quiet">
              Open khata
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
