import { useApi, type Offer } from '../lib/api';
import { Reveal } from '../components/Reveal';
import { whatsappLink } from '../site.config';
import { useTitle } from '../lib/useTitle';

const TAG_TONES = [
  'bg-sun text-ink',
  'bg-pink text-white',
  'bg-mint text-white',
  'bg-oxide text-white',
  'bg-tangerine text-white',
  'bg-lilac text-ink',
];

export default function Offers() {
  useTitle(
    'Combos and contractor slabs — Rang Ghar Paint & Hardware, Teliyarganj',
    'Interior and exterior combos, full-house packages and the contractor bulk slab at Rang Ghar Paint & Hardware, Teliyarganj, Prayagraj.',
  );
  const { data, error, loading } = useApi<{ offers: Offer[] }>('/api/offers');
  const offers = data?.offers ?? [];

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-tangerine" />
            Offers
          </span>
          <h1 className="h1 mt-3 max-w-[18ch]">Bundles we actually hold stock for</h1>
        </div>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-2">
          No festival coupons and no &ldquo;up to 40% off&rdquo;. These are combinations we can put on one bill today,
          and a slab for contractors who buy through the month.
        </p>
      </div>

      {loading ? <p className="mt-8 text-sm font-semibold text-ink-3">Getting today&apos;s offers…</p> : null}
      {error ? (
        <p className="mt-8 rounded-2xl border border-shut/30 bg-shut/10 px-4 py-3 text-sm text-shut">
          Offers did not load ({error}).
        </p>
      ) : null}

      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {offers.map((o, i) => (
          <Reveal key={o.id} delay={Math.min(i * 70, 280)}>
            <article className="card group flex h-full flex-col p-5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift sm:p-6">
              <span
                className={`self-start rounded-full px-3 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] shadow-[0_3px_0_0_rgba(36,27,20,0.12)] ${
                  TAG_TONES[i % TAG_TONES.length]
                }`}
              >
                {o.tag}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold leading-tight tracking-[-0.01em]">{o.title}</h2>
              <p className="mt-2 flex-1 text-[0.9rem] leading-relaxed text-ink-2">{o.detail}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
                <p className="rounded-full bg-paper-2 px-3 py-1.5 font-mono text-[0.68rem] font-medium text-ink-2">
                  {o.saving}
                </p>
                <a
                  href={whatsappLink(`Namaste, I want to ask about the offer: ${o.title}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-quiet"
                >
                  Ask for the rate
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={80}>
        <div className="mt-10 rounded-[1.75rem] border-2 border-dashed border-rule-strong/70 bg-white/60 p-5 sm:p-6">
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-ink-3" />
            The fine print, in plain words
          </span>
          <ul className="mt-4 grid gap-2.5 text-[0.84rem] leading-relaxed text-ink-2 sm:grid-cols-2">
            {[
              'Combo rates are for the full bundle on one bill. Part of a bundle is billed at normal counter rate.',
              'Prices follow the company list; a combo quoted in March is not held in June.',
              'Contractor slabs are monthly, on billed value, and are settled against the khata — not on top of other discounts.',
              'Tinted packs cannot be returned, bundle or not.',
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-oxide" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
