import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { VerdictBadge } from "../components/dao/VerdictBadge";
import { ProposalPicker } from "../components/dao/ProposalPicker";
import { fetchActiveSpaceProposals } from "../lib/snapshot/hub";

vi.mock("../lib/snapshot/hub", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/snapshot/hub")>();
  return {
    ...actual,
    fetchActiveSpaceProposals: vi.fn(),
  };
});

const mockedFetch = vi.mocked(fetchActiveSpaceProposals);

afterEach(() => cleanup());

afterEach(() => cleanup());

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("VerdictBadge", () => {
  it("renders verdicts and forces SPAM", () => {
    const { rerender } = render(<VerdictBadge verdict="APPROVE" />);
    expect(screen.getByText("APPROVE")).toBeTruthy();
    rerender(<VerdictBadge verdict="REJECT" isSpam />);
    expect(screen.getByText("SPAM")).toBeTruthy();
  });
});

describe("ProposalPicker", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("loads proposals and reports the selection", async () => {
    mockedFetch.mockResolvedValue([
      {
        id: "prop-1",
        title: "Fund dashboard",
        body: "Build it.",
        choices: ["For", "Against"],
        state: "active",
        author: "0xabc",
        created: 1,
        start: 1,
        end: 2,
        space: { id: "yam.eth" },
      },
    ]);
    const onSelect = vi.fn();
    render(<ProposalPicker onSelect={onSelect} defaultSpace="yam.eth" />, {
      wrapper,
    });

    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith("yam.eth")
    );
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "prop-1" } });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "prop-1", title: "Fund dashboard" })
    );
  });

  it("shows an error when the space fails to load", async () => {
    mockedFetch.mockRejectedValue(new Error("no space"));
    render(<ProposalPicker onSelect={vi.fn()} defaultSpace="nope.eth" />, {
      wrapper,
    });
    await screen.findByText(/Could not load proposals/);
  });
});

describe("snapshotProposalUrl", () => {
  it("uses the proposal's own space, not the default", async () => {
    const { snapshotProposalUrl } = await import("../lib/snapshot/hub");
    expect(
      snapshotProposalUrl({
        id: "0xb4c8",
        space: { id: "1inch.eth", name: "1inch" },
      })
    ).toBe("https://snapshot.org/#/1inch.eth/proposal/0xb4c8");
  });
});

describe("genToWei", () => {
  it("converts GEN decimals to wei exactly", async () => {
    const { genToWei } = await import("../components/dao/AmountInput");
    expect(genToWei("1")).toBe(1000000000000000000n);
    expect(genToWei("0.5")).toBe(500000000000000000n);
    expect(genToWei("0.000000000000000001")).toBe(1n);
    expect(() => genToWei("abc")).toThrow();
    expect(() => genToWei("1.1234567890123456789")).toThrow();
  });
});

describe("ProposalPicker controlled space", () => {
  it("reports space edits to the parent instead of forking state", async () => {
    const { fetchActiveSpaceProposals: _ignored } = await import(
      "../lib/snapshot/hub"
    );
    void _ignored;
    const onSpaceChange = vi.fn();
    render(
      <ProposalPicker
        onSelect={vi.fn()}
        space="yam.eth"
        onSpaceChange={onSpaceChange}
      />,
      { wrapper }
    );
    const input = screen.getByLabelText("Snapshot space");
    fireEvent.change(input, { target: { value: "1inch.eth" } });
    fireEvent.click(screen.getByRole("button", { name: "Load" }));
    expect(onSpaceChange).toHaveBeenCalledWith("1inch.eth");
  });
});
