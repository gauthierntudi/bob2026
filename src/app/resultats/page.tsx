import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LiveBoard } from "@/components/live-board";
import { getStandings } from "@/lib/data";

export default async function ResultsPage() {
  const board = await getStandings();

  return (
    <>
      <SiteHeader />
      <main>
        <LiveBoard initial={board} />
      </main>
      <SiteFooter />
    </>
  );
}
