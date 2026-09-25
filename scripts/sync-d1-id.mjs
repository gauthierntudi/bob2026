import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const match = env.match(/^CLOUDFLARE_D1_DATABASE_ID=(.*)$/m);
const id = match?.[1]?.trim();
if (!id) {
  console.error("CLOUDFLARE_D1_DATABASE_ID est vide dans .env");
  process.exit(1);
}

const path = "wrangler.jsonc";
const config = readFileSync(path, "utf8");
const next = config.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${id}"`);
if (next !== config) {
  writeFileSync(path, next);
}
