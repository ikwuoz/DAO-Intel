import { createClient } from "genlayer-js";
import { submitWrite } from "./fees";
import { GENLAYER_CHAIN } from "../genlayer/client";
import type SnapshotEvaluator from "./SnapshotEvaluator";
import { trackToDecided } from "./tx";

export interface Spend {
  spend_id: string;
  space_id: string;
  proposal_id: string;
  beneficiary: string;
  amount: number;
  milestone: string;
  status: "PENDING" | "RELEASED" | "CANCELLED";
  proposer: string;
  evaluator_verdict: string;
  evaluator_overall: number;
}

/**
 * SnapshotTreasuryGuard — frontend wrapper for
 * contracts/snapshot_treasury_guard.py
 *
 * Flow: deposit GEN -> create_spend (gated on Phase-1 APPROVE in calldata)
 * -> owner release_spend (plain GEN transfer; Safe addresses supported).
 */
class TreasuryGuard {
  private contractAddress: `0x${string}`;
  private client: any;


  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = { chain: GENLAYER_CHAIN };
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({
      chain: GENLAYER_CHAIN,
      account: address as `0x${string}`,
    });
  }

  async deposit(valueWei: bigint) {
    return submitWrite(this.client, this.contractAddress, "deposit", [], valueWei);
  }

  /**
   * Read Phase-1 evaluation then propose a spend. RevertsUnless
   * verdict is APPROVE, not spam, and overall meets the guard threshold.
   */
  async createSpendWithEvaluation(
    spendId: string,
    spaceId: string,
    proposalId: string,
    beneficiary: string,
    amountWei: bigint,
    milestone: string,
    evaluator: SnapshotEvaluator
  ) {
    const evaluation = await evaluator.getEvaluation(proposalId);
    if (!evaluation)
      throw new Error(
        `No Phase-1 evaluation for ${proposalId} on this evaluator — ` +
          `ingest and evaluate it first (same space), then retry`
      );
    if (evaluation.verdict !== "APPROVE" || evaluation.is_spam) {
      throw new Error(
        `Proposal not spendable (verdict ${evaluation.verdict}, ` +
          `spam=${evaluation.is_spam}) — requires APPROVE and not spam`
      );
    }
    // Pre-check the deterministic gates so failures name the cause instead
    // of surfacing the node's generic execution error from estimation.
    const treasury = await this.getTreasury();
    const amount = BigInt(amountWei.toString());
    if (treasury) {
      if (evaluation.overall < treasury.min_overall) {
        throw new Error(
          `Evaluation overall ${evaluation.overall} below threshold ${treasury.min_overall}`
        );
      }
      if (amount > BigInt(treasury.available)) {
        throw new Error(
          `Insufficient treasury funds: available ${treasury.available} wei, requested ${amount} wei`
        );
      }
    }
    return submitWrite(this.client, this.contractAddress, "create_spend", [
      spendId,
      spaceId,
      proposalId,
      beneficiary,
      amountWei.toString(),
      milestone,
      evaluation.verdict,
      evaluation.overall,
      evaluation.is_spam,
    ]);
  }

  async releaseSpend(spendId: string) {
    return submitWrite(this.client, this.contractAddress, "release_spend", [spendId]);
  }

  async setArbiter(arbiter: string) {
    return submitWrite(this.client, this.contractAddress, "set_arbiter", [arbiter]);
  }

  /**
   * Owner/arbiter override: creates a spend bypassing the evaluation gate.
   * Stored with MANUAL verdict; milestone must document the justification.
   */
  async createSpendManual(
    spendId: string,
    spaceId: string,
    proposalId: string,
    beneficiary: string,
    amountWei: bigint,
    justification: string
  ) {
    return submitWrite(this.client, this.contractAddress, "create_spend_manual", [spendId, spaceId, proposalId, beneficiary, amountWei.toString(), justification]);
  }

  async cancelSpend(spendId: string) {
    return submitWrite(this.client, this.contractAddress, "cancel_spend", [spendId]);
  }

  async getSpend(spendId: string): Promise<Spend | null> {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_spend",
        args: [spendId],
      });
      const obj = raw instanceof Map ? Object.fromEntries(raw.entries()) : raw;
      return {
        spend_id: String(obj.spend_id ?? spendId),
        space_id: String(obj.space_id ?? ""),
        proposal_id: String(obj.proposal_id ?? ""),
        beneficiary: String(obj.beneficiary ?? ""),
        amount: Number(obj.amount),
        milestone: String(obj.milestone ?? ""),
        status: obj.status,
        proposer: String(obj.proposer ?? ""),
        evaluator_verdict: String(obj.evaluator_verdict ?? ""),
        evaluator_overall: Number(obj.evaluator_overall),
      };
    } catch {
      return null;
    }
  }

  async getTreasury(): Promise<{
    total_deposited: number;
    total_released: number;
    available: number;
    min_overall: number;
  } | null> {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_treasury",
        args: [],
      });
      const obj = raw instanceof Map ? Object.fromEntries(raw.entries()) : raw;
      return {
        total_deposited: Number(obj.total_deposited),
        total_released: Number(obj.total_released),
        available: Number(obj.available),
        min_overall: Number(obj.min_overall),
      };
    } catch {
      return null;
    }
  }

  async getSpaceSpends(spaceId: string): Promise<string[]> {
    const raw = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_space_spends",
      args: [spaceId],
    });
    return Array.isArray(raw) ? raw.map(String) : [];
  }

  async getOwner(): Promise<string | null> {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_owner",
        args: [],
      });
      return String(raw ?? "");
    } catch {
      return null;
    }
  }

  async getArbiter(): Promise<string | null> {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_arbiter",
        args: [],
      });
      return String(raw ?? "");
    } catch {
      return null;
    }
  }
  /** Wait for consensus decision on a write; true only on successful execution. */
  async track(hash: string): Promise<boolean> {
    return trackToDecided(this.client, hash);
  }

}

export default TreasuryGuard;
