import type { Shade } from '../lib/api';

/**
 * A slow band of shade pills. Hover or focus pauses it; reduced motion gets a
 * static first row.
 */
export function Marquee({ shades }: { shades: Shade[] }) {
  if (!shades.length) return null;

  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-2.5 pr-2.5" aria-hidden={hidden}>
      {shades.map((s) => (
        <span
          key={`${hidden ? 'b' : 'a'}-${s.code}`}
          className="flex shrink-0 items-center gap-2 rounded-full border border-rule bg-white px-3 py-1.5"
        >
          <span className="h-3 w-3 rounded-full border border-ink/10" style={{ backgroundColor: s.hex }} />
          <span className="font-mono text-[0.62rem] font-medium text-ink">{s.code}</span>
          <span className="text-[0.72rem] font-semibold text-ink-2">{s.name}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="marquee overflow-hidden border-y border-rule bg-white/55 py-3"
      aria-label="Shades mixed at the counter"
    >
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
