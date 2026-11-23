// Which brand a shade is mixed in at the counter. The shade code is the shop's
// own (RG-####) — the brand line says where it gets mixed, which is how a
// dealer's tinting machine actually works: one card, five bases.

export type PaintBrand = {
  slug: string;
  name: string;
  short: string;
  range: string;
  note: string;
};

export const paintBrands: PaintBrand[] = [
  {
    slug: 'asian-paints',
    name: 'Asian Paints',
    short: 'Royale',
    range: 'Royale Luxury Emulsion',
    note: 'Deepest base for dark shades; the one we mix most.',
  },
  {
    slug: 'berger',
    name: 'Berger',
    short: 'Silk Glamour',
    range: 'Silk Glamour',
    note: 'Wipeable finish, good for halls and stairwells.',
  },
  {
    slug: 'nerolac',
    name: 'Nerolac',
    short: 'Excel',
    range: 'Excel Mica Marble',
    note: 'Exterior grades that hold through two monsoons.',
  },
  {
    slug: 'birla-opus',
    name: 'Birla Opus',
    short: 'One',
    range: 'One Luxury Emulsion',
    note: 'Newest line on the shelf; strongest whites.',
  },
];

export const defaultBrand = paintBrands[0];

export function brandByIndex(i: number): PaintBrand {
  return paintBrands[((i % paintBrands.length) + paintBrands.length) % paintBrands.length];
}

export function brandBySlug(slug: string): PaintBrand {
  return paintBrands.find((b) => b.slug === slug) ?? defaultBrand;
}
