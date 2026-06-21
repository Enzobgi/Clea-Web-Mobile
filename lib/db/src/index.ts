import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

let schemaReady: Promise<void> | null = null;

export function ensureDatabaseSchema() {
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY,
          email text NOT NULL UNIQUE,
          display_name text NOT NULL,
          password_hash text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
          id uuid PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
          ON auth_sessions(user_id);
        CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
          ON auth_sessions(expires_at);

        CREATE TABLE IF NOT EXISTS user_data (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `)
      .then(() => undefined)
      .catch(error => {
        schemaReady = null;
        throw error;
      });
  }

  return schemaReady;
}

export * from "./schema";
