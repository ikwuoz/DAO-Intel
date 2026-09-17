/**
 * TypeScript types for the Snapshot DAO stack contracts
 */

export type ProposalVerdict = "APPROVE" | "REJECT" | "NEEDS_REVISION";

export interface ProposalEvaluation {
  proposal_id: string;
  verdict: ProposalVerdict;
  is_spam: boolean;
  clarity: number;
  alignment: number;
  feasibility: number;
  overall: number;
  analysis: string;
}

export interface VoteRecommendation {
  proposal_id: string;
  choice_index: number;
  choice_label: string;
  confidence: number;
  reasoning: string;
}

export type SpendStatus = "PENDING" | "RELEASED" | "CANCELLED";

export interface Spend {
  spend_id: string;
  space_id: string;
  proposal_id: string;
  beneficiary: string;
  amount: number;
  milestone: string;
  status: SpendStatus;
  proposer: string;
  evaluator_verdict: ProposalVerdict;
  evaluator_overall: number;
}

export interface TreasuryState {
  total_deposited: number;
  total_released: number;
  available: number;
  min_overall: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}
