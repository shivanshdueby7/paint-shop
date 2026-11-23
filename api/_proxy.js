/** Shared backend proxy for the Vercel functions. */
export async function proxy(req, res, origin) {
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
