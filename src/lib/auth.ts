import { cookies } from "next/headers";

const VOTER_COOKIE = "bob_voter";
const JUROR_COOKIE = "bob_juror";
const ADMIN_COOKIE = "bob_admin";

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return `${value}.${toHex(signature)}`;
}

async function verify(token: string, secret: string) {
  const splitAt = token.lastIndexOf(".");
  if (splitAt <= 0) return null;
  const value = token.slice(0, splitAt);
  const expected = await sign(value, secret);
  if (expected.length !== token.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return mismatch === 0 ? value : null;
}

export async function getVoterToken() {
  const jar = await cookies();
  const existing = jar.get(VOTER_COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  jar.set(VOTER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

export async function readVoterToken() {
  const jar = await cookies();
  return jar.get(VOTER_COOKIE)?.value ?? null;
}

export async function setJurorSession(jurorId: number, secret: string) {
  const jar = await cookies();
  jar.set(JUROR_COOKIE, await sign(String(jurorId), secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 18,
  });
}

export async function readJurorId(secret: string) {
  const jar = await cookies();
  const token = jar.get(JUROR_COOKIE)?.value;
  if (!token) return null;
  const value = await verify(token, secret);
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export async function clearJurorSession() {
  const jar = await cookies();
  jar.delete(JUROR_COOKIE);
}

export async function setAdminSession(secret: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await sign("ok", secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin(secret: string) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return (await verify(token, secret)) === "ok";
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export function passwordsMatch(input: string, expected: string) {
  const a = new TextEncoder().encode(input);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length || a.length === 0) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

export function createJurorCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}
