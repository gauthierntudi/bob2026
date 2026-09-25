import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { candidatePhotos } from "@/db/schema";

const extensions = ["jpg", "jpeg", "png", "webp", "gif"] as const;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId)) return new Response(null, { status: 404 });

  const db = await getDb();
  const photo = await db
    .select()
    .from(candidatePhotos)
    .where(eq(candidatePhotos.candidateId, candidateId))
    .get();
  if (photo) {
    return new Response(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const { env } = await getCloudflareContext({ async: true });
  if (env.FILES) {
    for (const extension of extensions) {
      const object = await env.FILES.get(`candidates/${candidateId}.${extension}`);
      if (!object) continue;
      return new Response(await object.arrayBuffer(), {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  return new Response(null, { status: 404 });
}
