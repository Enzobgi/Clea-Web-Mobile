import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }

  const allowedOrigins = new Set(
    [process.env.APP_ORIGIN, process.env.CORS_ORIGIN]
      .filter((value): value is string => Boolean(value))
      .map(value => value.replace(/\/$/, "")),
  );
  const requestOrigin = `${req.protocol}://${req.get("host")}`;

  if (origin.replace(/\/$/, "") === requestOrigin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
    next();
    return;
  }

  res.status(403).json({ error: "Origine non autorisée." });
}
