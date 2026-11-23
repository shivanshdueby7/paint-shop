import { Hono } from 'hono';
import { isSameOriginRequest } from '@freebuff/auth';
import type { FreebuffUser } from '@freebuff/auth';
import type { Env } from '../env';
import { getAuth } from '../auth';
import { makeBillNo, nowIso, readSetting, round2, writeSetting } from '../db';

export type Ctx = { Bindings: Env; Variables: { user: FreebuffUser | null } };

export const adminRoutes = new Hono<Ctx>();

const IST = '+330 minutes';

async function resolveOwner(env: Env, user: FreebuffUser | null): Promise<boolean> {
  if (!user) return false;
  const allow = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length) return Boolean(user.email && allow.includes(user.email.toLowerCase()));
  // No allowlist configured: the first signed-in account to open the panel
  // becomes the shop owner, and every later account is turned away.
  const ownerSub = await readSetting(env.DB, 'owner_sub');
  if (!ownerSub) {
    await writeSetting(env.DB, 'owner_sub', user.sub);
    if (user.email) await writeSetting(env.DB, 'owner_email', user.email);
    return true;
  }
  return ownerSub === user.sub;
}

adminRoutes.use('*', async (c, next) => {
  const user = await getAuth(c.env).getUser(c.req.raw);
  c.set('user', user);
  const isOwner = await resolveOwner(c.env, user);
  if (c.req.path.endsWith('/me')) {
    const ownerEmail = await readSetting(c.env.DB, 'owner_email');
    return c.json({ user, isOwner, ownerEmail }, 200, { 'Cache-Control': 'private, no-store' });
  }
  if (!user) return c.json({ error: 'Sign in required' }, 401);
  if (!isOwner) return c.json({ error: 'This account is not the shop owner.' }, 403);
  if (c.req.method !== 'GET' && !isSameOriginRequest(c.req.raw, c.env.APP_ORIGIN)) {
    return c.json({ error: 'Bad origin' }, 403);
  }
  await next();
});

