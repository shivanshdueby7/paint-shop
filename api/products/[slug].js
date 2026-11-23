import products from '../../snapshot/products.js';
import { proxy } from '../_proxy.js';

/** /api/products/:slug — separate function because Vercel routes nested API paths explicitly. */
export default async function handler(req, res) {
  const origin = process.env.API_ORIGIN;
  if (origin) return proxy(req, res, origin);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(503).json({ error: 'This deployment is read-only.' });
  }

  const slug = req.query?.slug ?? new URL(req.url || '/', 'http://localhost').pathname.split('/').filter(Boolean).pop();
  const body = products[decodeURIComponent(String(slug))];
  if (!body) return res.status(404).json({ error: 'No such product' });
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json(body);
}
