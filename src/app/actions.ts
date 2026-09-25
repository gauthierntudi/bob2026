"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getDb, getSecrets } from "@/db";
import { candidates, jurors, juryScores, publicVotes, settings } from "@/db/schema";
import {
  clearAdminSession,
  clearJurorSession,
  createJurorCode,
  getVoterToken,
  isAdmin,
  passwordsMatch,
  readJurorId,
  setAdminSession,
  setJurorSession,
} from "@/lib/auth";
import { storeCandidatePhoto } from "@/lib/files";
import { readPhoto } from "@/lib/photo";
import { CRITERIA, clampScore, type CriterionKey } from "@/lib/scoring";

function refresh() {
  revalidatePath("/");
  revalidatePath("/jury");
  revalidatePath("/resultats");
  revalidatePath("/admin");
}

async function requireAdmin() {
  const { sessionSecret } = await getSecrets();
  if (!(await isAdmin(sessionSecret))) throw new Error("Accès régie refusé.");
  return getDb();
}

async function claimNumber(db: Awaited<ReturnType<typeof getDb>>, raw: string, exceptId?: number) {
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    redirect("/admin?error=Indiquez%20un%20num%C3%A9ro%20entre%201%20et%209999.");
  }
  const taken = await db.select().from(candidates).where(eq(candidates.sortOrder, number)).get();
  if (taken && taken.id !== exceptId) redirect("/admin?error=Ce%20num%C3%A9ro%20est%20d%C3%A9j%C3%A0%20utilis%C3%A9.");
  return number;
}

export async function castPublicVote(formData: FormData) {
  const raw = String(formData.get("number") ?? "").trim();
  const number = Number(raw);
  if (!/^\d+$/.test(raw)) redirect("/?error=Tapez%20le%20num%C3%A9ro%20du%20candidat.");

  const db = await getDb();
  const state = await db.select().from(settings).where(eq(settings.id, 1)).get();
  if (state?.publicOpen !== 1) redirect("/?error=Le%20vote%20du%20public%20est%20ferm%C3%A9.");

  const candidate = await db.select().from(candidates).where(eq(candidates.sortOrder, number)).get();
  if (!candidate) redirect("/?error=Num%C3%A9ro%20inconnu.");

  const voterToken = await getVoterToken();
  await db
    .insert(publicVotes)
    .values({ voterToken, candidateId: candidate.id, updatedAt: sql`datetime('now')` })
    .onConflictDoUpdate({
      target: publicVotes.voterToken,
      set: { candidateId: candidate.id, updatedAt: sql`datetime('now')` },
    });

  refresh();
  redirect("/?ok=1");
}

export async function loginJuror(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const db = await getDb();
  const juror = await db.select().from(jurors).where(eq(jurors.code, code)).get();
  if (!juror) redirect("/jury?error=Code%20jury%20inconnu.");
  const { sessionSecret } = await getSecrets();
  await setJurorSession(juror.id, sessionSecret);
  refresh();
  redirect("/jury");
}

export async function logoutJuror() {
  await clearJurorSession();
  refresh();
}

export async function saveJurySheet(formData: FormData) {
  const { sessionSecret } = await getSecrets();
  const jurorId = await readJurorId(sessionSecret);
  if (!jurorId) redirect("/jury?error=Reconnectez-vous%20avec%20votre%20code%20jury.");

  const db = await getDb();
  const state = await db.select().from(settings).where(eq(settings.id, 1)).get();
  if (state?.juryOpen !== 1) redirect("/jury?error=La%20notation%20du%20jury%20est%20ferm%C3%A9e.");

  const candidateId = Number(formData.get("candidateId"));
  const candidate = await db.select().from(candidates).where(eq(candidates.id, candidateId)).get();
  if (!candidate) redirect("/jury?error=Candidat%20introuvable.");

  const sheet = {} as Record<CriterionKey, number>;
  for (const criterion of CRITERIA) {
    sheet[criterion.key] = clampScore(Number(formData.get(criterion.key)));
  }

  await db
    .insert(juryScores)
    .values({
      jurorId,
      candidateId,
      ...sheet,
      updatedAt: sql`datetime('now')`,
    })
    .onConflictDoUpdate({
      target: [juryScores.jurorId, juryScores.candidateId],
      set: { ...sheet, updatedAt: sql`datetime('now')` },
    });

  refresh();
  redirect(`/jury?saved=${candidateId}`);
}

