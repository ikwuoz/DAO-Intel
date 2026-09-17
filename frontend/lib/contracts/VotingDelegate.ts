import { createClient } from "genlayer-js";
import { submitWrite } from "./fees";
import { GENLAYER_CHAIN } from "../genlayer/client";
import { fetchSnapshotProposal } from "../snapshot/hub";
import type SnapshotEvaluator from "./SnapshotEvaluator";
import { trackToDecided } from "./tx";

export interface VoteRecommendation {
  proposal_id: string;
  choice_index: number;
  choice_label: string;
  confidence: number;
  reasoning: string;
}

/**
 * SnapshotVotingDelegate — frontend wrapper for
 * contracts/snapshot_voting_delegate.py
 *
 * Custodial flow: recommendation is advisory on-chain. The actual Snapshot
 * vote is cast off-chain with the member's own key only after confirm.
 */
class VotingDelegate {
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

  async setPolicy(policy: string) {
    return submitWrite(this.client, this.contractAddress, "set_policy", [policy]);
  }

  /**
   * Fetch proposal + Phase-1 evaluation, then request an on-chain
   * recommendation. All inputs are deterministic calldata.
   */
  async recommendWithEvaluation(
    proposalId: string,
    evaluator: SnapshotEvaluator
  ) {
    const proposal = await fetchSnapshotProposal(proposalId);
    const evaluation = await evaluator.getEvaluation(proposalId);
    if (!evaluation)
      throw new Error(
        `No Phase-1 evaluation for ${proposalId} on this evaluator — ` +
          `check the evaluator address and that evaluate_proposal finalized`
      );
    return submitWrite(this.client, this.contractAddress, "recommend", [
      proposal.id,
      proposal.title,
      proposal.body ?? "",
      JSON.stringify(proposal.choices ?? []),
      evaluation.verdict,
      evaluation.overall,
      evaluation.is_spam,
    ]);
  }

  async getRecommendation(
    proposalId: string,
    member: string
  ): Promise<VoteRecommendation | null> {
    try {
      const raw = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_recommendation",
        args: [proposalId, member],
      });
      const obj = raw instanceof Map ? Object.fromEntries(raw.entries()) : raw;
      return {
        proposal_id: String(obj.proposal_id ?? proposalId),
        choice_index: Number(obj.choice_index),
        choice_label: String(obj.choice_label),
        confidence: Number(obj.confidence),
        reasoning: String(obj.reasoning ?? ""),
      };
    } catch {
      return null;
    }
  }
  /** Wait for consensus decision on a write; true only on successful execution. */
  async track(hash: string): Promise<boolean> {
    return trackToDecided(this.client, hash);
  }

}

export default VotingDelegate;
