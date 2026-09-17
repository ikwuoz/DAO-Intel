# GenLayer DAO Intel

Next.js frontend for Snapshot DAO Intel on GenLayer: verifiable proposal evaluation, AI voting delegates, and treasury guards.

## Setup

1. Install dependencies:

**Using bun:**
```bash
bun install
```

**Using npm:**
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - `NEXT_PUBLIC_EVALUATOR_ADDRESS` / `NEXT_PUBLIC_DELEGATE_ADDRESS` / `NEXT_PUBLIC_GUARD_ADDRESS` - the three deployed DAO stack addresses (see `lib/contracts/addresses.ts`)
   - `NEXT_PUBLIC_GENLAYER_RPC_URL` - Studio Next RPC (MUST: `https://studio-next.genlayer.com/api`)
   - `NEXT_PUBLIC_GENLAYER_CHAIN_ID` - RPC chain ID (MUST: `61997`)
   - `NEXT_PUBLIC_GENLAYER_EXPLORER_URL` - block explorer (`https://explorer-studio-dev.genlayer.com/`)
   - `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` - Network label shown to users

   Change the RPC URL and chain ID together. The same resolved network is used
   by MetaMask, `genlayer-js`, and Transaction Kit.

## Development

**Using bun:**
```bash
bun dev
```

**Using npm:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

**Using bun:**
```bash
bun run build
bun start
```

**Using npm:**
```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom glass-morphism theme
- **genlayer-js** - GenLayer blockchain SDK
- **TanStack Query (React Query)** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built UI components

## Wallet Management

The app connects to MetaMask, adds or switches to the configured GenLayer
network, supports account switching, and remembers only the user's explicit
disconnect preference. Private keys are never stored by the application.

## Features

- **Evaluate Proposals**: Score Snapshot proposals against the space charter via LLM consensus (APPROVE / REJECT / NEEDS_REVISION + spam flag)
- **Delegate Votes**: Store a public voting policy and receive verifiable, reasoned recommendations
- **Guard Treasury**: Propose GEN spends gated on APPROVE evaluations; owner releases on milestone completion
- **Glass-morphism UI**: Premium dark theme with OKLCH colors, backdrop blur effects, and smooth animations
- **Data Refresh**: TanStack Query refreshes contract data after completed transactions and when the window regains focus
