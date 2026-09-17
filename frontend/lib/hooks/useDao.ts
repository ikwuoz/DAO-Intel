"use client";

import { useMemo } from "react";
import { useWallet } from "@/lib/genlayer/wallet";
import { getDaoAddresses } from "@/lib/contracts/addresses";
import SnapshotEvaluator from "@/lib/contracts/SnapshotEvaluator";
import VotingDelegate from "@/lib/contracts/VotingDelegate";
import TreasuryGuard from "@/lib/contracts/TreasuryGuard";

/**
 * Shared DAO stack wiring: resolves the three contract addresses once
 * and memoizes one wrapper instance per contract, re-bound on wallet
 * account change.
 */
export function useDao() {
  const { address } = useWallet();

  const addresses = useMemo(() => {
    try {
      return { ok: true as const, value: getDaoAddresses() };
    } catch (err: any) {
      return { ok: false as const, error: err.message as string };
    }
  }, []);

  const evaluator = useMemo(
    () =>
      addresses.ok ? new SnapshotEvaluator(addresses.value.evaluator, address) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addresses.ok, address]
  );
  const delegate = useMemo(
    () =>
      addresses.ok ? new VotingDelegate(addresses.value.delegate, address) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addresses.ok, address]
  );
  const guard = useMemo(
    () =>
      addresses.ok ? new TreasuryGuard(addresses.value.guard, address) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addresses.ok, address]
  );

  return { addresses, evaluator, delegate, guard, walletAddress: address };
}
