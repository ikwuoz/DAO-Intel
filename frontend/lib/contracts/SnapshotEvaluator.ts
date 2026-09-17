import { createClient } from "genlayer-js";
import { submitWrite } from "./fees";
import { GENLAYER_CHAIN } from "../genlayer/client";
import { fetchSnapshotProposal } from "../snapshot/hub";
import { trackToDecided } from "./tx";

export interface ProposalEvaluation {
  proposal_id: string;
  verdict: "APPROVE" | "REJECT" | "NEEDS_REVISION";
  is_spam: boolean;
  clarity: number;
  alignment: number;
  feasibility: number;
  overall: number;
  analysis: string;
}

/**
 * SnapshotProposalEvaluator — frontend wrapper for
 * contracts/snapshot_proposal_evaluator.py
 *
 * Flow: fetch proposal from Snapshot Hub (off-chain) -> ingest_proposal ->
 * evaluate_proposal (GenLayer consensus) -> get_evaluation (badge).
 */
class SnapshotEvaluator {
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

  private async write(
    functionName: string,
    args: unknown[],
    value?: bigint
  ): Promise<unknown> {
    return submitWrite(
      this.client,
      this.contractAddress,
      functionName,
      args,
      value
    );
  }

  private async read(functionName: string, args: unknown[]): Promise<any> {
    return this.client.readContract({
      address: this.contractAddress,
      functionName,
      args,
    });
  }

  async setCharter(spaceId: string, charter: string, rubric: string) {
    return this.write("set_charter", [spaceId, charter, rubric]);
  }

  /** Fetch from Snapshot Hub then ingest deterministically. */
  async ingestSnapshotProposal(spaceId: string, proposalId: string) {
    const proposal = await fetchSnapshotProposal(proposalId);
    return this.ingestProposal(spaceId, proposal);
  }

  /** Ingest an already-fetched Hub proposal (no refetch). */
  async ingestProposal(
    spaceId: string,
    proposal: { id: string; title: string; body?: string; choices?: string[] }
  ) {
    return this.write("ingest_proposal", [
      spaceId,
      proposal.id,
      proposal.title,
      proposal.body ?? "",
      JSON.stringify(proposal.choices ?? []),
    ]);
  }

  async evaluateProposal(proposalId: string) {
    return this.write("evaluate_proposal", [proposalId]);
  }

  async getEvaluation(proposalId: string): Promise<ProposalEvaluation | null> {
    try {
      const raw = await this.read("get_evaluation", [proposalId]);
      const obj = raw instanceof Map ? Object.fromEntries(raw.entries()) : raw;
      return {
        proposal_id: String(obj.proposal_id ?? proposalId),
        verdict: obj.verdict,
        is_spam: Boolean(obj.is_spam),
        clarity: Number(obj.clarity),
        alignment: Number(obj.alignment),
        feasibility: Number(obj.feasibility),
        overall: Number(obj.overall),
        analysis: String(obj.analysis ?? ""),
      };
    } catch {
      return null;
    }
  }

  async getSpaceProposals(spaceId: string): Promise<string[]> {
    const raw = await this.read("get_space_proposals", [spaceId]);
    return Array.isArray(raw) ? raw.map(String) : [];
  }
  /** Wait for consensus decision on a write; true only on successful execution. */
  async track(hash: string): Promise<boolean> {
    return trackToDecided(this.client, hash);
  }

}

export default SnapshotEvaluator;
