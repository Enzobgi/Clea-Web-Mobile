import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userDataTable } from "@workspace/db/schema";
import { getSessionUser } from "../lib/auth";

const dataRouter: IRouter = Router();

dataRouter.get("/data", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const [record] = await db
    .select()
    .from(userDataTable)
    .where(eq(userDataTable.userId, user.id))
    .limit(1);

  res.json({ data: record?.data ?? {}, updatedAt: record?.updatedAt ?? null });
});

dataRouter.put("/data", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const data = req.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    res.status(400).json({ error: "Format de données invalide." });
    return;
  }

  const serializedSize = Buffer.byteLength(JSON.stringify(data), "utf8");
  if (serializedSize > 2_000_000) {
    res.status(413).json({ error: "Les données dépassent la taille autorisée." });
    return;
  }

  const [record] = await db
    .insert(userDataTable)
    .values({ userId: user.id, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userDataTable.userId,
      set: { data, updatedAt: new Date() },
    })
    .returning();

  res.json({ updatedAt: record.updatedAt });
});

export default dataRouter;
