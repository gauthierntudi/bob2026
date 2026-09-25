/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  FILES?: R2Bucket;
  R2_PUBLIC_URL?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}
