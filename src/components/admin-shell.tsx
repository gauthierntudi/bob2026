"use client";

import { useEffect, useState } from "react";
import { PhotoField } from "@/components/photo-field";

type Person = { id: number; name: string; city: string; number: number; photoUrl: string | null };
type Juror = { id: number; name: string; code: string };
type Standing = { id: number; name: string; final: number | null; votes: number; photoUrl: string | null };

const sections = [
  { id: "board", label: "Tableau" },
  { id: "people", label: "Candidats" },
  { id: "jury", label: "Jury" },
] as const;

type Section = (typeof sections)[number]["id"];

const tabCookie = "bob_admin_tab";

function rememberTab(id: Section) {
  document.cookie = `${tabCookie}=${id}; path=/; max-age=31536000; samesite=lax`;
}

export function AdminShell({
  publicOpen,
  juryOpen,
  people,
  jurors,
  totalVotes,
  standings,
  section: initialSection,
  error,
  freshCode,
  freshJuror,
  setPolls,
  addCandidate,
  updateCandidate,
  removeCandidate,
  addJuror,
  removeJuror,
  logoutAdmin,
}: {
  publicOpen: boolean;
  juryOpen: boolean;
  people: Person[];
  jurors: Juror[];
  totalVotes: number;
  standings: Standing[];
  section: Section;
  error?: string;
  freshCode?: string;
  freshJuror?: string;
  setPolls: (data: FormData) => void;
  addCandidate: (data: FormData) => void;
  updateCandidate: (data: FormData) => void;
  removeCandidate: (data: FormData) => void;
  addJuror: (data: FormData) => void;
  removeJuror: (data: FormData) => void;
  logoutAdmin: () => void;
}) {
  const [section, setSection] = useState<Section>(initialSection);
  const [adding, setAdding] = useState(false);

  function openSection(id: Section) {
    rememberTab(id);
    setSection(id);
  }

  useEffect(() => {
    if (!adding) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAdding(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adding]);

  return (
    <div className="console">
      <aside className="console-side">
        <p className="console-mark">Régie</p>
        <nav>
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => openSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <form action={logoutAdmin}>
          <button className="ghost" type="submit">
            Fermer la session
          </button>
        </form>
      </aside>
      <div className="console-main">
        <header className="console-top">
          <h1>{sections.find((item) => item.id === section)?.label}</h1>
          <p>
            {`${people.length} candidat${people.length > 1 ? "s" : ""} · ${totalVotes} vote${totalVotes > 1 ? "s" : ""} · ${jurors.length} juré${jurors.length > 1 ? "s" : ""}`}
          </p>
        </header>
        {error ? <p className="error">{error}</p> : null}
        {freshCode ? (
          <p className="note">
            Code de {freshJuror} : <strong>{freshCode}</strong>
          </p>
        ) : null}

        {section === "board" ? (
          <section className="console-panel">
            <div className="stat-row">
              <article>
                <span>Votes public</span>
                <strong>{totalVotes}</strong>
              </article>
              <article>
                <span>Candidats</span>
                <strong>{people.length}</strong>
              </article>
              <article>
                <span>Jurés</span>
                <strong>{jurors.length}</strong>
              </article>
            </div>
            <form className="card" action={setPolls}>
              <h2>Ouverture</h2>
              <div className="switches">
                <label className="switch">
                  <input type="checkbox" name="publicOpen" defaultChecked={publicOpen} />
                  <span className="switch-ui" aria-hidden="true" />
                  Vote public
                </label>
                <label className="switch">
                  <input type="checkbox" name="juryOpen" defaultChecked={juryOpen} />
                  <span className="switch-ui" aria-hidden="true" />
                  Notation jury
                </label>
              </div>
              <button className="action" type="submit">
                Enregistrer
              </button>
            </form>
            <ol className="mini-rank">
              {standings.slice(0, 5).map((row, index) => (
                <li key={row.id}>
                  <span>#{index + 1}</span>
                  {row.photoUrl ? (
                    <img className="rank-face" src={row.photoUrl} alt="" />
                  ) : (
                    <span className="rank-face empty" />
                  )}
                  <b>{row.name}</b>
                  <em>{row.final == null ? "—" : row.final.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}</em>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {section === "people" ? (
          <section className="console-panel">
            <div className="people-bar">
              <button className="action" type="button" onClick={() => setAdding(true)}>
                Ajouter
              </button>
            </div>
            {adding ? (
              <div className="modal" onClick={() => setAdding(false)}>
                <form
                  className="card modal-card"
                  action={addCandidate}
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2>Ajouter</h2>
                  <PhotoField />
                  <div className="fields">
                    <input type="text" name="name" placeholder="Nom" required />
                    <input type="text" name="city" placeholder="Ville" aria-label="Ville" />
                    <input className="num-field" type="text" name="number" inputMode="numeric" placeholder="Numéro" aria-label="Numéro" />
                  </div>
                  <div className="editor-actions">
                    <button className="ghost" type="button" onClick={() => setAdding(false)}>
                      Annuler
                    </button>
                    <button className="action" type="submit">
                      Ajouter
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
            <div className="stack">
              {people.length === 0 ? <p className="note">Aucun candidat.</p> : null}
              {people.map((person) => (
                <form key={person.id} className="editor" action={updateCandidate}>
                  <input type="hidden" name="id" value={person.id} />
                  <PhotoField compact initialUrl={person.photoUrl} />
                  <div className="editor-fields">
                    <input type="text" name="name" defaultValue={person.name} aria-label="Nom" required />
                    <input type="text" name="city" defaultValue={person.city} aria-label="Ville" placeholder="Ville" />
                    <input
                      className="num-field"
                      type="text"
                      name="number"
                      inputMode="numeric"
                      defaultValue={person.number}
                      aria-label="Numéro"
                      required
                    />
                    <div className="editor-actions">
                      <button className="action" type="submit">
                        Enregistrer
                      </button>
                      <button className="danger" type="submit" formAction={removeCandidate} formNoValidate>
                        Retirer
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>
          </section>
        ) : null}

        {section === "jury" ? (
          <section className="console-panel">
            <form className="card" action={addJuror}>
              <h2>Nouveau juré</h2>
              <div className="fields">
                <input type="text" name="name" placeholder="Nom du juré" required />
                <button className="action" type="submit">
                  Créer un code
                </button>
              </div>
            </form>
            <ul className="jury-list">
              {jurors.map((juror) => (
                <li key={juror.id}>
                  <div>
                    <strong>{juror.name}</strong>
                    <code>{juror.code}</code>
                  </div>
                  <form action={removeJuror}>
                    <input type="hidden" name="id" value={juror.id} />
                    <button className="danger" type="submit">
                      Retirer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
