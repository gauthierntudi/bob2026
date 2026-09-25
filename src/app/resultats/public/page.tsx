import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LiveBoard } from "@/components/live-board";
import { getPublicStandings } from "@/lib/data";

export default async function PublicResultsPage() {
  const board = await getPublicStandings().catch(() => ({
    standings: [],
    totalVotes: 0,
    jurorCount: 0,
  }));

  return (
    <>
      <SiteHeader />
      <main>
        <LiveBoard initial={board} source="/api/resultats/public" publicOnly />
      </main>
      <SiteFooter />
    </>
  );
}
