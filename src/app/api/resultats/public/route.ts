import { getPublicStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getPublicStandings();
  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
