"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import type SnapshotEvaluator from "@/lib/contracts/SnapshotEvaluator";
import type { ProposalEvaluation } from "@/lib/contracts/types";

export const DEFAULT_SPACE = "yam.eth";

export function useSpaceProposals(
  evaluator: SnapshotEvaluator | null,
  spaceId: string
) {
  return useQuery({
    queryKey: ["evaluator", "space-proposals", spaceId],
    queryFn: () => evaluator!.getSpaceProposals(spaceId),
    enabled: !!evaluator && !!spaceId,
  });
}

/** On-chain ingested proposals + their evaluation status (null = pending). */
export function useOnchainProposals(
  evaluator: SnapshotEvaluator | null,
  spaceId: string
) {
  const ids = useSpaceProposals(evaluator, spaceId);
  const evaluations = useQueries({
    queries: (ids.data ?? []).map((proposalId) => ({
      queryKey: ["evaluator", "evaluation", proposalId],
      queryFn: () => evaluator!.getEvaluation(proposalId),
      enabled: !!evaluator,
    })),
  });
  return {
    ids: ids.data ?? [],
    isLoading: ids.isLoading,
    rows: (ids.data ?? []).map((proposalId, i) => ({
      proposalId,
      evaluation: evaluations[i]?.data ?? null,
      isLoading: evaluations[i]?.isLoading ?? false,
    })),
  };
}

export function useEvaluation(
  evaluator: SnapshotEvaluator | null,
  proposalId: string | null
) {
  return useQuery<ProposalEvaluation | null>({
    queryKey: ["evaluator", "evaluation", proposalId],
    queryFn: () => evaluator!.getEvaluation(proposalId!),
    enabled: !!evaluator && !!proposalId,
  });
}
