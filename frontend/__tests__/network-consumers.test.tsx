import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_NETWORK,
} from "../lib/genlayer/network";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ readContract: vi.fn() })),
  createTransactionKit: vi.fn(() => ({ configured: true })),
}));

vi.mock("genlayer-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@genlayer/transaction-kit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@genlayer/transaction-kit")>()),
  createTransactionKit: mocks.createTransactionKit,
}));

import SnapshotEvaluator from "../lib/contracts/SnapshotEvaluator";
import {
  addGenLayerNetwork,
  connectMetaMask,
  ensureGenLayerNetwork,
  switchToGenLayerNetwork,
} from "../lib/genlayer/client";
import { useTransactionKit } from "../lib/genlayer/kit";

const account = "0x1234567890123456789012345678901234567890";
const providerRequest = vi.fn();

describe("network consumers", () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.createTransactionKit.mockClear();
    providerRequest.mockReset();
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        request: providerRequest,
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    });
  });

  it("uses the shared chain for contract clients", () => {
    const contract = new SnapshotEvaluator(account, account);

    expect(mocks.createClient).toHaveBeenLastCalledWith({
      account,
      chain: GENLAYER_CHAIN,
    });

    contract.updateAccount("0x0000000000000000000000000000000000000001");
    expect(mocks.createClient).toHaveBeenLastCalledWith({
      account: "0x0000000000000000000000000000000000000001",
      chain: GENLAYER_CHAIN,
    });
  });

  it("uses the same chain for Transaction Kit submissions", () => {
    renderHook(() => useTransactionKit(account));

    expect(mocks.createTransactionKit).toHaveBeenCalledWith({
      account,
      chain: GENLAYER_CHAIN,
      provider: expect.objectContaining({ request: providerRequest }),
    });
  });

  it("does not create a signing kit without an account", () => {
    const { result } = renderHook(() => useTransactionKit(null));
    expect(result.current).toBeNull();
    expect(mocks.createTransactionKit).not.toHaveBeenCalled();
  });

  it("does not create a signing kit without a wallet provider", () => {
    Object.defineProperty(window, "ethereum", { configurable: true, value: undefined });
    const { result } = renderHook(() => useTransactionKit(account));
    expect(result.current).toBeNull();
    expect(mocks.createTransactionKit).not.toHaveBeenCalled();
  });

  it("uses the shared wallet network for add and switch requests", async () => {
    await switchToGenLayerNetwork();
    expect(providerRequest).toHaveBeenCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });

    await addGenLayerNetwork();
    expect(providerRequest).toHaveBeenCalledWith({
      method: "wallet_addEthereumChain",
      params: [GENLAYER_NETWORK],
    });
  });

  describe("auto-switch on connect", () => {
    const reject401 = () => {
      const err: any = new Error("User rejected the request");
      err.code = 4001;
      throw err;
    };

    beforeEach(() => {
      (window as any).ethereum.isMetaMask = true;
    });

    it("ensureGenLayerNetwork returns already without prompting", async () => {
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_chainId") return GENLAYER_CHAIN_ID_HEX;
        throw new Error(`unexpected ${method}`);
      });

      expect(await ensureGenLayerNetwork()).toBe("already");
      expect(providerRequest).not.toHaveBeenCalledWith(
        expect.objectContaining({ method: "wallet_switchEthereumChain" })
      );
    });

    it("ensureGenLayerNetwork switches when on the wrong network", async () => {
      let switched = false;
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_chainId") {
          return switched ? GENLAYER_CHAIN_ID_HEX : "0x1";
        }
        if (method === "wallet_switchEthereumChain") {
          switched = true;
          return null;
        }
        throw new Error(`unexpected ${method}`);
      });

      expect(await ensureGenLayerNetwork()).toBe("switched");
    });

    it("ensureGenLayerNetwork returns rejected instead of throwing", async () => {
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_chainId") return "0x1";
        if (method === "wallet_switchEthereumChain") reject401();
        throw new Error(`unexpected ${method}`);
      });

      expect(await ensureGenLayerNetwork()).toBe("rejected");
    });

    it("falls back to adding the chain on unrecognized-chain errors", async () => {
      let added = false;
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_chainId") {
          return added ? GENLAYER_CHAIN_ID_HEX : "0x1";
        }
        if (method === "wallet_switchEthereumChain") {
          throw new Error(
            'Unrecognized chain ID "0xF22D". Try adding the chain using wallet_addEthereumChain first.'
          );
        }
        if (method === "wallet_addEthereumChain") {
          added = true;
          return null;
        }
        throw new Error(`unexpected ${method}`);
      });

      expect(await ensureGenLayerNetwork()).toBe("switched");
      expect(providerRequest).toHaveBeenCalledWith({
        method: "wallet_addEthereumChain",
        params: [GENLAYER_NETWORK],
      });
    });

    it("connectMetaMask still connects when the switch is dismissed", async () => {
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_requestAccounts") return [account];
        if (method === "eth_chainId") return "0x1";
        if (method === "wallet_switchEthereumChain") reject401();
        throw new Error(`unexpected ${method}`);
      });

      const result = await connectMetaMask();
      expect(result.address).toBe(account);
      expect(result.onCorrectNetwork).toBe(false);
      expect(result.networkResult).toBe("rejected");
    });

    it("connectMetaMask reports a correct network when already there", async () => {
      providerRequest.mockImplementation(async ({ method }: any) => {
        if (method === "eth_requestAccounts") return [account];
        if (method === "eth_chainId") return GENLAYER_CHAIN_ID_HEX;
        throw new Error(`unexpected ${method}`);
      });

      const result = await connectMetaMask();
      expect(result).toEqual({
        address: account,
        onCorrectNetwork: true,
        networkResult: "already",
      });
    });
  });
});
