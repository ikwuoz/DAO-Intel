"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import type TreasuryGuard from "@/lib/contracts/TreasuryGuard";
import type { Spend, TreasuryState } from "@/lib/contracts/types";

export function useTreasury(guard: TreasuryGuard | null) {
  return useQuery<TreasuryState | null>({
    queryKey: ["guard", "treasury"],
    queryFn: () => guard!.getTreasury(),
    enabled: !!guard,
  });
}

export function useSpaceSpends(guard: TreasuryGuard | null, spaceId: string) {
  return useQuery<string[]>({
    queryKey: ["guard", "space-spends", spaceId],
    queryFn: () => guard!.getSpaceSpends(spaceId),
    enabled: !!guard && !!spaceId,
  });
}

export function useSpends(guard: TreasuryGuard | null, spendIds: string[]) {
  return useQueries({
    queries: spendIds.map((spendId) => ({
      queryKey: ["guard", "spend", spendId],
      queryFn: () => guard!.getSpend(spendId),
      enabled: !!guard,
    })),
  });
}

export function useGuardRoles(guard: TreasuryGuard | null) {
  const owner = useQuery({
    queryKey: ["guard", "owner"],
    queryFn: () => guard!.getOwner(),
    enabled: !!guard,
  });
  const arbiter = useQuery({
    queryKey: ["guard", "arbiter"],
    queryFn: () => guard!.getArbiter(),
    enabled: !!guard,
  });
  return { owner, arbiter };
}

export type { Spend };
