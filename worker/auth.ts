import { createFreebuffAuth } from '@freebuff/auth';
import type { FreebuffAuth } from '@freebuff/auth';
import type { Env } from './env';

let auth: FreebuffAuth | null = null;
let cacheKey = '';

/** One instance per isolate: it caches OIDC discovery and signing keys. */
export function getAuth(env: Env): FreebuffAuth {
  const key = `${env.FREEBUFF_CLIENT_ID}|${env.APP_ORIGIN}|${env.FREEBUFF_ISSUER ?? ''}`;
  if (!auth || cacheKey !== key) {
    auth = createFreebuffAuth({
      clientId: env.FREEBUFF_CLIENT_ID,
      issuer: env.FREEBUFF_ISSUER,
      baseUrl: env.APP_ORIGIN,
      allowInsecureLocalhost: env.APP_ORIGIN.startsWith('http://'),
    });
    cacheKey = key;
  }
  return auth;
}
