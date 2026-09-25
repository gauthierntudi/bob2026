import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStandings();
  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
