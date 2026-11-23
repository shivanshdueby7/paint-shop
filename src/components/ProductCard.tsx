import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/api';
import { inr, stockLabel } from '../lib/format';
import { readableOn } from '../lib/color';
import { packAccent, packKind, packLabel, packSize } from '../lib/pack';
import { PackShot } from './PackShot';

/**
 * Storefront card: a drawn pack in the product's own colour, the price on a
 * sticker, and — on hover, or when "Shades" is tapped on a phone — the colours
 * that pack can be mixed in.
 */
export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;

  // Touch taps arrive as pointer events too, so hover only counts for a real
  // mouse; on a phone the Shades button is the only thing that opens the panel.
  const toggle = () => {
    if (pinned) {
      setPinned(false);
      return;
    }
    setPinned(true);
    setHovered(false);
  };

  const first = product.variants[0];
  const lead = product.variants.find((v) => v.stock > 0) ?? first;
  const off = lead && lead.mrp > lead.price ? Math.round(((lead.mrp - lead.price) / lead.mrp) * 100) : 0;
  const samples = product.shadeSamples ?? [];
  const band = samples.length ? samples[product.id % samples.length] : null;
  const isPaint = product.shadeCount > 0;
  const stock = stockLabel(product.variants.reduce((s, v) => s + v.stock, 0));
  const kind = packKind(product);
  const hex = isPaint && band ? band.hex : packAccent(product);
  // Putty goes out by the sack and 20 L by the pail, so those two carry the
  // pack photograph from the godown. Everything else is drawn in its shade.
  const photo =
    kind === 'sack'
      ? { src: '/images/putty-bag.jpg', alt: `${product.name} — putty sack` }
      : kind === 'pail'
        ? { src: '/images/paint-bucket.jpg', alt: `${product.name} — 20 litre pail` }
        : null;

  return (
    <article
      className="group card relative flex flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lift"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHovered(false);
      }}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-paper-2/80 via-white to-paper-2/40 px-3 pb-2 pt-4">
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          <span className="rounded-full border border-ink/10 bg-white/90 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-2 backdrop-blur">
            {product.range}
          </span>
          {off > 0 ? (
            <span className="rounded-full bg-pink px-2.5 py-1 text-[0.58rem] font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_3px_0_0_rgba(36,27,20,0.18)]">
              {off}% off
            </span>
          ) : null}
        </div>

        <Link to={`/products/${product.slug}`} className="block" tabIndex={-1} aria-hidden="true">
          <div className="mx-auto flex h-[168px] items-end justify-center transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-[1.06]">
            {photo ? (
              <img
                src={photo.src}
                alt={photo.alt}
                width={880}
                height={1184}
                loading="lazy"
                decoding="async"
                className="h-full w-auto rounded-[1.2rem] border-2 border-white/80 object-contain drop-shadow-[0_14px_16px_rgba(36,27,20,0.16)]"
              />
            ) : (
              <PackShot
                kind={kind}
                hex={hex}
                brand={product.brandName}
                label={packLabel(product)}
                pack={packSize(product)}
                code={band?.code}
                className="h-full w-auto drop-shadow-[0_14px_16px_rgba(36,27,20,0.16)]"
                alt={`${product.name} — ${kind === 'tin' ? 'paint tin' : kind === 'drum' ? 'primer drum' : kind === 'can' ? 'enamel can' : kind === 'jug' ? 'waterproofing can' : kind === 'bucket' ? 'texture bucket' : 'counter pack'}`}
              />
            )}
          </div>

          {isPaint ? (
            <div className="mt-2.5 flex items-center justify-center gap-1.5">
              {samples.slice(0, 5).map((s) => (
                <span
                  key={s.code}
                  className="h-3 w-3 rounded-full border-2 border-white shadow-[0_1px_2px_rgba(36,27,20,0.18)]"
                  style={{ backgroundColor: s.hex }}
                  title={`${s.code} ${s.name}`}
                />
              ))}
              <span className="ml-0.5 rounded-full bg-white px-2 py-0.5 text-[0.58rem] font-bold text-ink-3">
                +{Math.max(0, product.shadeCount - 5)}
              </span>
            </div>
          ) : (
            <p className="mt-2.5 truncate text-center text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink-3">
              {product.variants.map((v) => v.packSize).join(' · ')}
            </p>
          )}
        </Link>

        {isPaint && open ? (
          <div className="absolute inset-0 z-20 flex flex-col rounded-b-[1.4rem] bg-white/95 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">
                {product.shadeCount} shades in this pack
              </p>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
            </div>
            <div className="mt-2 grid flex-1 grid-cols-4 gap-1.5">
              {samples.map((s) => (
                <span
                  key={s.code}
                  title={`${s.code} ${s.name} · LRV ${s.lrv}`}
                  className="relative block overflow-hidden rounded-lg border border-ink/10"
                  style={{ backgroundColor: s.hex }}
                >
                  <span
                    className="absolute bottom-1 left-1 font-mono text-[0.48rem] font-medium leading-none"
                    style={{ color: readableOn(s.hex) }}
                  >
                    {s.code.replace('RG-', '')}
                  </span>
                </span>
              ))}
              {!samples.length ? (
                <p className="col-span-4 text-[0.72rem] leading-relaxed text-ink-3">
                  Ask at the counter for the shade card for this pack.
                </p>
              ) : null}
            </div>
            <Link
              to="/shades"
              className="mt-2 flex items-center justify-between rounded-full bg-ink px-3 py-1.5 text-[0.64rem] font-bold text-paper transition-colors hover:bg-oxide"
            >
              <span>Open the shade card</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-[1.7rem] font-extrabold leading-none tracking-[-0.01em]">
            {inr(lead?.price ?? 0)}
          </p>
          {lead && lead.mrp > lead.price ? (
            <p className="font-mono text-[0.68rem] leading-none text-ink-3 line-through">{inr(lead.mrp)}</p>
          ) : null}
        </div>

        <p className="mt-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">{product.brandName}</p>
        <h3 className="mt-0.5 font-display text-[1.1rem] font-bold leading-tight tracking-[-0.01em]">
          <Link to={`/products/${product.slug}`} className="transition-colors hover:text-oxide">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-[0.66rem] font-semibold leading-relaxed text-ink-3">
          {lead?.packSize ?? '—'} · {product.finish} · <span className={stock.className}>{stock.text.toLowerCase()}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {isPaint ? (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className={`chip !px-2.5 !py-1 !text-[0.64rem] ${pinned ? 'chip-on' : ''}`}
            >
              {pinned ? 'Hide shades' : 'Shades'}
            </button>
          ) : (
            <span />
          )}
          <Link to={`/products/${product.slug}`} className="btn btn-sm btn-quiet !px-3 !py-1.5 !text-[0.66rem]">
            View <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
