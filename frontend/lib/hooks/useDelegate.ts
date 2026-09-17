"use client";

import { useQuery } from "@tanstack/react-query";
import type VotingDelegate from "@/lib/contracts/VotingDelegate";
import type { VoteRecommendation } from "@/lib/contracts/types";

export function useRecommendation(
  delegate: VotingDelegate | null,
  proposalId: string | null,
  member: string | null
) {
  return useQuery<VoteRecommendation | null>({
    queryKey: ["delegate", "recommendation", proposalId, member],
    queryFn: () => delegate!.getRecommendation(proposalId!, member!),
    enabled: !!delegate && !!proposalId && !!member,
  });
}
