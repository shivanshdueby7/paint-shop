import { Hono } from 'hono';
import { isSameOriginRequest } from '@freebuff/auth';
import type { FreebuffUser } from '@freebuff/auth';
import type { Env } from '../env';
import { nowIso, round2 } from '../db';

export type Ctx = { Bindings: Env; Variables: { user: FreebuffUser | null } };

export const publicRoutes = new Hono<Ctx>();

type ProductRow = {
  id: number; slug: string; name: string; brand_id: number | null; category_id: number;
  range_tier: string; finish: string; base: string; coverage: number; coverage_unit: string;
  coats: number; blurb: string; is_active: number; sort: number;
  brand_slug: string | null; brand_name: string | null; category_slug: string; category_name: string;
};

type VariantRow = {
  id: number; product_id: number; pack_size: string; mrp: number; price: number;
  stock: number; low_stock_at: number; batch: string;
};

export function mapProducts(products: ProductRow[], variants: VariantRow[]) {
  const byProduct = new Map<number, VariantRow[]>();
  for (const v of variants) {
    const list = byProduct.get(v.product_id);
    if (list) list.push(v);
    else byProduct.set(v.product_id, [v]);
  }
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandSlug: p.brand_slug,
    brandName: p.brand_name ?? 'Counter stock',
    categorySlug: p.category_slug,
    categoryName: p.category_name,
    range: p.range_tier,
    finish: p.finish,
    base: p.base,
    coverage: p.coverage,
    coverageUnit: p.coverage_unit,
    coats: p.coats,
    blurb: p.blurb,
    variants: (byProduct.get(p.id) ?? []).map((v) => ({
      id: v.id,
      packSize: v.pack_size,
      mrp: v.mrp,
      price: v.price,
      stock: v.stock,
    })),
  }));
}

const publicCache = { 'Cache-Control': 'public, max-age=60' };

publicRoutes.get('/health', (c) => c.json({ ok: true }));

publicRoutes.get('/settings', async (c) => {
  const env = c.env;
  const [shadeCount, productCount, brandCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM shades').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM products WHERE is_active = 1').first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM brands').first<{ n: number }>(),
  ]);
  return c.json(
    {
      counts: {
        shades: shadeCount?.n ?? 0,
        products: productCount?.n ?? 0,
        brands: brandCount?.n ?? 0,
      },
    },
    200,
    publicCache,
  );
});

publicRoutes.get('/catalog', async (c) => {
  const env = c.env;
  const [prodRes, catRes, brandRes] = await Promise.all([
    env.DB.prepare(
      `SELECT p.*, b.slug AS brand_slug, b.name AS brand_name, c.slug AS category_slug, c.name AS category_name
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = 1
        ORDER BY p.sort, p.id`,
    ).all<ProductRow>(),
    env.DB.prepare('SELECT id, slug, name, blurb, sort FROM categories ORDER BY sort').all<{
      id: number; slug: string; name: string; blurb: string; sort: number;
    }>(),
    env.DB.prepare('SELECT id, slug, name, note FROM brands ORDER BY id').all<{
      id: number; slug: string; name: string; note: string;
    }>(),
  ]);
  const [varRes, countRes, sampleRes] = await Promise.all([
    env.DB.prepare(
      `SELECT v.* FROM product_variants v JOIN products p ON p.id = v.product_id
        WHERE p.is_active = 1 ORDER BY v.product_id, v.id`,
    ).all<VariantRow>(),
    env.DB.prepare('SELECT product_id, COUNT(*) AS n FROM product_shades GROUP BY product_id').all<{
      product_id: number;
      n: number;
    }>(),
    // Eight shades per product, spread across the card so the hover preview
    // shows a range of colours rather than eight whites in a row.
    env.DB.prepare(
      `WITH ranked AS (
         SELECT product_id, shade_id,
                ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY ((shade_id * 71) % 977)) AS rn
           FROM product_shades
       )
       SELECT r.product_id, s.code, s.name, s.hex, s.lrv
         FROM ranked r JOIN shades s ON s.id = r.shade_id
        WHERE r.rn <= 8
        ORDER BY r.product_id, r.rn`,
    ).all<{ product_id: number; code: string; name: string; hex: string; lrv: number }>(),
  ]);

  const counts = new Map(countRes.results.map((r) => [r.product_id, r.n]));
  const samples = new Map<number, { code: string; name: string; hex: string; lrv: number }[]>();
  for (const row of sampleRes.results) {
    const list = samples.get(row.product_id) ?? [];
    list.push({ code: row.code, name: row.name, hex: row.hex, lrv: row.lrv });
    samples.set(row.product_id, list);
  }

  const products = mapProducts(prodRes.results, varRes.results).map((p) => ({
    ...p,
    shadeCount: counts.get(p.id) ?? 0,
    shadeSamples: samples.get(p.id) ?? [],
  }));

  return c.json(
    {
      brands: brandRes.results,
      categories: catRes.results,
      products,
    },
    200,
    publicCache,
  );
});