export async function loginAdmin(formData: FormData) {
  const { adminPassword, sessionSecret } = await getSecrets();
  const password = String(formData.get("password") ?? "");
  if (!adminPassword || !passwordsMatch(password, adminPassword)) {
    redirect("/admin?error=Mot%20de%20passe%20incorrect.");
  }
  await setAdminSession(sessionSecret);
  refresh();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  refresh();
}

export async function setPolls(formData: FormData) {
  const db = await requireAdmin();
  await db
    .update(settings)
    .set({
      publicOpen: formData.get("publicOpen") === "on" ? 1 : 0,
      juryOpen: formData.get("juryOpen") === "on" ? 1 : 0,
    })
    .where(eq(settings.id, 1));
  refresh();
}

export async function addCandidate(formData: FormData) {
  const db = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name) redirect("/admin?error=Le%20nom%20est%20obligatoire.");
  let photo;
  try {
    photo = await readPhoto(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo refusée.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  const last = await db
    .select({ sortOrder: candidates.sortOrder })
    .from(candidates)
    .orderBy(sql`${candidates.sortOrder} desc`)
    .get();
  const requested = String(formData.get("number") ?? "").trim();
  const sortOrder = requested
    ? await claimNumber(db, requested)
    : await claimNumber(db, String((last?.sortOrder ?? 0) + 1));
  const created = await db
    .insert(candidates)
    .values({
      name,
      city,
      sortOrder,
    })
    .returning({ id: candidates.id });
  if (photo && created[0]) {
    const photoUrl = await storeCandidatePhoto(created[0].id, photo);
    await db
      .update(candidates)
      .set({ photoType: photo.contentType, photoUrl })
      .where(eq(candidates.id, created[0].id));
  }
  refresh();
  redirect("/admin");
}

export async function updateCandidate(formData: FormData) {
  const db = await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name) redirect("/admin?error=Le%20nom%20est%20obligatoire.");
  const sortOrder = await claimNumber(db, String(formData.get("number") ?? "").trim(), id);
  const candidate = await db.select().from(candidates).where(eq(candidates.id, id)).get();
  if (!candidate) redirect("/admin?error=Candidat%20introuvable.");
  let photo;
  try {
    photo = await readPhoto(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo refusée.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  await db.update(candidates).set({ name, city, sortOrder }).where(eq(candidates.id, id));
  if (photo) {
    const photoUrl = await storeCandidatePhoto(id, photo);
    await db
      .update(candidates)
      .set({ photoType: photo.contentType, photoUrl })
      .where(eq(candidates.id, id));
  }
  refresh();
  redirect("/admin");
}

export async function setCandidatePhoto(formData: FormData) {
  const db = await requireAdmin();
  const id = Number(formData.get("id"));
  let photo;
  try {
    photo = await readPhoto(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Photo refusée.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  if (!photo) redirect("/admin?error=Choisissez%20une%20photo.");
  const candidate = await db.select().from(candidates).where(eq(candidates.id, id)).get();
  if (!candidate) redirect("/admin?error=Candidat%20introuvable.");
  const photoUrl = await storeCandidatePhoto(id, photo);
  await db
    .update(candidates)
    .set({ photoType: photo.contentType, photoUrl })
    .where(eq(candidates.id, id));
  refresh();
  redirect("/admin");
}

export async function removeCandidate(formData: FormData) {
  const db = await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(candidates).where(eq(candidates.id, id));
  refresh();
}

export async function addJuror(formData: FormData) {
  const db = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin?error=Le%20nom%20du%20jur%C3%A9%20est%20obligatoire.");
  const code = createJurorCode();
  await db.insert(jurors).values({ name, code });
  refresh();
  redirect(`/admin?code=${code}&juror=${encodeURIComponent(name)}`);
}

export async function removeJuror(formData: FormData) {
  const db = await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(jurors).where(eq(jurors.id, id));
  await db.delete(juryScores).where(and(eq(juryScores.jurorId, id)));
  refresh();
}
