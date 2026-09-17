import { describe, expect, it } from "vitest";
import { getDaoAddresses } from "../lib/contracts/addresses";

describe("getDaoAddresses", () => {
  it("resolves all three DAO stack addresses", () => {
    expect(
      getDaoAddresses({
        NEXT_PUBLIC_EVALUATOR_ADDRESS: "0xe1",
        NEXT_PUBLIC_DELEGATE_ADDRESS: "0xd1",
        NEXT_PUBLIC_GUARD_ADDRESS: "0x61",
      })
    ).toEqual({ evaluator: "0xe1", delegate: "0xd1", guard: "0x61" });
  });

  it("names the missing variable (including placeholders)", () => {
    expect(() =>
      getDaoAddresses({
        NEXT_PUBLIC_EVALUATOR_ADDRESS: "0xe1",
        NEXT_PUBLIC_GUARD_ADDRESS: "0x61",
      })
    ).toThrow("NEXT_PUBLIC_DELEGATE_ADDRESS is not set");
    expect(() =>
      getDaoAddresses({
        NEXT_PUBLIC_EVALUATOR_ADDRESS: "your_evaluator_address",
        NEXT_PUBLIC_DELEGATE_ADDRESS: "0xd1",
        NEXT_PUBLIC_GUARD_ADDRESS: "0x61",
      })
    ).toThrow("NEXT_PUBLIC_EVALUATOR_ADDRESS is not set");
  });
});
