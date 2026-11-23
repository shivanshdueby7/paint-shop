export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ASSETS: Fetcher;
  FREEBUFF_CLIENT_ID: string;
  FREEBUFF_ISSUER?: string;
  APP_ORIGIN: string;
  /** Optional comma-separated owner emails. When empty, the first sign-in claims the shop. */
  ADMIN_EMAILS?: string;
}
