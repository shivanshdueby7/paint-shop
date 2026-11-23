import { useState } from 'react';
import { apiSend, clearPublicCache, useApi } from '../lib/api';
import { inr, when } from '../lib/format';
import { Empty, ErrorLine, Loading, PageHead, useAction } from './ui';
import type { StockMove, StockRow } from './types';

const FILTERS = [
  { key: 'all', label: 'All packs' },
  { key: 'low', label: 'Low stock' },
  { key: 'old', label: 'Old stock' },
] as const;

export default function Stock() {
  const [filter, setFilter] = useState<'all' | 'low' | 'old'>('low');
  const { data, loading, error, reload } = useApi<{ stock: StockRow[]; moves: StockMove[] }>(`/api/admin/stock?filter=${filter}`);

  const rows = data?.stock ?? [];
  const moves = data?.moves ?? [];

  return (
    <div className="space-y-4">
      <PageHead
        title="Stock"
        note="One line per pack size, because 4 L and 20 L run out at different times. Stock goes down when a bill is saved and back up on a return."
        actions={
          <>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`btn btn-sm ${filter === f.key ? 'btn-solid' : 'btn-quiet'}`}
              >
                {f.label}
              </button>
            ))}
          </>
        }
      />

      {filter === 'old' ? (
        <p className="text-[0.72rem] leading-relaxed text-ink-3">
          Packs with stock on the shelf but no sale and no inward entry in the last 120 days. Clear these before the
          company changes the pack design.
        </p>
      ) : null}

      {loading && !data ? <Loading label="Counting the godown" /> : null}
      {error ? <p className="border-l-2 border-shut pl-2 text-[0.78rem] text-shut">{error}</p> : null}

      <div className="overflow-x-auto border border-rule bg-white/40">
        <table className="admin-table min-w-[46rem]">
          <thead>
            <tr>
              <th>Item</th>
              <th>Pack</th>
              <th>Batch</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Low at</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Stock in / out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <StockLine key={r.id} row={r} onDone={reload} />
            ))}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={7}>
                  <Empty>{filter === 'low' ? 'Nothing below its mark. Good.' : 'No packs in this list.'}</Empty>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="border border-rule bg-white/40">
        <div className="border-b border-rule px-3 py-2">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Last stock movements</p>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Kind</th>
              <th className="text-right">Qty</th>
              <th>Ref</th>
              <th className="text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.id}>
                <td className="text-[0.78rem]">
                  {m.product_name}
                  <span className="ml-1.5 font-mono text-[0.5625rem] text-ink-3">{m.pack_size}</span>
                </td>
                <td className="font-mono text-[0.5625rem] uppercase tracking-[0.08em] text-ink-3">{m.kind}</td>
                <td className={`text-right font-mono text-[0.72rem] ${m.qty > 0 ? 'text-open' : 'text-oxide'}`}>
                  {m.qty > 0 ? '+' : ''}
                  {m.qty}
                </td>
                <td className="font-mono text-[0.62rem] text-ink-3">{m.ref || '—'}</td>
                <td className="text-right font-mono text-[0.6rem] text-ink-3">{when(m.created_at)}</td>
              </tr>
            ))}
            {!moves.length ? (
              <tr>
                <td colSpan={5}>
                  <Empty>No movements yet.</Empty>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockLine({ row, onDone }: { row: StockRow; onDone: () => void }) {
  const [qty, setQty] = useState('');
  const [batch, setBatch] = useState(row.batch);
  const action = useAction();

  const move = async (kind: 'in' | 'out') => {
    const value = Number(qty);
    if (!value) {
      action.setError('Enter a quantity first.');
      return;
    }
    await action.run(async () => {
      await apiSend('/api/admin/stock', 'POST', { variantId: row.id, qty: value, kind, batch, ref: kind === 'in' ? 'Godown entry' : 'Manual' });
      setQty('');
      clearPublicCache('/api/catalog');
      onDone();
      return true;
    });
  };

  const low = row.stock <= row.low_stock_at;

  return (
    <tr>
      <td>
        <span className="text-[0.8rem]">{row.product_name}</span>
        <span className="block font-mono text-[0.5rem] uppercase tracking-[0.08em] text-ink-3">{row.category_name}</span>
      </td>
      <td className="font-mono text-[0.68rem]">{row.pack_size}</td>
      <td>
        <input
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="w-16 border border-rule bg-white px-1 py-0.5 font-mono text-[0.62rem]"
          aria-label={`Batch for ${row.product_name} ${row.pack_size}`}
        />
      </td>
      <td className={`text-right font-mono text-[0.8rem] ${row.stock <= 0 ? 'text-shut' : low ? 'text-oxide' : ''}`}>{row.stock}</td>
      <td className="text-right font-mono text-[0.62rem] text-ink-3">{row.low_stock_at}</td>
      <td className="text-right font-mono text-[0.68rem]">{inr(row.price)}</td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-14 border border-rule bg-white px-1 py-0.5 text-right font-mono text-[0.65rem]"
            placeholder="0"
            aria-label={`Quantity for ${row.product_name}`}
          />
          <button type="button" onClick={() => move('in')} disabled={action.busy} className="btn btn-sm border-rule px-1.5 py-0.5 text-[0.55rem]">
            In
          </button>
          <button type="button" onClick={() => move('out')} disabled={action.busy} className="btn btn-sm border-rule px-1.5 py-0.5 text-[0.55rem]">
            Out
          </button>
        </div>
        <ErrorLine message={action.error} />
      </td>
    </tr>
  );
}
