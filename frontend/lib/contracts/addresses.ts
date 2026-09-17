/**
 * DAO stack contract addresses.
 *
 * Three contracts, three addresses — one env var per contract:
 * - NEXT_PUBLIC_EVALUATOR_ADDRESS (SnapshotProposalEvaluator)
 * - NEXT_PUBLIC_DELEGATE_ADDRESS  (SnapshotVotingDelegate)
 * - NEXT_PUBLIC_GUARD_ADDRESS     (SnapshotTreasuryGuard)
 *
 * Wrappers take their address as a constructor arg; use getDaoAddresses()
 * to resolve all three in one place with a single clear error when any
 * is missing.
 */

export interface DaoAddresses {
  evaluator: string;
  delegate: string;
  guard: string;
}

export const EVALUATOR_ENV_VAR = "NEXT_PUBLIC_EVALUATOR_ADDRESS";
export const DELEGATE_ENV_VAR = "NEXT_PUBLIC_DELEGATE_ADDRESS";
export const GUARD_ENV_VAR = "NEXT_PUBLIC_GUARD_ADDRESS";

/**
 * NOTE: each variable is read via an explicit `process.env.X` access.
 * Next.js only inlines individually referenced NEXT_PUBLIC_* vars into
 * the browser bundle — passing `process.env` around as a whole object
 * arrives empty on the client and falsely reports everything missing.
 */
function nextPublicEnv(): Record<string, string | undefined> {
  return {
    [EVALUATOR_ENV_VAR]: process.env.NEXT_PUBLIC_EVALUATOR_ADDRESS,
    [DELEGATE_ENV_VAR]: process.env.NEXT_PUBLIC_DELEGATE_ADDRESS,
    [GUARD_ENV_VAR]: process.env.NEXT_PUBLIC_GUARD_ADDRESS,
  };
}

export function getDaoAddresses(
  env: Record<string, string | undefined> = nextPublicEnv()
): DaoAddresses {
  const read = (name: string): string => {
    const value = env[name];
    if (!value || value.startsWith("your_")) {
      throw new Error(
        `${name} is not set — deploy the DAO stack (§1.1 of docs/web-ui-runbook.md) and add all three addresses to your .env`
      );
    }
    return value;
  };
  return {
    evaluator: read(EVALUATOR_ENV_VAR),
    delegate: read(DELEGATE_ENV_VAR),
    guard: read(GUARD_ENV_VAR),
  };
}
