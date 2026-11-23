// One place for everything that is the shop's own. Change these four lines and
// the whole site follows — phone links, WhatsApp, hours, footer, JSON-LD.

export type HoursBlock = {
  label: string;
  short: string;
  days: number[];
  windows: [string, string][];
  note?: string;
};

export const site = {
  name: 'Rang Ghar',
  fullName: 'Rang Ghar Paint & Hardware',
  city: 'Teliyarganj, Prayagraj',
  since: 1998,
  phoneDisplay: '+91 98765 43210',
  phoneRaw: '+919876543210',
  whatsapp: '919876543210',
  gstin: '09ABCDE1234F1Z5',
  address: {
    lines: ['Shop 4, Jhalwa Road', 'Teliyarganj, near Jhalwa crossing', 'Prayagraj, Uttar Pradesh 211004'],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Teliyarganj+Jhalwa+Road+Prayagraj',
  },
  hours: [
    {
      label: 'Monday to Saturday',
      short: 'Mon – Sat',
      days: [1, 2, 3, 4, 5, 6],
      windows: [
        ['09:30', '14:00'],
        ['16:00', '20:00'],
      ],
      note: 'Counter closed 2 to 4 for lunch. Tinting machine runs till 7:30.',
    },
    {
      label: 'Sunday',
      short: 'Sun',
      days: [0],
      windows: [['10:00', '14:00']],
      note: 'Morning only. No delivery on Sunday afternoon.',
    },
  ] as HoursBlock[],
  brands: ['Asian Paints', 'Berger', 'Nerolac', 'Birla Opus', 'Birla White'],
  landmarks: [
    'Jhalwa crossing — 400 m',
    'Allahabad University, Jhalwa campus — 1.2 km',
    'Teliyarganj main road bus stop — 250 m',
    'Awas Vikas Colony — 1.5 km',
  ],
  delivery: 'Free delivery in Teliyarganj, Jhalwa and Awas Vikas on bills above ₹3,000. Beyond that, we add the rickshaw fare.',
} as const;

export const nav = [
  { to: '/products', label: 'What we stock' },
  { to: '/shades', label: 'Shade card' },
  { to: '/wall', label: 'Shade wall' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/services', label: 'Services' },
  { to: '/offers', label: 'Offers' },
  { to: '/trade', label: 'Contractors' },
  { to: '/visit', label: 'Visit the shop' },
];

export const ranges = [
  {
    tier: 'Economy' as const,
    line: 'For rented flats, godowns, boundary walls and second coats.',
    note: 'We keep full 20 L stacks of these.',
  },
  {
    tier: 'Premium' as const,
    line: 'The middle of the market. What most contractors quote for a new flat.',
    note: 'Best value per square foot, most months.',
  },
  {
    tier: 'Luxury' as const,
    line: 'Washable interiors and weather-facing exteriors for own houses.',
    note: 'Warranty cards issued at the counter.',
  },
  {
    tier: 'Ultra' as const,
    line: 'Top line of each brand. Longer assurance, deeper colour hold.',
    note: 'Usually 4 L and 10 L on the shelf; 20 L on order.',
  },
];

export const services = [
  {
    title: 'Tinting while you wait',
    body: 'Bring the shade code. Our machine tints 1 L, 4 L, 10 L and 20 L packs in about ten minutes. Deep shades take a second pass and a little longer.',
    detail: 'Mon–Sat, till 7:30 pm',
  },
  {
    title: 'Shade sitting',
    body: 'Sit with the physical card under our daylight lamp before you commit. Screen colours lie, especially on phones. This takes twenty minutes and costs nothing.',
    detail: 'Walk in, no appointment',
  },
  {
    title: 'Delivery in Teliyarganj',
    body: '20 L drums and 40 kg putty bags go on the loading rickshaw. Same-day inside Teliyarganj and Jhalwa, next morning beyond that.',
    detail: 'Free above ₹3,000',
  },
  {
    title: 'Painter referral',
    body: 'We keep a short list of painters who have actually finished jobs we supplied. We will not promise a date for them — you talk to the painter directly.',
    detail: 'Three names, your call',
  },
  {
    title: 'Seepage and damp first aid',
    body: 'Show us a photo of the patch. Half the time the answer is SmartCare and putty, not paint. We will tell you that instead of selling a drum.',
    detail: 'Photo on WhatsApp is fine',
  },
  {
    title: 'Texture and feature walls',
    body: 'Royale Play and Excel Mica Marble are applicator jobs. We arrange the material and put you in touch with someone who has done the design before.',
    detail: 'Sample board at the counter',
  },
];

export const faqs = [
  {
    q: 'Is the colour on my phone the same as the wall?',
    a: 'No. Every screen is set differently, and a wall catches light at an angle a screen never does. Treat the swatch as a direction, then look at the physical shade card at the counter — or take a ₹40 sample pot home and paint a one-foot patch.',
  },
  {
    q: 'Which sheen should I take?',
    a: 'Matt hides uneven plaster and is the safe choice for bedrooms and ceilings. Sheen and silk are easier to wipe, so halls, stairs and kids\u2019 rooms. Gloss enamel is for grills, gates and wood — not walls.',
  },
  {
    q: 'How much paint for a 2 BHK?',
    a: 'Rough rule: carpet area × 2.5 gives paintable area (walls plus ceiling). Two coats of interior emulsion at 120–130 sq ft per litre works out to about 40–45 litres for a 900 sq ft flat, plus primer and putty. The calculator on this site does the arithmetic.',
  },
  {
    q: 'Do you give a GST bill?',
    a: 'Yes, on request. Give your GSTIN at the counter and we issue a proper tax invoice with CGST and SGST split. Without it you get a cash memo, which is fine for a household but not for a company claim.',
  },
  {
    q: 'Can I return a tinted pack?',
    a: 'An unopened, untinted pack comes back within seven days with the bill. A tinted pack cannot go back to the company, so we do not take it. This is why we ask you to confirm the shade code before we open the tin.',
  },
  {
    q: 'Do contractors get credit?',
    a: 'Registered contractors get a khata with a limit we agree at the counter, 30-day terms, and a statement on WhatsApp whenever you ask. Retail customers pay at billing.',
  },
];

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

export const telLink = `tel:${site.phoneRaw}`;
