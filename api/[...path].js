import catalog from '../snapshot/catalog.js';
import shades from '../snapshot/shades.js';
import offers from '../snapshot/offers.js';
import settings from '../snapshot/settings.js';
import { proxy } from './_proxy.js';

/**
 * Vercel endpoint for single-segment /api/* paths.
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

  // Vercel's Node runtime does not always populate req.query for catch-all
  // routes, so read the path straight from the request URL.
  const raw = req.query?.path;
  let parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!parts.length) {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'api') parts.shift();
  }
  const path = parts.join('/');

  let body;
  if (path === 'catalog') body = catalog;
  else if (path === 'shades') body = shades;
  else if (path === 'offers') body = offers;
  else if (path === 'settings') body = settings;
  else if (path === 'health') body = { ok: true };

  if (!body) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json(body);
}
