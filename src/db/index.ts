import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { httpD1FromEnv } from "./http-d1";
import * as schema from "./schema";

function onVercel() {
  return process.env.VERCEL === "1";
}

export const getDb = cache(async () => {
  if (!onVercel()) {
    const { env } = await getCloudflareContext({ async: true });
    return drizzle(env.DB, { schema });
  }
  const http = httpD1FromEnv();
  if (!http) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN sont requis sur Vercel.");
  }
  return drizzle(http as never, { schema });
});

export async function getSecrets() {
  if (!onVercel()) {
    const { env } = await getCloudflareContext({ async: true });
    return {
      adminPassword: env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "",
      sessionSecret: env.SESSION_SECRET || process.env.SESSION_SECRET || "dev-only-secret",
    };
  }
  return {
    adminPassword: process.env.ADMIN_PASSWORD || "",
    sessionSecret: process.env.SESSION_SECRET || "dev-only-secret",
  };
}
