"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProposalPicker } from "@/components/dao/ProposalPicker";
import { WriteButton } from "@/components/dao/WriteButton";
import { useDao } from "@/lib/hooks/useDao";
import { useRecommendation } from "@/lib/hooks/useDelegate";
import type { SnapshotProposal } from "@/lib/snapshot/hub";
import { snapshotProposalUrl } from "@/lib/snapshot/hub";

export default function DelegatePage() {
  const { addresses, delegate, evaluator, walletAddress } = useDao();
  const [policy, setPolicy] = useState(
    "Follow evaluator when overall>=70, else abstain. Never vote For on spam."
  );
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [delegateSpace, setDelegateSpace] = useState("1inch.eth");

  const recommendation = useRecommendation(
    delegate,
    proposal?.id ?? null,
    walletAddress
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voting delegate</h1>
        <p className="text-sm text-muted-foreground">
          Store a public voting policy, get verifiable recommendations. The
          real Snapshot vote is still cast with your own key.
        </p>
      </div>

      <section className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">1. Your voting policy</h2>
        <div className="space-y-2">
          <Label htmlFor="del-policy">Policy (public, on-chain)</Label>
          <Input
            id="del-policy"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
          />
        </div>
        <WriteButton
          label="Set policy"
          disabled={!addresses.ok || !policy}
          invalidate={[["delegate"]]}
          onWrite={() => delegate!.setPolicy(policy)}
            track={(hash) => delegate!.track(hash)}
        />
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">2. Recommend a vote</h2>
        <ProposalPicker onSelect={setProposal} space={delegateSpace} onSpaceChange={setDelegateSpace} />
        {proposal && (
          <WriteButton
            label="Recommend (reads Phase-1 evaluation)"
            pendingLabel="Recommending — takes minutes…"
            disabled={!addresses.ok || !delegate || !evaluator}
            invalidate={[
              ["delegate", "recommendation", proposal.id, walletAddress ?? ""],
            ]}
            onWrite={() =>
              delegate!.recommendWithEvaluation(proposal.id, evaluator!)
            }
            track={(hash) => delegate!.track(hash)}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Recommendation chains the Snapshot proposal and its Phase-1
          evaluation into consensus. See VotingDelegate wrapper.
        </p>
      </section>

      {proposal && recommendation.data && (
        <section className="glass-card p-6 space-y-2 text-sm">
          <h2 className="font-semibold">Recommendation</h2>
          <p>
            Vote <strong>{recommendation.data.choice_label}</strong> with
            confidence {recommendation.data.confidence}
          </p>
          <p className="text-muted-foreground">
            {recommendation.data.reasoning}
          </p>
          <a
            className="text-accent hover:underline text-xs"
            href={snapshotProposalUrl(proposal)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cast the real vote on Snapshot →
          </a>
        </section>
      )}
    </div>
  );
}
