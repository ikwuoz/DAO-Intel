import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "../components/Logo";

describe("Logo", () => {
  it("renders the unique DAO mark with gradient and ballot check", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector('svg[aria-label="DAO Intelligence Logo"]');
    expect(svg).not.toBeNull();
    expect(svg!.querySelector("linearGradient")).not.toBeNull();
    expect(svg!.querySelector("polyline")).not.toBeNull();
  });

  it("renders the project wordmark", () => {
    render(<Logo />);
    expect(screen.getByText("DAO Intel")).toBeTruthy();
  });
});
