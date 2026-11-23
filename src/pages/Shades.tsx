import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi, shadesByFamily, type Shade, type ShadesPayload } from '../lib/api';
import { ShadeChip } from '../components/ShadeChip';
import { brandBySlug, defaultBrand, paintBrands } from '../lib/brands';
import { EnquiryForm } from '../components/EnquiryForm';
import { whatsappLink } from '../site.config';
import { useTitle } from '../lib/useTitle';

export default function Shades() {
  useTitle(
    'Shade card — Rang Ghar Paint & Hardware, Teliyarganj',
    'Every shade we can mix at the counter in Teliyarganj, Prayagraj: code, name, colour family, hex and light reflectance value. Pick a list and send it in one message.',
  );
  const { data, error, loading } = useApi<ShadesPayload>('/api/shades');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // A shade chip anywhere on the site links here with ?q=CODE, so the card opens
  // already filtered to that colour instead of dumping 315 chips on you.
  const linked = params.get('q') ?? params.get('code') ?? '';
  const [query, setQuery] = useState(linked);
  const [family, setFamily] = useState('all');
  const [brandSlug, setBrandSlug] = useState(defaultBrand.slug);
  const [selected, setSelected] = useState<string[]>([]);
  const brand = brandBySlug(brandSlug);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    if (linked) setQuery(linked);
  }, [linked]);

  const shades = data?.shades ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shades.filter(
      (s) =>
        (family === 'all' || s.family === family) &&
        (!q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
    );
  }, [shades, query, family]);

  const groups = useMemo(() => shadesByFamily(filtered), [filtered]);
  const chosen = shades.filter((s) => selected.includes(s.code));
  const listText = chosen.map((s) => `${s.code} ${s.name}`).join('\n');

  const toggle = (shade: Shade) => {
    setSelected((prev) => (prev.includes(shade.code) ? prev.filter((c) => c !== shade.code) : [...prev, shade.code]));
  };

  return (
    <div className={selected.length ? 'pb-44' : ''}>
      <div className="shell pt-10 lg:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-pink" />
              Shade card
            </span>
            <h1 className="h1 mt-3 max-w-[15ch]">Every colour we can mix</h1>
          </div>
          <p className="max-w-md text-[0.9rem] leading-relaxed text-ink-2">
            {shades.length || 'Three hundred'} shades, sorted by family. Each chip is a painted surface and carries its
            code, name, light reflectance and the brand it is mixed in — LRV is how much light bounces back, so a low
            number is a deeper wall. Pick as many as you like; they all go in one message.
          </p>
        </div>

        <div className="card mt-8 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="shade-search" className="label">
                Search code or name
              </label>
              <input
                id="shade-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="RG-1041, Ivory, terracotta…"
                className="field"
              />
            </div>
            <div className="sm:w-64">
              <label htmlFor="shade-family" className="label">
                Family
              </label>
              <select
                id="shade-family"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className="input appearance-none bg-white font-semibold"
              >
                <option value="all">All families</option>
                {(data?.families ?? []).map((f) => (
                  <option key={f.label} value={f.label}>
                    {f.label} ({f.count})
                  </option>
                ))}
              </select>
            </div>
            <span className="rounded-full bg-paper-2 px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-ink-2">
              {filtered.length} shade{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <span className="mr-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">Mixed in</span>
            {paintBrands.map((b) => (
              <button
                key={b.slug}
                type="button"
                onClick={() => setBrandSlug(b.slug)}
                aria-pressed={b.slug === brand.slug}
                className={`chip !px-3 !py-1.5 !text-[0.68rem] ${b.slug === brand.slug ? 'chip-on' : ''}`}
              >
                {b.name}
              </button>
            ))}
            <span className="ml-auto text-[0.6rem] font-bold uppercase tracking-[0.08em] text-ink-3">{brand.range}</span>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-[0.78rem] leading-relaxed text-ink-3">
          {brand.note} Every code on this card is the shop&apos;s own — the brand line is where we mix it, not a claim
          that the shade belongs to that company.
        </p>

        {loading ? <p className="mt-8 text-sm font-semibold text-ink-3">Opening the card…</p> : null}
        {error ? (
          <p className="mt-8 rounded-2xl border border-shut/30 bg-shut/10 px-4 py-3 text-sm text-shut">
            The shade card did not load ({error}). The physical card is on the counter.
          </p>
        ) : null}

        {!loading && !error && !filtered.length ? (
          <p className="mt-8 text-sm text-ink-2">
            No shade matches that. Try the code without the RG prefix, or browse a family.
          </p>
        ) : null}

        <div className="mt-8 space-y-10">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{group.label}</h2>
                <span className="tag">{group.shades.length}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {group.shades.map((s) => (
                  <ShadeChip
                    key={s.id}
                    shade={s}
                    brand={brand}
                    selected={selected.includes(s.code)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-paper-2/60 p-5">
          <p className="max-w-2xl text-[0.75rem] leading-relaxed text-ink-3">
            Every chip is mixed in{' '}
            <span className="font-semibold text-ink-2">
              {brand.name} {brand.range}
            </span>{' '}
            unless you ask for another brand at the counter. The colour is still a screen approximation — paint reflects
            light, phones do not. Before a full house, take a ₹40 sample pot of two or three shades and paint a patch on
            the actual wall; morning light and evening tube light show very different colours.
          </p>
        </div>
      </div>

      {selected.length ? (
        <div className="fixed inset-x-0 bottom-0 z-30">
          {quoting ? (
            <div className="max-h-[60vh] overflow-y-auto border-t-2 border-ink bg-paper/95 backdrop-blur-xl">
              <div className="shell py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="eyebrow">Shade list enquiry</span>
                    <p className="mt-2 text-sm text-ink-2">
                      {selected.length} shade{selected.length > 1 ? 's' : ''} selected. Send it and we will come back
                      with rates and availability.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuoting(false)}
                    className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-ink-3 transition-colors hover:text-ink"
                  >
                    Close ✕
                  </button>
                </div>
                <div className="mt-4 max-w-2xl">
                  <EnquiryForm
                    kind="shade_list"
                    shadeCodes={selected}
                    defaultMessage={`Shade list from the website:\n${listText}\n\nPlease tell me rate and availability — mainly 4 L and 10 L.`}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t-2 border-ink bg-paper/95 shadow-[0_-12px_30px_-18px_rgba(36,27,20,0.4)] backdrop-blur-xl">
            <div className="shell flex flex-wrap items-center gap-3 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex -space-x-2">
                  {chosen.slice(0, 8).map((s) => (
                    <span
                      key={s.code}
                      className="h-7 w-7 rounded-full border-2 border-paper"
                      style={{ backgroundColor: s.hex }}
                      title={s.name}
                    />
                  ))}
                </div>
                <p className="truncate text-[0.72rem] font-semibold text-ink-2">
                  {selected.length} selected · {chosen.slice(0, 2).map((s) => s.name).join(', ')}
                  {selected.length > 2 ? ` +${selected.length - 2}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-ink-3 transition-colors hover:text-ink"
              >
                Clear
              </button>
              <a
                href={whatsappLink(`Namaste, shade list from the website:\n${listText}\n\nPlease tell me rate and availability.`)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-quiet"
              >
                WhatsApp the list
              </a>
              <button
                type="button"
                onClick={() => navigate(`/wall?shades=${chosen.slice(0, 4).map((s) => s.code).join(',')}`)}
                className="btn btn-sm btn-quiet"
              >
                Wall preview
              </button>
              <button type="button" onClick={() => setQuoting((v) => !v)} className="btn btn-sm btn-solid">
                {quoting ? 'Hide form' : 'Get a quote'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
