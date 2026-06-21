import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireTrustedOrigin } from "./lib/request-security";

const app: Express = express();

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.url.split("?")[0],
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    }, "request completed");
  });
  next();
});
app.set("trust proxy", 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requireTrustedOrigin);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const publicDir = path.resolve(import.meta.dirname, "../public");
  app.use(express.static(publicDir, {
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }));
  app.get("*path", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
