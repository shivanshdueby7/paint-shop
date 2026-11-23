import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi, type Catalog, type Counts, type ShadesPayload } from '../lib/api';
import { site, whatsappLink, telLink, ranges } from '../site.config';
import { SectionHead } from '../components/Section';
import { ProductCard } from '../components/ProductCard';
import { ShadeChip } from '../components/ShadeChip';
import { OpenStatus } from '../components/OpenStatus';
import { Hero } from '../components/Hero';
import { Marquee } from '../components/Marquee';
import { Reveal } from '../components/Reveal';
import { defaultBrand } from '../lib/brands';
import { isToday, hoursSummary } from '../lib/hours';
import { useTitle } from '../lib/useTitle';

function pickEvenly<T>(list: T[], count: number): T[] {
  if (list.length <= count) return list;
  const step = list.length / count;
  return Array.from({ length: count }, (_, i) => list[Math.floor(i * step)]);
}

const RANGE_TONES = ['bg-sun text-ink', 'bg-mint/15 text-mint', 'bg-pink/15 text-pink', 'bg-oxide/10 text-oxide'];

export default function Home() {
  const shades = useApi<ShadesPayload>('/api/shades');
  const counts = useApi<Counts>('/api/settings');
  const catalog = useApi<Catalog>('/api/catalog');
  useTitle(
    'Rang Ghar Paint & Hardware — Paint shop in Teliyarganj, Prayagraj',
    'Paint, primer, putty and hardware in Teliyarganj, Prayagraj. Asian Paints, Berger, Nerolac, Birla Opus and Birla White. Shade card, tinting while you wait, GST bill, contractor khata.',
  );

  const shadeList = shades.data?.shades ?? [];
  const wall = useMemo(() => pickEvenly(shadeList, 48), [shadeList]);
  const marquee = useMemo(() => pickEvenly(shadeList, 22), [shadeList]);
  const products = catalog.data?.products ?? [];
  const shadeCount = counts.data?.counts.shades ?? shadeList.length;
  const productCount = counts.data?.counts.products ?? products.length;
  const shelf = useMemo(() => pickEvenly(products, 8), [products]);

  return (
    <div>
      <Hero />
      <Marquee shades={marquee} />

      {/* The wall — hover any chip for its code, name, LRV and brand. */}
      <section className="shell pt-16 sm:pt-24">
        <Reveal>
          <SectionHead
            eyebrow="The shade card"
            tone="pink"
            title="Three hundred shades, one wall"
            note={`Every chip is a painted surface, not a screen colour. Pick the ones you like and send the whole list in one message — we mix them at the counter in ${defaultBrand.name} ${defaultBrand.range}, or any of the other brands on the shelf.`}
            action={
              <Link to="/shades" className="btn btn-sun">
                Open the full card <span aria-hidden="true">→</span>
              </Link>
            }
          />
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {wall.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 16, 240)}>
              <Link
                to={`/shades?q=${encodeURIComponent(s.code)}`}
                className="block transition-transform duration-200 ease-out hover:-translate-y-1"
              >
                <ShadeChip shade={s} size="sm" />
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/wall" className="link-u">
            Compare four on a wall →
          </Link>
          <p className="max-w-2xl text-[0.74rem] leading-relaxed text-ink-3">
            Screen colours are approximate. The physical card sits at the counter under a daylight lamp — that is the one
            to trust. A ₹40 sample pot is the cheapest way to be sure.
          </p>
        </div>
      </section>

      {/* Numbers */}
      <section className="shell mt-16 sm:mt-24">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-9 text-paper sm:px-10">
            <div aria-hidden="true" className="blob absolute -right-20 -top-24 h-64 w-64 bg-oxide/60 blur-2xl" />
            <div aria-hidden="true" className="blob-2 absolute -bottom-28 left-1/4 h-56 w-56 bg-pink/20 blur-3xl" />
            <div className="relative grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { k: site.brands.length, l: 'brands on the shelf', sub: 'Asian Paints, Berger, Nerolac, Birla Opus, Birla White' },
                { k: shadeCount, l: 'shades mixed here', sub: 'Any code on our card, in 1 L to 20 L' },
                { k: productCount, l: 'products in the catalogue', sub: 'Every pack size priced separately' },
                { k: new Date().getFullYear() - site.since, l: 'years at this counter', sub: 'Same family, same corner' },
              ].map((s, i) => (
                <div key={s.l} className={i > 0 ? 'border-white/15 pl-0 sm:border-l-2 sm:pl-5' : ''}>
                  <p className="font-display text-4xl font-extrabold leading-none text-sun">{s.k}</p>
                  <p className="mt-1.5 text-[0.84rem] font-bold">{s.l}</p>
                  <p className="mt-1 text-[0.7rem] leading-snug text-paper/55">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Ranges */}
      <section className="shell pt-16 sm:pt-24">
        <Reveal>
          <SectionHead
            eyebrow="Four ranges"
            tone="mint"
            title="Four ranges, not a wall of tins"
            note="Every brand sells in grades. We tell you which grade actually suits the room instead of pushing the top tin at you — the difference between Economy and Luxury is mostly washability and how the colour holds after two monsoons."
            action={
              <Link to="/products" className="btn btn-quiet">
                Full catalogue <span aria-hidden="true">→</span>
              </Link>
            }
          />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ranges.map((r, i) => {
            const items = products.filter((p) => p.range === r.tier).slice(0, 3);
            const total = products.filter((p) => p.range === r.tier).length;
            return (
              <Reveal key={r.tier} delay={i * 70}>
                <div className="card group flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${RANGE_TONES[i]}`}>
                      {i + 1}
                    </span>
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-3">{total} packs</span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-[-0.01em]">{r.tier}</h3>
                  <p className="mt-1.5 min-h-[3.5rem] text-[0.82rem] leading-relaxed text-ink-2">{r.line}</p>
                  <ul className="mt-3 space-y-1 border-t border-rule pt-3">
                    {items.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/products/${p.slug}`}
                          className="text-[0.8rem] font-semibold text-ink-2 transition-colors hover:text-oxide"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                    {!items.length ? <li className="text-[0.8rem] text-ink-3">Ask at the counter</li> : null}
                  </ul>
                  <p className="mt-3 text-[0.7rem] leading-snug text-ink-3">{r.note}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Shelf */}
      <section className="shell pt-16 sm:pt-24">
        <Reveal>
          <SectionHead
            eyebrow="On the shelf"
            tone="tangerine"
            title="Off the shelf, with the rate on it"
            note="Every pack is drawn in its own colour, so a putty sack, a 20 L pail and a primer drum do not all look the same. Hover any card to see the colours it can be tinted in."
            action={
              <Link to="/products" className="btn btn-quiet">
                All {productCount} products <span aria-hidden="true">→</span>
              </Link>
            }
          />
        </Reveal>
        <Reveal className="mt-8" delay={80}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {shelf.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* Calculator + services */}
      <section className="shell grid gap-5 pt-16 lg:grid-cols-2 lg:gap-6 lg:pt-24">
        <Reveal>
          <div className="card flex h-full flex-col p-6 sm:p-8">
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-sun" />
              The 2.5 rule
            </span>
            <h2 className="h2 mt-3">How much paint, actually</h2>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-2">
              The rule every painter in this market uses: carpet area × 2.5 gives the paintable area, walls plus ceiling.
              Two coats of emulsion at 120–130 sq ft per litre. The calculator does the rest and tells you the pack sizes
              to buy.
            </p>
            <div className="mt-5 rounded-2xl bg-paper-2/70 p-4 font-mono text-xs leading-relaxed text-ink-2">
              <p className="text-ink-3">carpet area × 2.5 = paintable area</p>
              <p className="text-ink-3">× 2 coats ÷ 125 sq ft per litre = litres</p>
              <p className="mt-2 font-medium text-ink">900 sq ft flat → 2,250 sq ft → ~36 L emulsion</p>
              <p className="mt-1 text-ink-3">plus primer ~1 coat and putty ~2 coats, both cheaper per sq ft</p>
            </div>
            <Link to="/calculator" className="btn btn-solid mt-5 self-start">
              Open the calculator
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="card flex h-full flex-col p-6 sm:p-8">
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-mint" />
              At the counter
            </span>
            <h2 className="h2 mt-3">What happens when you come in</h2>
            <ul className="mt-5 space-y-3.5">
              {[
                ['Tinting while you wait', 'Ten minutes for a 4 L, a little longer for deep shades.', 'bg-sun'],
                ['Shade sitting under the lamp', 'Twenty minutes, free, before you commit to a tin.', 'bg-pink'],
                ['Delivery in Teliyarganj and Jhalwa', 'Free above ₹3,000 inside Teliyarganj, Jhalwa and Awas Vikas. Beyond that we add the rickshaw fare.', 'bg-mint'],
                ['Painter names we can vouch for', 'Three or four, not a directory. You deal with them directly.', 'bg-oxide'],
              ].map(([title, body, dot]) => (
                <li key={title} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                  <div>
                    <p className="text-[0.92rem] font-bold">{title}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-relaxed text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/services" className="link-u mt-5 self-start">
              All services →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Visit */}
      <section className="shell pt-16 sm:pt-24">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <Reveal variant="left">
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink shadow-hard">
              <img
                src="/images/shop-counter.jpg"
                alt="The counter at Rang Ghar: stacked tins, pails and a wall of painted shade samples"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="sticker absolute bottom-3 left-3 rotate-[-2deg]">The godown · shade wall</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Find us</p>
                <address className="mt-2 not-italic text-[0.9rem] font-bold leading-snug">
                  {site.address.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </div>
              <p className="max-w-sm self-end text-[0.78rem] leading-relaxed text-ink-3">
                Look for the blue shutter with the shade card taped to the glass, next to the hardware shop that sells
                locks. Parking for two-wheelers in front, cars on the side lane.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card p-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Counter hours</p>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {site.hours.map((h) => (
                    <tr key={h.label} className={`border-b border-rule/70 ${isToday(h) ? 'bg-sun/15' : ''}`}>
                      <td className="py-2.5 pr-3 text-ink-2">
                        {h.label}
                        {isToday(h) ? (
                          <span className="ml-2 rounded-full bg-oxide px-2 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.08em] text-white">
                            today
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {h.windows.map(([a, b]) => (
                          <span key={a} className="block">
                            {a} – {b}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-3">{hoursSummary()}</p>
              <div className="mt-4">
                <OpenStatus showDetail />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a href={site.address.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-solid">
                  Get directions
                </a>
                <a href={telLink} className="btn btn-quiet">
                  Call the counter
                </a>
                <a
                  href={whatsappLink('Namaste, I want to ask about paint.')}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-quiet sm:col-span-2"
                >
                  WhatsApp the shop
                </a>
              </div>
              <Link to="/visit" className="link-u mt-4 inline-block text-[0.72rem]">
                Delivery &amp; FAQ →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
