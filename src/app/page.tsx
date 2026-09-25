import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VotePad } from "@/components/vote-pad";
import { getPublicVote, getSettings, listCandidates } from "@/lib/data";
import { readVoterToken } from "@/lib/auth";

export default async function PublicVotePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  let state = { publicOpen: false, juryOpen: false };
  let people: Awaited<ReturnType<typeof listCandidates>> = [];
  let current: number | null = null;
  let offline = false;
  try {
    const [nextState, nextPeople, token] = await Promise.all([
      getSettings(),
      listCandidates(),
      readVoterToken(),
    ]);
    state = nextState;
    people = nextPeople;
    current = await getPublicVote(token);
  } catch {
    offline = true;
  }

  return (
    <>
      <SiteHeader />
      <main className="cast-page">
        <p className="kicker">Vote du public</p>
        <h1 className="cast-title">Choisissez</h1>

        {people.length === 0 ? (
          <p className="note">Les candidats ne sont pas encore publiés. La régie les ajoute depuis l’espace régie.</p>
        ) : (
          <VotePad
            open={state.publicOpen}
            currentNumber={people.find((person) => person.id === current)?.sortOrder ?? null}
            people={people.map((person) => ({
              id: person.id,
              name: person.name,
              city: person.city,
              number: person.sortOrder,
              photoUrl: person.photoUrl,
              hasPhoto: Boolean(person.photoUrl || person.photoType),
            }))}
          />
        )}

        {offline ? (
          <p className="note">
            Le service de votes n’est pas joignable. Ajoutez CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN
            dans les variables Vercel.
          </p>
        ) : null}
        {!offline && !state.publicOpen ? <p className="note">Le vote du public est fermé.</p> : null}
        {params.ok ? <p className="note">Vote enregistré.</p> : null}
        {params.error ? <p className="error">{params.error}</p> : null}
      </main>
      <SiteFooter />
    </>
  );
}
