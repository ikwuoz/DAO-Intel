/**
 * Fee-aware writes for the v0.6 fee model.
 *
 * Studio Next is fee-charging: every write must carry a `FeesDistribution`
 * and a non-zero fee value, or the node reverts with FeeValueMustBeNonZero.
 * Per the migration guide, estimate per concrete call and submit the
 * returned distribution/feeValue unchanged — including messageAllocations
 * for message-emitting branches (e.g. release_spend), which otherwise
 * finalize-but-never-execute.
 */

export interface WriteFees {
  distribution: unknown;
  feeValue: unknown;
  messageAllocations?: unknown;
}

export async function estimateWriteFees(
  client: any,
  address: `0x${string}`,
  functionName: string,
  args: unknown[],
  value?: bigint
): Promise<WriteFees> {
  const estimate = await client.estimateTransactionFeesForWrite({
    address,
    functionName,
    args,
    ...(value !== undefined ? { value } : {}),
  });
  const fees: WriteFees = {
    distribution: estimate.distribution,
    feeValue: estimate.feeValue,
  };
  const allocs =
    estimate.messageAllocations ?? estimate.message_allocations;
  if (allocs && (Array.isArray(allocs) ? allocs.length > 0 : true)) {
    fees.messageAllocations = allocs;
  }
  return fees;
}

/** Estimate fees for the call, then submit with them attached. */
export async function submitWrite(
  client: any,
  address: `0x${string}`,
  functionName: string,
  args: unknown[],
  value?: bigint
): Promise<unknown> {
  const fees = await estimateWriteFees(client, address, functionName, args, value);
  return client.writeContract({
    address,
    functionName,
    args,
    ...(value !== undefined ? { value } : {}),
    fees,
  });
}
