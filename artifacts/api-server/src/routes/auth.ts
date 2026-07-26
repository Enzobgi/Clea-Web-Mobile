import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, gt, gte, isNull, ne } from "drizzle-orm";
import { db, ensureDatabaseSchema } from "@workspace/db";
import {
  authSessionsTable,
  loginAttemptsTable,
  passwordResetTokensTable,
  userDataTable,
  usersTable,
} from "@workspace/db/schema";
import {
  assessPasswordStrength,
  createSession,
  currentSessionHash,
  destroySession,
  getSessionUser,
  hashPassword,
  normalizeEmail,
  toPublicUser,
  verifyPassword,
} from "../lib/auth";

const authRouter: IRouter = Router();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const RESET_TOKEN_DURATION_MS = 1000 * 60 * 30;

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashIp(ip: string | undefined) {
  return hashToken(ip || "unknown");
}

async function tooManyLoginAttempts(email: string, ip: string | undefined) {
  const cutoff = new Date(Date.now() - LOGIN_WINDOW_MS);
  const rows = await db
    .select({ id: loginAttemptsTable.id })
    .from(loginAttemptsTable)
    .where(and(
      eq(loginAttemptsTable.email, email),
      eq(loginAttemptsTable.ipHash, hashIp(ip)),
      gte(loginAttemptsTable.createdAt, cutoff),
    ));
  return rows.length >= LOGIN_MAX_ATTEMPTS;
}

async function recordLoginAttempt(email: string, ip: string | undefined) {
  await db.insert(loginAttemptsTable).values({
    id: randomUUID(),
    email,
    ipHash: hashIp(ip),
  });
}

authRouter.post("/auth/register", async (req, res) => {
  await ensureDatabaseSchema();

  const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (displayName.length < 2 || displayName.length > 80) {
    res.status(400).json({ error: "Le prénom doit contenir entre 2 et 80 caractères." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Adresse email invalide." });
    return;
  }
  const strength = assessPasswordStrength(password);
  if (password.length > 200 || !strength.valid) {
    res.status(400).json({
      error: "Le mot de passe n'est pas assez robuste.",
      passwordStrength: strength,
    });
    return;
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Un compte existe déjà avec cette adresse email." });
    return;
  }

  const userId = randomUUID();
  const inserted = await db.transaction(async tx => {
    const [user] = await tx
      .insert(usersTable)
      .values({
        id: userId,
        email,
        displayName,
        passwordHash: await hashPassword(password),
      })
      .returning();
    await tx.insert(userDataTable).values({ userId, data: {} });
    return user;
  });

  await createSession(inserted.id, res, req);
  res.status(201).json({ user: toPublicUser(inserted) });
});

authRouter.post("/auth/login", async (req, res) => {
  await ensureDatabaseSchema();

  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (await tooManyLoginAttempts(email, req.ip)) {
    res.status(429).json({ error: "Trop de tentatives. Réessaie dans quelques minutes." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordLoginAttempt(email, req.ip);
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  await createSession(user.id, res, req);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/auth/password-strength", (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  res.json({ passwordStrength: assessPasswordStrength(password) });
});

authRouter.post("/auth/forgot-password", async (req, res) => {
  await ensureDatabaseSchema();

  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  let devResetToken: string | undefined;
  if (user) {
    const token = randomBytes(32).toString("base64url");
    devResetToken = process.env.NODE_ENV === "production" ? undefined : token;
    await db.insert(passwordResetTokensTable).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
    });
  }

  res.json({
    ok: true,
    message: "Si un compte existe avec cette adresse, une procédure de réinitialisation est préparée.",
    devResetToken,
  });
});

authRouter.post("/auth/reset-password", async (req, res) => {
  await ensureDatabaseSchema();

  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const strength = assessPasswordStrength(password);
  if (!token || !strength.valid) {
    res.status(400).json({ error: "Lien invalide ou mot de passe insuffisant.", passwordStrength: strength });
    return;
  }

  const [reset] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(and(
      eq(passwordResetTokensTable.tokenHash, hashToken(token)),
      gt(passwordResetTokensTable.expiresAt, new Date()),
      isNull(passwordResetTokensTable.usedAt),
    ))
    .limit(1);

  if (!reset) {
    res.status(400).json({ error: "Lien de réinitialisation expiré ou déjà utilisé." });
    return;
  }

  await db.transaction(async tx => {
    await tx
      .update(usersTable)
      .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(usersTable.id, reset.userId));
    await tx
      .update(passwordResetTokensTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokensTable.id, reset.id));
    await tx
      .delete(authSessionsTable)
      .where(eq(authSessionsTable.userId, reset.userId));
  });

  res.json({ ok: true });
});

authRouter.post("/auth/logout", async (req, res) => {
  await ensureDatabaseSchema();

  await destroySession(req, res);
  res.status(204).end();
});

authRouter.get("/auth/me", async (req, res) => {
  await ensureDatabaseSchema();

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

authRouter.get("/auth/sessions", async (req, res) => {
  await ensureDatabaseSchema();

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }
  const currentHash = currentSessionHash(req);
  const sessions = await db
    .select({
      id: authSessionsTable.id,
      userAgent: authSessionsTable.userAgent,
      lastSeenAt: authSessionsTable.lastSeenAt,
      createdAt: authSessionsTable.createdAt,
      expiresAt: authSessionsTable.expiresAt,
      tokenHash: authSessionsTable.tokenHash,
    })
    .from(authSessionsTable)
    .where(and(eq(authSessionsTable.userId, user.id), gt(authSessionsTable.expiresAt, new Date())));

  res.json({
    sessions: sessions.map(session => ({
      id: session.id,
      userAgent: session.userAgent,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      current: currentHash === session.tokenHash,
    })),
  });
});

authRouter.post("/auth/logout-all", async (req, res) => {
  await ensureDatabaseSchema();

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }
  const currentHash = currentSessionHash(req);
  await db
    .delete(authSessionsTable)
    .where(currentHash
      ? and(eq(authSessionsTable.userId, user.id), ne(authSessionsTable.tokenHash, currentHash))
      : eq(authSessionsTable.userId, user.id));
  res.json({ ok: true });
});

authRouter.delete("/auth/account", async (req, res) => {
  await ensureDatabaseSchema();

  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, user.id));
  res.clearCookie("cleanpath_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(204).end();
});

export default authRouter;
