import type { Shade } from '../lib/api';
import { defaultBrand, type PaintBrand } from '../lib/brands';

const textOn = (lrv: number) => (lrv < 52 ? '#FFF6E9' : '#241B14');

/**
 * One shade as a painted patch: a clean colour field with a soft light fall,
 * the code and name underneath, and a fat check when it is picked. The whole
 * chip lifts on hover so the card feels like a physical swatch.
 */
export function ShadeChip({
  shade,
  brand = defaultBrand,
  size = 'md',
  selected = false,
  onToggle,
  bare = false,
  className = '',
}: {
  shade: Shade;
  brand?: PaintBrand;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onToggle?: (shade: Shade) => void;
  bare?: boolean;
  className?: string;
}) {
  const dark = shade.lrv < 52;

  if (bare) {
    const bareBody = <span className="paint-texture block h-full w-full" style={{ backgroundColor: shade.hex }} />;
    if (!onToggle) return <span className={className}>{bareBody}</span>;
    return (
      <button type="button" onClick={() => onToggle(shade)} className={className} aria-pressed={selected}>
        {bareBody}
      </button>
    );
  }

  const ratio = size === 'lg' ? '82%' : size === 'sm' ? '70%' : '76%';
  const radius = size === 'lg' ? '1.4rem' : '1.05rem';

  const body = (
    <>
      <span
        className="relative block w-full overflow-hidden"
        style={{ paddingBottom: ratio, borderRadius: radius }}
      >
        <span className="paint-texture absolute inset-0" style={{ backgroundColor: shade.hex }} />
        <span className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15" />
        <span className="absolute inset-x-3 bottom-2.5 h-1 rounded-full bg-white/20" />
        {selected ? (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/10">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold shadow-hard-sm"
              style={{
                backgroundColor: dark ? '#FFF6E9' : '#241B14',
                borderColor: dark ? '#241B14' : '#FFF6E9',
                color: dark ? '#241B14' : '#FFF6E9',
              }}
            >
              ✓
            </span>
          </span>
        ) : null}
        <span
          className="absolute bottom-2 right-2.5 font-mono text-[0.55rem] font-medium leading-none"
          style={{ color: textOn(shade.lrv) }}
        >
          {shade.lrv}
        </span>
      </span>

      <span className="block px-0.5 pt-2">
        <span className="flex items-center justify-between gap-1">
          <span className="truncate font-mono text-[0.58rem] font-medium uppercase tracking-[0.06em] text-ink-2">
            {shade.code}
          </span>
          <span className="h-2 w-2 shrink-0 rounded-full border border-ink/10" style={{ backgroundColor: shade.hex }} />
        </span>
        <span className="mt-0.5 block truncate font-display text-[0.95rem] font-bold leading-tight text-ink">
          {shade.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink-3">
          {brand.name}
        </span>
      </span>
    </>
  );

  const shell = [
    'group block w-full rounded-[1.45rem] border-2 p-1.5 text-left transition-all duration-200 ease-out',
    selected
      ? 'border-ink bg-white shadow-hard-sm'
      : 'border-transparent hover:-translate-y-1 hover:border-rule hover:bg-white hover:shadow-soft',
    className,
  ].join(' ');

  if (!onToggle) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(shade)}
      aria-pressed={selected}
      title={`${shade.code} ${shade.name} · mixed in ${brand.name} ${brand.range}`}
      className={shell}
    >
      {body}
    </button>
  );
}
