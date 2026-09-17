"use client";

import { Badge } from "@/components/ui/badge";
import type { ProposalVerdict } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";

const STYLES: Record<ProposalVerdict | "SPAM", string> = {
  APPROVE: "bg-green-500/15 text-green-400 border-green-500/30",
  REJECT: "bg-red-500/15 text-red-400 border-red-500/30",
  NEEDS_REVISION: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  SPAM: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export function VerdictBadge({
  verdict,
  isSpam,
  className,
}: {
  verdict: ProposalVerdict;
  isSpam?: boolean;
  className?: string;
}) {
  const shown = isSpam ? "SPAM" : verdict;
  return (
    <Badge variant="outline" className={cn(STYLES[shown], className)}>
      {shown.replace("_", " ")}
    </Badge>
  );
}
