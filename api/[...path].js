import catalog from '../snapshot/catalog.js';
import shades from '../snapshot/shades.js';
import offers from '../snapshot/offers.js';
import settings from '../snapshot/settings.js';
import products from '../snapshot/products.js';

/**
 * Vercel endpoint for /api/*.
 *
 * With API_ORIGIN set it forwards everything to the Cloudflare Worker (the real
 * backend, including enquiries and admin writes). Without it, the read-only
 * endpoints are served from snapshots generated from that same API by
 * `node scripts/snapshot.mjs`, so the storefront still works on a frontend-only
 * deployment. Writes are refused rather than silently faked.
 */
export default async function handler(req, res) {
  const origin = process.env.API_ORIGIN;
  if (origin) return proxy(req, res, origin);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(503).json({
      error: 'This deployment is read-only. Set API_ORIGIN to the Cloudflare Worker URL to accept enquiries.',
    });
  }

  const raw = req.query?.path;
  const path = (Array.isArray(raw) ? raw : raw ? [raw] : []).join('/');

  let body;
  if (path === 'catalog') body = catalog;
  else if (path === 'shades') body = shades;
  else if (path === 'offers') body = offers;
  else if (path === 'settings') body = settings;
  else if (path === 'health') body = { ok: true };
  else if (path.startsWith('products/')) body = products[decodeURIComponent(path.slice('products/'.length))];

  if (!body) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json(body);
}

async function proxy(req, res, origin) {
  const target = new URL(req.url, origin);
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'connection', 'content-length'].includes(key)) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  // The Worker validates same-origin on writes; from Vercel the browser's
  // Origin is our domain, so present the backend's own origin instead.
  headers.origin = new URL(origin).origin;

  const method = req.method || 'GET';
  let body;
  if (!['GET', 'HEAD'].includes(method)) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    headers['content-type'] = 'application/json';
  }

  try {
    const upstream = await fetch(target, { method, headers, body });
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (['content-encoding', 'content-length', 'transfer-encoding'].includes(key)) return;
      res.setHeader(key, value);
    });
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({ error: 'Backend unavailable', detail: String(error) });
  }
}
