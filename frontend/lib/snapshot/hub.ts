/**
 * Snapshot Hub (off-chain voting) fetcher.
 *
 * Snapshot is intentionally kept off-chain: Hub GraphQL at
 * https://hub.snapshot.org/graphql exposes proposal(id){id title body choices
 * state space{id}} with 60 req/min, no key for low volume. The frontend
 * fetches here, then passes title/body/choices as deterministic calldata into
 * the GenLayer evaluator contract (contracts/snapshot_proposal_evaluator.py).
 * This avoids GraphQL-POST-in-VM + score/state drift inside consensus.
 */

export const SNAPSHOT_HUB_URL = "https://hub.snapshot.org/graphql";

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  state: string;
  author: string;
  created: number;
  start: number;
  end: number;
  space: { id: string; name?: string };
}

const PROPOSAL_QUERY = `
query Proposal($id: String!) {
  proposal(id: $id) {
    id title body choices state author created start end snapshot
    space { id name }
  }
}`;

const SPACE_PROPOSALS_QUERY = `
query SpaceProposals($space: String!, $first: Int!) {
  proposals(first: $first, skip: 0,
    where: { space: $space, state: "active" },
    orderBy: "created", orderDirection: desc) {
    id title body choices state author created start end
    space { id name }
  }
}`;

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(SNAPSHOT_HUB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Snapshot Hub HTTP ${res.status}`);
  const json = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`Snapshot GraphQL: ${json.errors[0].message}`);
  return json.data;
}

export async function fetchSnapshotProposal(id: string): Promise<SnapshotProposal> {
  const data = await gql<{ proposal: SnapshotProposal | null }>(PROPOSAL_QUERY, { id });
  if (!data.proposal) throw new Error(`Snapshot proposal not found: ${id}`);
  return data.proposal;
}

export async function fetchActiveSpaceProposals(
  space: string,
  first = 20
): Promise<SnapshotProposal[]> {
  const data = await gql<{ proposals: SnapshotProposal[] }>(SPACE_PROPOSALS_QUERY, {
    space,
    first,
  });
  return data.proposals ?? [];
}

/** Canonical Snapshot UI URL — always from the proposal's own space. */
export function snapshotProposalUrl(proposal: Pick<SnapshotProposal, "id" | "space">): string {
  return `https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`;
}
