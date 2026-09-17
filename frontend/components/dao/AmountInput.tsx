"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WEI_PER_GEN = 10n ** 18n;

type Unit = "GEN" | "wei";

/** Parse a decimal GEN string to wei without float error. */
export function genToWei(input: string): bigint {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) {
    throw new Error(`Invalid GEN amount: "${input}"`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  return BigInt(whole) * WEI_PER_GEN + BigInt(frac.padEnd(18, "0") || "0");
}

/**
 * Amount input with a GEN/wei unit toggle. Reports the value in wei;
 * GEN input accepts up to 18 decimals.
 */
export function AmountInput({
  id,
  label,
  valueWei,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  valueWei: string;
  onChange: (wei: string) => void;
  placeholder?: string;
}) {
  const [unit, setUnit] = useState<Unit>("GEN");
  const [text, setText] = useState("");

  const handleText = (next: string) => {
    setText(next);
    try {
      const wei =
        unit === "GEN" ? genToWei(next || "0") : BigInt(next.trim() || "0");
      if (wei < 0n) throw new Error("negative");
      onChange(wei.toString());
    } catch {
      onChange("");
    }
  };

  const switchUnit = (next: Unit) => {
    // Keep the underlying wei value stable across the toggle.
    try {
      const wei = valueWei ? BigInt(valueWei) : 0n;
      setText(
        next === "GEN"
          ? weiToGen(wei)
          : wei.toString()
      );
    } catch {
      setText("");
    }
    setUnit(next);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder={placeholder ?? (unit === "GEN" ? "0.001" : "1000")}
          inputMode="decimal"
        />
        <div className="flex rounded-md border border-white/10 overflow-hidden shrink-0">
          {(["GEN", "wei"] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => switchUnit(u)}
              className={`px-3 text-xs font-medium transition-colors ${
                unit === u
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={unit === u}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function weiToGen(wei: bigint): string {
  const whole = wei / WEI_PER_GEN;
  const frac = (wei % WEI_PER_GEN).toString().padStart(18, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}
