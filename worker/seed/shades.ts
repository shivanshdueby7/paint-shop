// The shop's own shade card. Codes are RG-#### (ours, not a brand's), but the
// colour families, LRV values and finishes follow how paint cards are actually
// printed, because that is what a customer reads at the counter.

type Row = [name: string, h: number, s: number, l: number];

export type ShadeFamilySeed = {
  key: string;
  label: string;
  codeStart: number;
  rows: Row[];
};

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Light Reflectance Value: relative luminance of the dried film, as printed on shade cards. */
function lrvOf(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return Math.round((0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)) * 100);
}

function finishesFor(lrv: number): string {
  if (lrv >= 62) return 'Matt, Sheen, Silk, Satin';
  if (lrv >= 30) return 'Matt, Sheen, Satin';
  return 'Sheen, Satin, Gloss';
}

export const shadeFamilies: ShadeFamilySeed[] = [
  {
    key: 'whites',
    label: 'Whites & Off-whites',
    codeStart: 1001,
    rows: [
      ['Chuna White', 40, 12, 97],
      ['Ivory Lace', 42, 28, 94],
      ['Cotton Sheet', 40, 14, 96],
      ['Pearl White', 45, 10, 95],
      ['Paper Moon', 38, 18, 93],
      ['Milk Glass', 45, 8, 96],
      ['Almond Milk', 36, 26, 92],
      ['Pale Bone', 42, 22, 90],
      ['Soft Linen', 40, 20, 91],
      ["Bride's Veil", 30, 16, 95],
      ['Warm Cotton', 44, 24, 93],
      ['Sea Shell', 28, 22, 94],
      ['Parchment', 46, 30, 89],
      ['Vanilla Cream', 48, 34, 92],
      ['Coconut Husk', 38, 18, 88],
      ['Candle Light', 44, 32, 91],
      ['Cloud Cover', 210, 6, 94],
      ['First Snow', 200, 5, 97],
      ['Half White', 40, 10, 98],
      ['Jasmine Bud', 50, 20, 95],
      ['Plaster Dry', 34, 14, 90],
    ],
  },
  {
    key: 'sand',
    label: 'Beige & Sand',
    codeStart: 1041,
    rows: [
      ['Kathmandu Sand', 38, 28, 78],
      ['Jaisalmer Stone', 36, 24, 74],
      ['Camel Dust', 34, 26, 70],
      ['Baked Bread', 32, 32, 72],
      ['Desert Clay', 28, 30, 66],
      ['Teak Dust', 32, 28, 60],
      ['Khaki Drill', 42, 22, 66],
      ['Oat Milk', 40, 30, 82],
      ['Suede Tan', 30, 26, 63],
      ['Sandalwood', 34, 32, 68],
      ['Clay Pot', 24, 28, 58],
      ['Muted Wheat', 44, 24, 76],
      ['Rajasthan Dune', 32, 22, 79],
      ['Burlap', 40, 18, 69],
      ['Nutmeg Shell', 30, 24, 56],
      ['Warm Ash', 36, 10, 72],
      ['Rann Salt', 40, 12, 86],
      ['Chai Masala', 26, 30, 52],
      ['Biscuit Crumb', 34, 26, 75],
      ['Dholpur Stone', 30, 18, 81],
      ['Toasted Oat', 38, 28, 71],
    ],
  },
  {
    key: 'yellow',
    label: 'Yellows & Ochre',
    codeStart: 1081,
    rows: [
      ['Marigold', 44, 85, 56],
      ['Haldi', 46, 78, 52],
      ['Sarson Field', 50, 82, 54],
      ['Kesar Silk', 40, 70, 62],
      ['Sunflower Head', 48, 88, 58],
      ['Old Gold', 42, 55, 50],
      ['Brass Leaf', 44, 52, 45],
      ['Mustard Seed', 46, 60, 40],
      ['Amber Jar', 40, 65, 55],
      ['Turmeric Root', 42, 72, 45],
      ['Lemon Peel', 54, 80, 62],
      ['Corn Silk', 52, 60, 78],
      ['Ghee Lamp', 46, 55, 70],
      ['Mango Pulp', 44, 70, 66],
      ['Ochre Field', 38, 62, 48],
      ['Honey Comb', 42, 68, 51],
      ['Straw Stack', 48, 45, 68],
      ['Bitter Lemon', 58, 65, 46],
      ['Temple Brass', 40, 48, 42],
      ['Dull Saffron', 40, 58, 58],
      ['Genda Phool', 44, 80, 60],
    ],
  },
  {
    key: 'terracotta',
    label: 'Orange & Terracotta',
    codeStart: 1121,
    rows: [
      ['Terracotta', 20, 62, 45],
      ['Sindoor Clay', 16, 66, 42],
      ['Burnt Sienna', 14, 58, 38],
      ['Rust Patina', 18, 55, 35],
      ['Brick Kiln', 22, 52, 40],
      ['Coral Clay', 14, 55, 55],
      ['Pumpkin Skin', 24, 68, 48],
      ['Tandoor Glow', 18, 72, 44],
      ['Autumn Leaf', 26, 60, 42],
      ['Papaya Flesh', 22, 62, 58],
      ['Copper Wire', 24, 55, 45],
      ['Roasted Clay', 16, 48, 32],
      ['Kesariya', 28, 78, 52],
      ['Chilli Powder', 10, 68, 40],
      ['Clay Roof', 20, 48, 50],
      ['Marmalade', 30, 65, 50],
      ['Sunset Brick', 14, 62, 48],
      ['Pottery Red', 12, 55, 38],
      ['Mango Chutney', 34, 62, 38],
      ['Ochre Rust', 20, 50, 34],
      ['Kumkum Water', 8, 60, 46],
    ],
  },
  {
    key: 'red',
    label: 'Red & Maroon',
    codeStart: 1161,
    rows: [
      ['Post Box Red', 358, 72, 44],
      ['Sindoor', 4, 74, 46],
      ['Tomato Skin', 6, 68, 42],
      ['Tile Red', 2, 62, 36],
      ['Ruby Lacquer', 350, 65, 35],
      ['Wine Bark', 348, 45, 26],
      ['Beetroot', 340, 55, 30],
      ['Maroon Velvet', 352, 50, 22],
      ['Pomegranate', 350, 60, 32],
      ['Ox Blood', 356, 48, 20],
      ['Chinar Leaf', 10, 55, 34],
      ['Cranberry', 344, 58, 38],
      ['Lac Dye', 356, 65, 30],
      ['Rosewood', 350, 40, 25],
      ['Anar Red', 352, 70, 38],
      ['Deep Madder', 0, 55, 28],
      ['Coffee Cherry', 8, 42, 30],
      ['Gulkand', 342, 45, 36],
      ['Crimson Door', 354, 78, 40],
      ['Kaththa Red', 6, 50, 32],
      ['Brick Red', 4, 52, 38],
    ],
  },
  {
    key: 'pink',
    label: 'Pink & Blush',
    codeStart: 1201,
    rows: [
      ['Gulabi', 340, 48, 68],
      ['Blush Plaster', 12, 32, 82],
      ['Rose Quartz', 350, 28, 76],
      ['Old Rose', 345, 26, 62],
      ['Powder Pink', 350, 40, 86],
      ['Peony Petal', 342, 45, 72],
      ['Kulfi Rose', 355, 30, 80],
      ['Lotus Petal', 348, 38, 74],
      ['Chalk Pink', 0, 18, 88],
      ['Salmon Mousse', 12, 42, 70],
      ['Faded Rani', 338, 40, 58],
      ['Sakura Dust', 348, 25, 84],
      ['Candy Floss', 340, 55, 80],
      ['Coral Shell', 8, 48, 68],
      ['Onion Skin', 350, 22, 72],
      ['Brick Pink', 2, 32, 58],
      ['Rosewater', 352, 30, 78],
      ['Rani Pink', 336, 62, 50],
      ['Tinted Plaster', 10, 22, 78],
      ['Musk Melon', 16, 38, 76],
      ['Gulaal Dust', 344, 35, 66],
    ],
  },
  {
    key: 'mauve',
    label: 'Mauve & Plum',
    codeStart: 1241,
    rows: [
      ['Jamun', 285, 30, 26],
      ['Aubergine Skin', 290, 32, 20],
      ['Mauve Silk', 285, 18, 58],
      ['Brinjal', 292, 34, 24],
      ['Plum Pulp', 288, 28, 30],
      ['Iris Dust', 275, 14, 62],
      ['Grape Vine', 282, 24, 36],
      ['Orchid Ash', 278, 16, 70],
      ['Violet Slate', 270, 12, 48],
      ['Mulberry', 300, 22, 28],
      ['Elderberry', 292, 20, 22],
      ['Wisteria', 272, 22, 74],
      ['Tanzanite', 268, 30, 34],
      ['Black Currant', 296, 26, 18],
      ['Purple Sage', 280, 10, 54],
      ['Fig Skin', 288, 18, 32],
      ['Amethyst Stone', 274, 20, 44],
      ['Damson', 290, 24, 26],
      ['Dried Lavender', 276, 18, 66],
      ['Raisin', 300, 18, 24],
      ['Mauve Plaster', 282, 12, 60],
    ],
  },
  {
    key: 'blue',
    label: 'Blue',
    codeStart: 1281,
    rows: [
      ['Indigo Ink', 224, 55, 26],
      ['Monsoon Sky', 210, 30, 62],
      ['Navy Drill', 222, 48, 18],
      ['Cobalt Jar', 220, 62, 38],
      ['Denim Patch', 216, 32, 44],
      ['Midnight Well', 226, 45, 14],
      ['Asmani', 205, 55, 66],
      ['Powder Blue', 206, 40, 80],
      ['Royal Sail', 218, 58, 32],
      ['Blue Pottery', 212, 45, 46],
      ['Slate Sapphire', 214, 24, 36],
      ['Lapis Dust', 222, 38, 50],
      ['Rain Cloud', 210, 12, 58],
      ['Deep Marine', 220, 50, 22],
      ['Ikat Blue', 208, 34, 38],
      ['Ink Well', 228, 40, 20],
      ['Periwinkle', 230, 35, 72],
      ['Harbour Blue', 204, 28, 52],
      ['Rainsong', 208, 18, 68],
      ['Sapphire Night', 224, 55, 18],
      ['Ganga Water', 196, 32, 54],
    ],
  },
  {
    key: 'teal',
    label: 'Teal & Aqua',
    codeStart: 1321,
    rows: [
      ['Firozi', 186, 55, 48],
      ['Peacock Feather', 184, 62, 34],
      ['Sea Glass', 176, 28, 70],
      ['Teal Duck', 188, 50, 30],
      ['Aqua Wash', 178, 40, 76],
      ['Turquoise Tile', 182, 58, 44],
      ['Blue Lagoon', 190, 52, 40],
      ['Jade Water', 172, 42, 52],
      ['Oyster Bay', 180, 18, 66],
      ['Sea Foam', 176, 30, 82],
      ['Pond Edge', 168, 32, 38],
      ['Copper Patina', 174, 34, 46],
      ['Deep Teal', 188, 52, 22],
      ['River Stone', 190, 12, 54],
      ['Kerala Backwater', 176, 38, 28],
      ['Glacier Melt', 184, 30, 78],
      ['Aquamarine Jar', 180, 45, 60],
      ['Peacock Tail', 186, 55, 26],
      ['Green Sea', 170, 30, 44],
      ['Mint Water', 174, 25, 74],
      ['Tinted Teal', 182, 22, 62],
    ],
  },
  {
    key: 'green',
    label: 'Green',
    codeStart: 1361,
    rows: [
      ['Neem Leaf', 104, 40, 34],
      ['Bottle Green', 140, 45, 20],
      ['Mehndi', 92, 42, 30],
      ['Coorg Green', 132, 32, 28],
      ['Basil Pot', 112, 38, 36],
      ['Moss Stone', 96, 22, 40],
      ['Fern Shade', 124, 34, 30],
      ['Pea Pod', 86, 40, 46],
      ['Cardamom', 108, 28, 42],
      ['Pine Needle', 148, 35, 24],
      ['Forest Floor', 136, 28, 20],
      ['Chutney Green', 100, 45, 32],
      ['Areca Palm', 118, 30, 38],
      ['Avocado Skin', 78, 32, 40],
      ['Green Apple', 88, 48, 48],
      ['Tea Garden', 128, 24, 34],
      ['Palm Frond', 110, 26, 44],
      ['Bottle Brush', 120, 30, 26],
      ['Monsoon Grass', 106, 32, 42],
      ['Emerald Bangle', 152, 45, 32],
      ['Shamiana Green', 138, 20, 32],
    ],
  },
  {
    key: 'olive',
    label: 'Olive & Sage',
    codeStart: 1401,
    rows: [
      ['Sage Brush', 84, 16, 62],
      ['Olive Grove', 72, 26, 38],
      ['Eucalyptus', 140, 14, 58],
      ['Dried Thyme', 78, 18, 48],
      ['Rosemary', 130, 18, 44],
      ['Lichen Stone', 88, 14, 56],
      ['Wet Moss', 96, 22, 34],
      ['Cucumber Peel', 100, 24, 56],
      ['Fennel', 70, 22, 66],
      ['Artichoke', 82, 20, 46],
      ['Willow Leaf', 92, 18, 54],
      ['Cactus Grey', 110, 12, 50],
      ['Pine Fog', 150, 10, 62],
      ['Vetiver', 86, 24, 32],
      ['Green Clay', 76, 16, 42],
      ['Banyan Shade', 120, 14, 28],
      ['Khaki Green', 64, 22, 44],
      ['Wild Grass', 74, 24, 52],
      ['Pistachio', 66, 28, 70],
      ['Bamboo Shoot', 90, 20, 58],
      ['Olive Drab', 68, 24, 30],
    ],
  },
  {
    key: 'brown',
    label: 'Brown & Earth',
    codeStart: 1441,
    rows: [
      ['Banyan Bark', 22, 28, 26],
      ['Coffee Bean', 20, 32, 22],
      ['Cocoa Dust', 18, 26, 30],
      ['Walnut Shell', 24, 30, 24],
      ['Dark Teak', 20, 36, 20],
      ['Oudh Brown', 14, 32, 24],
      ['Cinnamon Stick', 16, 40, 32],
      ['Toffee', 24, 38, 38],
      ['Mud Wall', 30, 26, 36],
      ['Chocolate Bar', 12, 30, 18],
      ['Burl Wood', 18, 30, 28],
      ['Chestnut', 10, 34, 30],
      ['Saddle Leather', 22, 36, 34],
      ['Espresso', 18, 28, 14],
      ['Tobacco Leaf', 28, 32, 26],
      ['Clay Brown', 24, 24, 40],
      ['Date Palm', 20, 22, 30],
      ['Iron Rust', 14, 30, 22],
      ['Peat', 26, 20, 18],
      ['Katha Bark', 16, 26, 28],
      ['Burnt Umber', 22, 24, 20],
    ],
  },
  {
    key: 'grey',
    label: 'Grey',
    codeStart: 1481,
    rows: [
      ['Pearl Grey', 40, 6, 82],
      ['Slate Dust', 220, 6, 56],
      ['Graphite', 40, 5, 34],
      ['Cement Wall', 40, 6, 68],
      ['Mist Grey', 200, 5, 76],
      ['Ash Tray', 40, 5, 62],
      ['Storm Cloud', 220, 8, 46],
      ['Lead Pencil', 40, 4, 38],
      ['Dove Grey', 30, 5, 72],
      ['Concrete', 40, 5, 58],
      ['Smoke Stack', 40, 4, 42],
      ['Tin Roof', 200, 6, 50],
      ['Gunmetal', 220, 8, 30],
      ['Fog Bank', 200, 4, 84],
      ['Elephant Hide', 40, 6, 48],
      ['Wet Stone', 40, 5, 52],
      ['Iron Filings', 220, 6, 26],
      ['Shadow Grey', 40, 4, 22],
      ['Cold Steel', 210, 7, 40],
      ['Monsoon Grey', 210, 5, 64],
      ['Bone Grey', 40, 8, 74],
    ],
  },
  {
    key: 'black',
    label: 'Charcoal & Black',
    codeStart: 1521,
    rows: [
      ['Charcoal Bloom', 40, 8, 14],
      ['Midnight Ink', 220, 12, 10],
      ['Coal Cellar', 40, 5, 12],
      ['Lamp Black', 40, 3, 8],
      ['Tar Road', 40, 4, 16],
      ['Deep Graphite', 220, 6, 18],
      ['Obsidian', 220, 8, 7],
      ['Ebony', 30, 6, 10],
      ['Carbon', 40, 2, 11],
      ['Soot', 40, 4, 13],
      ['Black Olive', 70, 8, 15],
      ['Basalt', 210, 5, 15],
      ['Jet Stone', 40, 2, 6],
      ['Raven', 240, 6, 9],
      ['Pitch', 40, 3, 5],
      ['Onyx', 300, 4, 8],
      ['Shadow Black', 40, 2, 12],
      ['Iron Black', 210, 4, 17],
      ['Night Well', 220, 6, 12],
      ['Kajal', 40, 4, 14],
      ['Burnt Coal', 40, 5, 19],
    ],
  },
  {
    key: 'pastel',
    label: 'Mint & Pastel',
    codeStart: 1561,
    rows: [
      ['Mint Frost', 160, 30, 88],
      ['Baby Blue', 205, 45, 86],
      ['Lemon Sorbet', 52, 60, 88],
      ['Peach Whip', 20, 45, 88],
      ['Lavender Mist', 270, 22, 86],
      ['Pista Ice', 90, 30, 85],
      ['Rose Smoke', 348, 18, 84],
      ['Aqua Puff', 182, 32, 86],
      ['Butter Paper', 46, 45, 90],
      ['Mint Leaf Faint', 150, 22, 82],
      ['Powder Sky', 196, 30, 84],
      ['Blush Cotton', 6, 25, 90],
      ['Primrose Tint', 44, 40, 86],
      ['Seafoam Tint', 172, 24, 85],
      ['Lilac Chalk', 262, 16, 84],
      ['Cream Soda', 40, 45, 91],
      ['Veri Peri Light', 236, 30, 82],
      ['Tinted Mint', 166, 20, 88],
      ['Faint Coral', 12, 35, 89],
      ['Pale Pista', 78, 25, 87],
      ['Chalk Aqua', 186, 18, 90],
    ],
  },
];

export type ShadeSeedRow = {
  id: number;
  code: string;
  name: string;
  family: string;
  hex: string;
  lrv: number;
  finishes: string;
};

export function buildShades(): ShadeSeedRow[] {
  const out: ShadeSeedRow[] = [];
  let id = 1;
  for (const fam of shadeFamilies) {
    fam.rows.forEach((row, i) => {
      const [name, h, s, l] = row;
      const hex = hslToHex(h, s, l);
      const lrv = lrvOf(hex);
      out.push({
        id: id++,
        code: `RG-${fam.codeStart + i}`,
        name,
        family: fam.label,
        hex,
        lrv,
        finishes: finishesFor(lrv),
      });
    });
  }
  return out;
}
