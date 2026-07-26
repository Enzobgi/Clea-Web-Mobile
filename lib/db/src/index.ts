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
          email_verified_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

        CREATE TABLE IF NOT EXISTS auth_sessions (
          id uuid PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          user_agent text,
          last_seen_at timestamptz,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE auth_sessions
          ADD COLUMN IF NOT EXISTS user_agent text;
        ALTER TABLE auth_sessions
          ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

        CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
          ON auth_sessions(user_id);
        CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
          ON auth_sessions(expires_at);

        CREATE TABLE IF NOT EXISTS user_data (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id uuid PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          used_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
          ON password_reset_tokens(user_id);
        CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
          ON password_reset_tokens(expires_at);

        CREATE TABLE IF NOT EXISTS login_attempts (
          id uuid PRIMARY KEY,
          email text NOT NULL,
          ip_hash text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS login_attempts_email_idx
          ON login_attempts(email);
        CREATE INDEX IF NOT EXISTS login_attempts_created_at_idx
          ON login_attempts(created_at);
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
