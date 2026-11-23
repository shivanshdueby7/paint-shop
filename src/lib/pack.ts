import type { Product } from './api';

export type PackKind =
  | 'tin'
  | 'pail'
  | 'can'
  | 'drum'
  | 'sack'
  | 'jug'
  | 'bucket'
  | 'roller'
  | 'brush'
  | 'blade'
  | 'sheet'
  | 'box';

const ACCENTS = ['#F2793D', '#25A57F', '#2E3A8C', '#F45D7E', '#FFC53D', '#6CB8E8', '#B79CF0'];

/** Pick the pack shape that matches what actually sits on the shelf. */
export function packKind(product: Product): PackKind {
  const name = product.name.toLowerCase();
  switch (product.categorySlug) {
    case 'putty':
      return 'sack';
    case 'primer':
      return 'drum';
    case 'waterproofing':
      return 'jug';
    case 'texture':
      return 'bucket';
    case 'enamel':
      return 'can';
    case 'tools':
      if (name.includes('roller')) return 'roller';
      if (name.includes('brush')) return 'brush';
      if (name.includes('blade') || name.includes('knife') || name.includes('trowel')) return 'blade';
      if (name.includes('paper') || name.includes('sheet') || name.includes('sand')) return 'sheet';
      return 'box';
    case 'exterior':
    case 'interior':
      return product.variants.some((v) => /^20\s*l$/i.test(v.packSize)) ? 'pail' : 'tin';
    default:
      return 'tin';
  }
}

/** A stable accent for non-paint packs, so the shelf never looks repeated. */
export function packAccent(product: Product): string {
  return ACCENTS[product.id % ACCENTS.length];
}

/** Two short words for the printed label on the pack. */
export function packLabel(product: Product): string {
  const stop = new Set(['paint', 'wall', 'the', 'and', 'of']);
  const words = product.name
    .replace(/\b\d+(\.\d+)?\s*(l|kg|inch|mm|m)\b/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !stop.has(w.toLowerCase()));
  return (words.slice(0, 2).join(' ') || product.name).slice(0, 18);
}

/** The pack that leads the card: the 20 L pail if there is one, else the first. */
export function packSize(product: Product): string {
  return product.variants.find((v) => /^20\s*l$/i.test(v.packSize))?.packSize ?? product.variants[0]?.packSize ?? '';
}
