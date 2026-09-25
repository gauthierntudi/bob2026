"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { castPublicVote } from "@/app/actions";
import { CandidatePhoto } from "@/components/candidate-photo";
import { PendingButton } from "@/components/pending-button";
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
  const [sending, setSending] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ y: 0, t: 0, active: false });

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
      {picked
        ? createPortal(
        <div
          className="sheet-backdrop"
          style={{ opacity: Math.max(0.2, 1 - dragY / 280) }}
          onClick={() => {
            if (!sending) setPicked(null);
          }}
        >
          <form
            className={dragging ? "sheet is-dragging" : "sheet"}
            action={castPublicVote}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => {
              if (sending) return;
              if ((event.target as HTMLElement).closest("button, input, a")) return;
              drag.current = { y: event.clientY, t: performance.now(), active: true };
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                /* le geste reste suivi sans capture */
              }
            }}
            onPointerMove={(event) => {
              if (!drag.current.active) return;
              const next = Math.max(0, event.clientY - drag.current.y);
              if (next > 6) setDragging(true);
              setDragY(next);
            }}
            onPointerUp={(event) => {
              if (!drag.current.active) return;
              const next = Math.max(0, event.clientY - drag.current.y);
              const elapsed = Math.max(1, performance.now() - drag.current.t);
              drag.current.active = false;
              if (next > 88 || next / elapsed > 0.65) {
                setDragging(false);
                setDragY(0);
                setPicked(null);
                return;
              }
              setDragging(false);
              requestAnimationFrame(() => setDragY(0));
            }}
            onPointerCancel={() => {
              drag.current.active = false;
              setDragging(false);
              setDragY(0);
            }}
          >
            <VoteWait onChange={setSending} />
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
            <PendingButton idle="Confirmer" busy="Validation…" />
            <button className="ghost sheet-cancel" type="button" disabled={sending} onClick={() => setPicked(null)}>
              Annuler
            </button>
          </form>
        </div>,
        document.body,
        )
        : null}
    </>
  );
}

function VoteWait({ onChange }: { onChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onChange(pending);
  }, [pending, onChange]);
  return null;
}
