import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authSessionsTable = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    userIdIndex: index("auth_sessions_user_id_idx").on(table.userId),
    expiresAtIndex: index("auth_sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export const passwordResetTokensTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    userIdIndex: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIndex: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

export const loginAttemptsTable = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    emailIndex: index("login_attempts_email_idx").on(table.email),
    createdAtIndex: index("login_attempts_created_at_idx").on(table.createdAt),
  }),
);

export const userDataTable = pgTable("user_data", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type AuthSession = typeof authSessionsTable.$inferSelect;
export type UserData = typeof userDataTable.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
export type LoginAttempt = typeof loginAttemptsTable.$inferSelect;
