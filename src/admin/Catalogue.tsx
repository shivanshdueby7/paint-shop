import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiSend, useApi } from '../lib/api';
import { Empty, ErrorLine, Loading, Modal, PageHead, useAction } from './ui';
import type { AdminOffer, AdminProduct, AdminShade, AdminVariant, BrandRow, CategoryRow } from './types';

type CatalogAdmin = { products: AdminProduct[]; variants: AdminVariant[]; brands: BrandRow[]; categories: CategoryRow[] };

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'shades', label: 'Shades' },
  { key: 'offers', label: 'Offers' },
] as const;

export default function Catalogue() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab = raw === 'shades' || raw === 'offers' ? raw : 'products';

  return (
    <div className="space-y-4">
      <PageHead
        title="Catalogue"
        note="Products and their pack sizes, the shade card, and the bundles on the offers page. Everything here appears on the public site within a minute."
      />
      <div className="flex gap-1 border-b border-rule">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParams(t.key === 'products' ? {} : { tab: t.key })}
            className={`border-b-2 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] ${
              tab === t.key ? 'border-oxide text-ink' : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' ? <ProductsTab /> : null}
      {tab === 'shades' ? <ShadesTab /> : null}
      {tab === 'offers' ? <OffersTab /> : null}
    </div>
  );
}

// ── Products ─────────────────────────────────────────────────────────────────

function ProductsTab() {
  const { data, loading, error, reload } = useApi<CatalogAdmin>('/api/admin/products');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const products = data?.products ?? [];
  const variants = data?.variants ?? [];
  const list = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.name} ${p.brand_name ?? ''} ${p.category_name}`.toLowerCase().includes(q);
  });
  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="p-search" className="label">
              Search products
            </label>
            <input id="p-search" value={search} onChange={(e) => setSearch(e.target.value)} className="input" placeholder="Royale, putty…" />
          </div>
          <button type="button" onClick={() => setShowNew((v) => !v)} className="btn btn-sm btn-solid">
            {showNew ? 'Close' : '+ New'}
          </button>
        </div>

        {showNew && data ? <NewProduct brands={data.brands} categories={data.categories} onDone={reload} onClose={() => setShowNew(false)} /> : null}

        {loading && !data ? <Loading label="Loading catalogue" /> : null}
        {error ? <p className="mt-2 border-l-2 border-shut pl-2 text-[0.75rem] text-shut">{error}</p> : null}

        <div className="mt-3 max-h-[70vh] overflow-y-auto border border-rule bg-white/40">
          {list.map((p) => {
            const packs = variants.filter((v) => v.product_id === p.id);
            const totalStock = packs.reduce((s, v) => s + v.stock, 0);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`block w-full border-b border-rule/70 px-3 py-2 text-left last:border-0 hover:bg-paper-2 ${
                  selectedId === p.id ? 'bg-paper-2' : ''
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`text-[0.82rem] ${p.is_active ? '' : 'text-ink-3 line-through'}`}>{p.name}</span>
                  <span className="shrink-0 font-mono text-[0.6rem] text-ink-3">{totalStock} pcs</span>
                </span>
                <span className="mt-0.5 block font-mono text-[0.5rem] uppercase tracking-[0.1em] text-ink-3">
                  {p.brand_name ?? 'Counter'} · {p.category_name} · {p.range_tier}
                </span>
              </button>
            );
          })}
          {!list.length && !loading ? <Empty>No product matches.</Empty> : null}
        </div>
      </div>

      <div>
        {selected && data ? (
          <ProductEditor
            key={selected.id}
            product={selected}
            variants={variants.filter((v) => v.product_id === selected.id)}
            brands={data.brands}
            categories={data.categories}
            onSaved={reload}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="border border-rule bg-white/40 p-5">
            <p className="text-[0.85rem] font-medium">Pick a product on the left to edit it.</p>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-2">
              Each pack size is its own line with its own rate and stock — 1 L, 4 L, 10 L, 20 L are billed separately,
              which is how the counter works.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewProduct({
  brands,
  categories,
  onDone,
  onClose,
}: {
  brands: BrandRow[];
  categories: CategoryRow[];
  onDone: () => void;
  onClose: () => void;
}) {
  const action = useAction();
  const [form, setForm] = useState({
    name: '',
    brandId: String(brands[0]?.id ?? ''),
    categoryId: String(categories[0]?.id ?? ''),
    range: 'Premium',
    finish: 'Matt',
    base: 'Water based',
    coverage: '120',
    coats: '2',
    blurb: '',
  });

  const save = async () => {
    const ok = await action.run(async () => {
      await apiSend('/api/admin/products', 'POST', {
        ...form,
        coverage: Number(form.coverage),
        coats: Number(form.coats),
        brandId: Number(form.brandId) || null,
        categoryId: Number(form.categoryId),
      });
      onDone();
      onClose();
      return true;
    });
    return ok;
  };

  return (
    <div className="mt-2 border border-rule bg-white/50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="np-name">
            Product name
          </label>
          <input id="np-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="np-brand">
            Brand
          </label>
          <select id="np-brand" className="input" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
            <option value="">Counter stock (no brand)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-cat">
            Category
          </label>
          <select id="np-cat" className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-range">
            Range
          </label>
          <select id="np-range" className="input" value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value })}>
            {['Economy', 'Premium', 'Luxury', 'Ultra'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-finish">
            Finish
          </label>
          <select id="np-finish" className="input" value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })}>
            {['Matt', 'Sheen', 'Silk', 'Satin', 'Gloss', 'Texture', 'Tool'].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-cov">
            Coverage
          </label>
          <input id="np-cov" className="input font-mono" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="np-coats">
            Coats
          </label>
          <input id="np-coats" className="input font-mono" value={form.coats} onChange={(e) => setForm({ ...form, coats: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="np-blurb">
            One-line description
          </label>
          <input id="np-blurb" className="input" value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm btn-solid">
          Save product
        </button>
        <ErrorLine message={action.error} />
      </div>
      <p className="mt-1.5 text-[0.65rem] text-ink-3">Add pack sizes after saving — the product starts with no stock.</p>
    </div>
  );
}

function ProductEditor({
  product,
  variants,
  brands,
  categories,
  onSaved,
  onClose,
}: {
  product: AdminProduct;
  variants: AdminVariant[];
  brands: BrandRow[];
  categories: CategoryRow[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const action = useAction();
  const [form, setForm] = useState({
    name: product.name,
    brandId: product.brand_id ? String(product.brand_id) : '',
    categoryId: String(product.category_id),
    range: product.range_tier,
    finish: product.finish,
    base: product.base,
    coverage: String(product.coverage),
    coverageUnit: product.coverage_unit,
    coats: String(product.coats),
    blurb: product.blurb,
    isActive: Boolean(product.is_active),
  });

  const save = async () => {
    await action.run(async () => {
      await apiSend(`/api/admin/products/${product.id}`, 'PATCH', {
        ...form,
        brandId: form.brandId ? Number(form.brandId) : null,
        categoryId: Number(form.categoryId),
        coverage: Number(form.coverage),
        coats: Number(form.coats),
        isActive: form.isActive,
      });
      onSaved();
      return 'Product saved.';
    });
  };

  const deactivate = async () => {
    if (!window.confirm(`Remove ${product.name} from the public catalogue? Bills already written keep it.`)) return;
    await action.run(async () => {
      await apiSend(`/api/admin/products/${product.id}`, 'DELETE');
      onSaved();
      onClose();
      return 'Removed.';
    });
  };

  return (
    <div className="border border-ink bg-white/60">
      <div className="flex items-center justify-between border-b border-rule px-3 py-2">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-3">Edit product</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[0.65rem]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Listed
          </label>
          <button type="button" onClick={onClose} className="font-mono text-[0.65rem] text-ink-3 hover:text-ink">
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-2 px-3 py-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pe-name">
            Name
          </label>
          <input id="pe-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="pe-brand">
            Brand
          </label>
          <select id="pe-brand" className="input" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
            <option value="">Counter stock</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pe-cat">
            Category
          </label>
          <select id="pe-cat" className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pe-range">
            Range
          </label>
          <select id="pe-range" className="input" value={form.range} onChange={(e) => setForm({ ...form, range: e.target.value })}>
            {['Economy', 'Premium', 'Luxury', 'Ultra'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pe-finish">
            Finish
          </label>
          <input id="pe-finish" className="input" value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="pe-base">
            Base
          </label>
          <input id="pe-base" className="input" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="pe-cov">
              Coverage
            </label>
            <input id="pe-cov" className="input font-mono" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pe-coats">
              Coats
            </label>
            <input id="pe-coats" className="input font-mono" value={form.coats} onChange={(e) => setForm({ ...form, coats: e.target.value })} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pe-blurb">
            Description shown on the site
          </label>
          <textarea
            id="pe-blurb"
            className="input min-h-[64px]"
            value={form.blurb}
            onChange={(e) => setForm({ ...form, blurb: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-rule px-3 py-2">
        <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm btn-solid">
          Save product
        </button>
        <button type="button" onClick={deactivate} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-shut">
          Remove from site
        </button>
        <ErrorLine message={action.error} />
        {action.ok ? <p className="text-[0.7rem] text-open">{action.ok}</p> : null}
      </div>

      <div className="border-t border-rule px-3 py-3">
        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-3">Pack sizes</p>
        <div className="mt-2 hidden grid-cols-[4.5rem_1fr_1fr_4rem_3.5rem_5.5rem_auto] gap-1.5 px-1.5 font-mono text-[0.5rem] uppercase tracking-[0.1em] text-ink-3 sm:grid">
          <span>Pack</span>
          <span className="text-right">Rate</span>
          <span className="text-right">MRP</span>
          <span className="text-right">Stock</span>
          <span className="text-right">Low at</span>
          <span>Batch / tint</span>
          <span />
        </div>
        <div className="mt-2 space-y-2">
          {variants.map((v) => (
            <VariantEditor key={v.id} variant={v} onSaved={onSaved} />
          ))}
          {!variants.length ? <p className="text-[0.75rem] text-ink-3">No packs yet. Add the first one below.</p> : null}
        </div>
        <NewVariant productId={product.id} onDone={onSaved} />
      </div>
    </div>
  );
}

function VariantEditor({ variant, onSaved }: { variant: AdminVariant; onSaved: () => void }) {
  const action = useAction();
  const [pack, setPack] = useState(variant.pack_size);
  const [mrp, setMrp] = useState(String(variant.mrp));
  const [price, setPrice] = useState(String(variant.price));
  const [stock, setStock] = useState(String(variant.stock));
  const [low, setLow] = useState(String(variant.low_stock_at));
  const [batch, setBatch] = useState(variant.batch ?? '');

  const save = async () => {
    await action.run(async () => {
      await apiSend(`/api/admin/variants/${variant.id}`, 'PATCH', {
        packSize: pack,
        mrp: Number(mrp) || 0,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        lowStockAt: Number(low) || 0,
        batch,
      });
      onSaved();
      return true;
    });
  };

  const remove = async () => {
    if (!window.confirm(`Delete the ${variant.pack_size} pack?`)) return;
    await action.run(async () => {
      await apiSend(`/api/admin/variants/${variant.id}`, 'DELETE');
      onSaved();
      return true;
    });
  };

  return (
    <div className="grid grid-cols-2 items-center gap-1.5 border border-rule/70 bg-white/60 p-1.5 sm:grid-cols-[4.5rem_1fr_1fr_4rem_3.5rem_5.5rem_auto]">
      <input className="input px-1 py-1 font-mono text-[0.7rem]" value={pack} onChange={(e) => setPack(e.target.value)} aria-label="Pack size" placeholder="1 L" />
      <input className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Rate" />
      <input className="input px-1 py-1 text-right font-mono text-[0.7rem] text-ink-3" value={mrp} onChange={(e) => setMrp(e.target.value)} aria-label="MRP" />
      <input className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={stock} onChange={(e) => setStock(e.target.value)} aria-label="Stock" />
      <input className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={low} onChange={(e) => setLow(e.target.value)} aria-label="Low stock at" />
      <input
        className="input px-1 py-1 font-mono text-[0.65rem] text-ink-2"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        aria-label="Batch or tint note"
        placeholder="Batch / tint"
      />
      <div className="col-span-2 flex items-center justify-between gap-1 sm:col-span-1 sm:justify-start">
        <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm border-rule px-1.5 py-1 text-[0.55rem]">
          Save
        </button>
        <button type="button" onClick={remove} className="font-mono text-[0.6rem] text-ink-3 hover:text-shut" aria-label="Delete pack">
          ✕
        </button>
      </div>
      {action.error ? <p className="col-span-2 text-[0.6rem] text-shut sm:col-span-7">{action.error}</p> : null}
    </div>
  );
}

function NewVariant({ productId, onDone }: { productId: number; onDone: () => void }) {
  const action = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ packSize: '', mrp: '', price: '', stock: '0', batch: '' });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-oxide hover:underline">
        + Add a pack size
      </button>
    );
  }

  const save = async () => {
    const ok = await action.run(async () => {
      await apiSend(`/api/admin/products/${productId}/variants`, 'POST', {
        packSize: form.packSize,
        mrp: Number(form.mrp) || 0,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        batch: form.batch,
      });
      setForm({ packSize: '', mrp: '', price: '', stock: '0', batch: '' });
      setOpen(false);
      onDone();
      return true;
    });
    return ok;
  };

  return (
    <div className="mt-2 flex flex-wrap items-end gap-1.5">
      <div className="w-20">
        <label className="label" htmlFor="nv-pack">
          Pack
        </label>
        <input id="nv-pack" className="input px-1 py-1 font-mono text-[0.7rem]" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} placeholder="4 L" />
      </div>
      <div className="w-20">
        <label className="label" htmlFor="nv-price">
          Rate
        </label>
        <input id="nv-price" className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </div>
      <div className="w-20">
        <label className="label" htmlFor="nv-mrp">
          MRP
        </label>
        <input id="nv-mrp" className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
      </div>
      <div className="w-16">
        <label className="label" htmlFor="nv-stock">
          Stock
        </label>
        <input id="nv-stock" className="input px-1 py-1 text-right font-mono text-[0.7rem]" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
      </div>
      <div className="w-28">
        <label className="label" htmlFor="nv-batch">
          Batch / tint
        </label>
        <input
          id="nv-batch"
          className="input px-1 py-1 font-mono text-[0.7rem]"
          value={form.batch}
          onChange={(e) => setForm({ ...form, batch: e.target.value })}
          placeholder="B264"
        />
      </div>
      <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm btn-solid">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="font-mono text-[0.6rem] text-ink-3 hover:text-ink">
        Cancel
      </button>
      <ErrorLine message={action.error} />
    </div>
  );
}

// ── Shades ───────────────────────────────────────────────────────────────────

const EMPTY_SHADE = { code: '', name: '', family: 'Whites & Off-whites', hex: '#E8E2D2', lrv: '', finishes: 'Matt, Sheen, Silk' };

function ShadesTab() {
  const { data, loading, error, reload } = useApi<{ shades: AdminShade[] }>('/api/admin/shades');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<AdminShade | null>(null);
  const [creating, setCreating] = useState(false);

  const shades = (data?.shades ?? []).filter((s) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    return `${s.code} ${s.name} ${s.family}`.toLowerCase().includes(query);
  });

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-72">
          <label htmlFor="sh-q" className="label">
            Search code, name or family
          </label>
          <input id="sh-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="RG-1041" />
        </div>
        <span className="font-mono text-[0.625rem] text-ink-3">{shades.length} shades</span>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-sm btn-solid ml-auto">
          + New shade
        </button>
      </div>

      {loading && !data ? <Loading label="Loading the card" /> : null}
      {error ? <p className="mt-2 border-l-2 border-shut pl-2 text-[0.75rem] text-shut">{error}</p> : null}

      <div className="mt-3 max-h-[65vh] overflow-auto border border-rule bg-white/40">
        <table className="admin-table min-w-[34rem]">
          <thead className="sticky top-0 bg-paper">
            <tr>
              <th className="w-10" />
              <th>Code</th>
              <th>Name</th>
              <th>Family</th>
              <th className="text-right">LRV</th>
              <th>Finishes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shades.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="block h-6 w-6 border border-rule" style={{ backgroundColor: s.hex }} />
                </td>
                <td className="font-mono text-[0.65rem]">{s.code}</td>
                <td className="text-[0.78rem]">{s.name}</td>
                <td className="text-[0.7rem] text-ink-3">{s.family}</td>
                <td className="text-right font-mono text-[0.65rem]">{s.lrv}</td>
                <td className="text-[0.62rem] text-ink-3">{s.finishes}</td>
                <td className="text-right">
                  <button type="button" onClick={() => setEditing(s)} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-ink">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shades.length && !loading ? <Empty>No shade matches that.</Empty> : null}
      </div>

      <ShadeModal
        open={creating || Boolean(editing)}
        shade={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={reload}
      />
    </div>
  );
}

function ShadeModal({
  open,
  shade,
  onClose,
  onSaved,
}: {
  open: boolean;
  shade: AdminShade | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const action = useAction();
  const [form, setForm] = useState(EMPTY_SHADE);

  // Reset the draft whenever the modal opens for a different row.
  const [currentId, setCurrentId] = useState<number | null>(null);
  if (open && (shade?.id ?? null) !== currentId) {
    setCurrentId(shade?.id ?? null);
    setForm(
      shade
        ? { code: shade.code, name: shade.name, family: shade.family, hex: shade.hex, lrv: String(shade.lrv), finishes: shade.finishes }
        : EMPTY_SHADE,
    );
  }
  if (!open && currentId !== null) setCurrentId(null);

  const save = async () => {
    const ok = await action.run(async () => {
      const body = {
        code: form.code,
        name: form.name,
        family: form.family,
        hex: form.hex,
        lrv: form.lrv ? Number(form.lrv) : undefined,
        finishes: form.finishes,
      };
      if (shade) await apiSend(`/api/admin/shades/${shade.id}`, 'PATCH', body);
      else await apiSend('/api/admin/shades', 'POST', body);
      onSaved();
      onClose();
      return true;
    });
    return ok;
  };

  const remove = async () => {
    if (!shade) return;
    if (!window.confirm(`Delete shade ${shade.code} ${shade.name} from the card?`)) return;
    await action.run(async () => {
      await apiSend(`/api/admin/shades/${shade.id}`, 'DELETE');
      onSaved();
      onClose();
      return true;
    });
  };

  return (
    <Modal open={open} title={shade ? `Shade ${shade.code}` : 'New shade'} onClose={onClose}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sd-code">
            Code
          </label>
          <input id="sd-code" className="input font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="RG-1701" />
        </div>
        <div>
          <label className="label" htmlFor="sd-name">
            Name
          </label>
          <input id="sd-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Monsoon Grey" />
        </div>
        <div>
          <label className="label" htmlFor="sd-family">
            Family
          </label>
          <input id="sd-family" className="input" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="sd-hex">
            Colour
          </label>
          <div className="flex items-center gap-2">
            <input
              id="sd-hex"
              type="color"
              className="h-8 w-10 border border-rule bg-white p-0.5"
              value={form.hex}
              onChange={(e) => setForm({ ...form, hex: e.target.value.toUpperCase() })}
            />
            <input className="input font-mono" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value.toUpperCase() })} aria-label="Hex value" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="sd-lrv">
            LRV (blank = calculate)
          </label>
          <input id="sd-lrv" className="input font-mono" value={form.lrv} onChange={(e) => setForm({ ...form, lrv: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="sd-fin">
            Finishes
          </label>
          <input id="sd-fin" className="input" value={form.finishes} onChange={(e) => setForm({ ...form, finishes: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm btn-solid">
          Save shade
        </button>
        {shade ? (
          <button type="button" onClick={remove} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-shut">
            Delete
          </button>
        ) : null}
        <ErrorLine message={action.error} />
      </div>
      <p className="mt-2 text-[0.65rem] leading-relaxed text-ink-3">
        Saving a shade updates the public shade card. Products pick it up automatically by finish.
      </p>
    </Modal>
  );
}

// ── Offers ───────────────────────────────────────────────────────────────────

const EMPTY_OFFER = { tag: '', title: '', detail: '', saving: '', sort: '99' };

function OffersTab() {
  const { data, loading, error, reload } = useApi<{ offers: AdminOffer[] }>('/api/admin/offers');
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [creating, setCreating] = useState(false);
  const action = useAction();

  const offers = data?.offers ?? [];

  const toggle = async (o: AdminOffer) => {
    await action.run(async () => {
      await apiSend(`/api/admin/offers/${o.id}`, 'PATCH', { isActive: !o.is_active });
      reload();
      return true;
    });
  };

  const remove = async (o: AdminOffer) => {
    if (!window.confirm(`Delete the offer "${o.title}"?`)) return;
    await action.run(async () => {
      await apiSend(`/api/admin/offers/${o.id}`, 'DELETE');
      reload();
      return true;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[0.78rem] text-ink-3">{offers.length} bundles on the offers page</p>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-sm btn-solid">
          + New offer
        </button>
      </div>

      {loading && !data ? <Loading label="Loading offers" /> : null}
      {error ? <p className="mt-2 border-l-2 border-shut pl-2 text-[0.75rem] text-shut">{error}</p> : null}

      <div className="mt-3 space-y-2">
        {offers.map((o) => (
          <article key={o.id} className={`border border-rule bg-white/40 p-3 ${o.is_active ? '' : 'opacity-60'}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-3">{o.tag || 'Offer'}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => toggle(o)} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-ink">
                  {o.is_active ? 'Hide' : 'Show'}
                </button>
                <button type="button" onClick={() => setEditing(o)} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-ink">
                  Edit
                </button>
                <button type="button" onClick={() => remove(o)} className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3 hover:text-shut">
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-1 text-[0.9rem] font-semibold">{o.title}</p>
            <p className="mt-0.5 text-[0.78rem] leading-relaxed text-ink-2">{o.detail}</p>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-3">{o.saving}</p>
          </article>
        ))}
      </div>

      <OfferModal
        open={creating || Boolean(editing)}
        offer={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={reload}
      />
    </div>
  );
}

