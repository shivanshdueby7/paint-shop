import { PackShot } from './PackShot';
import type { PackKind } from '../lib/pack';

/**
 * A single drawn pack for product cards. Kept as the small wrapper ProductCard
 * uses, with the same props it always had plus the pack shape.
 */
export function TinVisual({
  hex,
  lrv,
  brand,
  code,
  kind = 'tin',
  label,
  pack,
  className = '',
}: {
  hex: string;
  lrv: number;
  brand: string;
  code?: string;
  kind?: PackKind;
  label?: string;
  pack?: string;
  className?: string;
}) {
  return (
    <PackShot
      kind={kind}
      hex={hex}
      brand={brand}
      label={label ?? 'Paint'}
      pack={pack ?? '4 L'}
      code={code}
      className={className}
      alt={`${brand} ${pack ?? '4 L'} pack, shade ${code ?? hex}, LRV ${lrv}`}
    />
  );
}
