import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EnquiryForm } from '../components/EnquiryForm';
import { useApi, type Shade, type ShadesPayload } from '../lib/api';
import { defaultBrand } from '../lib/brands';
import { whatsappLink } from '../site.config';
import { useTitle } from '../lib/useTitle';

const MAX = 4;

const textOn = (lrv: number) => (lrv < 52 ? '#FFF6E9' : '#241B14');

export default function Wall() {
  useTitle(
    'Shade wall — put four colours side by side | Rang Ghar Paint & Hardware',
    'Compare four paint shades on a wall before you buy: daylight and tubelight, with code, family and light reflectance for each. Mixed at the counter in Teliyarganj, Prayagraj.',
  );
  const { data, error, loading } = useApi<ShadesPayload>('/api/shades');
  const [params] = useSearchParams();
  const initial = (params.get('shades') ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, MAX);

  const [picked, setPicked] = useState<string[]>(initial);
  const [seeded, setSeeded] = useState(initial.length > 0);
  const [light, setLight] = useState<'day' | 'lamp'>('day');
  const [query, setQuery] = useState('');
  const [quoting, setQuoting] = useState(false);

  const shades = data?.shades ?? [];

  // Three shades, evenly spaced across the card, so the wall is never empty.
  useEffect(() => {
    if (seeded || !shades.length) return;
    const step = Math.max(1, Math.floor(shades.length / 3));
    setPicked([shades[0], shades[step], shades[step * 2]].filter(Boolean).map((s) => s!.code));
    setSeeded(true);
  }, [shades, seeded]);

  const onWall = useMemo(
    () => picked.map((code) => shades.find((s) => s.code === code)).filter((s): s is Shade => Boolean(s)),
    [picked, shades],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return shades
      .filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [shades, query]);

  const sorted = useMemo(() => [...shades].sort((a, b) => a.lrv - b.lrv), [shades]);
  const presets = useMemo(() => {
    if (shades.length < 6) return [];
    const lights = shades.filter((s) => s.lrv >= 72).slice(0, 3);
    const dark = sorted[Math.floor(sorted.length * 0.05)];
    const mid = sorted[Math.floor(sorted.length * 0.4)];
    const pale = sorted[Math.floor(sorted.length * 0.92)];
    return [
      { label: 'Lightest three', codes: lights.map((s) => s.code) },
      { label: 'Light to dark', codes: [pale, mid, dark].filter(Boolean).map((s) => s.code) },
    ];
  }, [shades, sorted]);

  const add = (code: string) =>
    setPicked((prev) => (prev.includes(code) || prev.length >= MAX ? prev : [...prev, code]));
  const remove = (code: string) => setPicked((prev) => prev.filter((c) => c !== code));

  const listText = onWall.map((s) => `${s.code} ${s.name}`).join('\n');
  const caption =
    light === 'day'
      ? 'Daylight, 11 am — what the room looks like before the lamp goes on'
      : 'Tubelight, 8 pm — most walls read cooler and a shade duller';

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-lilac" />
            Shade wall
          </span>
          <h1 className="h1 mt-3 max-w-[15ch]">Four shades, one wall</h1>
        </div>
        <p className="max-w-md text-[0.9rem] leading-relaxed text-ink-2">
          A chip on a phone tells you nothing about a room. Put the shortlist side by side at wall size, switch the light,
          and look at the light reflectance numbers — a wall at LRV 80 bounces four times the light of one at 20.
        </p>
      </div>

      {loading ? <p className="mt-8 text-sm font-semibold text-ink-3">Painting the wall…</p> : null}
      {error ? (
        <p className="mt-8 rounded-2xl border border-shut/30 bg-shut/10 px-4 py-3 text-sm text-shut">
          The shade card did not load ({error}).
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        {/* The wall */}
        <div>
          <div className="card p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                Wall 01 · {onWall.length} of {MAX} shades
              </p>
              <div className="flex items-center gap-1.5">
                {(['day', 'lamp'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLight(mode)}
                    className={`chip !px-3 !py-1.5 !text-[0.64rem] ${light === mode ? 'chip-on' : ''}`}
                  >
                    {mode === 'day' ? 'Daylight' : 'Tubelight'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.2rem] border-2 border-ink/15">
              <div className="flex" style={{ filter: light === 'lamp' ? 'brightness(0.9) saturate(0.94)' : 'none' }}>
                {onWall.length ? (
                  onWall.map((s) => (
                    <div
                      key={s.code}
                      className="relative h-[11rem] flex-1 border-r-2 border-white/20 last:border-r-0 sm:h-[14rem] lg:h-[17rem]"
                      style={{ backgroundColor: s.hex }}
                    >
                      <span
                        className="absolute left-2.5 top-2.5 font-mono text-[0.58rem] font-medium uppercase tracking-[0.1em]"
                        style={{ color: textOn(s.lrv) }}
                      >
                        {s.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(s.code)}
                        aria-label={`Take ${s.code} off the wall`}
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border-2 text-[0.65rem] font-bold leading-none opacity-70 transition-opacity hover:opacity-100"
                        style={{ color: textOn(s.lrv), borderColor: textOn(s.lrv) }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[11rem] flex-1 items-center justify-center bg-paper-2/60 px-6 text-center sm:h-[14rem] lg:h-[17rem]">
                    <p className="max-w-xs text-[0.85rem] leading-relaxed text-ink-3">
                      The wall is empty. Search a shade on the right, or load a preset.
                    </p>
                  </div>
                )}
              </div>
              <div className="h-1.5 border-t border-ink/20 bg-[#F6F3EA]" />
              <div className="h-8 border-t border-[#B9B2A0] bg-[#E4DFD1]">
                <p className="px-2 pt-2 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#7C7665]">
                  skirting · 100 mm
                </p>
              </div>
            </div>
            <p className="mt-2 text-[0.6rem] font-semibold leading-relaxed text-ink-3">{caption}</p>
          </div>

          {/* Comparison */}
          {onWall.length ? (
            <div
              className="mt-6 grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(11rem, 1fr))` }}
            >
              {onWall.map((s) => (
                <div key={s.code} className="rounded-2xl border border-rule bg-white p-3.5 shadow-soft">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-ink/10"
                      style={{ backgroundColor: s.hex }}
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-[0.62rem] font-medium">{s.code}</p>
                      <p className="truncate font-display text-[0.95rem] font-bold leading-tight" title={s.name}>
                        {s.name}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-ink-3">
                    <div className="flex justify-between border-b border-rule/70 py-1">
                      <dt>Family</dt>
                      <dd className="max-w-[8rem] truncate text-right text-ink-2">{s.family}</dd>
                    </div>
                    <div className="flex justify-between border-b border-rule/70 py-1">
                      <dt>LRV</dt>
                      <dd className="text-ink-2">{s.lrv}</dd>
                    </div>
                    <div className="flex justify-between border-b border-rule/70 py-1">
                      <dt>Mixed in</dt>
                      <dd className="truncate pl-2 text-right text-ink-2">{defaultBrand.name}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt>Hex</dt>
                      <dd className="text-ink-2">{s.hex.toUpperCase()}</dd>
                    </div>
                  </dl>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rule">
                    <div className="h-1.5 rounded-full bg-ink" style={{ width: `${Math.max(3, s.lrv)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink(
                `Namaste, these shades side by side on the wall:\n${listText}\n\nPlease tell me rate and availability, mainly 4 L and 10 L.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-quiet"
            >
              WhatsApp this wall
            </a>
            <button
              type="button"
              onClick={() => setQuoting((v) => !v)}
              className="btn btn-sm btn-solid"
              disabled={!onWall.length}
            >
              {quoting ? 'Hide form' : 'Ask the shop about these'}
            </button>
            <Link to="/calculator" className="link-u text-[0.72rem]">
              How much will it cover? →
            </Link>
          </div>

          {quoting ? (
            <div className="card mt-4 max-w-2xl p-4 sm:p-5">
              <EnquiryForm
                kind="shade_list"
                shadeCodes={picked}
                defaultMessage={`Shades I am comparing on the wall:\n${listText}\n\nPlease tell me rate and availability — mainly 4 L and 10 L.`}
              />
            </div>
          ) : null}
        </div>

        {/* Rail */}
        <aside className="card self-start overflow-hidden">
          <div className="border-b border-rule p-4">
            <span className="eyebrow">Add a shade</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="RG-1041, ivory, teak…"
              className="field mt-3"
              aria-label="Search a shade to add"
            />
          </div>

          <div className="p-4">
            {query ? (
              results.length ? (
                <ul className="divide-y divide-rule/70">
                  {results.map((s) => {
                    const full = picked.length >= MAX || picked.includes(s.code);
                    return (
                      <li key={s.code}>
                        <button
                          type="button"
                          onClick={() => add(s.code)}
                          disabled={full}
                          className="flex w-full items-center gap-2.5 py-2 text-left disabled:opacity-40"
                        >
                          <span
                            className="h-6 w-6 shrink-0 rounded-md border border-ink/10"
                            style={{ backgroundColor: s.hex }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.78rem] font-semibold leading-tight">{s.name}</span>
                            <span className="font-mono text-[0.54rem] uppercase tracking-[0.06em] text-ink-3">
                              {s.code} · LRV {s.lrv}
                            </span>
                          </span>
                          <span className="text-[0.7rem] font-bold text-ink-3">{picked.includes(s.code) ? 'on' : '+'}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-1 text-[0.75rem] text-ink-3">No shade matches that.</p>
              )
            ) : (
              <p className="text-[0.72rem] leading-relaxed text-ink-3">
                Type a code or a name from the card. The wall holds four.
              </p>
            )}
          </div>

          {presets.length ? (
            <div className="border-t border-rule p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">Or load a preset</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPicked(p.codes.slice(0, MAX))}
                    className="chip !px-2.5 !py-1 !text-[0.62rem]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-rule p-4">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">On the wall</p>
            <ul className="mt-2 space-y-1.5">
              {onWall.map((s) => (
                <li key={s.code} className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded border border-ink/10"
                    style={{ backgroundColor: s.hex }}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[0.64rem]">{s.code}</span>
                  <button
                    type="button"
                    onClick={() => remove(s.code)}
                    className="text-[0.58rem] font-bold uppercase tracking-[0.06em] text-ink-3 transition-colors hover:text-oxide"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {!onWall.length ? <li className="text-[0.72rem] text-ink-3">Nothing yet.</li> : null}
            </ul>
            <Link to="/shades" className="link-u mt-3 inline-block text-[0.66rem]">
              Browse the full card →
            </Link>
          </div>
        </aside>
      </div>

      <p className="mt-10 max-w-2xl rounded-2xl bg-paper-2/60 p-5 text-[0.72rem] leading-relaxed text-ink-3">
        These are all mixed in {defaultBrand.name} {defaultBrand.range} at the counter; tell us at the counter if you
        want another brand. Screens and walls disagree. This is a comparison, not a promise — the physical card at the
        counter sits under a daylight lamp, and a ₹40 sample pot on your own wall beats both.
      </p>
    </div>
  );
}