const noStore = { 'Cache-Control': 'private, no-store' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

// ── Overview ─────────────────────────────────────────────────────────────────

adminRoutes.get('/overview', async (c) => {
  const db = c.env.DB;
  const [today, split, week, low, khata, recent, counts] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS bills, COALESCE(SUM(total),0) AS total
         FROM sales WHERE status != 'returned' AND date(sold_at, ?) = date('now', ?)`,
    )
      .bind(IST, IST)
      .first<{ bills: number; total: number }>(),
    db.prepare(
      `SELECT payment_mode AS mode, COUNT(*) AS bills, COALESCE(SUM(total),0) AS total
         FROM sales WHERE status != 'returned' AND date(sold_at, ?) = date('now', ?)
        GROUP BY payment_mode`,
    )
      .bind(IST, IST)
      .all<{ mode: string; bills: number; total: number }>(),
    db.prepare(
      `SELECT date(sold_at, ?) AS day, COUNT(*) AS bills, COALESCE(SUM(total),0) AS total
         FROM sales WHERE status != 'returned' AND date(sold_at, ?) >= date('now', ?, '-6 days')
        GROUP BY day ORDER BY day`,
    )
      .bind(IST, IST, IST)
      .all<{ day: string; bills: number; total: number }>(),
    db.prepare(
      `SELECT v.id, v.pack_size, v.stock, v.low_stock_at, p.name, p.slug
         FROM product_variants v JOIN products p ON p.id = v.product_id
        WHERE p.is_active = 1 AND v.stock <= v.low_stock_at
        ORDER BY (v.stock - v.low_stock_at) ASC, v.stock ASC LIMIT 10`,
    ).all<{ id: number; pack_size: string; stock: number; low_stock_at: number; name: string; slug: string }>(),
    db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(balance),0) AS total FROM customers WHERE balance > 0').first<{
      n: number;
      total: number;
    }>(),
    db.prepare(
      `SELECT id, bill_no, customer_name, total, payment_mode, status, sold_at
         FROM sales ORDER BY id DESC LIMIT 6`,
    ).all(),
    db.prepare(
      `SELECT (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products,
              (SELECT COUNT(*) FROM shades) AS shades,
              (SELECT COUNT(*) FROM customers) AS customers,
              (SELECT COUNT(*) FROM enquiries WHERE status = 'new') AS enquiries`,
    ).first<{ products: number; shades: number; customers: number; enquiries: number }>(),
  ]);

  const totalWeek = (week.results ?? []).reduce((s, r) => s + r.total, 0);
  return c.json(
    {
      today: today ?? { bills: 0, total: 0 },
      split: split.results ?? [],
      week: week.results ?? [],
      weekTotal: round2(totalWeek),
      lowStock: (low.results ?? []).map((r) => ({
        variantId: r.id,
        name: r.name,
        slug: r.slug,
        packSize: r.pack_size,
        stock: r.stock,
        lowStockAt: r.low_stock_at,
      })),
      khata: khata ?? { n: 0, total: 0 },
      recent: recent.results ?? [],
      counts: counts ?? { products: 0, shades: 0, customers: 0, enquiries: 0 },
    },
    200,
    noStore,
  );
});

// ── Sales ────────────────────────────────────────────────────────────────────

type SaleItemIn = { variantId: number; qty: number; rate: number; shadeCode?: string; tintFormula?: string };
type SaleIn = {
  customerId?: number | null;
  customerName?: string;
  customerPhone?: string;
  billType?: string;
  paymentMode?: string;
  discount?: number;
  notes?: string;
  items?: SaleItemIn[];
};

adminRoutes.get('/sales', async (c) => {
  const db = c.env.DB;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const q = c.req.query('q');
  const payment = c.req.query('payment');
  const status = c.req.query('status');
  const where: string[] = ['1 = 1'];
  const args: unknown[] = [];
  if (from) {
    where.push('date(sold_at, ?) >= date(?)');
    args.push(IST, from);
  }
  if (to) {
    where.push('date(sold_at, ?) <= date(?)');
    args.push(IST, to);
  }
  if (payment) {
    where.push('payment_mode = ?');
    args.push(payment);
  }
  if (status) {
    where.push('status = ?');
    args.push(status);
  }
  if (q) {
    where.push('(bill_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  const clause = where.join(' AND ');
  const [rows, totals] = await Promise.all([
    db
      .prepare(
        `SELECT id, bill_no, customer_id, customer_name, customer_phone, bill_type, sold_at,
                subtotal, discount, total, payment_mode, status, notes
           FROM sales WHERE ${clause} ORDER BY id DESC LIMIT 200`,
      )
      .bind(...args)
      .all(),
    db
      .prepare(
        `SELECT COUNT(*) AS bills, COALESCE(SUM(total),0) AS total, COALESCE(SUM(discount),0) AS discount
           FROM sales WHERE ${clause} AND status != 'returned'`,
      )
      .bind(...args)
      .first<{ bills: number; total: number; discount: number }>(),
  ]);
  return c.json({ sales: rows.results ?? [], totals: totals ?? { bills: 0, total: 0, discount: 0 } }, 200, noStore);
});

adminRoutes.get('/sales/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const [sale, items] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM sales WHERE id = ?').bind(id).first(),
    c.env.DB.prepare('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id').bind(id).all(),
  ]);
  if (!sale) return c.json({ error: 'No such bill' }, 404);
  return c.json({ sale, items: items.results ?? [] }, 200, noStore);
});

type VariantForSale = {
  id: number; product_id: number; pack_size: string; price: number; stock: number;
  product_name: string; category_id: number;
};

adminRoutes.post('/sales', async (c) => {
  const db = c.env.DB;
  const body = (await c.req.json().catch(() => null)) as SaleIn | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);

  const items = (body.items ?? []).filter((i) => num(i.variantId) > 0 && num(i.qty) > 0);
  if (!items.length) return c.json({ error: 'Add at least one item to the bill.' }, 400);

  const ids = [...new Set(items.map((i) => Number(i.variantId)))];
  const variantRes = await db
    .prepare(
      `SELECT v.id, v.product_id, v.pack_size, v.price, v.stock, p.name AS product_name, p.category_id
         FROM product_variants v JOIN products p ON p.id = v.product_id
        WHERE v.id IN (${ids.map(() => '?').join(',')})`,
    )
    .bind(...ids)
    .all<VariantForSale>();
  const variants = new Map(variantRes.results.map((v) => [v.id, v]));
  if (variants.size !== ids.length) return c.json({ error: 'One of the items no longer exists.' }, 400);

  const codes = items.map((i) => str(i.shadeCode).trim()).filter(Boolean);
  const shadeMap = new Map<string, string>();
  if (codes.length) {
    const shadeRes = await db
      .prepare(`SELECT code, name FROM shades WHERE code IN (${codes.map(() => '?').join(',')})`)
      .bind(...codes)
      .all<{ code: string; name: string }>();
    for (const s of shadeRes.results) shadeMap.set(s.code, s.name);
  }

  const paymentMode = ['cash', 'upi', 'card', 'credit'].includes(str(body.paymentMode)) ? str(body.paymentMode) : 'cash';
  const billType = str(body.billType) === 'invoice' ? 'invoice' : 'memo';
  const discount = Math.max(0, round2(num(body.discount)));

  const lines = items.map((i) => {
    const v = variants.get(Number(i.variantId))!;
    const rate = num(i.rate) > 0 ? round2(num(i.rate)) : v.price;
    const qty = round2(num(i.qty));
    const shadeCode = str(i.shadeCode).trim().toUpperCase();
    return {
      variant: v,
      qty,
      rate,
      amount: round2(rate * qty),
      shadeCode,
      shadeName: shadeMap.get(shadeCode) ?? '',
      tintFormula: str(i.tintFormula).trim().slice(0, 120),
      isPaint: [1, 2, 3].includes(v.category_id),
    };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const total = round2(Math.max(0, subtotal - discount));
  const taxable = round2(total / 1.18);
  const tax = round2(total - taxable);

  let customerId: number | null = body.customerId ? Number(body.customerId) : null;
  let customerName = str(body.customerName).trim().slice(0, 80) || 'Walk-in';
  let customerPhone = str(body.customerPhone).replace(/[^\d+]/g, '').slice(0, 15);

  if (customerId) {
    const cust = await db.prepare('SELECT id, name, phone FROM customers WHERE id = ?').bind(customerId).first<{
      id: number;
      name: string;
      phone: string;
    }>();
    if (!cust) return c.json({ error: 'That khata account was not found.' }, 400);
    customerName = cust.name;
    customerPhone = cust.phone;
  } else if (paymentMode === 'credit') {
    if (customerPhone.replace(/\D/g, '').length < 10) {
      return c.json({ error: 'A credit bill needs a customer name and phone number.' }, 400);
    }
    const existing = await db
      .prepare('SELECT id, name, phone FROM customers WHERE phone = ?')
      .bind(customerPhone)
      .first<{ id: number; name: string; phone: string }>();
    if (existing) {
      customerId = existing.id;
      customerName = existing.name;
    } else {
      const ins = await db
        .prepare(
          `INSERT INTO customers (name, phone, type, credit_limit, balance, notes, created_at)
           VALUES (?, ?, 'retail', 0, 0, 'Opened at the counter', ?)`,
        )
        .bind(customerName, customerPhone, nowIso())
        .run();
      customerId = Number(ins.meta.last_row_id);
    }
  }

  const now = nowIso();
  const todayCount = await db
    .prepare(`SELECT COUNT(*) AS n FROM sales WHERE date(sold_at, ?) = date('now', ?)`)
    .bind(IST, IST)
    .first<{ n: number }>();

  let saleId = 0;
  let billNo = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    billNo = makeBillNo(new Date(), (todayCount?.n ?? 0) + 1 + attempt);
    try {
      const res = await db
        .prepare(
          `INSERT INTO sales
            (bill_no, customer_id, customer_name, customer_phone, bill_type, sold_at, subtotal, discount,
             total, taxable, gst_rate, cgst, sgst, payment_mode, status, notes, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 18, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          billNo,
          customerId,
          customerName,
          customerPhone,
          billType,
          now,
          subtotal,
          discount,
          total,
          taxable,
          round2(tax / 2),
          round2(tax / 2),
          paymentMode,
          paymentMode === 'credit' ? 'credit' : 'paid',
          str(body.notes).slice(0, 500),
          c.get('user')?.email ?? 'shop',
          now,
        )
        .run();
      saleId = Number(res.meta.last_row_id);
      break;
    } catch (err) {
      if (attempt === 3) throw err;
    }
  }

  const stmts = lines.map((l) =>
    db
      .prepare(
        `INSERT INTO sale_items
          (sale_id, variant_id, product_name, pack_size, shade_code, shade_name, tint_formula, qty, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        saleId,
        l.variant.id,
        l.variant.product_name,
        l.variant.pack_size,
        l.isPaint ? l.shadeCode : '',
        l.isPaint ? l.shadeName : '',
        l.isPaint ? l.tintFormula : '',
        l.qty,
        l.rate,
        l.amount,
      ),
  );
  for (const l of lines) {
    stmts.push(db.prepare('UPDATE product_variants SET stock = stock - ?, updated_at = ? WHERE id = ?').bind(l.qty, now, l.variant.id));
    stmts.push(
      db
        .prepare('INSERT INTO stock_moves (variant_id, qty, kind, ref, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(l.variant.id, -l.qty, 'sale', billNo, '', now),
    );
  }
  if (paymentMode === 'credit' && customerId) {
    stmts.push(db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').bind(total, customerId));
    stmts.push(
      db
        .prepare('INSERT INTO payments (customer_id, sale_id, amount, mode, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(customerId, saleId, -total, 'credit', `Bill ${billNo} on khata`, now),
    );
  }
  await db.batch(stmts);

  return c.json({ ok: true, id: saleId, billNo, total }, 201, noStore);
});

adminRoutes.post('/sales/:id/return', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const sale = await db.prepare('SELECT * FROM sales WHERE id = ?').bind(id).first<{
    id: number; bill_no: string; total: number; customer_id: number | null; status: string;
  }>();
  if (!sale) return c.json({ error: 'No such bill' }, 404);
  if (sale.status === 'returned') return c.json({ error: 'This bill is already returned.' }, 409);

  const items = await db
    .prepare('SELECT variant_id, qty FROM sale_items WHERE sale_id = ?')
    .bind(id)
    .all<{ variant_id: number | null; qty: number }>();
  const now = nowIso();
  const stmts: D1PreparedStatement[] = [
    db.prepare("UPDATE sales SET status = 'returned' WHERE id = ?").bind(id),
  ];
  for (const it of items.results ?? []) {
    if (!it.variant_id) continue;
    stmts.push(db.prepare('UPDATE product_variants SET stock = stock + ?, updated_at = ? WHERE id = ?').bind(it.qty, now, it.variant_id));
    stmts.push(
      db
        .prepare('INSERT INTO stock_moves (variant_id, qty, kind, ref, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(it.variant_id, it.qty, 'return', sale.bill_no, '', now),
    );
  }
  if (sale.customer_id) {
    stmts.push(db.prepare('UPDATE customers SET balance = MAX(0, balance - ?) WHERE id = ?').bind(sale.total, sale.customer_id));
    stmts.push(
      db
        .prepare('INSERT INTO payments (customer_id, sale_id, amount, mode, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(sale.customer_id, sale.id, sale.total, 'return', `Return against ${sale.bill_no}`, now),
    );
  }
  await db.batch(stmts);
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.post('/sales/:id/payment', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as { amount?: number; mode?: string; note?: string } | null;
  const amount = round2(num(body?.amount));
  if (amount <= 0) return c.json({ error: 'Enter an amount above zero.' }, 400);
  const sale = await db.prepare('SELECT id, bill_no, customer_id FROM sales WHERE id = ?').bind(id).first<{
    id: number; bill_no: string; customer_id: number | null;
  }>();
  if (!sale) return c.json({ error: 'No such bill' }, 404);
  if (!sale.customer_id) return c.json({ error: 'This was a paid bill, nothing to receive.' }, 400);

  const now = nowIso();
  const mode = ['cash', 'upi', 'card'].includes(str(body?.mode)) ? str(body?.mode) : 'cash';
  await db.batch([
    db.prepare('UPDATE customers SET balance = MAX(0, balance - ?) WHERE id = ?').bind(amount, sale.customer_id),
    db
      .prepare('INSERT INTO payments (customer_id, sale_id, amount, mode, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(sale.customer_id, sale.id, amount, mode, str(body?.note) || `Received against ${sale.bill_no}`, now),
  ]);
  return c.json({ ok: true }, 200, noStore);
});

// ── Khata / customers ────────────────────────────────────────────────────────

adminRoutes.get('/customers', async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT c.*, (SELECT MAX(sold_at) FROM sales s WHERE s.customer_id = c.id) AS last_sale_at,
            (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id) AS bill_count
       FROM customers c ORDER BY c.balance DESC, c.name`,
  ).all();
  return c.json({ customers: res.results ?? [] }, 200, noStore);
});

adminRoutes.post('/customers', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = str(body?.name).trim().slice(0, 80);
  const phone = str(body?.phone).replace(/[^\d+]/g, '').slice(0, 15);
  if (name.length < 2) return c.json({ error: 'Write the customer name.' }, 400);
  if (phone.replace(/\D/g, '').length < 10) return c.json({ error: 'Write a 10 digit phone number.' }, 400);
  const res = await c.env.DB.prepare(
    `INSERT INTO customers (name, phone, type, gstin, address, credit_limit, balance, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  )
    .bind(
      name,
      phone,
      str(body?.type) === 'contractor' ? 'contractor' : 'retail',
      str(body?.gstin).toUpperCase().slice(0, 20),
      str(body?.address).slice(0, 200),
      Math.max(0, num(body?.creditLimit)),
      str(body?.notes).slice(0, 500),
      nowIso(),
    )
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
});

adminRoutes.patch('/customers/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.name !== undefined) {
    const v = str(body.name).trim().slice(0, 80);
    if (v.length < 2) return c.json({ error: 'Name is too short.' }, 400);
    sets.push('name = ?');
    args.push(v);
  }
  if (body.phone !== undefined) {
    sets.push('phone = ?');
    args.push(str(body.phone).replace(/[^\d+]/g, '').slice(0, 15));
  }
  if (body.type !== undefined) {
    sets.push('type = ?');
    args.push(str(body.type) === 'contractor' ? 'contractor' : 'retail');
  }
  if (body.gstin !== undefined) {
    sets.push('gstin = ?');
    args.push(str(body.gstin).toUpperCase().slice(0, 20));
  }
  if (body.address !== undefined) {
    sets.push('address = ?');
    args.push(str(body.address).slice(0, 200));
  }
  if (body.creditLimit !== undefined) {
    sets.push('credit_limit = ?');
    args.push(Math.max(0, num(body.creditLimit)));
  }
  if (body.notes !== undefined) {
    sets.push('notes = ?');
    args.push(str(body.notes).slice(0, 500));
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  args.push(id);
  await c.env.DB.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.get('/customers/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const [customer, sales, payments] = await Promise.all([
    db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first(),
    db
      .prepare(
        `SELECT id, bill_no, sold_at, total, payment_mode, status, bill_type
           FROM sales WHERE customer_id = ? ORDER BY id DESC LIMIT 100`,
      )
      .bind(id)
      .all(),
    db
      .prepare('SELECT id, sale_id, amount, mode, note, created_at FROM payments WHERE customer_id = ? ORDER BY id DESC LIMIT 100')
      .bind(id)
      .all(),
  ]);
  if (!customer) return c.json({ error: 'No such customer' }, 404);
  return c.json({ customer, sales: sales.results ?? [], payments: payments.results ?? [] }, 200, noStore);
});

adminRoutes.post('/customers/:id/payment', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as { amount?: number; mode?: string; note?: string } | null;
  const amount = round2(num(body?.amount));
  if (amount <= 0) return c.json({ error: 'Enter an amount above zero.' }, 400);
  const cust = await db.prepare('SELECT id, balance FROM customers WHERE id = ?').bind(id).first<{ id: number; balance: number }>();
  if (!cust) return c.json({ error: 'No such customer' }, 404);
  const mode = ['cash', 'upi', 'card'].includes(str(body?.mode)) ? str(body?.mode) : 'cash';
  await db.batch([
    db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').bind(amount, id),
    db
      .prepare('INSERT INTO payments (customer_id, sale_id, amount, mode, note, created_at) VALUES (?, NULL, ?, ?, ?, ?)')
      .bind(id, amount, mode, str(body?.note) || 'Payment received', nowIso()),
  ]);
  return c.json({ ok: true }, 200, noStore);
});

// ── Catalogue ────────────────────────────────────────────────────────────────

adminRoutes.get('/products', async (c) => {
  const db = c.env.DB;
  const [prods, vars, brandsRes, catsRes] = await Promise.all([
    db
      .prepare(
        `SELECT p.*, b.name AS brand_name, c.name AS category_name
           FROM products p LEFT JOIN brands b ON b.id = p.brand_id
           JOIN categories c ON c.id = p.category_id
          ORDER BY p.is_active DESC, p.sort, p.id`,
      )
      .all(),
    db.prepare('SELECT * FROM product_variants ORDER BY product_id, id').all(),
    db.prepare('SELECT id, slug, name, note FROM brands ORDER BY id').all(),
    db.prepare('SELECT id, slug, name, blurb, sort FROM categories ORDER BY sort').all(),
  ]);
  return c.json(
    { products: prods.results ?? [], variants: vars.results ?? [], brands: brandsRes.results ?? [], categories: catsRes.results ?? [] },
    200,
    noStore,
  );
});

adminRoutes.post('/products', async (c) => {
  const db = c.env.DB;
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = str(body?.name).trim().slice(0, 90);
  if (name.length < 2) return c.json({ error: 'Give the product a name.' }, 400);
  const categoryId = num(body?.categoryId);
  if (!categoryId) return c.json({ error: 'Pick a category.' }, 400);
  let slug = slugify(name) || `item-${Date.now()}`;
  const clash = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first();
  if (clash) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  const res = await db
    .prepare(
      `INSERT INTO products (slug, name, brand_id, category_id, range_tier, finish, base, coverage,
        coverage_unit, coats, blurb, is_active, sort, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
    .bind(
      slug,
      name,
      num(body?.brandId) || null,
      categoryId,
      ['Economy', 'Premium', 'Luxury', 'Ultra'].includes(str(body?.range)) ? str(body?.range) : 'Premium',
      str(body?.finish).slice(0, 20),
      str(body?.base).slice(0, 30),
      num(body?.coverage),
      str(body?.coverageUnit) || 'sq ft per litre per coat',
      num(body?.coats, 2),
      str(body?.blurb).slice(0, 400),
      num(body?.sort, 999),
      nowIso(),
    )
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id), slug }, 201, noStore);
});

