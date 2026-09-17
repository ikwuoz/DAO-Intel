"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useDao } from "@/lib/hooks/useDao";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/evaluate", label: "Evaluate" },
  { href: "/delegate", label: "Delegate" },
  { href: "/treasury", label: "Treasury" },
];

export function SetupBanner({ error }: { error: string }) {
  return (
    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
      <p className="font-semibold text-yellow-400">Contract addresses missing</p>
      <p className="text-muted-foreground">{error}</p>
      <p className="text-muted-foreground mt-1">
        Next.js reads <code>.env</code> at startup — restart{" "}
        <code>npm run dev</code> after editing it.
      </p>
    </div>
  );
}

export default function DaoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { addresses } = useDao();
  // Env-gated branches must not diverge between SSR and the client
  // (e.g. dev server started before .env was edited). Render them only
  // after mount so both sides agree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <nav className="flex gap-2">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  pathname === tab.href
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          {mounted && !addresses.ok && (
            <SetupBanner error={addresses.error} />
          )}
          {mounted ? (
            children
          ) : (
            <div className="glass-card p-6 animate-pulse text-sm text-muted-foreground">
              Loading…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
