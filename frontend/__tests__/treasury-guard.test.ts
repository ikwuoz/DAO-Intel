import { describe, expect, it, vi } from "vitest";

vi.mock("genlayer-js", () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock("../lib/contracts/fees", () => ({
  submitWrite: vi.fn(async () => "0xhash"),
}));

import TreasuryGuard from "../lib/contracts/TreasuryGuard";
import { submitWrite } from "../lib/contracts/fees";

const mockedSubmit = vi.mocked(submitWrite);

const EVAL_BASE = {
  proposal_id: "prop-1",
  verdict: "APPROVE" as const,
  is_spam: false,
  clarity: 8,
  alignment: 8,
  feasibility: 8,
  overall: 82,
  analysis: "Solid.",
};

const TREASURY = {
  total_deposited: 1000,
  total_released: 0,
  available: 1000,
  min_overall: 60,
};

function setup(evaluation: unknown, treasury: unknown) {
  const guard = new TreasuryGuard(
    "0x1234567890123456789012345678901234567890"
  );
  guard.getTreasury = async () => treasury as any;
  const evaluator = { getEvaluation: async () => evaluation } as any;
  const call = (
    amount: bigint = 100n,
    beneficiary: string = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  ) =>
    guard.createSpendWithEvaluation(
      "s1", "1inch.eth", "prop-1", beneficiary, amount, "M1", evaluator
    );
  return { guard, call };
}

describe("createSpendWithEvaluation pre-checks", () => {
  it("rejects a missing evaluation with the proposal id", async () => {
    const { call } = setup(null, TREASURY);
    await expect(call()).rejects.toThrow(/No Phase-1 evaluation for prop-1/);
  });

  it("rejects non-APPROVE and spam verdicts", async () => {
    const { call } = setup(
      { ...EVAL_BASE, verdict: "REJECT", overall: 30 },
      TREASURY
    );
    await expect(call()).rejects.toThrow(/not spendable/);
  });

  it("rejects below-threshold scores with numbers", async () => {
    const { call } = setup({ ...EVAL_BASE, overall: 50 }, TREASURY);
    await expect(call()).rejects.toThrow(/below threshold 60/);
  });

  it("rejects amounts above available with numbers", async () => {
    const { call } = setup(EVAL_BASE, TREASURY);
    await expect(call(5000n)).rejects.toThrow(
      /Insufficient treasury funds: available 1000 wei/
    );
  });

  it("submits when all gates pass", async () => {
    const { call } = setup(EVAL_BASE, TREASURY);
    await call();
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "create_spend",
      expect.arrayContaining(["s1", "1inch.eth", "APPROVE", 82, false])
    );
  });
});
