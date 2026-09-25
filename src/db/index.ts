import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getDb = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});

export async function getSecrets() {
  const { env } = await getCloudflareContext({ async: true });
  return {
    adminPassword: env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "",
    sessionSecret: env.SESSION_SECRET || process.env.SESSION_SECRET || "dev-only-secret",
  };
}