adminRoutes.patch('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.name !== undefined) {
    sets.push('name = ?');
    args.push(str(body.name).trim().slice(0, 90));
  }
  if (body.brandId !== undefined) {
    sets.push('brand_id = ?');
    args.push(num(body.brandId) || null);
  }
  if (body.categoryId !== undefined) {
    sets.push('category_id = ?');
    args.push(num(body.categoryId));
  }
  if (body.range !== undefined) {
    sets.push('range_tier = ?');
    args.push(['Economy', 'Premium', 'Luxury', 'Ultra'].includes(str(body.range)) ? str(body.range) : 'Premium');
  }
  if (body.finish !== undefined) {
    sets.push('finish = ?');
    args.push(str(body.finish).slice(0, 20));
  }
  if (body.base !== undefined) {
    sets.push('base = ?');
    args.push(str(body.base).slice(0, 30));
  }
  if (body.coverage !== undefined) {
    sets.push('coverage = ?');
    args.push(num(body.coverage));
  }
  if (body.coverageUnit !== undefined) {
    sets.push('coverage_unit = ?');
    args.push(str(body.coverageUnit).slice(0, 60));
  }
  if (body.coats !== undefined) {
    sets.push('coats = ?');
    args.push(num(body.coats, 2));
  }
  if (body.blurb !== undefined) {
    sets.push('blurb = ?');
    args.push(str(body.blurb).slice(0, 400));
  }
  if (body.isActive !== undefined) {
    sets.push('is_active = ?');
    args.push(body.isActive ? 1 : 0);
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  args.push(id);
  await c.env.DB.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.delete('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('UPDATE products SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.post('/products/:id/variants', async (c) => {
  const db = c.env.DB;
  const productId = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const packSize = str(body?.packSize).trim().slice(0, 20);
  if (!packSize) return c.json({ error: 'Write a pack size, e.g. 4 L or 20 kg.' }, 400);
  const res = await db
    .prepare(
      `INSERT INTO product_variants (product_id, pack_size, mrp, price, stock, low_stock_at, batch, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      productId,
      packSize,
      Math.max(0, num(body?.mrp)),
      Math.max(0, num(body?.price)),
      Math.round(num(body?.stock)),
      Math.round(num(body?.lowStockAt, 4)),
      str(body?.batch).slice(0, 20),
      nowIso(),
    )
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
});

adminRoutes.patch('/variants/:id', async (c) => {
  const db = c.env.DB;
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.packSize !== undefined) {
    sets.push('pack_size = ?');
    args.push(str(body.packSize).trim().slice(0, 20));
  }
  if (body.mrp !== undefined) {
    sets.push('mrp = ?');
    args.push(Math.max(0, num(body.mrp)));
  }
  if (body.price !== undefined) {
    sets.push('price = ?');
    args.push(Math.max(0, num(body.price)));
  }
  if (body.stock !== undefined) {
    sets.push('stock = ?');
    args.push(Math.round(num(body.stock)));
  }
  if (body.lowStockAt !== undefined) {
    sets.push('low_stock_at = ?');
    args.push(Math.round(num(body.lowStockAt, 4)));
  }
  if (body.batch !== undefined) {
    sets.push('batch = ?');
    args.push(str(body.batch).slice(0, 20));
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  sets.push('updated_at = ?');
  args.push(nowIso(), id);
  await db.prepare(`UPDATE product_variants SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.delete('/variants/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.prepare('DELETE FROM product_variants WHERE id = ?').bind(id).run();
  return c.json({ ok: true }, 200, noStore);
});

// ── Shades ───────────────────────────────────────────────────────────────────

adminRoutes.get('/shades', async (c) => {
  const q = c.req.query('q');
  const family = c.req.query('family');
  const where: string[] = ['1 = 1'];
  const args: unknown[] = [];
  if (q) {
    where.push('(code LIKE ? OR name LIKE ?)');
    args.push(`%${q}%`, `%${q}%`);
  }
  if (family) {
    where.push('family = ?');
    args.push(family);
  }
  const res = await c.env.DB.prepare(
    `SELECT * FROM shades WHERE ${where.join(' AND ')} ORDER BY family, id`,
  )
    .bind(...args)
    .all();
  return c.json({ shades: res.results ?? [] }, 200, noStore);
});

adminRoutes.post('/shades', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const code = str(body?.code).trim().toUpperCase().slice(0, 16);
  const name = str(body?.name).trim().slice(0, 60);
  const hex = str(body?.hex).trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(hex)) return c.json({ error: 'Colour must be a hex value like #C8B08A.' }, 400);
  if (!code || !name) return c.json({ error: 'Code and name are both needed.' }, 400);
  const lrv = num(body?.lrv) > 0 ? Math.round(num(body?.lrv)) : lrvFromHex(hex);
  try {
    const res = await c.env.DB.prepare(
      'INSERT INTO shades (code, name, family, hex, lrv, finishes) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(code, name, str(body?.family) || 'Unfiled', hex, lrv, str(body?.finishes) || 'Matt, Sheen, Satin')
      .run();
    return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
  } catch {
    return c.json({ error: `Shade code ${code} already exists on the card.` }, 409);
  }
});

adminRoutes.patch('/shades/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.code !== undefined) {
    sets.push('code = ?');
    args.push(str(body.code).trim().toUpperCase().slice(0, 16));
  }
  if (body.name !== undefined) {
    sets.push('name = ?');
    args.push(str(body.name).trim().slice(0, 60));
  }
  if (body.family !== undefined) {
    sets.push('family = ?');
    args.push(str(body.family).slice(0, 40));
  }
  if (body.hex !== undefined) {
    const hex = str(body.hex).trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) return c.json({ error: 'Colour must be a hex value like #C8B08A.' }, 400);
    sets.push('hex = ?');
    args.push(hex);
    if (body.lrv === undefined) {
      sets.push('lrv = ?');
      args.push(lrvFromHex(hex));
    }
  }
  if (body.lrv !== undefined) {
    sets.push('lrv = ?');
    args.push(Math.round(num(body.lrv)));
  }
  if (body.finishes !== undefined) {
    sets.push('finishes = ?');
    args.push(str(body.finishes).slice(0, 80));
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  args.push(id);
  await c.env.DB.prepare(`UPDATE shades SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.delete('/shades/:id', async (c) => {
  const id = Number(c.req.param('id'));
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM product_shades WHERE shade_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM shades WHERE id = ?').bind(id),
  ]);
  return c.json({ ok: true }, 200, noStore);
});

function lrvFromHex(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return Math.round((0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)) * 100);
}

// ── Offers, brands, categories ───────────────────────────────────────────────

adminRoutes.get('/offers', async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM offers ORDER BY sort, id').all();
  return c.json({ offers: res.results ?? [] }, 200, noStore);
});

adminRoutes.post('/offers', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const title = str(body?.title).trim().slice(0, 90);
  if (!title) return c.json({ error: 'Give the offer a title.' }, 400);
  const res = await c.env.DB.prepare(
    'INSERT INTO offers (tag, title, detail, saving, is_active, sort) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(
      str(body?.tag).slice(0, 30),
      title,
      str(body?.detail).slice(0, 500),
      str(body?.saving).slice(0, 60),
      body?.isActive === false ? 0 : 1,
      num(body?.sort, 99),
    )
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
});

adminRoutes.patch('/offers/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);
  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.tag !== undefined) {
    sets.push('tag = ?');
    args.push(str(body.tag).slice(0, 30));
  }
  if (body.title !== undefined) {
    sets.push('title = ?');
    args.push(str(body.title).trim().slice(0, 90));
  }
  if (body.detail !== undefined) {
    sets.push('detail = ?');
    args.push(str(body.detail).slice(0, 500));
  }
  if (body.saving !== undefined) {
    sets.push('saving = ?');
    args.push(str(body.saving).slice(0, 60));
  }
  if (body.isActive !== undefined) {
    sets.push('is_active = ?');
    args.push(body.isActive ? 1 : 0);
  }
  if (body.sort !== undefined) {
    sets.push('sort = ?');
    args.push(num(body.sort, 99));
  }
  if (!sets.length) return c.json({ error: 'Nothing to update.' }, 400);
  args.push(id);
  await c.env.DB.prepare(`UPDATE offers SET ${sets.join(', ')} WHERE id = ?`).bind(...args).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.delete('/offers/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM offers WHERE id = ?').bind(Number(c.req.param('id'))).run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.get('/brands', async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM brands ORDER BY id').all();
  return c.json({ brands: res.results ?? [] }, 200, noStore);
});

adminRoutes.post('/brands', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = str(body?.name).trim().slice(0, 60);
  if (!name) return c.json({ error: 'Write the brand name.' }, 400);
  const res = await c.env.DB.prepare('INSERT INTO brands (slug, name, note) VALUES (?, ?, ?)')
    .bind(slugify(name) || `brand-${Date.now()}`, name, str(body?.note).slice(0, 80))
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
});

adminRoutes.get('/categories', async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort').all();
  return c.json({ categories: res.results ?? [] }, 200, noStore);
});

adminRoutes.post('/categories', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = str(body?.name).trim().slice(0, 60);
  if (!name) return c.json({ error: 'Write the category name.' }, 400);
  const res = await c.env.DB.prepare('INSERT INTO categories (slug, name, blurb, sort) VALUES (?, ?, ?, ?)')
    .bind(slugify(name) || `cat-${Date.now()}`, name, str(body?.blurb).slice(0, 120), num(body?.sort, 99))
    .run();
  return c.json({ ok: true, id: Number(res.meta.last_row_id) }, 201, noStore);
});

// ── Stock ────────────────────────────────────────────────────────────────────

adminRoutes.get('/stock', async (c) => {
  const db = c.env.DB;
  const filter = c.req.query('filter') ?? 'all';
  const base = `SELECT v.id, v.product_id, v.pack_size, v.stock, v.low_stock_at, v.batch, v.price, v.updated_at,
                       p.name AS product_name, p.slug AS product_slug, c.name AS category_name
                  FROM product_variants v
                  JOIN products p ON p.id = v.product_id
                  JOIN categories c ON c.id = p.category_id`;
  let sql = `${base} WHERE p.is_active = 1`;
  if (filter === 'low') sql += ' AND v.stock <= v.low_stock_at';
  if (filter === 'old') {
    sql += ` AND v.stock > 0
             AND NOT EXISTS (SELECT 1 FROM sale_items si JOIN sales s ON s.id = si.sale_id
                              WHERE si.variant_id = v.id AND s.sold_at >= datetime('now', '-120 days'))
             AND NOT EXISTS (SELECT 1 FROM stock_moves m
                              WHERE m.variant_id = v.id AND m.created_at >= datetime('now', '-120 days'))`;
  }
  sql += filter === 'low' ? ' ORDER BY (v.stock - v.low_stock_at) ASC' : ' ORDER BY p.name, v.id';
  const [rows, moves] = await Promise.all([
    db.prepare(sql).all(),
    db
      .prepare(
        `SELECT m.id, m.variant_id, m.qty, m.kind, m.ref, m.note, m.created_at, p.name AS product_name, v.pack_size
           FROM stock_moves m
           JOIN product_variants v ON v.id = m.variant_id
           JOIN products p ON p.id = v.product_id
          ORDER BY m.id DESC LIMIT 40`,
      )
      .all(),
  ]);
  return c.json({ stock: rows.results ?? [], moves: moves.results ?? [] }, 200, noStore);
});

adminRoutes.post('/stock', async (c) => {
  const db = c.env.DB;
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const variantId = num(body?.variantId);
  const kind = ['in', 'out', 'adjust'].includes(str(body?.kind)) ? str(body?.kind) : 'in';
  const qty = Math.round(num(body?.qty));
  if (!variantId) return c.json({ error: 'Pick an item.' }, 400);
  if (qty <= 0 && kind !== 'adjust') return c.json({ error: 'Enter a quantity.' }, 400);

  const variant = await db
    .prepare('SELECT id, stock FROM product_variants WHERE id = ?')
    .bind(variantId)
    .first<{ id: number; stock: number }>();
  if (!variant) return c.json({ error: 'No such pack.' }, 404);

  const now = nowIso();
  const nextStock = kind === 'in' ? variant.stock + qty : kind === 'out' ? variant.stock - qty : qty;
  const signed = kind === 'in' ? qty : kind === 'out' ? -qty : nextStock - variant.stock;
  const batch = str(body?.batch).slice(0, 20);

  const stmts: D1PreparedStatement[] = [
    db.prepare('UPDATE product_variants SET stock = ?, updated_at = ? WHERE id = ?').bind(nextStock, now, variantId),
    db
      .prepare('INSERT INTO stock_moves (variant_id, qty, kind, ref, batch, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(variantId, signed, kind, str(body?.ref).slice(0, 60), batch, str(body?.note).slice(0, 200), now),
  ];
  if (batch) stmts.push(db.prepare('UPDATE product_variants SET batch = ? WHERE id = ?').bind(batch, variantId));
  await db.batch(stmts);
  return c.json({ ok: true, stock: nextStock }, 200, noStore);
});

// ── Enquiries ────────────────────────────────────────────────────────────────

adminRoutes.get('/enquiries', async (c) => {
  const status = c.req.query('status');
  const where = status ? 'WHERE status = ?' : '';
  const stmt = c.env.DB.prepare(`SELECT * FROM enquiries ${where} ORDER BY id DESC LIMIT 200`);
  const res = await (status ? stmt.bind(status) : stmt).all();
  const rows = (res.results ?? []) as Record<string, unknown>[];
  return c.json(
    {
      enquiries: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        phone: r.phone,
        message: r.message,
        shadeCodes: r.shade_codes,
        areaSqft: r.area_sqft,
        status: r.status,
        createdAt: r.created_at,
        handledAt: r.handled_at,
        hasPhoto: Boolean(r.photo_key),
      })),
    },
    200,
    noStore,
  );
});

adminRoutes.patch('/enquiries/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = (await c.req.json().catch(() => null)) as { status?: string } | null;
  const status = ['new', 'handled'].includes(str(body?.status)) ? str(body?.status) : 'handled';
  await c.env.DB.prepare('UPDATE enquiries SET status = ?, handled_at = ?, handled_by = ? WHERE id = ?')
    .bind(status, status === 'handled' ? nowIso() : '', c.get('user')?.email ?? '', id)
    .run();
  return c.json({ ok: true }, 200, noStore);
});

adminRoutes.get('/enquiries/:id/photo', async (c) => {
  const row = await c.env.DB.prepare('SELECT photo_key FROM enquiries WHERE id = ?')
    .bind(Number(c.req.param('id')))
    .first<{ photo_key: string }>();
  if (!row?.photo_key) return c.json({ error: 'No photo on this enquiry' }, 404);
  const obj = await c.env.FILES.get(row.photo_key);
  if (!obj) return c.json({ error: 'Photo is missing from storage' }, 404);
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=300',
    },
  });
});
