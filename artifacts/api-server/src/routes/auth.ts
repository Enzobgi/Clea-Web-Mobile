import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userDataTable, usersTable } from "@workspace/db/schema";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  normalizeEmail,
  toPublicUser,
  verifyPassword,
} from "../lib/auth";

const authRouter: IRouter = Router();

authRouter.post("/auth/register", async (req, res) => {
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
  if (password.length < 10 || password.length > 200) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 10 caractères." });
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

  await createSession(inserted.id, res);
  res.status(201).json({ user: toPublicUser(inserted) });
});

authRouter.post("/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Email ou mot de passe incorrect." });
    return;
  }

  await createSession(user.id, res);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/auth/logout", async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
});

authRouter.get("/auth/me", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

export default authRouter;
