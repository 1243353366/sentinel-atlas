import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const threatAnalyses = mysqlTable("threat_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  mode: mysqlEnum("mode", ["analyst", "adversary", "defender", "detection", "auditor"]).notNull(),
  observation: text("observation").notNull(),
  summary: text("summary").notNull(),
  techniques: text("techniques").notNull(),
  objective: text("objective").notNull(),
  telemetry: text("telemetry").notNull(),
  detectionGap: text("detectionGap").notNull(),
  safeTest: text("safeTest").notNull(),
  confidence: mysqlEnum("confidence", ["SUPPORTED", "CANDIDATE", "UNMAPPED", "RESTRICTED"]).notNull(),
  validationStatus: varchar("validationStatus", { length: 64 }).notNull().default("validated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ThreatAnalysis = typeof threatAnalyses.$inferSelect;
export type InsertThreatAnalysis = typeof threatAnalyses.$inferInsert;
