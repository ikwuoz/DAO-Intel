import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressDisplay } from "../components/AddressDisplay";

const ADDRESS = "0x1234567890123456789012345678901234567890";

describe("AddressDisplay", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("copies the full address when the text is clicked", async () => {
    render(<AddressDisplay address={ADDRESS} />);
    fireEvent.click(screen.getByRole("button", { name: /copy address/i }));
    await waitFor(() =>
      expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(ADDRESS)
    );
  });

  it("shows the copy affordance by default and hides it on opt-out", () => {
    const { container, rerender } = render(<AddressDisplay address={ADDRESS} />);
    const button = container.querySelector('[role="button"]')!;
    expect(button.getAttribute("title")).toContain("(click to copy)");
    expect(button.querySelector("svg")).not.toBeNull();
    rerender(<AddressDisplay address={ADDRESS} showCopy={false} />);
    expect(button.querySelector("svg")).toBeNull();
  });

  it("renders a dash without an address", () => {
    render(<AddressDisplay address={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });
});
