import { useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { useApi, type Catalog } from '../lib/api';
import { useTitle } from '../lib/useTitle';

const TIERS = ['Economy', 'Premium', 'Luxury', 'Ultra'] as const;

export default function Products() {
  useTitle(
    'What we stock — Rang Ghar Paint & Hardware, Teliyarganj',
    'Asian Paints, Berger, Nerolac, Birla Opus and Birla White in Teliyarganj, Prayagraj. Interior and exterior emulsion, enamel, primer, putty, waterproofing and texture, with pack rates.',
  );
  const { data, error, loading } = useApi<Catalog>('/api/catalog');
  const [category, setCategory] = useState('all');
  const [finish, setFinish] = useState('all');
  const [brand, setBrand] = useState('all');
  const [tier, setTier] = useState<string>('all');

  const products = data?.products ?? [];
  const finishes = useMemo(
    () => [...new Set(products.map((p) => p.finish))].filter((f) => f && f !== 'Tool'),
    [products],
  );

  const filtered = products.filter(
    (p) =>
      (category === 'all' || p.categorySlug === category) &&
      (finish === 'all' || p.finish === finish) &&
      (brand === 'all' || p.brandSlug === brand) &&
      (tier === 'all' || p.range === tier),
  );

  const grouped = TIERS.map((t) => ({ tier: t, items: filtered.filter((p) => p.range === t) })).filter(
    (g) => g.items.length > 0,
  );

  const dirty = category !== 'all' || finish !== 'all' || brand !== 'all' || tier !== 'all';

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-tangerine" />
            Catalogue
          </span>
          <h1 className="h1 mt-3 max-w-[14ch]">What we stock</h1>
        </div>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-2">
          Rates below are counter rates with GST included, updated from the company price list. Every pack size is priced
          separately because that is how the bill is made.
        </p>
      </div>

      {loading ? <p className="mt-10 text-sm font-semibold text-ink-3">Loading the shelf…</p> : null}
      {error ? (
        <p className="mt-10 rounded-2xl border border-shut/30 bg-shut/10 px-4 py-3 text-sm text-shut">
          The catalogue did not load ({error}). Call the shop and we will read it out.
        </p>
      ) : null}

      {/* Finder: surface → finish → brand */}
      <section className="card mt-8 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: '1',
              label: 'Where it goes',
              value: category,
              set: setCategory,
              options: [{ v: 'all', label: 'Any surface' }, ...(data?.categories ?? []).map((c) => ({ v: c.slug, label: c.name }))],
            },
            {
              n: '2',
              label: 'Finish',
              value: finish,
              set: setFinish,
              options: [{ v: 'all', label: 'Any finish' }, ...finishes.map((f) => ({ v: f, label: f }))],
            },
            {
              n: '3',
              label: 'Brand',
              value: brand,
              set: setBrand,
              options: [{ v: 'all', label: 'Any brand' }, ...(data?.brands ?? []).map((b) => ({ v: b.slug, label: b.name }))],
            },
          ].map((step) => (
            <div key={step.n}>
              <label htmlFor={`f-${step.n}`} className="label">
                <span className="text-oxide">{step.n}</span> · {step.label}
              </label>
              <select
                id={`f-${step.n}`}
                value={step.value}
                onChange={(e) => step.set(e.target.value)}
                className="input appearance-none bg-white pr-8 font-semibold"
              >
                {step.options.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          <span className="mr-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Range</span>
          {[{ v: 'all', label: 'All' }, ...TIERS.map((t) => ({ v: t, label: t }))].map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTier(t.v)}
              className={`chip !px-3 !py-1.5 !text-[0.7rem] ${tier === t.v ? 'chip-on' : ''}`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-auto text-[0.64rem] font-bold uppercase tracking-[0.08em] text-ink-3">
            {filtered.length} of {products.length} products
          </span>
          {dirty ? (
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setFinish('all');
                setBrand('all');
                setTier('all');
              }}
              className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-oxide underline decoration-2 underline-offset-2"
            >
              Clear
            </button>
          ) : null}
        </div>
      </section>

      {!loading && !filtered.length ? (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-rule p-8 text-center">
          <p className="font-display text-xl font-bold">Nothing matches that combination on the shelf.</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-2">
            Loosen a filter, or ask at the counter — most brands will supply a range we do not keep in stock within two
            days.
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-[0.68rem] font-semibold text-ink-3">
        Hover a card — or tap Shades on a phone — to see the colours mixed in that pack.
      </p>

      {grouped.map((group, i) => (
        <Reveal key={group.tier} delay={i * 60}>
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold tracking-[-0.01em]">{group.tier}</h2>
              <span className="tag">{group.items.length} products</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {group.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </Reveal>
      ))}
    </div>
  );
}
