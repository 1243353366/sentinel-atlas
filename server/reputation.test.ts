import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { lookupCirclSha256 } from "./routers/reputation";
import type { TrpcContext } from "./_core/context";

function publicCaller() {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {}, socket: { remoteAddress: "127.0.0.1" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reputation policy", () => {
  it("defaults to local-only and exposes no upload capability", async () => {
    const policy = await publicCaller().reputation.policy();
    expect(policy.defaultMode).toBe("local_only");
    expect(policy.uploadEnabled).toBe(false);
    expect(policy.authentication).toBe("No API key");
    expect(policy.consentRequired).toBe(true);
    expect(policy.persistenceDefault).toBe("off");
  });

  it("requires explicit remote-lookup consent", async () => {
    await expect(publicCaller().reputation.lookup({
      sha256: "a".repeat(64),
      consentToRemoteLookup: false as true,
    })).rejects.toThrow();
  });

  it("keeps persistence disabled unless separately requested", async () => {
    const sha256 = "3".repeat(64);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));

    const result = await publicCaller().reputation.lookup({
      sha256,
      consentToRemoteLookup: true,
      persistEvent: false,
    });

    expect(result.persistenceRequested).toBe(false);
    expect(result.ledgerStored).toBe(false);
    expect(result.ledgerEventId).toBeNull();
  });
});

describe("CIRCL SHA-256 lookup", () => {
  it("sends only the validated digest in a hash-only GET request", async () => {
    const sha256 = "1".repeat(64);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      "hashlookup:trust": 85,
      source: "NIST NSRL",
      FileName: "known-fixture.bin",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await lookupCirclSha256(sha256);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`https://hashlookup.circl.lu/lookup/sha256/${sha256}`);
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty("body");
    expect(result.status).toBe("known");
    expect(result.trust).toBe(85);
    expect(result.fileUploaded).toBe(false);
  });

  it("labels a provider miss as not found rather than clean", async () => {
    const sha256 = "2".repeat(64);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));

    const result = await lookupCirclSha256(sha256);

    expect(result.status).toBe("not_found");
    expect(result.summary.toLowerCase()).toContain("not a clean verdict");
  });

  it("rejects malformed digests before contacting the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(lookupCirclSha256("not-a-hash")).rejects.toThrow("valid 64-character SHA-256");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
