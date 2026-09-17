"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProposalPicker } from "@/components/dao/ProposalPicker";
import { VerdictBadge } from "@/components/dao/VerdictBadge";
import { WriteButton } from "@/components/dao/WriteButton";
import { useDao } from "@/lib/hooks/useDao";
import { useEvaluation, useOnchainProposals } from "@/lib/hooks/useEvaluator";
import { fetchSnapshotProposal, type SnapshotProposal } from "@/lib/snapshot/hub";

function EvaluateInner() {
  const { addresses, evaluator } = useDao();
  const searchParams = useSearchParams();
  const [space, setSpace] = useState("1inch.eth");
  const [charter, setCharter] = useState(
    "Fund public goods. No spam. Treasury-safe proposals only."
  );
  const [rubric, setRubric] = useState(
    "Approve clear, aligned, feasible proposals. Reject spam."
  );
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [proposalIdInput, setProposalIdInput] = useState("");
  const [deepLinkError, setDeepLinkError] = useState("");

  const evaluation = useEvaluation(evaluator, proposal?.id ?? null);
  const onchain = useOnchainProposals(evaluator, space.trim());

  // Deep link: /evaluate?space=yam.eth&proposal=<snapshot-id> loads any
  // proposal (including closed ones) as the badge target. This is the
  // shareable evaluation URL spaces link from the proposal body until a
  // native Snapshot plugin exists (see docs/snapshot-integration.md).
  useEffect(() => {
    const id = searchParams.get("proposal");
    const spaceParam = searchParams.get("space");
    if (!id) return;
    if (spaceParam) {
      setSpace(spaceParam);
    }
    setProposalIdInput(id);
    fetchSnapshotProposal(id)
      .then((p) => {
        setProposal(p);
        setDeepLinkError("");
      })
      .catch(() => setDeepLinkError(`Could not load proposal ${id} from Hub.`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evaluate proposals</h1>
        <p className="text-sm text-muted-foreground">
          Score Snapshot proposals against the space charter via LLM consensus.
        </p>
      </div>

      <section className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">1. Space charter</h2>
        <div className="space-y-2">
          <Label htmlFor="ev-space">Space</Label>
          <Input id="ev-space" value={space} onChange={(e) => setSpace(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-charter">Charter</Label>
          <Input id="ev-charter" value={charter} onChange={(e) => setCharter(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-rubric">Rubric</Label>
          <Input id="ev-rubric" value={rubric} onChange={(e) => setRubric(e.target.value)} />
        </div>
        <WriteButton
          label="Set charter (owner)"
          disabled={!addresses.ok || !space || !charter}
          invalidate={[["evaluator"]]}
          onWrite={() => evaluator!.setCharter(space.trim(), charter, rubric)}
            track={(hash) => evaluator!.track(hash)}
        />
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">2. Pick a proposal</h2>
        {deepLinkError && (
          <p className="text-sm text-red-400">{deepLinkError}</p>
        )}
        <ProposalPicker onSelect={setProposal} space={space} onSpaceChange={setSpace} />
        {proposal && (
          <WriteButton
            label="Ingest proposal"
            disabled={!addresses.ok}
            invalidate={[["evaluator"]]}
            onWrite={() => evaluator!.ingestProposal(proposal.space.id, proposal)}
            track={(hash) => evaluator!.track(hash)}
          />
        )}
        <div className="space-y-2">
          <Label htmlFor="ev-proposal-id">
            Or ingest directly by Snapshot proposal ID (also reaches closed
            proposals)
          </Label>
          <div className="flex gap-2">
            <Input
              id="ev-proposal-id"
              value={proposalIdInput}
              onChange={(e) => setProposalIdInput(e.target.value)}
              placeholder="0x…"
            />
            <WriteButton
              label="Ingest by ID"
              disabled={!addresses.ok || !proposalIdInput.trim()}
              invalidate={[["evaluator"]]}
              onWrite={() =>
                evaluator!.ingestSnapshotProposal(
                  space.trim(),
                  proposalIdInput.trim()
                )
              }
              track={(hash) => evaluator!.track(hash)}
            />
          </div>
        </div>
      </section>

      {proposal && (
        <section className="glass-card p-6 space-y-4">
          <h2 className="font-semibold">3. Evaluate</h2>
          <WriteButton
            label="Evaluate (LLM consensus)"
            pendingLabel="Evaluating — takes minutes…"
            disabled={!addresses.ok}
            invalidate={[["evaluator", "evaluation", proposal.id]]}
            onWrite={() => evaluator!.evaluateProposal(proposal.id)}
            track={(hash) => evaluator!.track(hash)}
          />
          {evaluation.data && (
            <div className="rounded-md border border-white/10 p-4 space-y-2 text-sm">
              <VerdictBadge
                verdict={evaluation.data.verdict}
                isSpam={evaluation.data.is_spam}
              />
              <p>
                Clarity {evaluation.data.clarity} · Alignment{" "}
                {evaluation.data.alignment} · Feasibility{" "}
                {evaluation.data.feasibility} · Overall {evaluation.data.overall}
              </p>
              <p className="text-muted-foreground">{evaluation.data.analysis}</p>
            </div>
          )}
          {evaluation.data === null && !evaluation.isLoading && (
            <p className="text-sm text-muted-foreground">
              No evaluation yet — run consensus above.
            </p>
          )}
        </section>
      )}

      <section className="glass-card p-6 space-y-3">
        <h2 className="font-semibold">On-chain in {space || "…"}</h2>
        {onchain.isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {!onchain.isLoading && onchain.rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing ingested for this space yet.
          </p>
        )}
        {onchain.rows.map((row) => (
          <div
            key={row.proposalId}
            className="flex items-center gap-3 rounded-md border border-white/10 p-3 text-sm"
          >
            <span className="font-mono truncate flex-1">{row.proposalId}</span>
            {row.isLoading ? (
              <span className="text-muted-foreground">…</span>
            ) : row.evaluation ? (
              <VerdictBadge
                verdict={row.evaluation.verdict}
                isSpam={row.evaluation.is_spam}
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                ingested · unevaluated
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-6 animate-pulse text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <EvaluateInner />
    </Suspense>
  );
}
