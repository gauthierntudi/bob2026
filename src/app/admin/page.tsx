import { cookies } from "next/headers";
import {
  addCandidate,
  addJuror,
  loginAdmin,
  logoutAdmin,
  removeCandidate,
  removeJuror,
  renameJuror,
  resetVotes,
  setPolls,
  updateCandidate,
} from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { isAdmin } from "@/lib/auth";
import { getSettings, getStandings, listCandidates, listJurors } from "@/lib/data";
import { getSecrets } from "@/db";

function adminSection(value: string | undefined) {
  if (value === "people" || value === "jury" || value === "board") return value;
  return "board";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; juror?: string }>;
}) {
  const params = await searchParams;
  const { sessionSecret } = await getSecrets();
  const allowed = await isAdmin(sessionSecret);

  if (!allowed) {
    return (
      <main className="console-login">
        <form action={loginAdmin}>
          <p className="kicker">Régie</p>
          <h1>Connexion</h1>
          <input type="password" name="password" placeholder="Mot de passe" required />
          <button className="action" type="submit">
            Ouvrir
          </button>
          {params.error ? <p className="error">{params.error}</p> : null}
        </form>
      </main>
    );
  }

  const [state, people, jurors, board, jar] = await Promise.all([
    getSettings(),
    listCandidates(),
    listJurors(),
    getStandings(),
    cookies(),
  ]);

  return (
    <AdminShell
      publicOpen={state.publicOpen}
      juryOpen={state.juryOpen}
      people={people.map((person) => ({
        id: person.id,
        name: person.name,
        city: person.city,
        number: person.sortOrder,
        photoUrl: person.photoUrl,
      }))}
      jurors={jurors.map((juror) => ({ id: juror.id, name: juror.name, code: juror.code }))}
      totalVotes={board.totalVotes}
      standings={board.standings.map((row) => ({
        id: row.id,
        name: row.name,
        final: row.final,
        votes: row.votes,
        photoUrl: row.photoUrl,
      }))}
      section={adminSection(jar.get("bob_admin_tab")?.value)}
      error={params.error}
      freshCode={params.code}
      freshJuror={params.juror}
      setPolls={setPolls}
      resetVotes={resetVotes}
      addCandidate={addCandidate}
      updateCandidate={updateCandidate}
      removeCandidate={removeCandidate}
      addJuror={addJuror}
      removeJuror={removeJuror}
      renameJuror={renameJuror}
      logoutAdmin={logoutAdmin}
    />
  );
}
