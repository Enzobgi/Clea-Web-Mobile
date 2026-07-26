import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  authSessionsTable,
  usersTable,
  type User,
} from "@workspace/db/schema";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "cleanpath_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type PublicUser = Pick<User, "id" | "email" | "displayName">;

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  valid: boolean;
  issues: string[];
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, hashValue] = storedHash.split(":");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

  const expected = Buffer.from(hashValue, "base64url");
  const derivedKey = (await scrypt(
    password,
    Buffer.from(saltValue, "base64url"),
    expected.length,
  )) as Buffer;

  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

export function assessPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Utilise au moins 12 caractères.");
  if (!/[a-z]/.test(password)) issues.push("Ajoute une lettre minuscule.");
  if (!/[A-Z]/.test(password)) issues.push("Ajoute une lettre majuscule.");
  if (!/[0-9]/.test(password)) issues.push("Ajoute un chiffre.");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("Ajoute un symbole.");
  if (/^[a-z]+$/.test(password)) issues.push("Un mot de passe composé uniquement de lettres minuscules est trop faible.");
  if (/^(.)\1+$/.test(password)) issues.push("Évite les caractères répétés.");

  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (/^[a-z]+$/.test(password)) score = Math.min(score, 1);
  if (password.length >= 24 && !/^(.)\1+$/.test(password)) score = Math.max(score, 3);

  const normalizedScore = Math.max(0, Math.min(4, score)) as PasswordStrength["score"];
  return {
    score: normalizedScore,
    label: normalizedScore >= 4 ? "Robuste" : normalizedScore >= 3 ? "Correct" : normalizedScore >= 2 ? "Fragile" : "Trop faible",
    valid: normalizedScore >= 3 && issues.length <= 2 && !/^[a-z]+$/.test(password),
    issues,
  };
}

export async function createSession(userId: string, res: Response, req?: Request) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(authSessionsTable).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    userAgent: req?.get("user-agent")?.slice(0, 300),
    lastSeenAt: new Date(),
    expiresAt,
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await db
      .delete(authSessionsTable)
      .where(eq(authSessionsTable.tokenHash, hashToken(token)));
  }
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionUser(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const rows = await db
    .select({ user: usersTable })
    .from(authSessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, authSessionsTable.userId))
    .where(
      and(
        eq(authSessionsTable.tokenHash, hashToken(token)),
        gt(authSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const user = rows[0]?.user ?? null;
  if (user) {
    void db
      .update(authSessionsTable)
      .set({ lastSeenAt: new Date() })
      .where(eq(authSessionsTable.tokenHash, hashToken(token)))
      .catch(() => undefined);
  }
  return user;
}

export function currentSessionHash(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" ? hashToken(token) : null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
