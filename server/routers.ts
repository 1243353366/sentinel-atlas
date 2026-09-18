import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getRecentThreatAnalyses, saveThreatAnalysis } from "./db";

const modeSchema = z.enum(["analyst", "adversary", "defender", "detection", "auditor"]);
const inputSchema = z.object({
  mode: modeSchema,
  observation: z.string().trim().min(10).max(1800),
});

const restrictedPatterns = [
  /deploy\s+(malware|ransomware|payload)/i,
  /steal\s+(credentials|passwords|tokens)/i,
  /evad(e|ing)\s+(detection|law enforcement|monitoring)/i,
  /lateral\s+movement\s+(against|into)\s+(production|real|third)/i,
  /exfiltrat(e|ion).*real/i,
  /bypass\s+(edr|antivirus|security controls)/i,
];

const reasoningSystem = `You are Sentinel Atlas, an evidence-grounded defensive security analyst.

Hard boundaries:
- Analyze behavior descriptions, telemetry, reports, and synthetic exercise notes only.
- Never provide malware, persistence, credential theft, evasion, lateral movement, exfiltration, or unauthorized-access instructions.
- Never recommend executing live malware. Recommend only benign, authorized, isolated emulation.
- If the note asks for harmful operational help, return a restricted safety response.
- Do not invent facts, sources, hashes, or ATT&CK mappings. Use candidate wording when evidence is incomplete.
- Keep the answer useful to defenders: map behavior, state uncertainty, name expected telemetry, and identify a detection gap.

Return JSON that matches the requested schema exactly.`;

const outputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    techniques: { type: "array", items: { type: "string" } },
    objective: { type: "string" },
    telemetry: { type: "array", items: { type: "string" } },
    detectionGap: { type: "string" },
    safeTest: { type: "string" },
    confidence: { type: "string", enum: ["SUPPORTED", "CANDIDATE", "UNMAPPED", "RESTRICTED"] },
  },
  required: ["summary", "techniques", "objective", "telemetry", "detectionGap", "safeTest", "confidence"],
  additionalProperties: false,
} as const;

type AtlasResult = {
  summary: string;
  techniques: string[];
  objective: string;
  telemetry: string[];
  detectionGap: string;
  safeTest: string;
  confidence: "SUPPORTED" | "CANDIDATE" | "UNMAPPED" | "RESTRICTED";
};

function restrictedResult(): AtlasResult {
  return {
    summary: "This request is outside Sentinel Atlas safety scope. I can help analyze defensive evidence or design an authorized, isolated test instead.",
    techniques: ["Not classified"],
    objective: "Safety boundary triggered; no operational guidance provided.",
    telemetry: ["Preserve the original request for review and use approved lab evidence only."],
    detectionGap: "Confirm that the exercise has written authorization, isolated infrastructure, synthetic credentials, and no uncontrolled outbound access.",
    safeTest: "Reframe the request as a benign ATT&CK-mapped emulation with a vendor-approved harness and human review.",
    confidence: "RESTRICTED",
  };
}

function normalizeResult(raw: unknown): AtlasResult {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<AtlasResult>;
  const confidence = ["SUPPORTED", "CANDIDATE", "UNMAPPED", "RESTRICTED"].includes(String(value.confidence))
    ? value.confidence as AtlasResult["confidence"] : "UNMAPPED";
  return {
    summary: String(value.summary || "Insufficient evidence for a reliable conclusion.").slice(0, 2200),
    techniques: Array.isArray(value.techniques) ? value.techniques.map(String).slice(0, 8) : ["Unmapped behavior"],
    objective: String(value.objective || "Requires analyst review before classification.").slice(0, 1200),
    telemetry: Array.isArray(value.telemetry) ? value.telemetry.map(String).slice(0, 8) : ["Preserve process, identity, file, network, and control-response evidence."],
    detectionGap: String(value.detectionGap || "What evidence would confirm or falsify this hypothesis?").slice(0, 1200),
    safeTest: String(value.safeTest || "Use a benign reproduction in an isolated, authorized lab only.").slice(0, 1400),
    confidence,
  };
}

async function runAtlas(input: z.infer<typeof inputSchema>): Promise<AtlasResult> {
  if (restrictedPatterns.some((pattern) => pattern.test(input.observation))) return restrictedResult();

  const response = await invokeLLM({
    messages: [
      { role: "system", content: reasoningSystem },
      { role: "user", content: `Reasoning mode: ${input.mode}\nObserved behavior or exercise note:\n${input.observation}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "sentinel_atlas_result", strict: true, schema: outputSchema },
    },
  });
  const content = response.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : JSON.stringify(content || {});
  return normalizeResult(JSON.parse(text));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  atlas: router({
    analyze: publicProcedure.input(inputSchema).mutation(async ({ input, ctx }) => {
      const result = await runAtlas(input);
      const id = await saveThreatAnalysis({
        userId: ctx.user?.id ?? null,
        mode: input.mode,
        observation: input.observation,
        summary: result.summary,
        techniques: JSON.stringify(result.techniques),
        objective: result.objective,
        telemetry: JSON.stringify(result.telemetry),
        detectionGap: result.detectionGap,
        safeTest: result.safeTest,
        confidence: result.confidence,
        validationStatus: result.confidence === "RESTRICTED" ? "blocked" : "validated",
      });
      return { ...result, id };
    }),
    recent: protectedProcedure.query(({ ctx }) => getRecentThreatAnalyses(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
