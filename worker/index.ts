import { Hono } from 'hono';
import { getAuth } from './auth';
import { ensureDb } from './db';
import { publicRoutes, type Ctx } from './routes/public';
import { adminRoutes } from './routes/admin';

const app = new Hono<Ctx>();

app.use('/api/*', async (c, next) => {
  await ensureDb(c.env);
  await next();
});

// Public endpoints replace the stale-cache headers with their own.
app.use('/api/*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
});

app.route('/api', publicRoutes);
app.route('/api/admin', adminRoutes);
app.all('/api/*', (c) => c.json({ error: 'No such endpoint' }, 404));

// Everything else is the built SPA; wrangler serves index.html for app routes.
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));
app.onError((err, c) => {
  console.error('worker error', err instanceof Error ? err.message : err);
  return c.json({ error: 'Something broke on our side. Try again.' }, 500);
});

export default {
  fetch(request: Request, env: Ctx['Bindings'], ctx: ExecutionContext): Promise<Response> {
    // wrap() serves /auth/freebuff/* and refreshes session cookies in place.
    return getAuth(env).wrap((req: Request) => app.fetch(req, env, ctx))(request);
  },
};
