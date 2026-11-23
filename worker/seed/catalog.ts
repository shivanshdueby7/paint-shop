// Catalogue seed. Brand and range names are the real ones a Prayagraj dealer
// stocks; rates are indicative counter prices (GST included) and are meant to be
// edited in the admin panel, not treated as brand MRP.

export type BrandSeed = { id: number; slug: string; name: string; note: string };

export const brands: BrandSeed[] = [
  { id: 1, slug: 'asian-paints', name: 'Asian Paints', note: 'Dealer since 2004' },
  { id: 2, slug: 'berger', name: 'Berger', note: 'Authorised counter' },
  { id: 3, slug: 'nerolac', name: 'Nerolac', note: 'Stocked range' },
  { id: 4, slug: 'birla-opus', name: 'Birla Opus', note: 'New arrivals' },
  { id: 5, slug: 'birla-white', name: 'Birla White', note: 'Putty & levelplast' },
];

export type CategorySeed = { id: number; slug: string; name: string; blurb: string; sort: number };

export const categories: CategorySeed[] = [
  { id: 1, slug: 'interior', name: 'Interior Emulsion', blurb: 'Bedroom, hall, kitchen — walls and ceiling.', sort: 1 },
  { id: 2, slug: 'exterior', name: 'Exterior Emulsion', blurb: 'Chhajja, boundary, full outside walls.', sort: 2 },
  { id: 3, slug: 'enamel', name: 'Enamel & Wood', blurb: 'Grill, gate, door, furniture.', sort: 3 },
  { id: 4, slug: 'primer', name: 'Primer', blurb: 'First coat before anything else.', sort: 4 },
  { id: 5, slug: 'putty', name: 'Putty', blurb: 'Wall levelling before primer.', sort: 5 },
  { id: 6, slug: 'waterproofing', name: 'Waterproofing', blurb: 'Seepage, damp patches, terrace.', sort: 6 },
  { id: 7, slug: 'texture', name: 'Texture & Designer', blurb: 'Feature wall, lobby, showroom.', sort: 7 },
  { id: 8, slug: 'tools', name: 'Tools & Sundries', blurb: 'Roller, brush, blade, tape, paper.', sort: 8 },
];

type Size = [pack: string, mrp: number, price: number, stock: number];

export type ProductSeed = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  range: 'Economy' | 'Premium' | 'Luxury' | 'Ultra';
  finish: string;
  base: string;
  coverage: number;
  coverageUnit: string;
  coats: number;
  blurb: string;
  sizes: Size[];
};

