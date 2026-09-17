import { studioDevnet } from "genlayer-js/chains";

// Studio Next is a MUST for the hackathon: Consensus v0.6 preview,
// chain 61997. studio-next is the mandated entry point to the same
// preview deployment as studio-dev.
const DEFAULT_RPC_URL = "https://studio-next.genlayer.com/api";
const DEFAULT_CHAIN_NAME = "GenLayer Studio Next";
const DEFAULT_EXPLORER_URL = "https://explorer-studio-dev.genlayer.com/";

export interface GenLayerNetworkOverrides {
  chainId?: string;
  chainName?: string;
  rpcUrl?: string;
  symbol?: string;
  explorerUrl?: string;
}

function parseChainId(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return studioDevnet.id;
  }

  const chainId = Number(value);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error(`NEXT_PUBLIC_GENLAYER_CHAIN_ID must be a positive integer; received ${value}`);
  }

  return chainId;
}

/**
 * Resolve one network definition shared by MetaMask, genlayer-js, and
 * Transaction Kit. Keeping these consumers on the same object prevents an RPC
 * endpoint override from producing transactions signed for a different chain.
 */
export function createGenLayerNetworkConfig(
  overrides: GenLayerNetworkOverrides = {},
) {
  const chainId = parseChainId(overrides.chainId);
  const chainName = overrides.chainName || DEFAULT_CHAIN_NAME;
  const rpcUrl = overrides.rpcUrl || DEFAULT_RPC_URL;
  const symbol = overrides.symbol || "GEN";
  const explorerUrl = overrides.explorerUrl || DEFAULT_EXPLORER_URL;

  const chain = {
    ...studioDevnet,
    id: chainId,
    name: chainName,
    nativeCurrency: {
      name: symbol,
      symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: "GenLayer Explorer",
        url: explorerUrl,
      },
    },
  } satisfies typeof studioDevnet;

  return {
    chain,
    wallet: {
      // EIP-695 hex quantity: MetaMask strictly validates this and rejects
      // uppercase (e.g. "0xF22D" fails with "Unrecognized chain ID").
      chainId: `0x${chainId.toString(16).toLowerCase()}`,
      chainName,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: [rpcUrl],
      blockExplorerUrls: [explorerUrl],
    },
  };
}

const networkConfig = createGenLayerNetworkConfig({
  chainId: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID,
  chainName: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME,
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL,
  symbol: process.env.NEXT_PUBLIC_GENLAYER_SYMBOL,
  explorerUrl: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL,
});

export const GENLAYER_CHAIN = networkConfig.chain;
export const GENLAYER_NETWORK = networkConfig.wallet;
export const GENLAYER_CHAIN_ID = GENLAYER_CHAIN.id;
export const GENLAYER_CHAIN_ID_HEX = GENLAYER_NETWORK.chainId;
export const GENLAYER_EXPLORER_URL = explorerUrlOf(networkConfig.chain);

function explorerUrlOf(chain: typeof GENLAYER_CHAIN): string {
  return chain.blockExplorers?.default.url ?? DEFAULT_EXPLORER_URL;
}
