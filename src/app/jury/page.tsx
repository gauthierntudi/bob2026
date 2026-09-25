import { loginJuror, saveJurySheet } from "@/app/actions";
import { CandidatePhoto } from "@/components/candidate-photo";
import { JuryLogout } from "@/components/jury-logout";
import { PendingButton } from "@/components/pending-button";
import { ScoreField } from "@/components/score-field";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { badgeVars } from "@/lib/badges";
import { readJurorId } from "@/lib/auth";
import { getJurorSheets, getSettings, listCandidates, listJurors } from "@/lib/data";
import { getSecrets } from "@/db";
import { CRITERIA } from "@/lib/scoring";

export default async function JuryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const { sessionSecret } = await getSecrets();
  const jurorId = await readJurorId(sessionSecret);
  let state = { publicOpen: false, juryOpen: false };
  let people: Awaited<ReturnType<typeof listCandidates>> = [];
  let jurors: Awaited<ReturnType<typeof listJurors>> = [];
  try {
    [state, people, jurors] = await Promise.all([getSettings(), listCandidates(), listJurors()]);
  } catch {
    /* la page reste visible si D1 n’est pas joignable */
  }
  const juror = jurors.find((item) => item.id === jurorId) ?? null;
  const sheets = juror ? await getJurorSheets(juror.id).catch(() => new Map()) : new Map();

  return (
    <>
      <SiteHeader />
      <main className="jury-page">
        <p className="kicker">Notation du jury</p>
        <h1 className="cast-title">Notez</h1>

        {!juror ? (
          <form className="code-form" action={loginJuror}>
            <input name="code" placeholder="Code jury" autoComplete="off" required />
            <button className="action" type="submit">
              Entrer
            </button>
          </form>
        ) : (
          <>
            <div className="jury-bar">
              <p>
                {juror.name}
                {state.juryOpen ? "" : " — la notation est fermée."}
              </p>
              <JuryLogout />
            </div>
            <div className="jury-grid">
              {people.map((person, index) => {
                const sheet = sheets.get(person.id);
                const saved = params.saved === String(person.id);
                return (
                  <form
                    className={saved ? "jury-card is-saved" : "jury-card"}
                    action={saveJurySheet}
                    key={person.id}
                    style={badgeVars(index)}
                  >
                    <div className="jury-who">
                      <span className="board-photo">
                        <CandidatePhoto
                          id={person.id}
                          name={person.name}
                          hasPhoto={Boolean(person.photoUrl || person.photoType)}
                          photoUrl={person.photoUrl}
                          className="jury-face"
                        />
                        <span className="cast-num">{person.sortOrder}</span>
                      </span>
                      <div>
                        <h2>{person.name}</h2>
                        {person.city ? <p>{person.city}</p> : null}
                      </div>
                    </div>
                    <input type="hidden" name="candidateId" value={person.id} />
                    <div className="criteria">
                      {CRITERIA.map((criterion) => (
                        <ScoreField
                          key={criterion.key}
                          name={criterion.key}
                          label={criterion.label}
                          weight={criterion.weight}
                          defaultValue={sheet?.[criterion.key] ?? 0}
                          disabled={!state.juryOpen}
                        />
                      ))}
                    </div>
                    <PendingButton
                      idle={saved ? "Enregistré" : "Enregistrer"}
                      busy="Enregistrement…"
                      disabled={!state.juryOpen}
                    />
                  </form>
                );
              })}
            </div>
            {people.length === 0 ? <p className="note">Aucun candidat à noter.</p> : null}
          </>
        )}
        {params.error ? <p className="error">{params.error}</p> : null}
      </main>
      <SiteFooter />
    </>
  );
}
