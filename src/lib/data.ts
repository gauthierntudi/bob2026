import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { candidates, jurors, juryScores, publicVotes, settings } from "@/db/schema";
import {
  asCriterionMark,
  averageJuryScore,
  finalScore,
  publicShare,
  type CriterionKey,
  type JurySheet,
} from "@/lib/scoring";

export async function getSettings() {
  const db = await getDb();
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get();
  return {
    publicOpen: row?.publicOpen === 1,
    juryOpen: row?.juryOpen === 1,
  };
}

export async function listCandidates() {
  const db = await getDb();
  return db.select().from(candidates).orderBy(asc(candidates.sortOrder), asc(candidates.id));
}

export async function listJurors() {
  const db = await getDb();
  return db.select().from(jurors).orderBy(asc(jurors.name));
}

export async function getPublicVote(voterToken: string | null) {
  if (!voterToken) return null;
  const db = await getDb();
  const row = await db
    .select()
    .from(publicVotes)
    .where(eq(publicVotes.voterToken, voterToken))
    .get();
  return row?.candidateId ?? null;
}

export async function getJurorSheets(jurorId: number) {
  const db = await getDb();
  const rows = await db.select().from(juryScores).where(eq(juryScores.jurorId, jurorId));
  const byCandidate = new Map<number, JurySheet>();
  for (const row of rows) {
    byCandidate.set(row.candidateId, {
      technique: asCriterionMark(row.technique),
      interpretation: asCriterionMark(row.interpretation),
      presence: asCriterionMark(row.presence),
      originality: asCriterionMark(row.originality),
    });
  }
  return byCandidate;
}

export type Standing = {
  id: number;
  name: string;
  city: string;
  number: number;
  hasPhoto: boolean;
  photoUrl: string | null;
  votes: number;
  publicScore: number | null;
  juryScore: number | null;
  juryCount: number;
  criteria: Record<CriterionKey, number | null>;
  final: number | null;
};

export async function getStandings(): Promise<{
  standings: Standing[];
  totalVotes: number;
  jurorCount: number;
}> {
  const db = await getDb();
  const [people, voteRows, scoreRows, jurorRows] = await Promise.all([
    listCandidates(),
    db
      .select({
        candidateId: publicVotes.candidateId,
        votes: sql<number>`count(*)`.mapWith(Number),
      })
      .from(publicVotes)
      .groupBy(publicVotes.candidateId),
    db.select().from(juryScores),
    db.select({ id: jurors.id }).from(jurors),
  ]);

  const votesByCandidate = new Map(voteRows.map((row) => [row.candidateId, row.votes]));
  const totalVotes = voteRows.reduce((sum, row) => sum + row.votes, 0);
  const sheetsByCandidate = new Map<number, JurySheet[]>();

  for (const row of scoreRows) {
    const sheet: JurySheet = {
      technique: asCriterionMark(row.technique),
      interpretation: asCriterionMark(row.interpretation),
      presence: asCriterionMark(row.presence),
      originality: asCriterionMark(row.originality),
    };
    const list = sheetsByCandidate.get(row.candidateId) ?? [];
    list.push(sheet);
    sheetsByCandidate.set(row.candidateId, list);
  }

  const standings = people.map((person) => {
    const votes = votesByCandidate.get(person.id) ?? 0;
    const sheets = sheetsByCandidate.get(person.id) ?? [];
    const publicScore = publicShare(votes, totalVotes);
    const juryScore = averageJuryScore(sheets);
    const criteria = {
      technique: mean(sheets.map((sheet) => sheet.technique)),
      interpretation: mean(sheets.map((sheet) => sheet.interpretation)),
      presence: mean(sheets.map((sheet) => sheet.presence)),
      originality: mean(sheets.map((sheet) => sheet.originality)),
    };
    return {
      id: person.id,
      name: person.name,
      city: person.city,
      number: person.sortOrder,
      hasPhoto: Boolean(person.photoUrl || person.photoType),
      photoUrl: person.photoUrl,
      votes,
      publicScore,
      juryScore,
      juryCount: sheets.length,
      criteria,
      final: finalScore(publicScore, juryScore),
    };
  });

  standings.sort((a, b) => (b.final ?? -1) - (a.final ?? -1) || a.name.localeCompare(b.name, "fr"));

  return { standings, totalVotes, jurorCount: jurorRows.length };
}

export async function getPublicStandings() {
  const board = await getStandings();
  const standings = board.standings
    .map((row) => ({
      ...row,
      juryScore: null,
      juryCount: 0,
      final: row.publicScore,
    }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "fr"));
  return { standings, totalVotes: board.totalVotes, jurorCount: 0 };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
