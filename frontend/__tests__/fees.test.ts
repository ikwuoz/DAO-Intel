import { describe, expect, it, vi } from "vitest";
import { estimateWriteFees, submitWrite } from "../lib/contracts/fees";

const ADDRESS = "0x1234567890123456789012345678901234567890" as `0x${string}`;

function mockClient(estimate: Record<string, unknown>) {
  return {
    estimateTransactionFeesForWrite: vi.fn(async () => estimate),
    writeContract: vi.fn(async (args: unknown) => ({ hash: "0xabc", args })),
  };
}

describe("submitWrite", () => {
  it("attaches estimated distribution and fee value", async () => {
    const client = mockClient({
      distribution: { leaderTimeunitsAllocation: 250 },
      feeValue: 12345n,
    });
    await submitWrite(client, ADDRESS, "set_charter", ["yam.eth"]);
    expect(client.estimateTransactionFeesForWrite).toHaveBeenCalledWith({
      address: ADDRESS,
      functionName: "set_charter",
      args: ["yam.eth"],
    });
    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        fees: { distribution: { leaderTimeunitsAllocation: 250 }, feeValue: 12345n },
      })
    );
  });

  it("forwards message allocations for emitting branches", async () => {
    const allocs = [{ messageType: 1 }];
    const client = mockClient({
      distribution: {},
      feeValue: 1n,
      messageAllocations: allocs,
    });
    await submitWrite(client, ADDRESS, "release_spend", ["s1"]);
    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        fees: expect.objectContaining({ messageAllocations: allocs }),
      })
    );
  });

  it("omits allocations when the simulation observes none", async () => {
    const client = mockClient({ distribution: {}, feeValue: 1n });
    await submitWrite(client, ADDRESS, "set_policy", ["x"]);
    const fees = (
      client.writeContract.mock.calls[0][0] as { fees: Record<string, unknown> }
    ).fees;
    expect("messageAllocations" in fees).toBe(false);
  });

  it("passes value through to estimate and submit", async () => {
    const client = mockClient({ distribution: {}, feeValue: 1n });
    await submitWrite(client, ADDRESS, "deposit", [], 1000n);
    expect(client.estimateTransactionFeesForWrite).toHaveBeenCalledWith(
      expect.objectContaining({ value: 1000n })
    );
    expect(client.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({ value: 1000n })
    );
  });
});

describe("estimateWriteFees", () => {
  it("propagates estimation failures instead of submitting zero-fee", async () => {
    const client = {
      estimateTransactionFeesForWrite: vi.fn(async () => {
        throw new Error("simulation failed");
      }),
      writeContract: vi.fn(),
    };
    await expect(
      submitWrite(client, ADDRESS, "set_charter", ["x"])
    ).rejects.toThrow("simulation failed");
    expect(client.writeContract).not.toHaveBeenCalled();
  });
});


