import { useMemo, useState } from 'react';
import { useApi, type Catalog } from '../lib/api';
import { bestRate, packsForKg, packsForLitres, packSummary } from '../lib/calc';
import { inr, num } from '../lib/format';
import { EnquiryForm } from '../components/EnquiryForm';
import { Reveal } from '../components/Reveal';
import { whatsappLink } from '../site.config';
import { useTitle } from '../lib/useTitle';

type Room = { id: number; name: string; area: string };

const TIERS = ['Economy', 'Premium', 'Luxury', 'Ultra'] as const;

export default function Calculator() {
  useTitle(
    'Paint calculator — how much paint for your flat | Rang Ghar, Teliyarganj',
    'Work out litres, primer and putty from carpet area, with counter rates. The carpet area × 2.5 rule painters in Prayagraj actually use.',
  );
  const { data } = useApi<Catalog>('/api/catalog');
  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, name: 'Hall', area: '200' },
    { id: 2, name: 'Bedroom 1', area: '120' },
    { id: 3, name: 'Bedroom 2', area: '110' },
  ]);
  const [surface, setSurface] = useState<'interior' | 'exterior'>('interior');
  const [tier, setTier] = useState<(typeof TIERS)[number]>('Premium');
  const [coats, setCoats] = useState(2);
  const [showForm, setShowForm] = useState(false);

  const products = data?.products ?? [];
  const totalArea = rooms.reduce((sum, r) => sum + (Number(r.area) || 0), 0);
  const multiplier = surface === 'interior' ? 2.5 : 1;
  const paintable = Math.round(totalArea * multiplier);

  const calc = useMemo(() => {
    const emulsionCat = surface === 'interior' ? 'interior' : 'exterior';
    const coverage = surface === 'interior' ? 125 : 112;
    const pick = (cat: string) => {
      const pool = products.filter((p) => p.categorySlug === cat);
      const tierPool = pool.filter((p) => p.range === tier);
      return (tierPool.length ? tierPool : pool)[0];
    };

    const emulsion = pick(emulsionCat);
    const primer = pick('primer');
    const putty = pick('putty');

    const emulsionLitres = (paintable * coats) / coverage;
    const primerLitres = (paintable * 1) / 130;
    const puttyKg = surface === 'interior' ? (paintable * 2) / 22 : 0;

    const emulsionRate = emulsion ? bestRate(emulsion.variants, 'L') : 0;
    const primerRate = primer ? bestRate(primer.variants, 'L') : 0;
    const puttyRate = putty ? bestRate(putty.variants, 'kg') : 0;

    const rows = [
      {
        item: emulsion ? `${emulsion.name} (${emulsion.brandName})` : 'Emulsion',
        qty: `${num(emulsionLitres, 1)} L`,
        packs: packSummary(packsForLitres(emulsionLitres), 'L'),
        rate: emulsionRate,
        amount: Math.round(emulsionLitres * emulsionRate),
      },
      {
        item: primer ? `${primer.name} (${primer.brandName})` : 'Primer',
        qty: `${num(primerLitres, 1)} L`,
        packs: packSummary(packsForLitres(primerLitres), 'L'),
        rate: primerRate,
        amount: Math.round(primerLitres * primerRate),
      },
      ...(surface === 'interior'
        ? [
            {
              item: putty ? `${putty.name} (${putty.brandName})` : 'Wall putty',
              qty: `${num(puttyKg, 0)} kg`,
              packs: packSummary(packsForKg(puttyKg), 'kg'),
              rate: puttyRate,
              amount: Math.round(puttyKg * puttyRate),
            },
          ]
        : []),
    ];

    const sundries = paintable > 0 ? 650 : 0;
    const total = rows.reduce((s, r) => s + r.amount, 0) + sundries;

    const message = [
      `Paint estimate from the website:`,
      `${surface === 'interior' ? 'Interior' : 'Exterior'} · ${num(totalArea)} sq ft entered · ${num(paintable)} sq ft paintable · ${coats} coats · ${tier}`,
      ...rows.map((r) => `${r.item}: ${r.qty} (${r.packs}) ≈ ${inr(r.amount)}`),
      `Sundries (roller, brush, tape, sheet) ≈ ${inr(sundries)}`,
      `Total material ≈ ${inr(total)}`,
    ].join('\n');

    return { rows, sundries, total, message, emulsionLitres, primerLitres, puttyKg };
  }, [products, surface, tier, coats, paintable, totalArea]);

  const addRoom = () =>
    setRooms((prev) => [...prev, { id: Date.now(), name: `Room ${prev.length + 1}`, area: '' }]);

  return (
    <div className="shell pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow">
            <span className="h-2 w-2 rounded-full bg-sun" />
            Calculator
          </span>
          <h1 className="h1 mt-3 max-w-[18ch]">How much paint, and what it will cost</h1>
        </div>
        <p className="max-w-sm text-[0.9rem] leading-relaxed text-ink-2">
          Enter carpet area room by room. We multiply by 2.5 for walls plus ceiling, then work out litres, primer, putty
          and the pack sizes to actually buy — at today&apos;s counter rates.
        </p>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        {/* Inputs */}
        <Reveal>
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Rooms</h2>
              <button
                type="button"
                onClick={addRoom}
                className="chip !px-3 !py-1.5 !text-[0.68rem]"
              >
                + Add room
              </button>
            </div>

            <div className="mt-3 divide-y divide-rule/70">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-end gap-2.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <label className="label" htmlFor={`room-${room.id}`}>
                      Room
                    </label>
                    <input
                      id={`room-${room.id}`}
                      className="field"
                      value={room.name}
                      onChange={(e) =>
                        setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r)))
                      }
                    />
                  </div>
                  <div className="w-28 shrink-0">
                    <label className="label" htmlFor={`area-${room.id}`}>
                      {surface === 'interior' ? 'Carpet sq ft' : 'Wall sq ft'}
                    </label>
                    <input
                      id={`area-${room.id}`}
                      className="field text-right font-mono"
                      inputMode="numeric"
                      value={room.area}
                      onChange={(e) =>
                        setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, area: e.target.value } : r)))
                      }
                      placeholder="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRooms((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== room.id) : prev))}
                    className="mb-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-rule text-[0.7rem] font-bold text-ink-3 transition-colors hover:border-shut hover:text-shut"
                    aria-label={`Remove ${room.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-rule pt-5">
              <div className="flex flex-wrap gap-2">
                {(['interior', 'exterior'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSurface(s)}
                    aria-pressed={surface === s}
                    className={`chip !px-4 !py-2 !text-[0.72rem] ${surface === s ? 'chip-on' : ''}`}
                  >
                    {s === 'interior' ? 'Interior' : 'Exterior'}
                  </button>
                ))}
              </div>
              {surface === 'exterior' ? (
                <p className="mt-2.5 text-[0.74rem] leading-relaxed text-ink-3">
                  For outside walls, enter the wall area directly — no ceiling, no × 2.5. Measure length × height of each
                  face and add them.
                </p>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="tier">
                    Range
                  </label>
                  <select
                    id="tier"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
                    className="input appearance-none bg-white font-semibold"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="coats">
                    Coats of emulsion
                  </label>
                  <select
                    id="coats"
                    value={coats}
                    onChange={(e) => setCoats(Number(e.target.value))}
                    className="input appearance-none bg-white font-semibold"
                  >
                    {[2, 3].map((c) => (
                      <option key={c} value={c}>
                        {c} coats
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* The working */}
        <Reveal delay={100}>
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule p-5">
              <h2 className="font-display text-xl font-bold">The working</h2>
              <span className="rounded-full bg-paper-2 px-3 py-1 font-mono text-[0.62rem] text-ink-2">
                {num(totalArea)} entered → {num(paintable)} sq ft
              </span>
            </div>

            {!totalArea ? (
              <p className="p-5 text-sm leading-relaxed text-ink-2">
                Put an area against at least one room to see the packs.
              </p>
            ) : (
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-rule-strong">
                        <th className="py-2 text-left text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                          Item
                        </th>
                        <th className="py-2 text-right text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                          Needed
                        </th>
                        <th className="py-2 text-right text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                          Buy
                        </th>
                        <th className="py-2 text-right text-[0.58rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                          Rough ₹
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.rows.map((r) => (
                        <tr key={r.item} className="border-b border-rule/60 align-top">
                          <td className="py-2.5 pr-2 text-[0.8rem] font-semibold text-ink-2">{r.item}</td>
                          <td className="py-2.5 text-right font-mono text-[0.7rem] text-ink-2">{r.qty}</td>
                          <td className="whitespace-nowrap py-2.5 pl-3 text-right font-mono text-[0.7rem] text-ink-2">
                            {r.packs}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pl-3 text-right font-mono text-[0.78rem]">
                            {inr(r.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b border-rule/60">
                        <td className="py-2.5 text-[0.8rem] text-ink-2">Sundries — roller, brush, tape, sheet</td>
                        <td className="py-2.5" />
                        <td className="py-2.5" />
                        <td className="whitespace-nowrap py-2.5 pl-3 text-right font-mono text-[0.78rem]">
                          {inr(calc.sundries)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-ink px-4 py-3.5 text-paper">
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-paper/60">
                      Material estimate
                    </p>
                    <p className="font-display text-2xl font-extrabold leading-tight text-sun">{inr(calc.total)}</p>
                  </div>
                  <p className="text-[0.62rem] font-semibold leading-snug text-paper/60">
                    {num(paintable)} sq ft · {coats} coats · {tier}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={whatsappLink(calc.message)} target="_blank" rel="noreferrer" className="btn btn-sm btn-solid">
                    Send this list on WhatsApp
                  </a>
                  <button type="button" onClick={() => setShowForm((v) => !v)} className="btn btn-sm btn-quiet">
                    {showForm ? 'Hide form' : 'Get this quoted'}
                  </button>
                </div>

                <p className="mt-5 border-t border-rule pt-4 text-[0.72rem] leading-relaxed text-ink-3">
                  This is material only. Labour in this market runs about ₹18–24 per sq ft of paintable area, and the
                  painter buys his own rollers and sheets. Add 5–10% waste for rough plaster, and remember primer and
                  putty are two separate coats, not one.
                </p>

                {showForm ? (
                  <div className="mt-5 rounded-2xl border-2 border-rule bg-paper/50 p-4">
                    <EnquiryForm
                      kind="calculator"
                      areaSqft={paintable}
                      heading="Send the estimate to the counter"
                      defaultMessage={`${calc.message}\n\nPlease confirm packs and final rate.`}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
