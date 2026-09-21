import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import { z } from "zod";
import { getRecentReleaseTrustEvents, saveReleaseTrustEvent } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CACHE_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 20;

const cache = new Map<string, { expiresAt: number; value: ReputationResult }>();
const requestBuckets = new Map<string, { count: number; resetsAt: number }>();

type ReputationResult = {
  provider: "CIRCL Hashlookup";
  sha256: string;
  status: "known" | "not_found" | "flagged" | "unavailable";
  summary: string;
  trust: number | null;
  source: string | null;
  fileName: string | null;
  queriedAt: string;
  cached: boolean;
  fileUploaded: false;
  disclosure: string;
};

function clientKey(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : "";
  return firstForwarded || req.socket?.remoteAddress || "anonymous";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || current.resetsAt <= now) {
    requestBuckets.set(key, { count: 1, resetsAt: now + RATE_WINDOW_MS });
    return;
  }
  if (current.count >= RATE_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Hash lookup limit reached. Wait a few minutes and try again.",
    });
  }
  current.count += 1;
}

function textField(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 240);
  }
  return null;
}

function numberField(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function booleanField(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && ["true", "false"].includes(value.toLowerCase())) return value.toLowerCase() === "true";
  }
  return null;
}

export async function lookupCirclSha256(sha256: string): Promise<ReputationResult> {
  const normalized = sha256.trim().toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid 64-character SHA-256 digest." });
  }

  const existing = cache.get(normalized);
  if (existing && existing.expiresAt > Date.now()) return { ...existing.value, cached: true };

  const disclosure = "Only this SHA-256 digest was sent to CIRCL over HTTPS. No filename, path, metadata, or file bytes were uploaded.";
  const queriedAt = new Date().toISOString();

  try {
    const response = await fetch(`https://hashlookup.circl.lu/lookup/sha256/${normalized}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Sentinel-Atlas/1.1 (+https://sentinel-atlas.onrender.com/)",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.status === 404) {
      const value: ReputationResult = {
        provider: "CIRCL Hashlookup",
        sha256: normalized,
        status: "not_found",
        summary: "This digest was not present in CIRCL's included known-file datasets. Absence is not a clean verdict.",
        trust: null,
        source: null,
        fileName: null,
        queriedAt,
        cached: false,
        fileUploaded: false,
        disclosure,
      };
      cache.set(normalized, { expiresAt: Date.now() + CACHE_TTL_MS, value });
      return value;
    }

    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
    const payload = await response.json() as Record<string, unknown>;
    const knownMalicious = booleanField(payload, "KnownMalicious", "known_malicious", "malicious") === true;
    const value: ReputationResult = {
      provider: "CIRCL Hashlookup",
      sha256: normalized,
      status: knownMalicious ? "flagged" : "known",
      summary: knownMalicious
        ? "CIRCL returned a malicious-context flag for this known digest. Treat it as a signal requiring analyst review."
        : "CIRCL found this digest in one or more known-file datasets. This is context, not an antivirus verdict.",
      trust: numberField(payload, "hashlookup:trust", "trust"),
      source: textField(payload, "source", "db", "database"),
      fileName: textField(payload, "FileName", "file_name", "name"),
      queriedAt,
      cached: false,
      fileUploaded: false,
      disclosure,
    };
    cache.set(normalized, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    return {
      provider: "CIRCL Hashlookup",
      sha256: normalized,
      status: "unavailable",
      summary: "The public reputation service did not answer in time. The local digest remains valid; retry later.",
      trust: null,
      source: null,
      fileName: null,
      queriedAt,
      cached: false,
      fileUploaded: false,
      disclosure,
    };
  }
}

export const reputationRouter = router({
  policy: publicProcedure.query(() => ({
    provider: "CIRCL Hashlookup",
    endpoint: "https://hashlookup.circl.lu/lookup/sha256/{sha256}",
    authentication: "No API key",
    defaultMode: "local_only" as const,
    uploadEnabled: false,
    consentRequired: true,
    retention: "Sentinel Atlas keeps lookup results only in a short-lived in-memory cache.",
    persistenceDefault: "off" as const,
    caveat: "Known, not found, and trust metadata are contextual signals—not proof that a file is safe or malicious.",
  })),
  lookup: publicProcedure
    .input(z.object({
      sha256: z.string().trim().toLowerCase().regex(SHA256_PATTERN, "Enter a valid SHA-256 digest."),
      consentToRemoteLookup: z.literal(true),
      persistEvent: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      enforceRateLimit(clientKey(ctx.req));
      const result = await lookupCirclSha256(input.sha256);
      let ledgerEventId: number | null = null;
      try {
        if (!input.persistEvent) return { ...result, persistenceRequested: false, ledgerStored: false, ledgerEventId: null };
        ledgerEventId = await saveReleaseTrustEvent({
          userId: ctx.user?.id ?? null,
          eventType: "remote_hash_lookup",
          provider: result.provider,
          outcome: result.status,
          digestAlgorithm: "SHA-256",
          consentGranted: 1,
          fileUploaded: 0,
          details: JSON.stringify({ source: result.source, cached: result.cached }),
        });
      } catch {
        console.warn("Hash lookup completed without ledger persistence because the complementary database was unavailable.");
      }
      return { ...result, persistenceRequested: true, ledgerStored: ledgerEventId !== null, ledgerEventId };
    }),
  recent: publicProcedure.query(async () => {
    try {
      const events = await getRecentReleaseTrustEvents(8);
      return { databaseAvailable: events !== null, events: events ?? [] };
    } catch {
      return { databaseAvailable: false, events: [] };
    }
  }),
});
