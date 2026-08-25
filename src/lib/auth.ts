import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireEnv } from "@/lib/env";
import { constantTimeEqual } from "@/lib/security";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getAuthSecret() {
  return requireEnv("AUTH_SECRET");
}

function encodeHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return encodeHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export async function createSessionToken(email: string, role = "ADMIN") {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${email}|${role}|${expiresAt}`;
  return `${payload}|${await sign(payload)}`;
}

export async function verifySessionToken(token: string) {
  const parts = token.split("|");
  if (parts.length !== 4) return false;

  const [email, role, expiresAt, signature] = parts;

  if (!email || !role || !expiresAt || !signature) {
    return false;
  }

  const payload = `${email}|${role}|${expiresAt}`;
  const expected = await sign(payload);
  if (signature.length !== expected.length) {
    return false;
  }

  const matches = await constantTimeEqual(signature, expected);
  const expiry = Number(expiresAt);
  const isNotExpired = Number.isSafeInteger(expiry) && expiry > Math.floor(Date.now() / 1000);

  return matches && isNotExpired;
}

export async function createSessionCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, await createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    redirect("/login");
  }
}

export async function validateAdminCredentials(email: string, password: string) {
  const [emailMatches, passwordMatches] = await Promise.all([
    constantTimeEqual(email.trim().toLowerCase(), requireEnv("ADMIN_EMAIL").trim().toLowerCase()),
    constantTimeEqual(password, requireEnv("ADMIN_PASSWORD")),
  ]);

  return emailMatches && passwordMatches;
}
