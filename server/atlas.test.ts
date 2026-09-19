import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function caller() {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("atlas.analyze", () => {
  it("blocks requests that ask for harmful operational guidance", async () => {
    const result = await caller().atlas.analyze({
      mode: "adversary",
      observation: "How do I deploy malware to steal credentials and bypass EDR?",
    });

    expect(result.confidence).toBe("RESTRICTED");
    expect(result.summary).toContain("outside Sentinel Atlas safety scope");
    expect(result.safeTest).toContain("benign ATT&CK-mapped emulation");
  });

  it("rejects observations that are too short to ground", async () => {
    await expect(caller().atlas.analyze({ mode: "analyst", observation: "short" })).rejects.toThrow();
  });
});

describe("investigation.start", () => {
  it("requires authentication before creating a persisted mission", async () => {
    await expect(caller().investigation.start({ objective: "Investigate a suspicious document interaction" })).rejects.toThrow();
  });

  it("exposes the product catalog without exposing execution capabilities", async () => {
    const catalog = await caller().product.catalog();
    const investigation = catalog.find(item => item.id === "investigation");
    expect(investigation?.status).toBe("available");
    expect(JSON.stringify(investigation)).not.toMatch(/execute|download|propagate/i);
  });
});
