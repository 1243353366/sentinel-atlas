import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileArchive,
  Fingerprint,
  Github,
  KeyRound,
  Loader2,
  LockKeyhole,
  Radar,
  Search,
  ShieldCheck,
  TerminalSquare,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const RELEASE_VERSION = "v2.1.0";
const RELEASE_REPO = "1243353366/sentinel-atlas";
const RELEASE_FILE = `sentinel-atlas-${RELEASE_VERSION}.tar.gz`;
const RELEASE_URL = `https://github.com/${RELEASE_REPO}/releases/tag/${RELEASE_VERSION}`;
const ATTESTATIONS_URL = `https://github.com/${RELEASE_REPO}/attestations`;
const VERIFY_COMMAND = `gh attestation verify ${RELEASE_FILE} --repo ${RELEASE_REPO} --signer-workflow ${RELEASE_REPO}/.github/workflows/release.yml --source-ref refs/tags/${RELEASE_VERSION} --deny-self-hosted-runners`;
const MAX_BROWSER_FILE_BYTES = 512 * 1024 * 1024;

type HashState = {
  name: string;
  size: number;
  sha256: string;
};

async function hashFile(file: File) {
  if (file.size > MAX_BROWSER_FILE_BYTES) throw new Error("Browser hashing is limited to 512 MB. Use sha256sum for larger artifacts.");
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function statusTone(status?: "known" | "not_found" | "flagged" | "unavailable") {
  if (status === "known") return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  if (status === "flagged") return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  if (status === "not_found") return "border-amber-200/30 bg-amber-200/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default function ReleaseTrust() {
  const [hash, setHash] = useState<HashState | null>(null);
  const [manualHash, setManualHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [persistEvent, setPersistEvent] = useState(false);
  const policy = trpc.reputation.policy.useQuery();
  const recent = trpc.reputation.recent.useQuery();
  const lookup = trpc.reputation.lookup.useMutation({ onSuccess: () => recent.refetch() });
  const activeHash = useMemo(() => (hash?.sha256 || manualHash).trim().toLowerCase(), [hash, manualHash]);
  const validHash = /^[a-f0-9]{64}$/.test(activeHash);

  const onFile = async (file?: File) => {
    if (!file) return;
    setIsHashing(true);
    setConsent(false);
    setPersistEvent(false);
    lookup.reset();
    try {
      const sha256 = await hashFile(file);
      setHash({ name: file.name, size: file.size, sha256 });
      setManualHash(sha256);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not hash that file.");
    } finally {
      setIsHashing(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const runLookup = () => {
    if (!validHash || !consent) return;
    lookup.mutate({ sha256: activeHash, consentToRemoteLookup: true, persistEvent });
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            <div className="atlas-mark"><Radar className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">Sentinel Atlas</div>
              <div className="text-xs text-slate-500">Release trust center</div>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <Badge className="hidden border-emerald-300/20 bg-emerald-300/10 text-emerald-200 sm:inline-flex"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />No API key</Badge>
            <Button asChild size="sm" variant="outline" className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10">
              <a href="/"><ArrowLeft className="mr-2 h-3.5 w-3.5" />Workspace</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-5 py-8 lg:px-10 lg:py-12">
        <section className="hero-grid relative overflow-hidden rounded-[28px] border border-white/10 px-6 py-9 sm:px-10 sm:py-12">
          <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2"><Badge className="border-cyan-300/25 bg-cyan-300/10 text-cyan-200">PUBLIC RELEASE EVIDENCE</Badge><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">hash first · consent before network · signed provenance</span></div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">Trust the artifact by <span className="text-cyan-300">verifying the evidence.</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Fingerprint a file locally, opt in to a hash-only public lookup, and verify that GitHub Actions produced the exact release you downloaded.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <TrustMetric value="0" label="files uploaded" />
              <TrustMetric value="1" label="remote hash provider" />
              <TrustMetric value="3" label="evidence layers" />
            </div>
          </div>
          <div className="hero-orbit" aria-hidden="true"><div /><div /><div /></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <Card className="border-cyan-300/20 bg-cyan-300/[0.045] shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-cyan-300"><Fingerprint className="h-3.5 w-3.5" />Local fingerprint</div>
              <CardTitle className="text-2xl text-white">Calculate SHA-256 in this browser</CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">The selected file stays on your device. Sentinel Atlas reads it only to calculate the digest.</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <label className="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/25 bg-black/15 p-6 text-center transition hover:border-cyan-300/50 hover:bg-cyan-300/[0.04]">
                {isHashing ? <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-300" /> : <FileArchive className="mb-3 h-8 w-8 text-cyan-300" />}
                <span className="text-sm font-medium text-slate-100">{isHashing ? "Hashing locally…" : "Choose APK, EXE, ZIP, or release artifact"}</span>
                <span className="mt-2 text-xs text-slate-500">Maximum 512 MB in the browser · no upload</span>
                <input className="sr-only" type="file" onChange={event => onFile(event.target.files?.[0])} />
              </label>

              {hash && <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-100">{hash.name}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{(hash.size / 1024 / 1024).toFixed(2)} MiB</p></div><Badge className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200">LOCAL HASH READY</Badge></div><div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-[#07111f] p-3"><code className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-cyan-100">{hash.sha256}</code><button type="button" aria-label="Copy local SHA-256" onClick={() => copyText(hash.sha256, "SHA-256")} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"><Copy className="h-4 w-4" /></button></div></div>}

              <div className="space-y-2">
                <label htmlFor="manual-hash" className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Or paste a SHA-256 digest</label>
                <Input id="manual-hash" value={manualHash} onChange={event => { setManualHash(event.target.value.replace(/\s/g, "")); setHash(null); setConsent(false); setPersistEvent(false); lookup.reset(); }} maxLength={64} spellCheck={false} placeholder="64 hexadecimal characters" className="h-11 border-white/10 bg-black/20 font-mono text-xs text-slate-100 placeholder:text-slate-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-300/20 bg-violet-300/[0.045] shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-violet-200"><Search className="h-3.5 w-3.5" />Live reputation context</div>
              <CardTitle className="text-2xl text-white">CIRCL hash-only lookup</CardTitle>
              <p className="text-sm leading-6 text-slate-400">No account or API key. A remote request is made only after you explicitly consent.</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-4 text-xs leading-5 text-amber-50/80"><div className="mb-2 flex items-center gap-2 font-medium text-amber-100"><TriangleAlert className="h-4 w-4" />Privacy boundary</div>The SHA-256 itself may be sensitive and can appear in provider or network logs. Sentinel Atlas sends no filename, file bytes, path, or metadata.</div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
                <Checkbox checked={consent} onCheckedChange={checked => setConsent(checked === true)} className="mt-0.5 border-white/25 data-[state=checked]:border-cyan-300 data-[state=checked]:bg-cyan-300 data-[state=checked]:text-[#07111f]" />
                <span className="text-sm leading-6 text-slate-300">I consent to sending <strong>only this SHA-256 digest</strong> to CIRCL for this lookup.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                <Checkbox checked={persistEvent} onCheckedChange={checked => setPersistEvent(checked === true)} className="mt-0.5 border-white/25 data-[state=checked]:border-emerald-300 data-[state=checked]:bg-emerald-300 data-[state=checked]:text-[#07111f]" />
                <span className="text-sm leading-6 text-slate-300"><strong>Optional:</strong> store only the provider outcome and consent metadata in the evidence ledger. The raw digest and trust score are never stored.</span>
              </label>
              <Button onClick={runLookup} disabled={!validHash || !consent || lookup.isPending} className="h-11 w-full bg-violet-200 text-[#1c1230] hover:bg-violet-100">{lookup.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Querying CIRCL…</> : <><Search className="mr-2 h-4 w-4" />Run hash-only lookup</>}</Button>
              {!validHash && activeHash.length > 0 && <p className="text-xs text-amber-200">A SHA-256 digest must contain exactly 64 hexadecimal characters.</p>}
              {lookup.data && <div className={`rounded-2xl border p-4 ${statusTone(lookup.data.status)}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.14em]">{lookup.data.provider}</span><Badge className={statusTone(lookup.data.status)}>{lookup.data.status.replace("_", " ")}</Badge></div><p className="mt-4 text-sm leading-6">{lookup.data.summary}</p>{lookup.data.trust !== null && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">Live trust context</span><strong className="text-lg text-white">{lookup.data.trust}<span className="text-xs font-normal text-slate-500"> / 100</span></strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-label="CIRCL trust context" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lookup.data.trust}><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300" style={{ width: `${Math.max(0, Math.min(100, lookup.data.trust))}%` }} /></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Provider context shown for this session only. CIRCL documents 50 as no opinion; this is not an antivirus score.</p></div>}<dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-500">Source</dt><dd className="mt-1 text-slate-200">{lookup.data.source ?? "Not supplied"}</dd></div><div><dt className="text-slate-500">Score storage</dt><dd className="mt-1 text-emerald-200">UI only</dd></div><div><dt className="text-slate-500">File upload</dt><dd className="mt-1 text-emerald-200">No</dd></div><div><dt className="text-slate-500">Cache</dt><dd className="mt-1 text-slate-200">{lookup.data.cached ? "Short-lived hit" : "Fresh lookup"}</dd></div></dl></div>}
              {lookup.error && <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm text-rose-100">{lookup.error.message}</div>}
              <p className="text-xs leading-5 text-slate-500">{policy.data?.caveat ?? "Known or absent hashes are context, not proof of safety."}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="border-sky-300/20 bg-sky-300/[0.04] shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-200"><Activity className="h-3.5 w-3.5" />Foreground state</div>
              <CardTitle className="text-2xl text-white">Every boundary stays visible</CardTitle>
              <p className="text-sm leading-6 text-slate-400">The foreground shows what happened, what crossed the network, and whether optional persistence succeeded.</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <ForegroundStep number="01" title="Artifact selected or digest pasted" detail={activeHash ? "Input is present in this browser session." : "Waiting for a local artifact or SHA-256 digest."} state={activeHash ? "complete" : "waiting"} />
              <ForegroundStep number="02" title="SHA-256 validated" detail={validHash ? "The digest is canonical lowercase hexadecimal." : "No valid 64-character digest is ready."} state={validHash ? "complete" : "waiting"} />
              <ForegroundStep number="03" title="Remote disclosure consent" detail={consent ? "One CIRCL lookup is authorized for the active digest." : "Local-only mode remains active."} state={consent ? "complete" : "guarded"} />
              <ForegroundStep number="04" title="Provider response" detail={lookup.data?.summary ?? (lookup.isPending ? "Waiting for CIRCL's response…" : "No remote request has completed in this session.")} state={lookup.data ? "complete" : lookup.isPending ? "active" : "waiting"} />
              <ForegroundStep number="05" title="Complementary ledger" detail={lookup.data ? (lookup.data.ledgerStored ? `Stored non-sensitive event #${lookup.data.ledgerEventId}; the trust score remained UI-only.` : lookup.data.persistenceRequested ? "Persistence was requested but unavailable; the provider result was not blocked." : "Persistence remained off; this result is session-only.") : persistEvent ? "Persistence will be attempted after the lookup." : "Optional persistence is off by default."} state={lookup.data?.ledgerStored ? "complete" : lookup.data || persistEvent ? "guarded" : "waiting"} />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200"><Database className="h-3.5 w-3.5" />Complementary evidence database</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-2xl text-white">Append-only trust ledger</CardTitle><p className="mt-2 text-sm leading-6 text-slate-400">Optional persistence stores provider, outcome, consent, upload status, and timestamp—never file content, filenames, paths, raw digests, or trust scores.</p></div><Badge className={recent.data?.databaseAvailable ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-amber-200/25 bg-amber-200/10 text-amber-100"}>{recent.isLoading ? "CHECKING" : recent.data?.databaseAvailable ? "AVAILABLE" : "NON-BLOCKING"}</Badge></div>
            </CardHeader>
            <CardContent className="pt-6">
              {recent.data?.events.length ? <div className="space-y-3">{recent.data.events.map(event => <div key={event.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-cyan-100">{event.outcome.replace("_", " ")}</span><span className="text-sm font-medium text-slate-100">{event.provider}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{event.digestAlgorithm} · consent {event.consentGranted ? "recorded" : "not recorded"} · file upload {event.fileUploaded ? "yes" : "no"} · trust score not stored</p></div><span className="inline-flex items-center gap-2 text-[10px] text-slate-600"><Clock3 className="h-3.5 w-3.5" />{new Date(event.createdAt).toLocaleString()}</span></div>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center"><Database className="mb-4 h-8 w-8 text-slate-600" /><p className="text-sm font-medium text-slate-300">{recent.data?.databaseAvailable ? "Ledger ready—no events yet" : "Database offline; core verification remains available"}</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">This module is deliberately fail-soft. It records evidence only when you opt in and never blocks local hashing, provider results, signed releases, or the rest of Sentinel Atlas.</p></div>}
            </CardContent>
          </Card>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/[0.08] via-white/[0.025] to-cyan-300/[0.05] shadow-2xl shadow-black/20">
          <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" />Signed build provenance</div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">GitHub signs the bytes—not the promise.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">Every tagged release is built on a GitHub-hosted runner, archived deterministically, and attested with GitHub OIDC and Sigstore transparency before the same bytes are published.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-emerald-200 text-[#09231b] hover:bg-emerald-100"><a href={RELEASE_URL} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Download {RELEASE_VERSION}</a></Button>
                <Button asChild variant="outline" className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10"><a href={ATTESTATIONS_URL} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" />Public attestations<ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3"><EvidenceStep number="01" label="Build" detail="Node 25 · pnpm lock" /><EvidenceStep number="02" label="Attest" detail="SLSA provenance · Sigstore" /><EvidenceStep number="03" label="Publish" detail="Exact archived bytes" /></div>
              <div className="rounded-2xl border border-white/10 bg-[#07111f] p-4"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400"><TerminalSquare className="h-4 w-4 text-emerald-200" />Strict verification command</div><button type="button" aria-label="Copy attestation verification command" onClick={() => copyText(VERIFY_COMMAND, "Verification command")} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"><Copy className="h-4 w-4" /></button></div><code className="block break-all font-mono text-xs leading-6 text-emerald-100">{VERIFY_COMMAND}</code></div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><p className="text-xs leading-5 text-slate-400">Verification proves artifact identity and workflow provenance. It does not prove the absence of vulnerabilities or malicious behavior.</p></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Boundary icon={<LockKeyhole className="h-5 w-5" />} title="Local by default" text="Hashing happens in your browser. Nothing leaves the device unless you enable a single remote lookup." />
          <Boundary icon={<Fingerprint className="h-5 w-5" />} title="Hash only" text="The server validates one lowercase SHA-256 and never implements an upload route for a reputation provider." />
          <Boundary icon={<CheckCircle2 className="h-5 w-5" />} title="Publicly verifiable" text="Release consumers can independently verify the artifact, signer workflow, protected tag, and hosted runner policy." />
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Sentinel Atlas · self-hostable defensive research workspace</span><div className="flex flex-wrap gap-4"><a href="https://github.com/1243353366/sentinel-atlas" target="_blank" rel="noopener noreferrer" className="transition hover:text-slate-200">Source</a><a href="https://www.circl.lu/services/hashlookup/" target="_blank" rel="noopener noreferrer" className="transition hover:text-slate-200">CIRCL policy</a><a href="/" className="transition hover:text-slate-200">Workspace</a></div></footer>
      </main>
    </div>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-semibold text-cyan-200">{value}</p><p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p></div>;
}

function EvidenceStep({ number, label, detail }: { number: string; label: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="font-mono text-[10px] text-emerald-200">{number}</span><p className="mt-4 text-sm font-semibold text-slate-100">{label}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>;
}

function ForegroundStep({ number, title, detail, state }: { number: string; title: string; detail: string; state: "waiting" | "active" | "guarded" | "complete" }) {
  const tone = state === "complete" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : state === "active" ? "border-sky-300/25 bg-sky-300/10 text-sky-200" : state === "guarded" ? "border-amber-200/25 bg-amber-200/10 text-amber-100" : "border-white/10 bg-white/[0.03] text-slate-500";
  return <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/15 p-4"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${tone}`}>{number}</span><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-100">{title}</p><span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${tone}`}>{state}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></div>;
}

function Boundary({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="text-cyan-300">{icon}</div><h3 className="mt-4 text-base font-semibold text-slate-100">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>;
}
