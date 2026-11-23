/** Forward the shop's counter-login flow to the Cloudflare Worker. */
export default async function handler(req, res) {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return res
      .status(503)
      .type('text/plain')
      .send('Counter login needs API_ORIGIN set to the Cloudflare Worker URL. The shop front end is still available.');
  }

  const target = new URL(req.url, origin);
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'connection', 'content-length'].includes(key)) continue;
    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  headers.origin = new URL(origin).origin;

  const method = req.method || 'GET';
  let body;
  if (!['GET', 'HEAD'].includes(method)) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';
  }

  try {
    const upstream = await fetch(target, { method, headers, body, redirect: 'manual' });
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
