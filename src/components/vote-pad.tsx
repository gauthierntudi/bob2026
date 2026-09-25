"use client";

import { useEffect, useState } from "react";
import { castPublicVote } from "@/app/actions";
import { CandidatePhoto } from "@/components/candidate-photo";
import { badgeVars } from "@/lib/badges";

type Person = {
  id: number;
  name: string;
  city: string;
  number: number;
  photoUrl: string | null;
  hasPhoto: boolean;
};

export function VotePad({
  people,
  currentNumber,
  open,
}: {
  people: Person[];
  currentNumber: number | null;
  open: boolean;
}) {
  const [picked, setPicked] = useState<Person | null>(null);

  useEffect(() => {
    if (!picked) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPicked(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  return (
    <>
      <div className="cast-grid">
        {people.map((person, index) => {
          const voted = currentNumber === person.number;
          return (
            <button
              key={person.id}
              type="button"
              className={voted ? "cast-card on" : "cast-card"}
              disabled={!open}
              onClick={() => setPicked(person)}
              style={badgeVars(index)}
            >
              <span className="cast-photo">
                <CandidatePhoto
                  id={person.id}
                  name={person.name}
                  hasPhoto={person.hasPhoto}
                  photoUrl={person.photoUrl}
                  className="cast-face"
                />
                <span className="cast-num" data-long={person.number > 99 ? "" : undefined}>
                  {person.number}
                </span>
              </span>
              <strong>{person.name}</strong>
              {person.city ? <em>{person.city}</em> : null}
              {voted ? <span className="mark">Votre vote</span> : null}
            </button>
          );
        })}
      </div>
      {picked ? (
        <div className="sheet-backdrop" onClick={() => setPicked(null)}>
          <form
            className="sheet"
            action={castPublicVote}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="sheet-grip" aria-hidden="true" />
            <input type="hidden" name="number" value={picked.number} />
            <div className="sheet-who">
              <CandidatePhoto
                id={picked.id}
                name={picked.name}
                hasPhoto={picked.hasPhoto}
                photoUrl={picked.photoUrl}
                className="sheet-face"
              />
              <p className="kicker">Numéro {picked.number}</p>
              <h2 id="sheet-title">{picked.name}</h2>
              {picked.city ? <p className="sub">{picked.city}</p> : null}
            </div>
            <p className="sheet-ask">Confirmer votre vote pour ce candidat ?</p>
            <button className="action" type="submit">
              Confirmer
            </button>
            <button className="ghost sheet-cancel" type="button" onClick={() => setPicked(null)}>
              Annuler
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
