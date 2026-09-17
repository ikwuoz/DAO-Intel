import { isSuccessful } from "genlayer-js";
import { GENLAYER_EXPLORER_URL } from "../genlayer/network";

/** Explorer URL for a transaction hash. */
export function txExplorerUrl(hash: string): string {
  return `${GENLAYER_EXPLORER_URL.replace(/\/$/, "")}/transactions/${hash}`;
}

export function shortHash(hash: string): string {
  if (!hash || hash.length < 16) return hash ?? "";
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/**
 * Wait until consensus decides the tx, then report contract-execution
 * success (status ACCEPTED/FINALIZED *and* FINISHED_WITH_RETURN).
 */
export async function trackToDecided(
  client: any,
  hash: string,
  opts: { interval?: number; retries?: number } = {}
): Promise<boolean> {
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      waitUntil: "decided",
      interval: opts.interval ?? 5000,
      retries: opts.retries ?? 60,
    });
    return isSuccessful(receipt);
  } catch {
    return false;
  }
}

/** Extract a tx hash from the various writeContract return shapes. */
export function extractHash(result: unknown): string | null {
  if (typeof result === "string" && result.startsWith("0x")) return result;
  if (result !== null && typeof result === "object") {
    const hash = (result as Record<string, unknown>).hash;
    if (typeof hash === "string" && hash.startsWith("0x")) return hash;
  }
  return null;
}
