"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/genlayer/wallet";
import { error as toastError, success as toastSuccess } from "@/lib/utils/toast";
import { extractHash, shortHash, txExplorerUrl } from "@/lib/contracts/tx";

type Phase = "idle" | "submitting" | "tracking";

const PHASE_LABEL: Record<Exclude<Phase, "idle">, string> = {
  submitting: "Submitting…",
  tracking: "Awaiting consensus…",
};

/**
 * Write-action button with full tx feedback:
 * idle → submitting → tracking (decided) → confirmed/failed toasts
 * carrying the tx hash + explorer link. Reads refresh only after
 * a confirmed execution.
 */
export function WriteButton({
  label,
  pendingLabel,
  trackingLabel = "Awaiting consensus…",
  successMessage = "Transaction confirmed",
  disabled,
  invalidate,
  onWrite,
  track,
}: {
  label: string;
  pendingLabel?: string;
  trackingLabel?: string;
  successMessage?: string;
  disabled?: boolean;
  invalidate: string[][];
  onWrite: () => Promise<unknown>;
  /** Wait for consensus decision; resolves true only on successful execution. */
  track?: (hash: string) => Promise<boolean>;
}) {
  const { isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [failed, setFailed] = useState("");
  const [lastHash, setLastHash] = useState<string | null>(null);

  const openExplorer = (hash: string) => () =>
    window.open(txExplorerUrl(hash), "_blank", "noopener");

  const run = async () => {
    setPhase("submitting");
    setFailed("");
    setLastHash(null);
    try {
      const result = await onWrite();
      const hash = extractHash(result);

      if (hash && track) {
        setPhase("tracking");
        setLastHash(hash);
        const ok = await track(hash);
        if (!ok) {
          throw new Error(
            `Consensus did not confirm execution (${shortHash(hash)})`
          );
        }
      }

      for (const key of invalidate) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      toastSuccess(hash ? successMessage : "Submitted", {
        description: hash ? shortHash(hash) : undefined,
        action: hash
          ? { label: "View in explorer", onClick: openExplorer(hash) }
          : undefined,
      });
    } catch (err: any) {
      const message = err?.message ?? "Transaction failed";
      setFailed(message);
      toastError("Transaction failed", {
        description: message,
        action:
          lastHash !== null
            ? { label: "View in explorer", onClick: openExplorer(lastHash) }
            : undefined,
      });
    } finally {
      setPhase("idle");
    }
  };

  const busy = phase !== "idle";
  const buttonLabel =
    phase === "submitting"
      ? (pendingLabel ?? PHASE_LABEL.submitting)
      : phase === "tracking"
        ? trackingLabel
        : label;

  return (
    <div className="space-y-2">
      <Button
        variant="gradient"
        onClick={run}
        disabled={disabled || busy || !isConnected}
      >
        {buttonLabel}
      </Button>
      {!isConnected && (
        <p className="text-xs text-muted-foreground">
          Connect your wallet to submit.
        </p>
      )}
      {phase === "tracking" && lastHash && (
        <p className="text-xs text-muted-foreground">
          {shortHash(lastHash)} — track it{" "}
          <a
            className="text-accent hover:underline"
            href={txExplorerUrl(lastHash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            in the explorer
          </a>
          .
        </p>
      )}
      {failed && <p className="text-xs text-red-400">{failed}</p>}
    </div>
  );
}
