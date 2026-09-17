"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchActiveSpaceProposals,
  type SnapshotProposal,
} from "@/lib/snapshot/hub";
import { DEFAULT_SPACE } from "@/lib/hooks/useEvaluator";

/**
 * Shared starting point for all DAO flows: pick a space, load its live
 * Snapshot proposals, select one. The selected proposal's stable fields
 * are exactly what the contracts ingest deterministically.
 */
export function ProposalPicker({
  onSelect,
  defaultSpace = DEFAULT_SPACE,
  space: controlledSpace,
  onSpaceChange,
}: {
  onSelect: (proposal: SnapshotProposal | null) => void;
  defaultSpace?: string;
  /** Controlled mode: single source of truth shared with the page. */
  space?: string;
  onSpaceChange?: (space: string) => void;
}) {
  const [internalSpace, setInternalSpace] = useState(
    controlledSpace ?? defaultSpace
  );
  const [appliedSpace, setAppliedSpace] = useState(
    controlledSpace ?? defaultSpace
  );
  const [selectedId, setSelectedId] = useState<string>("");

  const space = controlledSpace ?? internalSpace;
  const setSpace = (next: string) => {
    setInternalSpace(next);
    onSpaceChange?.(next);
  };

  // Follow external changes in controlled mode (one shared space input).
  useEffect(() => {
    if (controlledSpace !== undefined) {
      setAppliedSpace(controlledSpace);
      setSelectedId("");
      onSelect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledSpace]);

  const proposalsQuery = useQuery({
    queryKey: ["snapshot", "active-proposals", appliedSpace],
    queryFn: () => fetchActiveSpaceProposals(appliedSpace),
    enabled: !!appliedSpace,
  });

  const proposals = proposalsQuery.data ?? [];
  const selected =
    proposals.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dao-space">Snapshot space</Label>
        <div className="flex gap-2">
          <Input
            id="dao-space"
            value={space}
            onChange={(e) => setSpace(e.target.value)}
            placeholder="yam.eth"
          />
          <Button
            variant="secondary"
            onClick={() => {
              setAppliedSpace(space.trim());
              setSelectedId("");
              onSelect(null);
            }}
          >
            Load
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dao-proposal">Proposal</Label>
        {proposalsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading proposals…</p>
        )}
        {proposalsQuery.isError && (
          <p className="text-sm text-red-400">
            Could not load proposals for {appliedSpace}. Check the space name.
          </p>
        )}
        {proposalsQuery.data && proposals.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active proposals in {appliedSpace}.
          </p>
        )}
        {proposals.length > 0 && (
          <select
            id="dao-proposal"
            className="w-full rounded-md border border-white/10 bg-card px-3 py-2 text-sm"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              onSelect(
                proposals.find((p) => p.id === e.target.value) ?? null
              );
            }}
          >
            <option value="">Select a proposal…</option>
            {proposals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {selected && (
        <div className="rounded-md border border-white/10 p-3 text-sm space-y-1">
          <p className="font-semibold">{selected.title}</p>
          <p className="text-muted-foreground line-clamp-3">{selected.body}</p>
          <p className="text-xs text-muted-foreground">
            Choices: {selected.choices.join(" / ")} · State: {selected.state}
          </p>
        </div>
      )}
    </div>
  );
}
