"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CandidatePhoto } from "@/components/candidate-photo";
import { badgeIndex, badgeVars } from "@/lib/badges";
import { formatScore, PUBLIC_WEIGHT, JURY_WEIGHT } from "@/lib/scoring";
import type { Standing } from "@/lib/data";

type Board = {
  standings: Standing[];
  totalVotes: number;
  jurorCount: number;
};

function signature(board: Board) {
  return board.standings
    .map((row) => `${row.id}:${row.final}:${row.votes}:${row.juryScore}:${row.publicScore}`)
    .join("|");
}

export function LiveBoard({
  initial,
  source = "/api/resultats",
  publicOnly = false,
}: {
  initial: Board;
  source?: string;
  publicOnly?: boolean;
}) {
  const [board, setBoard] = useState(initial);
  const [hot, setHot] = useState<Set<number>>(new Set());
  const nodes = useRef(new Map<number, HTMLElement>());
  const previousRects = useRef(new Map<number, DOMRect>());
  const numbers = board.standings.map((row) => row.number);
  const leader = board.standings[0];

  useLayoutEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map<number, DOMRect>();
    for (const [id, element] of nodes.current) {
      const next = element.getBoundingClientRect();
      const previous = previousRects.current.get(id);
      nextRects.set(id, next);
      if (!previous || motion) continue;
      const dx = previous.left - next.left;
      const dy = previous.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    }
    previousRects.current = nextRects;
  }, [board]);

  useEffect(() => {
    let current = signature(initial);
    let alive = true;
    let previous = initial.standings;

    async function pull() {
      try {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok || !alive) return;
        const next = (await response.json()) as Board;
        const nextSignature = signature(next);
        if (nextSignature === current) return;
        const changed = new Set<number>();
        next.standings.forEach((row, index) => {
          const before = previous.find((item) => item.id === row.id);
          const beforeIndex = previous.findIndex((item) => item.id === row.id);
          if (
            !before ||
            before.final !== row.final ||
            before.votes !== row.votes ||
            beforeIndex !== index
          ) {
            changed.add(row.id);
          }
        });
        previous = next.standings;
        setHot(changed);
        setBoard(next);
        current = nextSignature;
      } catch {
        /* keep the last board */
      }
    }

    const timer = window.setInterval(pull, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") pull();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial, source]);

  useEffect(() => {
    if (hot.size === 0) return;
    const timer = window.setTimeout(() => setHot(new Set()), 900);
    return () => window.clearTimeout(timer);
  }, [hot]);

  return (
    <section className="board">
      <p className="kicker live-kicker">
        <span className="live-dot" aria-hidden="true" />
        En direct
      </p>
      <h1 className="cast-title">Classement</h1>
      <div className="board-meta">
        {publicOnly ? <span>Vote du public</span> : <span>Public 40 %</span>}
        {publicOnly ? null : <span>Jury 60 %</span>}
        <span>
          {board.totalVotes} vote{board.totalVotes > 1 ? "s" : ""}
        </span>
        {publicOnly ? null : (
          <span>
            {board.jurorCount} juré{board.jurorCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {leader ? `En tête : ${leader.name}, ${formatScore(leader.final)}` : "Aucun candidat"}
      </p>
      {board.standings.length === 0 ? (
        <p className="note">Aucun candidat pour l’instant.</p>
      ) : (
        <ol className="board-list">
          {board.standings.map((row, index) => (
            <Card
              key={row.id}
              row={row}
              place={index + 1}
              lead={index === 0}
              numbers={numbers}
              publicOnly={publicOnly}
              hot={hot.has(row.id)}
              bind={(element) => {
                if (element) nodes.current.set(row.id, element);
                else nodes.current.delete(row.id);
              }}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function Card({
  row,
  place,
  lead,
  numbers,
  publicOnly,
  hot,
  bind,
}: {
  row: Standing;
  place: number;
  lead: boolean;
  numbers: number[];
  publicOnly: boolean;
  hot: boolean;
  bind: (element: HTMLLIElement | null) => void;
}) {
  const className = `${lead ? "board-lead" : "board-row"}${hot ? " is-hot" : ""}`;
  return (
    <li ref={bind} className={className} style={badgeVars(badgeIndex(numbers, row.number))}>
      <span className="board-place">{place}</span>
      <span className="board-photo">
        <CandidatePhoto
          id={row.id}
          name={row.name}
          hasPhoto={row.hasPhoto}
          photoUrl={row.photoUrl}
          className="board-face"
        />
        <span className="cast-num">{row.number}</span>
      </span>
      {lead ? (
        <>
          <strong>{row.name}</strong>
          {row.city ? <em>{row.city}</em> : null}
          <Score value={row.final} />
          <Mix row={row} publicOnly={publicOnly} />
          <small>
            {publicOnly
              ? `${row.votes} vote${row.votes > 1 ? "s" : ""}`
              : `Public ${formatScore(row.publicScore)} · Jury ${formatScore(row.juryScore)} · ${row.votes} vote${row.votes > 1 ? "s" : ""}`}
          </small>
        </>
      ) : (
        <>
          <div className="board-copy">
            <strong>{row.name}</strong>
            {row.city ? <em>{row.city}</em> : null}
            <Mix row={row} publicOnly={publicOnly} />
          </div>
          <Score value={row.final} />
        </>
      )}
    </li>
  );
}

function Score({ value }: { value: number | null }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const end = value;
    if (start === end) return;
    if (start == null || end == null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = end;
      setShown(end);
      return;
    }
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / 700);
      const eased = 1 - (1 - progress) ** 3;
      setShown(start + (end - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else from.current = end;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <b className="board-score">{formatScore(shown)}</b>;
}

function Mix({ row, publicOnly }: { row: Standing; publicOnly: boolean }) {
  const publicPart = publicOnly ? (row.publicScore ?? 0) : (row.publicScore ?? 0) * PUBLIC_WEIGHT;
  const juryPart = publicOnly ? 0 : (row.juryScore ?? 0) * JURY_WEIGHT;
  return (
    <span className="board-mix" aria-hidden="true">
      <i style={{ width: `${publicPart}%` }} />
      {publicOnly ? null : <i className="jury" style={{ width: `${juryPart}%` }} />}
    </span>
  );
}