export const products: ProductSeed[] = [
  // ── Asian Paints ───────────────────────────────────────────────────────────
  {
    id: 1, slug: 'royale-luxury-emulsion', name: 'Royale Luxury Emulsion', brand: 'asian-paints',
    category: 'interior', range: 'Luxury', finish: 'Matt', base: 'Water based', coverage: 130,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'The one most families in Teliyarganj pick for the hall. Washable, low smell, tints to any shade on our card.',
    sizes: [['1 L', 470, 452, 24], ['4 L', 1850, 1780, 18], ['10 L', 4500, 4320, 9], ['20 L', 8700, 8350, 4]],
  },
  {
    id: 2, slug: 'royale-shyne', name: 'Royale Shyne', brand: 'asian-paints',
    category: 'interior', range: 'Luxury', finish: 'Sheen', base: 'Water based', coverage: 125,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Slight shine, easier to wipe than matt. Good for kids\u2019 rooms and stair walls.',
    sizes: [['1 L', 520, 500, 14], ['4 L', 2010, 1930, 11], ['10 L', 4850, 4650, 5], ['20 L', 9400, 9030, 2]],
  },
  {
    id: 3, slug: 'apcolite-premium-emulsion', name: 'Apcolite Premium Emulsion', brand: 'asian-paints',
    category: 'interior', range: 'Premium', finish: 'Matt', base: 'Water based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Middle range that most contractors quote for rental and new-build work.',
    sizes: [['1 L', 330, 318, 30], ['4 L', 1260, 1215, 22], ['10 L', 3050, 2940, 12], ['20 L', 5900, 5680, 6]],
  },
  {
    id: 4, slug: 'tractor-emulsion', name: 'Tractor Emulsion', brand: 'asian-paints',
    category: 'interior', range: 'Economy', finish: 'Matt', base: 'Water based', coverage: 110,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Budget emulsion we keep stacked. Fine for godown, shop back-room, rented flats.',
    sizes: [['1 L', 190, 183, 40], ['4 L', 720, 695, 34], ['10 L', 1700, 1640, 15], ['20 L', 3300, 3180, 8]],
  },
  {
    id: 5, slug: 'apex-ultima-protek', name: 'Apex Ultima Protek', brand: 'asian-paints',
    category: 'exterior', range: 'Ultra', finish: 'Sheen', base: 'Water based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Top exterior we sell for ambedkar-set houses and duplexes on the Jhalwa side.',
    sizes: [['1 L', 640, 615, 16], ['4 L', 2500, 2400, 12], ['10 L', 6050, 5810, 6], ['20 L', 11800, 11330, 3]],
  },
  {
    id: 6, slug: 'apex-ultima', name: 'Apex Ultima', brand: 'asian-paints',
    category: 'exterior', range: 'Luxury', finish: 'Sheen', base: 'Water based', coverage: 115,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Standard premium exterior. Most asked-for when the plaster is new.',
    sizes: [['1 L', 520, 500, 20], ['4 L', 2050, 1970, 14], ['10 L', 4950, 4760, 7], ['20 L', 9600, 9220, 4]],
  },
  {
    id: 7, slug: 'ace-exterior-emulsion', name: 'Ace Exterior Emulsion', brand: 'asian-paints',
    category: 'exterior', range: 'Economy', finish: 'Matt', base: 'Water based', coverage: 100,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Budget outside paint. Two coats minimum, three if the wall faces west.',
    sizes: [['1 L', 210, 202, 26], ['4 L', 800, 770, 20], ['10 L', 1900, 1830, 10], ['20 L', 3700, 3560, 5]],
  },
  {
    id: 8, slug: 'royale-play-texture', name: 'Royale Play Design Texture', brand: 'asian-paints',
    category: 'texture', range: 'Luxury', finish: 'Texture', base: 'Water based', coverage: 35,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Feature wall only. Bring the design number, we get the material and the applicator.',
    sizes: [['1 L', 700, 675, 8], ['4 L', 2700, 2600, 4]],
  },
  {
    id: 9, slug: 'trucare-wall-putty', name: 'TruCare Wall Putty', brand: 'asian-paints',
    category: 'putty', range: 'Premium', finish: 'Matt', base: 'Cement based', coverage: 22,
    coverageUnit: 'sq ft per kg (1 coat)', coats: 2,
    blurb: 'White cement putty for levelling. Sold by the bag, delivery on 40 kg bags.',
    sizes: [['5 kg', 230, 220, 30], ['10 kg', 440, 425, 22], ['20 kg', 860, 830, 16], ['40 kg', 1650, 1595, 6]],
  },
  {
    id: 10, slug: 'decoprime-primer', name: 'Decoprime Interior Primer', brand: 'asian-paints',
    category: 'primer', range: 'Premium', finish: 'Matt', base: 'Water based', coverage: 140,
    coverageUnit: 'sq ft per litre per coat', coats: 1,
    blurb: 'Water-based wall primer, no kerosene smell. One coat over putty before emulsion.',
    sizes: [['1 L', 180, 173, 34], ['4 L', 680, 655, 24], ['10 L', 1600, 1540, 12], ['20 L', 3000, 2890, 6]],
  },
  {
    id: 11, slug: 'smartcare-damp-proof', name: 'SmartCare Damp Proof Ultra', brand: 'asian-paints',
    category: 'waterproofing', range: 'Luxury', finish: 'Matt', base: 'Water based', coverage: 40,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'For the damp patch behind the bathroom wall. Elastomeric, so it stretches with the crack.',
    sizes: [['1 L', 330, 318, 12], ['5 L', 1500, 1440, 8], ['10 L', 2800, 2690, 4], ['20 L', 5400, 5190, 2]],
  },
  {
    id: 12, slug: 'apcolite-enamel', name: 'Apcolite Premium Enamel', brand: 'asian-paints',
    category: 'enamel', range: 'Premium', finish: 'Gloss', base: 'Solvent based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Grill, gate, railing. Thinner needed, we keep tins of Turpentine at the counter.',
    sizes: [['500 ml', 180, 173, 26], ['1 L', 330, 318, 20], ['4 L', 1250, 1205, 10]],
  },

  // ── Berger ────────────────────────────────────────────────────────────────
  {
    id: 13, slug: 'weathercoat-long-life', name: 'WeatherCoat Long Life', brand: 'berger',
    category: 'exterior', range: 'Ultra', finish: 'Sheen', base: 'Water based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Berger\u2019s top exterior with a 7-year written assurance on the tin. Popular on Civil Lines bungalows.',
    sizes: [['1 L', 560, 538, 10], ['4 L', 2150, 2065, 9], ['10 L', 5200, 4995, 4], ['20 L', 10200, 9800, 2]],
  },
  {
    id: 14, slug: 'weathercoat-anti-dust', name: 'WeatherCoat Anti Dustt', brand: 'berger',
    category: 'exterior', range: 'Luxury', finish: 'Sheen', base: 'Water based', coverage: 115,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Dust does not settle as fast. Good on main-road facing walls in Teliyarganj.',
    sizes: [['1 L', 480, 462, 14], ['4 L', 1850, 1780, 10], ['10 L', 4450, 4275, 5], ['20 L', 8750, 8400, 2]],
  },
  {
    id: 15, slug: 'silk-breathe-easy', name: 'Silk Breathe Easy', brand: 'berger',
    category: 'interior', range: 'Luxury', finish: 'Silk', base: 'Water based', coverage: 125,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Low VOC. We suggest this when someone in the house has asthma or the room is closed all day.',
    sizes: [['1 L', 520, 500, 12], ['4 L', 2000, 1925, 8], ['10 L', 4850, 4660, 4], ['20 L', 9400, 9030, 1]],
  },
  {
    id: 16, slug: 'bison-acrylic-emulsion', name: 'Bison Acrylic Emulsion', brand: 'berger',
    category: 'interior', range: 'Economy', finish: 'Matt', base: 'Water based', coverage: 105,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Economy interior. Contractors take this by the 20 L for labour-contract jobs.',
    sizes: [['1 L', 200, 193, 28], ['4 L', 760, 733, 20], ['10 L', 1850, 1780, 9], ['20 L', 3500, 3370, 4]],
  },
  {
    id: 17, slug: 'luxol-high-gloss-enamel', name: 'Luxol High Gloss Enamel', brand: 'berger',
    category: 'enamel', range: 'Premium', finish: 'Gloss', base: 'Solvent based', coverage: 130,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Hard gloss for gates and window frames. Dries overnight, do not wash for three days.',
    sizes: [['500 ml', 175, 168, 18], ['1 L', 330, 318, 16], ['4 L', 1250, 1205, 7]],
  },
  {
    id: 18, slug: 'bison-exterior-primer', name: 'Bison Exterior Primer', brand: 'berger',
    category: 'primer', range: 'Economy', finish: 'Matt', base: 'Solvent based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 1,
    blurb: 'Solvent-based outside primer. One coat before any exterior emulsion.',
    sizes: [['1 L', 165, 159, 20], ['4 L', 620, 598, 12], ['10 L', 1450, 1395, 6]],
  },

  // ── Nerolac ───────────────────────────────────────────────────────────────
  {
    id: 19, slug: 'excel-total', name: 'Excel Total', brand: 'nerolac',
    category: 'exterior', range: 'Luxury', finish: 'Sheen', base: 'Water based', coverage: 118,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Nerolac exterior with dust and algae resistance. We stock the full shade card.',
    sizes: [['1 L', 540, 519, 8], ['4 L', 2100, 2018, 7], ['10 L', 5100, 4900, 3], ['20 L', 9900, 9510, 2]],
  },
  {
    id: 20, slug: 'beauty-gold', name: 'Beauty Gold', brand: 'nerolac',
    category: 'interior', range: 'Premium', finish: 'Matt', base: 'Water based', coverage: 120,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Steady mid-range interior. Slightly thicker film than the economy lines.',
    sizes: [['1 L', 400, 384, 18], ['4 L', 1550, 1490, 13], ['10 L', 3700, 3555, 7], ['20 L', 7100, 6820, 3]],
  },
  {
    id: 21, slug: 'impressions-hd', name: 'Impressions HD', brand: 'nerolac',
    category: 'interior', range: 'Luxury', finish: 'Silk', base: 'Water based', coverage: 128,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'HD finish, deeper colour pay-off on saturated shades like our RG-1240s.',
    sizes: [['1 L', 560, 538, 9], ['4 L', 2180, 2095, 6], ['10 L', 5300, 5090, 3]],
  },
  {
    id: 22, slug: 'excel-mica-marble', name: 'Excel Mica Marble', brand: 'nerolac',
    category: 'texture', range: 'Luxury', finish: 'Texture', base: 'Water based', coverage: 30,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Mica texture for a lobby wall. Needs an applicator — we can arrange one.',
    sizes: [['1 L', 640, 615, 6], ['4 L', 2450, 2355, 3]],
  },

  // ── Birla Opus ────────────────────────────────────────────────────────────
  {
    id: 23, slug: 'silky-touch', name: 'Silky Touch', brand: 'birla-opus',
    category: 'interior', range: 'Ultra', finish: 'Silk', base: 'Water based', coverage: 130,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Newest premium interior we have taken on. Six finishes printed on the card, we mix to all of them.',
    sizes: [['1 L', 480, 462, 12], ['4 L', 1900, 1830, 9], ['10 L', 4600, 4420, 4]],
  },
  {
    id: 24, slug: 'health-shield', name: 'Health Shield', brand: 'birla-opus',
    category: 'interior', range: 'Premium', finish: 'Matt', base: 'Water based', coverage: 125,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Anti-bacterial claim on the tin. Hospitals and clinics nearby order this.',
    sizes: [['1 L', 430, 413, 14], ['4 L', 1700, 1635, 10], ['10 L', 4100, 3940, 5]],
  },
  {
    id: 25, slug: 'weather-shield', name: 'Weather Shield', brand: 'birla-opus',
    category: 'exterior', range: 'Premium', finish: 'Sheen', base: 'Water based', coverage: 112,
    coverageUnit: 'sq ft per litre per coat', coats: 2,
    blurb: 'Exterior with a good price-to-coverage ratio. Ask for the 20 L if the whole house is being done.',
    sizes: [['1 L', 510, 490, 11], ['4 L', 2000, 1922, 8], ['10 L', 4850, 4660, 4], ['20 L', 9300, 8940, 2]],
  },

  // ── Birla White ───────────────────────────────────────────────────────────
  {
    id: 26, slug: 'birla-white-wall-care', name: 'Birla White Wall Care Putty', brand: 'birla-white',
    category: 'putty', range: 'Premium', finish: 'Matt', base: 'White cement based', coverage: 24,
    coverageUnit: 'sq ft per kg (1 coat)', coats: 2,
    blurb: 'The putty most painters here ask for by name. 40 kg bag goes on the loading rickshaw.',
    sizes: [['5 kg', 240, 230, 26], ['10 kg', 460, 442, 18], ['20 kg', 900, 865, 12], ['40 kg', 1720, 1660, 5]],
  },
  {
    id: 27, slug: 'levelplast', name: 'Birla White Levelplast', brand: 'birla-white',
    category: 'putty', range: 'Premium', finish: 'Matt', base: 'Gypsum based', coverage: 30,
    coverageUnit: 'sq ft per kg (1 coat)', coats: 1,
    blurb: 'For levelling bad plaster before putty. One coat, then Wall Care on top.',
    sizes: [['20 kg', 780, 750, 6], ['40 kg', 1480, 1430, 3]],
  },

  // ── Counter hardware (no brand) ───────────────────────────────────────────
  {
    id: 28, slug: 'roller-9', name: '9 inch Paint Roller', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'Synthetic roller with handle. Painters buy two or three at a time.',
    sizes: [['1 pc', 180, 170, 22]],
  },
  {
    id: 29, slug: 'brush-4', name: '4 inch Wall Brush', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'Coconut bristle brush for corners and edges. Also used for primer.',
    sizes: [['1 pc', 120, 110, 30]],
  },
  {
    id: 30, slug: 'masking-tape', name: 'Masking Tape 24 mm', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'For skirting and switch boards. Leaves no gum if removed within a day.',
    sizes: [['20 m roll', 60, 55, 48]],
  },
  {
    id: 31, slug: 'putty-blade', name: 'Putty Blade 10 inch', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'Stainless blade with wooden handle. The painters\u2019 favourite size.',
    sizes: [['1 pc', 150, 140, 14]],
  },
  {
    id: 32, slug: 'emery-120', name: 'Emery Paper 120 Grit', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'For rubbing down putty before primer. Sold by the sheet.',
    sizes: [['1 sheet', 25, 22, 90]],
  },
  {
    id: 33, slug: 'drop-sheet', name: 'Plastic Drop Sheet 12 x 9', brand: null,
    category: 'tools', range: 'Economy', finish: 'Tool', base: '—', coverage: 0,
    coverageUnit: '—', coats: 0,
    blurb: 'Floor cover for furniture and tiles while painting.',
    sizes: [['1 pc', 90, 82, 26]],
  },
];
