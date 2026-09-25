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
  const [state, people, token] = await Promise.all([
    getSettings(),
    listCandidates(),
    readVoterToken(),
  ]);
  const current = await getPublicVote(token);

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

        {!state.publicOpen ? <p className="note">Le vote du public est fermé.</p> : null}
        {params.ok ? <p className="note">Vote enregistré.</p> : null}
        {params.error ? <p className="error">{params.error}</p> : null}
      </main>
      <SiteFooter />
    </>
  );
}
