"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const PHASES = [
  {
    step: "1. Evaluate Proposals",
    title: "Proposal Evaluator",
    text: "Snapshot proposals are scored by LLM consensus against the space charter: APPROVE, REJECT, or NEEDS_REVISION, with spam detection.",
  },
  {
    step: "2. Delegate Votes",
    title: "Voting Delegate",
    text: "Members store a public voting policy and receive verifiable, reasoned recommendations. Votes are still cast with your own key.",
  },
  {
    step: "3. Guard the Treasury",
    title: "Treasury Guard",
    text: "GEN disbursements require an APPROVE evaluation above threshold before release. Deterministic gating, no black-box spending.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Padding to account for fixed navbar */}
      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Snapshot DAO Intel
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Verifiable proposal evaluation, AI voting delegates, and treasury
              guards on GenLayer blockchain.
              <br />
              Off-chain Snapshot voting, on-chain neutral judgment.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/evaluate">
                <Button variant="gradient">Evaluate proposals</Button>
              </Link>
              <Link href="/treasury">
                <Button variant="outline">Guard the treasury</Button>
              </Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PHASES.map((phase) => (
                <div key={phase.title} className="space-y-2">
                  <div className="text-accent font-bold text-lg">{phase.step}</div>
                  <div className="font-semibold">{phase.title}</div>
                  <p className="text-sm text-muted-foreground">{phase.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Powered by GenLayer
              </a>
              <a
                href="https://studio-next.genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Studio
              </a>
              <a
                href="https://explorer-studio-dev.genlayer.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Explorer
              </a>
              <a
                href="https://docs.genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Docs
              </a>
              <a
                href="https://github.com/genlayerlabs/genlayer-project-boilerplate"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                GitHub
              </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
