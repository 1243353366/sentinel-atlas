import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertThreatAnalysis, InsertUser, threatAnalyses, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= values.lastSignedIn;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function saveThreatAnalysis(input: InsertThreatAnalysis) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(threatAnalyses).values(input);
  return Number(result[0].insertId);
}

export async function getRecentThreatAnalyses(userId: number, limit = 8) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: threatAnalyses.id,
    mode: threatAnalyses.mode,
    observation: threatAnalyses.observation,
    summary: threatAnalyses.summary,
    confidence: threatAnalyses.confidence,
    createdAt: threatAnalyses.createdAt,
  }).from(threatAnalyses)
    .where(eq(threatAnalyses.userId, userId))
    .orderBy(desc(threatAnalyses.createdAt))
    .limit(limit);
}
