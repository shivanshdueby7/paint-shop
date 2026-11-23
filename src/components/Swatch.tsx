import type { Shade } from '../lib/api';
import { defaultBrand, type PaintBrand } from '../lib/brands';
import { ShadeChip } from './ShadeChip';

/**
 * Kept as the small shade component used on product pages: same painted chip,
 * with the brand it is mixed in printed under the name.
 */
export function Swatch({
  shade,
  brand = defaultBrand,
  selected = false,
  onToggle,
  compact = false,
}: {
  shade: Shade;
  brand?: PaintBrand;
  selected?: boolean;
  onToggle?: (shade: Shade) => void;
  compact?: boolean;
}) {
  return (
    <ShadeChip
      shade={shade}
      brand={brand}
      selected={selected}
      onToggle={onToggle}
      size={compact ? 'sm' : 'md'}
    />
  );
}