function OfferModal({
  open,
  offer,
  onClose,
  onSaved,
}: {
  open: boolean;
  offer: AdminOffer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const action = useAction();
  const [form, setForm] = useState(EMPTY_OFFER);
  const [currentId, setCurrentId] = useState<number | null>(null);

  if (open && (offer?.id ?? null) !== currentId) {
    setCurrentId(offer?.id ?? null);
    setForm(
      offer
        ? { tag: offer.tag, title: offer.title, detail: offer.detail, saving: offer.saving, sort: String(offer.sort) }
        : EMPTY_OFFER,
    );
  }
  if (!open && currentId !== null) setCurrentId(null);

  const save = async () => {
    await action.run(async () => {
      const body = { ...form, sort: Number(form.sort) || 99 };
      if (offer) await apiSend(`/api/admin/offers/${offer.id}`, 'PATCH', body);
      else await apiSend('/api/admin/offers', 'POST', body);
      onSaved();
      onClose();
      return true;
    });
  };

  return (
    <Modal open={open} title={offer ? 'Edit offer' : 'New offer'} onClose={onClose}>
      <div className="grid gap-2">
        <div>
          <label className="label" htmlFor="of-tag">
            Tag
          </label>
          <input id="of-tag" className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Interior combo" />
        </div>
        <div>
          <label className="label" htmlFor="of-title">
            Title
          </label>
          <input id="of-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="of-detail">
            Detail
          </label>
          <textarea id="of-detail" className="input min-h-[72px]" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="of-saving">
              Saving line
            </label>
            <input id="of-saving" className="input" value={form.saving} onChange={(e) => setForm({ ...form, saving: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="of-sort">
              Order
            </label>
            <input id="of-sort" className="input font-mono" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={save} disabled={action.busy} className="btn btn-sm btn-solid">
          Save offer
        </button>
        <ErrorLine message={action.error} />
      </div>
    </Modal>
  );
}

