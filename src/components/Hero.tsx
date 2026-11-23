import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useApi, type Counts, type Shade, type ShadesPayload } from '../lib/api';
import { site, telLink, whatsappLink } from '../site.config';
import { OpenStatus } from './OpenStatus';
import { TintTin } from './TintTin';
import { brandByIndex } from '../lib/brands';
import { hoursSummary } from '../lib/hours';

// Shown until /api/shades answers, so the hero never pops in empty.
const FALLBACK: Shade[] = [
  { id: 1, code: 'RG-1121', name: 'Terracotta', family: 'Orange & Terracotta', hex: '#C97A54', lrv: 45, finishes: 'Sheen, Satin, Gloss' },
  { id: 2, code: 'RG-1281', name: 'Indigo Ink', family: 'Blue', hex: '#2C4C7A', lrv: 26, finishes: 'Sheen, Satin, Gloss' },
  { id: 3, code: 'RG-1401', name: 'Sage Brush', family: 'Olive & Sage', hex: '#9AA383', lrv: 62, finishes: 'Matt, Sheen, Silk, Satin' },
  { id: 4, code: 'RG-1081', name: 'Marigold', family: 'Yellows & Ochre', hex: '#E3B93C', lrv: 56, finishes: 'Matt, Sheen, Silk, Satin' },
  { id: 5, code: 'RG-1001', name: 'Chuna White', family: 'Whites & Off-whites', hex: '#F7F4EC', lrv: 97, finishes: 'Matt, Sheen, Silk, Satin' },
  { id: 6, code: 'RG-1521', name: 'Charcoal Bloom', family: 'Charcoal & Black', hex: '#242420', lrv: 14, finishes: 'Sheen, Satin, Gloss' },
];

function pickEvenly<T>(list: T[], count: number): T[] {
  if (list.length <= count) return list;
  const step = list.length / count;
  return Array.from({ length: count }, (_, i) => list[Math.floor(i * step)]);
}

export function Hero() {
  const shades = useApi<ShadesPayload>('/api/shades');
  const counts = useApi<Counts>('/api/settings');
  const pool = shades.data?.shades?.length ? shades.data.shades : FALLBACK;
  const picks = useMemo(() => pickEvenly(pool, 6), [pool]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = picks[index % picks.length];
  const brand = brandByIndex(index);
  const shadeCount = counts.data?.counts.shades ?? shades.data?.shades.length ?? 315;

  useEffect(() => {
    if (paused || picks.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % picks.length), 3500);
    return () => window.clearInterval(timer);
  }, [paused, picks.length]);

  return (
    <section className="relative overflow-hidden">
      {/* Loose paint shapes behind the whole hero. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-28 top-2 h-80 w-80 bg-sun/35 blur-2xl" />
        <div className="blob-2 absolute -right-24 top-16 h-[26rem] w-[26rem] bg-pink/20 blur-3xl" />
        <div className="blob absolute bottom-0 left-1/3 h-64 w-64 bg-mint/20 blur-3xl" />
        <div className="dot-grid absolute inset-0 opacity-40" />
      </div>

      <div className="shell relative grid gap-12 pb-16 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-mint" />
              Paint shop · Teliyarganj
            </span>
            <span className="rounded-full bg-ink px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-paper">
              since {site.since}
            </span>
          </div>

          <h1 className="h1 mt-5 max-w-[15ch] text-balance">
            The wall you keep{' '}
            <span className="marker" style={{ '--marker': active.hex } as CSSProperties}>
              picturing
            </span>
            , mixed at our counter.
          </h1>

          <p key={active.code} className="tint-swap mt-5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border-2 border-ink/10 bg-white/85 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink-2">
            <span className="h-3 w-3 rounded-full border border-ink/10" style={{ backgroundColor: active.hex }} />
            <span className="font-mono">{active.code}</span>
            <span className="normal-case tracking-normal text-ink-3">{active.name}</span>
            <span className="text-ink-3">/</span>
            mixed here
          </p>

          <p className="mt-5 max-w-xl text-[0.98rem] leading-relaxed text-ink-2">
            Five brands on the shelf, a tinting machine at the back, and a counter that has been selling to this
            neighbourhood since {site.since}. Bring the painter&apos;s list or just a photo of the wall; we will work out
            the packs, the shade code and the bill.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/shades" className="btn btn-solid btn-lg">
              Open the shade card
            </Link>
            <a
              href={whatsappLink('Namaste, here is the painter\u2019s list. Please send a quote.')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-quiet btn-lg"
            >
              WhatsApp a photo
            </a>
          </div>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl border border-rule bg-white/80 p-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-3">Counter</p>
              <div className="mt-1.5">
                <OpenStatus />
              </div>
              <p className="mt-1 text-[0.58rem] font-semibold text-ink-3">{hoursSummary()}</p>
            </div>
            <div className="rounded-2xl border border-rule bg-white/80 p-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-3">Find us</p>
              <address className="mt-1.5 not-italic text-[0.72rem] font-semibold leading-snug text-ink-2">
                {site.address.lines[0]}
                <br />
                {site.address.lines[1]}
              </address>
              <a
                href={site.address.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[0.6rem] font-bold uppercase tracking-[0.08em] text-oxide underline decoration-2 underline-offset-2"
              >
                Directions →
              </a>
            </div>
            <div className="rounded-2xl border border-rule bg-white/80 p-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-3">Talk to us</p>
              <a href={telLink} className="mt-1.5 block font-mono text-[0.74rem] font-medium text-ink hover:text-oxide">
                {site.phoneDisplay}
              </a>
              <p className="mt-1 text-[0.6rem] font-semibold leading-relaxed text-ink-3">
                {shadeCount} shades mixed
                <br />
                GST bill on request
              </p>
            </div>
          </div>
        </div>

        {/* The tint machine: drawn tin, live label, six chips. */}
        <aside
          className="relative"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          aria-label="Live tint preview"
        >
          <span className="sticker absolute -right-2 -top-3 z-20 rotate-6">live tint</span>
          <div className="card relative overflow-hidden p-4 sm:p-6">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sun/25 blur-2xl" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-3">Counter 01</p>
                <p className="font-display text-lg font-bold leading-none">The tint machine</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-mint">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                mixing
              </span>
            </div>

            <div key={active.code} className="tint-swap mt-1">
              <TintTin shade={active} brand={brand} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-1.5" role="group" aria-label="Pick a shade to tint">
              {picks.map((s, i) => (
                <button
                  key={`${s.code}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  aria-label={`Tint the tin ${s.code} ${s.name}`}
                  title={`${s.code} ${s.name}`}
                  className={`relative h-10 flex-1 rounded-xl border-2 transition-all duration-200 ease-out ${
                    i === index
                      ? '-translate-y-1 border-ink shadow-hard-sm'
                      : 'border-white/80 hover:-translate-y-1 hover:border-ink/40'
                  }`}
                  style={{ backgroundColor: s.hex }}
                >
                  {i === index ? (
                    <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_0_2px_rgba(36,27,20,0.25)]" />
                  ) : null}
                </button>
              ))}
            </div>

            <p className="mt-3 text-center text-[0.62rem] font-semibold leading-relaxed text-ink-3">
              Tap a chip to tint the tin · {brand.name} {brand.range}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