publicRoutes.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare(
    `SELECT p.*, b.slug AS brand_slug, b.name AS brand_name, c.slug AS category_slug, c.name AS category_name
       FROM products p
       LEFT JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ? AND p.is_active = 1`,
  )
    .bind(slug)
    .first<ProductRow>();
  if (!row) return c.json({ error: 'No such product' }, 404);
  const vars = await c.env.DB.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id')
    .bind(row.id)
    .all<VariantRow>();
  const product = mapProducts([row], vars.results)[0];
  const shades = await c.env.DB.prepare(
    `SELECT s.id, s.code, s.name, s.family, s.hex, s.lrv, s.finishes
       FROM product_shades ps JOIN shades s ON s.id = ps.shade_id
      WHERE ps.product_id = ? ORDER BY s.id`,
  )
    .bind(row.id)
    .all<{ id: number; code: string; name: string; family: string; hex: string; lrv: number; finishes: string }>();
  return c.json({ product, shadeCount: shades.results.length, shades: shades.results.slice(0, 48) }, 200, publicCache);
});

publicRoutes.get('/shades', async (c) => {
  const res = await c.env.DB.prepare('SELECT * FROM shades ORDER BY id').all<{
    id: number; code: string; name: string; family: string; hex: string; lrv: number; finishes: string;
  }>();
  const families: { label: string; count: number }[] = [];
  for (const s of res.results) {
    const found = families.find((f) => f.label === s.family);
    if (found) found.count++;
    else families.push({ label: s.family, count: 1 });
  }
  return c.json({ shades: res.results, families }, 200, publicCache);
});

publicRoutes.get('/offers', async (c) => {
  const res = await c.env.DB.prepare(
    'SELECT id, tag, title, detail, saving FROM offers WHERE is_active = 1 ORDER BY sort, id',
  ).all();
  return c.json({ offers: res.results }, 200, publicCache);
});

type EnquiryIn = {
  kind?: string;
  name?: string;
  phone?: string;
  message?: string;
  shadeCodes?: string[];
  areaSqft?: number | null;
  photo?: { name?: string; type?: string; dataUrl?: string } | null;
};

publicRoutes.post('/enquiries', async (c) => {
  if (!isSameOriginRequest(c.req.raw, c.env.APP_ORIGIN)) return c.json({ error: 'Bad origin' }, 403);
  const body = (await c.req.json().catch(() => null)) as EnquiryIn | null;
  if (!body) return c.json({ error: 'Send JSON' }, 400);

  const name = (body.name ?? '').trim().slice(0, 80);
  const phone = (body.phone ?? '').replace(/[^\d+]/g, '').slice(0, 15);
  if (name.length < 2) return c.json({ error: 'Please write your name.' }, 400);
  if (phone.replace(/\D/g, '').length < 10) return c.json({ error: 'Please write a 10 digit phone number.' }, 400);

  let photoKey = '';
  if (body.photo?.dataUrl) {
    const match = /^data:(image\/(?:png|jpe?g|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/.exec(body.photo.dataUrl);
    if (!match) return c.json({ error: 'Photo must be a PNG, JPG or WebP image.' }, 400);
    const bytes = Uint8Array.from(atob(match[2]), (ch) => ch.charCodeAt(0));
    if (bytes.byteLength > 3_500_000) return c.json({ error: 'Photo is larger than 3.5 MB. Send a smaller one.' }, 400);
    const ext = match[1].includes('png') ? 'png' : match[1].includes('webp') ? 'webp' : 'jpg';
    photoKey = `enquiries/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await c.env.FILES.put(photoKey, bytes, { httpMetadata: { contentType: match[1] } });
  }

  const kind = ['shade_list', 'quote', 'calculator', 'contact'].includes(body.kind ?? '') ? body.kind! : 'quote';
  const shadeCodes = Array.isArray(body.shadeCodes) ? body.shadeCodes.slice(0, 30).join(', ') : '';
  const area = typeof body.areaSqft === 'number' && isFinite(body.areaSqft) ? round2(body.areaSqft) : null;

  const res = await c.env.DB.prepare(
    `INSERT INTO enquiries (kind, name, phone, message, shade_codes, area_sqft, photo_key, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
  )
    .bind(kind, name, phone, (body.message ?? '').slice(0, 1500), shadeCodes, area, photoKey, nowIso())
    .run();

  return c.json({ ok: true, id: res.meta.last_row_id, hasPhoto: Boolean(photoKey) }, 201);
});
