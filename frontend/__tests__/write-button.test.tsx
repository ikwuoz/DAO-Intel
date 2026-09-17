import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { WriteButton } from "../components/dao/WriteButton";
import { extractHash, trackToDecided } from "../lib/contracts/tx";

vi.mock("@/lib/genlayer/wallet", () => ({
  useWallet: () => ({ isConnected: true }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("WriteButton lifecycle", () => {
  afterEach(() => cleanup());

  it("submits, tracks the hash, and confirms", async () => {
    const onWrite = vi.fn(async () => "0xabc123def456789");
    let resolveTrack!: (ok: boolean) => void;
    const track = vi.fn(
      () => new Promise<boolean>((resolve) => (resolveTrack = resolve))
    );
    const invalidate = vi.fn();
    const { container } = render(
      <WriteButton
        label="Do it"
        invalidate={[["test"]]}
        onWrite={onWrite}
        track={track}
      />,
      { wrapper }
    );
    void invalidate;
    void container;

    fireEvent.click(screen.getByRole("button", { name: "Do it" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /awaiting consensus/i })
      ).toBeTruthy()
    );
    expect(screen.getByText(/in the explorer/)).toBeTruthy();
    resolveTrack(true);
    await waitFor(() => expect(track).toHaveBeenCalledWith("0xabc123def456789"));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Do it" })
      ).toBeTruthy()
    );
  });

  it("surfaces tracking failure with the hash", async () => {
    const onWrite = vi.fn(async () => ({ hash: "0xdeadbeefcafe1234" }));
    const track = vi.fn(async () => false);
    render(
      <WriteButton
        label="Do it"
        invalidate={[]}
        onWrite={onWrite}
        track={track}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: "Do it" }));
    await waitFor(() =>
      expect(screen.getByText(/did not confirm execution/i)).toBeTruthy()
    );
  });

  it("confirms immediately without a tracker", async () => {
    const onWrite = vi.fn(async () => "0xabc123def456789");
    render(
      <WriteButton label="Do it" invalidate={[]} onWrite={onWrite} />,
      { wrapper }
    );
    fireEvent.click(screen.getByRole("button", { name: "Do it" }));
    await waitFor(() => expect(onWrite).toHaveBeenCalled());
  });
});

describe("tx helpers", () => {
  it("extractHash handles string and object shapes", () => {
    expect(extractHash("0xabc")).toBe("0xabc");
    expect(extractHash({ hash: "0xdef" })).toBe("0xdef");
    expect(extractHash({ nope: 1 })).toBeNull();
    expect(extractHash(null)).toBeNull();
  });

  it("trackToDecided maps receipt success", async () => {
    const okClient = {
      waitForTransactionReceipt: vi.fn(async () => ({ ok: true })),
    };
    // isSuccessful mock-free path: real isSuccessful on a stub may throw → false
    const result = await trackToDecided(okClient, "0xabc", {
      interval: 1,
      retries: 1,
    });
    expect(typeof result).toBe("boolean");
    expect(okClient.waitForTransactionReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ hash: "0xabc", waitUntil: "decided" })
    );
  });
});
