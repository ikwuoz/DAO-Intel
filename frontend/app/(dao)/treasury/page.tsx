"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProposalPicker } from "@/components/dao/ProposalPicker";
import { WriteButton } from "@/components/dao/WriteButton";
import { AmountInput } from "@/components/dao/AmountInput";
import { useDao } from "@/lib/hooks/useDao";
import { DEFAULT_SPACE } from "@/lib/hooks/useEvaluator";
import {
  useGuardRoles,
  useSpaceSpends,
  useSpends,
  useTreasury,
} from "@/lib/hooks/useTreasury";
import type { SnapshotProposal } from "@/lib/snapshot/hub";

function isAuthorized(
  wallet: string | null,
  owner: string | null | undefined,
  arbiter: string | null | undefined
) {
  if (!wallet) return false;
  const w = wallet.toLowerCase();
  return (
    (typeof owner === "string" && owner.toLowerCase() === w) ||
    (typeof arbiter === "string" && arbiter.toLowerCase() === w)
  );
}

export default function TreasuryPage() {
  const { addresses, guard, evaluator, walletAddress } = useDao();
  const [space, setSpace] = useState(DEFAULT_SPACE);
  const [depositWei, setDepositWei] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [spendId, setSpendId] = useState("s1");
  const [beneficiary, setBeneficiary] = useState("");
  const [amountWei, setAmountWei] = useState("");
  const [milestone, setMilestone] = useState("Milestone 1");
  const [justification, setJustification] = useState("");

  const treasury = useTreasury(guard);
  const roles = useGuardRoles(guard);
  const spendIds = useSpaceSpends(guard, space);
  const spends = useSpends(guard, spendIds.data ?? []);

  const authorized = isAuthorized(
    walletAddress,
    roles.owner.data,
    roles.arbiter.data
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treasury guard</h1>
        <p className="text-sm text-muted-foreground">
          Fund the treasury; spends need an APPROVE evaluation to release.
        </p>
      </div>

      <section className="glass-card p-6 space-y-3 text-sm">
        <h2 className="font-semibold">Treasury</h2>
        {treasury.data ? (
          <p>
            Deposited {treasury.data.total_deposited} · Released{" "}
            {treasury.data.total_released} · Available{" "}
            <strong>{treasury.data.available}</strong> · Threshold{" "}
            {treasury.data.min_overall}
          </p>
        ) : (
          <p className="text-muted-foreground">Loading…</p>
        )}
        <div className="space-y-2">
          <Label htmlFor="tr-space">Space</Label>
          <Input
            id="tr-space"
            value={space}
            onChange={(e) => setSpace(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <AmountInput
            id="tr-deposit"
            label="Deposit"
            valueWei={depositWei}
            onChange={setDepositWei}
          />
          <WriteButton
            label="Deposit"
            disabled={!addresses.ok || !depositWei}
            invalidate={[["guard", "treasury"]]}
            onWrite={() => guard!.deposit(BigInt(depositWei))}
            track={(hash) => guard!.track(hash)}
          />
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="tr-arbiter">Backup arbiter (owner only)</Label>
            <Input
              id="tr-arbiter"
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
              placeholder="0x…"
            />
          </div>
          <WriteButton
            label="Set arbiter"
            disabled={!addresses.ok || !arbiter}
            invalidate={[["guard", "arbiter"]]}
            onWrite={() => guard!.setArbiter(arbiter.trim())}
            track={(hash) => guard!.track(hash)}
          />
        </div>
        {!authorized && walletAddress && (
          <p className="text-xs text-muted-foreground">
            Release/cancel and manual spends need the owner or arbiter key.
          </p>
        )}
      </section>

      <section className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">Propose a spend</h2>
        <ProposalPicker onSelect={setProposal} space={space} onSpaceChange={setSpace} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tr-spend-id">Spend ID</Label>
            <Input
              id="tr-spend-id"
              value={spendId}
              onChange={(e) => setSpendId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tr-beneficiary">Beneficiary</Label>
            <Input
              id="tr-beneficiary"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x…"
            />
          </div>
          <AmountInput
            id="tr-amount"
            label="Amount"
            valueWei={amountWei}
            onChange={setAmountWei}
          />
          <div className="space-y-2">
            <Label htmlFor="tr-milestone">Milestone</Label>
            <Input
              id="tr-milestone"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
            />
          </div>
        </div>
        {proposal && (
          <WriteButton
            label="Create spend (APPROVE-gated)"
            disabled={!addresses.ok || !evaluator || !beneficiary || !amountWei}
            invalidate={[
              ["guard", "space-spends", proposal.space.id],
              ["guard", "treasury"],
            ]}
            onWrite={() =>
              guard!.createSpendWithEvaluation(
                spendId.trim(),
                proposal.space.id,
                proposal.id,
                beneficiary.trim(),
                BigInt(amountWei),
                milestone,
                evaluator!
              )
            }
            track={(hash) => guard!.track(hash)}
          />
        )}
        <div className="space-y-2">
          <Label htmlFor="tr-justification">
            Manual override justification (owner/arbiter)
          </Label>
          <Input
            id="tr-justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Why bypass the evaluation gate…"
          />
        </div>
        {proposal && (
          <WriteButton
            label="Create manual spend"
            disabled={!addresses.ok || !authorized || !beneficiary || !justification || !amountWei}
            invalidate={[
              ["guard", "space-spends", proposal.space.id],
              ["guard", "treasury"],
            ]}
            onWrite={() =>
              guard!.createSpendManual(
                spendId.trim(),
                proposal.space.id,
                proposal.id,
                beneficiary.trim(),
                BigInt(amountWei),
                justification
              )
            }
            track={(hash) => guard!.track(hash)}
          />
        )}
      </section>

      <section className="glass-card p-6 space-y-3">
        <h2 className="font-semibold">Spends in {space}</h2>
        {(spendIds.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No spends yet.</p>
        )}
        {spends.map((q, i) => {
          const spend = q.data;
          if (!spend) return null;
          const id = (spendIds.data ?? [])[i];
          return (
            <div
              key={id}
              className="rounded-md border border-white/10 p-3 text-sm space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{spend.spend_id}</span>
                <Badge variant="outline">{spend.status}</Badge>
                <Badge variant="outline">{spend.evaluator_verdict}</Badge>
              </div>
              <p className="text-muted-foreground">
                {spend.amount} wei → {spend.beneficiary} · {spend.milestone}
              </p>
              {spend.status === "PENDING" && (
                <div className="flex gap-2 pt-1">
                  <WriteButton
                    label="Release"
                    disabled={!addresses.ok || !authorized}
                    invalidate={[
                      ["guard", "spend", id],
                      ["guard", "treasury"],
                    ]}
                    onWrite={() => guard!.releaseSpend(id)}
            track={(hash) => guard!.track(hash)}
                  />
                  <WriteButton
                    label="Cancel"
                    disabled={!addresses.ok || !authorized}
                    invalidate={[["guard", "spend", id]]}
                    onWrite={() => guard!.cancelSpend(id)}
            track={(hash) => guard!.track(hash)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
