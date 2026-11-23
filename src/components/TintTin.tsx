import type { Shade } from '../lib/api';
import type { PaintBrand } from '../lib/brands';
import { readableOn } from '../lib/color';
import { PackShot } from './PackShot';

/**
 * The live tint: a drawn 4 L tin that takes the selected shade, with the label
 * printed beside it so the code, name and LRV stay readable.
 */
export function TintTin({
  shade,
  brand,
  className = '',
}: {
  shade: Shade;
  brand: PaintBrand;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative mx-auto w-full max-w-[18.5rem]">
        <span className="absolute -left-1 top-2 z-10 rounded-full border-2 border-ink bg-white px-2.5 py-1 font-mono text-[0.6rem] font-medium shadow-hard-sm">
          {shade.hex.toUpperCase()}
        </span>
        <span className="sticker absolute -right-1 top-8 z-10 rotate-6">freshly mixed</span>
        <div key={shade.code} className="tin-pop">
          <PackShot
            kind="tin"
            hex={shade.hex}
            brand={brand.name}
            label={shade.name}
            pack="4 L"
            code={shade.code}
            className="w-full"
            alt={`${brand.name} 4 litre tin tinted ${shade.code} ${shade.name}`}
          />
        </div>
      </div>

      <div className="relative -mt-3 rounded-2xl border-2 border-ink bg-white p-3 shadow-hard-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-3">{brand.name}</span>
          <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[0.6rem] text-ink-2">{shade.code}</span>
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="font-display text-xl font-bold leading-none">{shade.name}</p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
            style={{ backgroundColor: shade.hex, color: readableOn(shade.hex) }}
          >
            LRV {shade.lrv}
          </span>
        </div>
        <p className="mt-1 truncate text-[0.68rem] font-semibold text-ink-3">{brand.range}</p>
      </div>
    </div>
  );
}
