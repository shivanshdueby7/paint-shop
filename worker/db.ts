import { brands, categories, products } from './seed/catalog';
import { buildShades } from './seed/shades';
import type { Env } from './env';

// Schema is created and seeded by the Worker itself on first use, so a fresh
// D1 database (or a local one) needs no manual migration step.
const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    blurb TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    brand_id INTEGER, category_id INTEGER NOT NULL, range_tier TEXT NOT NULL DEFAULT 'Premium',
    finish TEXT NOT NULL DEFAULT '', base TEXT NOT NULL DEFAULT '', coverage REAL NOT NULL DEFAULT 0,
    coverage_unit TEXT NOT NULL DEFAULT '', coats INTEGER NOT NULL DEFAULT 2,
    blurb TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL, pack_size TEXT NOT NULL,
    mrp REAL NOT NULL DEFAULT 0, price REAL NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0,
    low_stock_at INTEGER NOT NULL DEFAULT 4, batch TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS shades (
    id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    family TEXT NOT NULL, hex TEXT NOT NULL, lrv INTEGER NOT NULL, finishes TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS product_shades (
    product_id INTEGER NOT NULL, shade_id INTEGER NOT NULL, PRIMARY KEY (product_id, shade_id)
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'retail', gstin TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '', credit_limit REAL NOT NULL DEFAULT 0,
    balance REAL NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY, bill_no TEXT NOT NULL UNIQUE, customer_id INTEGER,
    customer_name TEXT NOT NULL DEFAULT '', customer_phone TEXT NOT NULL DEFAULT '',
    bill_type TEXT NOT NULL DEFAULT 'memo', sold_at TEXT NOT NULL, subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL DEFAULT 0, taxable REAL NOT NULL DEFAULT 0,
    gst_rate REAL NOT NULL DEFAULT 18, cgst REAL NOT NULL DEFAULT 0, sgst REAL NOT NULL DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'cash', status TEXT NOT NULL DEFAULT 'paid',
    notes TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY, sale_id INTEGER NOT NULL, variant_id INTEGER,
    product_name TEXT NOT NULL, pack_size TEXT NOT NULL DEFAULT '',
    shade_code TEXT NOT NULL DEFAULT '', shade_name TEXT NOT NULL DEFAULT '',
    tint_formula TEXT NOT NULL DEFAULT '', qty REAL NOT NULL DEFAULT 1,
    rate REAL NOT NULL DEFAULT 0, amount REAL NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS stock_moves (
    id INTEGER PRIMARY KEY, variant_id INTEGER NOT NULL, qty INTEGER NOT NULL,
    kind TEXT NOT NULL, ref TEXT NOT NULL DEFAULT '', batch TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'quote', name TEXT NOT NULL,
    phone TEXT NOT NULL, message TEXT NOT NULL DEFAULT '', shade_codes TEXT NOT NULL DEFAULT '',
    area_sqft REAL, photo_key TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT '', handled_at TEXT NOT NULL DEFAULT '',
    handled_by TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, sale_id INTEGER,
    amount REAL NOT NULL, mode TEXT NOT NULL DEFAULT 'cash', note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY, tag TEXT NOT NULL DEFAULT '', title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '', saving TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at)`,
  `CREATE INDEX IF NOT EXISTS idx_items_sale ON sale_items(sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_moves_variant ON stock_moves(variant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status)`,
];

export function nowIso(): string {
  return new Date().toISOString();
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** RG-<ddmmyy>-<nn>, the way a counter book numbers the day's bills. */
export function makeBillNo(date = new Date(), seq = 1): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(2);
  return `RG-${dd}${mm}${yy}-${String(seq).padStart(2, '0')}`;
}

export async function readSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  return row?.value ?? null;
}

export async function writeSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, value)
    .run();
}

async function runSchema(db: D1Database) {
  for (const sql of SCHEMA_SQL) {
    await db.prepare(sql).run();
  }
}

async function seedBrandsAndCategories(db: D1Database) {
  const stmts: D1PreparedStatement[] = [];
  for (const b of brands) {
    stmts.push(
      db.prepare('INSERT OR IGNORE INTO brands (id, slug, name, note) VALUES (?, ?, ?, ?)').bind(b.id, b.slug, b.name, b.note),
    );
  }
  for (const c of categories) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO categories (id, slug, name, blurb, sort) VALUES (?, ?, ?, ?, ?)')
        .bind(c.id, c.slug, c.name, c.blurb, c.sort),
    );
  }
  await db.batch(stmts);
}

async function seedProducts(db: D1Database) {
  const createdAt = nowIso();
  const stmts: D1PreparedStatement[] = [];
  let variantId = 1;
  for (const p of products) {
    const brand = p.brand ? brands.find((b) => b.slug === p.brand) : null;
    const cat = categories.find((c) => c.slug === p.category)!;
    stmts.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO products
            (id, slug, name, brand_id, category_id, range_tier, finish, base, coverage, coverage_unit, coats, blurb, is_active, sort, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          p.id, p.slug, p.name, brand?.id ?? null, cat.id, p.range, p.finish, p.base,
          p.coverage, p.coverageUnit, p.coats, p.blurb, p.id, createdAt,
        ),
    );
    for (const [pack, mrp, price, stock] of p.sizes) {
      const batch = `B${260 + ((p.id * 7 + variantId) % 40)}`;
      stmts.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO product_variants
              (id, product_id, pack_size, mrp, price, stock, low_stock_at, batch, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(variantId, p.id, pack, mrp, price, stock, pack.startsWith('20') || pack.startsWith('40') ? 3 : 5, batch, createdAt),
      );
      variantId++;
    }
  }
  await db.batch(stmts);
}

async function seedShades(db: D1Database) {
  const shades = buildShades();
  const stmts: D1PreparedStatement[] = [];
  for (const s of shades) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO shades (id, code, name, family, hex, lrv, finishes) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(s.id, s.code, s.name, s.family, s.hex, s.lrv, s.finishes),
    );
  }
  await db.batch(stmts);

  // Which shades we can tint into which product: the finish printed on the
  // shade card decides it, which is how a dealer's tinting machine is set up.
  const links: D1PreparedStatement[] = [];
  for (const p of products) {
    if (!['interior', 'exterior', 'enamel'].includes(p.category)) continue;
    for (const s of shades) {
      if (!s.finishes.includes(p.finish)) continue;
      links.push(db.prepare('INSERT OR IGNORE INTO product_shades (product_id, shade_id) VALUES (?, ?)').bind(p.id, s.id));
    }
  }
  for (let i = 0; i < links.length; i += 200) {
    await db.batch(links.slice(i, i + 200));
  }
}

async function seedOffers(db: D1Database) {
  const rows: [string, string, string, string][] = [
    ['Interior combo', 'Hall + two bedrooms', 'Royale Luxury 10 L, Birla White putty 40 kg, primer 10 L, any shade from our card. One bill, one delivery, no separate trips.', 'Counter bundle rate'],
    ['Full house', 'Interior + exterior, 3 BHK', 'Apex Ultima 20 L outside, Royale 20 L inside, primer and putty included. We will sit with the shade card once before you finalise.', 'Ask for the package rate'],
    ['Contractor', 'Bulk slab, registered contractors', 'Above ₹50,000 a month: 4–6% off list, khata with 30-day terms, site delivery in Teliyarganj and Jhalwa.', 'Slab decided at the counter'],
    ['Monsoon', 'Damp patch check', 'Bring a photo of the seepage. We will tell you whether it needs putty, primer or SmartCare before you spend money on paint.', 'No charge for the check'],
  ];
  const stmts = rows.map((r, i) =>
    db
      .prepare('INSERT OR IGNORE INTO offers (id, tag, title, detail, saving, is_active, sort) VALUES (?, ?, ?, ?, ?, 1, ?)')
      .bind(i + 1, r[0], r[1], r[2], r[3], i + 1),
  );
  await db.batch(stmts);
}

async function seedDemoBooks(db: D1Database) {
  const createdAt = nowIso();
  const customers = [
    ['Ashok Kumar Painter', '9876543211', 'contractor', '', 'Teliyarganj, behind Ram Mandir', 20000, 'Takes 20 L drums, settles every second Saturday.'],
    ['Sahara Construction', '9876543212', 'contractor', '09AABCS1429P1Z4', 'Jhalwa bypass road', 60000, 'Site billing, needs GST invoice every time.'],
    ['Ramesh Chandra', '9876543213', 'retail', '', 'Awas Vikas Colony, Jhunsi', 0, ''],
    ['Meena Devi', '9876543214', 'retail', '', 'Teliyarganj main road', 0, ''],
  ] as const;
  const cStmts = customers.map((c, i) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO customers (id, name, phone, type, gstin, address, credit_limit, balance, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .bind(i + 1, c[0], c[1], c[2], c[3], c[4], c[5], c[6], createdAt),
  );
  await db.batch(cStmts);

  // variant lookup so the demo bills reference real packs
  const vRows = await db.prepare('SELECT id, product_id, pack_size, price FROM product_variants').all<{
    id: number; product_id: number; pack_size: string; price: number;
  }>();
  const shadeRows = await db.prepare('SELECT id, code, name FROM shades ORDER BY id').all<{ id: number; code: string; name: string }>();
  if (!vRows.results.length || !shadeRows.results.length) return;

  const pickVariant = (productId: number, pack: string) =>
    vRows.results.find((v) => v.product_id === productId && v.pack_size === pack);

  const defs: [number, number, number | null, string, string, string, number, [number, string, number][]][] = [
    [0, 11, 4, 'cash', 'memo', 'paid', 0, [[4, '4 L', 2], [9, '10 kg', 1]]],
    [0, 12, 0, 'upi', 'invoice', 'paid', 50, [[1, '4 L', 2], [10, '4 L', 1], [28, '1 pc', 2]]],
    [1, 10, null, 'cash', 'memo', 'paid', 0, [[7, '10 L', 1], [18, '4 L', 1]]],
    [1, 17, 1, 'credit', 'invoice', 'credit', 200, [[6, '20 L', 2], [9, '40 kg', 4], [10, '10 L', 2]]],
    [2, 12, 2, 'upi', 'memo', 'paid', 0, [[3, '10 L', 1], [29, '1 pc', 2]]],
    [2, 15, null, 'cash', 'memo', 'paid', 20, [[32, '1 sheet', 10], [30, '20 m roll', 2]]],
    [3, 11, 0, 'cash', 'invoice', 'paid', 100, [[5, '4 L', 1], [13, '10 L', 1]]],
    [3, 18, 3, 'upi', 'memo', 'paid', 0, [[15, '4 L', 1], [10, '4 L', 1]]],
    [4, 10, 1, 'credit', 'invoice', 'credit', 0, [[19, '10 L', 2], [26, '40 kg', 6]]],
    [5, 13, null, 'cash', 'memo', 'paid', 0, [[2, '1 L', 2], [29, '1 pc', 1]]],
    [6, 16, 2, 'cash', 'memo', 'paid', 0, [[16, '20 L', 2], [17, '1 L', 3]]],
    [8, 12, 0, 'upi', 'invoice', 'paid', 150, [[1, '10 L', 1], [9, '20 kg', 2], [11, '4 L', 1]]],
  ];

  let saleId = 1;
  let itemId = 1;
  const byDay = new Map<string, number>();
  for (const [daysAgo, hour, customerId, mode, type, status, discount, lines] of defs) {
    const date = new Date(Date.now() - daysAgo * 86400000);
    date.setHours(hour, (saleId * 13) % 60, 0, 0);
    const dayKey = date.toDateString();
    const seq = (byDay.get(dayKey) ?? 0) + 1;
    byDay.set(dayKey, seq);

    const items = lines
      .map(([pid, pack, qty]) => {
        const v = pickVariant(pid, pack);
        if (!v) return null;
        return { v, qty };
      })
      .filter((x): x is { v: { id: number; product_id: number; pack_size: string; price: number }; qty: number } => x !== null);
    if (!items.length) continue;

    const subtotal = round2(items.reduce((s, it) => s + it.v.price * it.qty, 0));
    const total = round2(Math.max(0, subtotal - discount));
    const taxable = round2(total / 1.18);
    const tax = round2(total - taxable);
    const cust = customerId === null ? null : customers[customerId];
    const billNo = makeBillNo(date, seq);

    await db
      .prepare(
        `INSERT OR IGNORE INTO sales
          (id, bill_no, customer_id, customer_name, customer_phone, bill_type, sold_at, subtotal, discount,
           total, taxable, gst_rate, cgst, sgst, payment_mode, status, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 18, ?, ?, ?, ?, '', 'shop', ?)`,
      )
      .bind(
        saleId, billNo, customerId, cust?.[0] ?? 'Walk-in', cust?.[1] ?? '', type, date.toISOString(),
        subtotal, discount, total, taxable, round2(tax / 2), round2(tax / 2), mode, status, date.toISOString(),
      )
      .run();

    for (const it of items) {
      const shade = shadeRows.results[(saleId * 7 + itemId * 11) % shadeRows.results.length];
      const pname = products.find((p) => p.id === it.v.product_id)?.name ?? 'Paint';
      const isPaint = ['interior', 'exterior', 'enamel'].includes(products.find((p) => p.id === it.v.product_id)?.category ?? '');
      await db
        .prepare(
          `INSERT OR IGNORE INTO sale_items
            (id, sale_id, variant_id, product_name, pack_size, shade_code, shade_name, tint_formula, qty, rate, amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          itemId++, saleId, it.v.id, pname, it.v.pack_size,
          isPaint ? shade.code : '', isPaint ? shade.name : '',
          isPaint ? `1x${(itemId % 9) + 1}0 ml colourant` : '',
          it.qty, it.v.price, round2(it.v.price * it.qty),
        )
        .run();
    }

    if (status === 'credit' && customerId !== null) {
      // The sale row already carries the charge on the khata ledger; a matching
      // payment row would make the ledger read the bill twice.
      await db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').bind(total, customerId).run();
    }
    saleId++;
  }

  // One contractor already part-paid, so ageing has something to show.
  await db.prepare('UPDATE customers SET balance = 4250 WHERE id = 1').run();
}

export async function initDb(db: D1Database): Promise<void> {
  await runSchema(db);
  const seeded = await db.prepare("SELECT value FROM meta WHERE key = 'seed_version'").first<{ value: string }>();
  if (seeded?.value === '1') return;
  await seedBrandsAndCategories(db);
  await seedProducts(db);
  await seedShades(db);
  await seedOffers(db);
  await seedDemoBooks(db);
  await db.prepare("INSERT INTO meta (key, value) VALUES ('seed_version', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
}

const booted = new WeakMap<object, Promise<void>>();

/** Runs schema + seed once per isolate. */
export function ensureDb(env: Env): Promise<void> {
  let p = booted.get(env.DB as unknown as object);
  if (!p) {
    p = initDb(env.DB).catch((err) => {
      booted.delete(env.DB as unknown as object);
      throw err;
    });
    booted.set(env.DB as unknown as object, p);
  }
  return p;
}
