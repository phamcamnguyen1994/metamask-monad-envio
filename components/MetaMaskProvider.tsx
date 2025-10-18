"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { switchToMonadNetwork } from "@/lib/network";
import { getMetaMaskSmartAccount, type SmartAccount } from "@/lib/smartAccount";

const getEthereum = () =>
  typeof window !== "undefined" ? (window as typeof window & { ethereum?: any }).ethereum : undefined;

type MetaMaskContextValue = {
  account: `0x${string}` | null;
  smartAccount: SmartAccount | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<SmartAccount>;
  ensureConnected: () => Promise<{ account: `0x${string}`; smartAccount: SmartAccount }>;
  disconnect: () => void;
  clearError: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
};

const MetaMaskContext = createContext<MetaMaskContextValue | undefined>(undefined);

export function MetaMaskProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountRef = useRef<`0x${string}` | null>(null);
  const smartAccountRef = useRef<SmartAccount | null>(null);

  const connect = useCallback(async (): Promise<SmartAccount> => {
    if (smartAccountRef.current) {
      return smartAccountRef.current;
    }

    const ethereum = getEthereum();
    if (!ethereum) {
      const err = new Error("MetaMask is not available in this environment.");
      setError(err.message);
      throw err;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await switchToMonadNetwork();

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || !accounts.length) {
        throw new Error("MetaMask did not return any accounts.");
      }

      const selectedAccount = accounts[0] as `0x${string}`;
      const smartAccountInstance = await getMetaMaskSmartAccount();

      accountRef.current = selectedAccount;
      smartAccountRef.current = smartAccountInstance;

      setAccount(selectedAccount);
      setSmartAccount(smartAccountInstance);

      return smartAccountInstance;
    } catch (err: any) {
      const message = err?.message ?? "Failed to connect MetaMask.";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const ensureConnected = useCallback(async () => {
    if (smartAccountRef.current && accountRef.current) {
      return { smartAccount: smartAccountRef.current, account: accountRef.current };
    }

    const smartAccountInstance = await connect();

    let selectedAccount = accountRef.current;
    if (!selectedAccount) {
      const ethereum = getEthereum();
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];
      const maybeAccount = accounts?.[0];
      if (maybeAccount) {
        const restoredAccount = maybeAccount as `0x${string}`;
        accountRef.current = restoredAccount;
        setAccount(restoredAccount);
        selectedAccount = restoredAccount;
      }
    }

    if (!selectedAccount) {
      throw new Error("Unable to determine connected MetaMask account.");
    }

    return { smartAccount: smartAccountInstance, account: selectedAccount };
  }, [connect]);

  const disconnect = useCallback(() => {
    accountRef.current = null;
    smartAccountRef.current = null;
    setAccount(null);
    setSmartAccount(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("MetaMask not available");
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      // Refresh smart account for new chain
      smartAccountRef.current = null;
      setSmartAccount(null);
      
      const smartAccountInstance = await getMetaMaskSmartAccount();
      smartAccountRef.current = smartAccountInstance;
      setSmartAccount(smartAccountInstance);
      
    } catch (err: any) {
      console.error("Failed to switch network:", err);
      throw err;
    }
  }, []);

  // Track current chainId
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const fetchChainId = async () => {
      try {
        const chain = await ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(chain, 16));
      } catch (err) {
        console.warn("Failed to fetch chainId:", err);
      }
    };

    fetchChainId();

    const handleChainChanged = (chain: string) => {
      setChainId(parseInt(chain, 16));
      // Reset smart account on chain change
      smartAccountRef.current = null;
      setSmartAccount(null);
    };

    ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    let cancelled = false;

    const restoreConnection = async () => {
      try {
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];

        if (!accounts || !accounts.length) {
          return;
        }

        const selectedAccount = accounts[0] as `0x${string}`;
        accountRef.current = selectedAccount;
        if (!cancelled) {
          setAccount(selectedAccount);
        }

        if (smartAccountRef.current) {
          return;
        }

        const smartAccountInstance = await getMetaMaskSmartAccount();
        if (cancelled) {
          return;
        }

        smartAccountRef.current = smartAccountInstance;
        setSmartAccount(smartAccountInstance);
      } catch (err) {
        console.warn("Failed to restore MetaMask session:", err);
      }
    };

    restoreConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        disconnect();
      } else {
        accountRef.current = accounts[0] as `0x${string}`;
        setAccount(accountRef.current);
        smartAccountRef.current = null;
        setSmartAccount(null);
      }
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [disconnect]);

  const value = useMemo<MetaMaskContextValue>(
    () => ({
      account,
      smartAccount,
      chainId,
      isConnecting,
      error,
      connect,
      ensureConnected,
      disconnect,
      clearError,
      switchNetwork,
    }),
    [account, smartAccount, chainId, isConnecting, error, connect, ensureConnected, disconnect, clearError, switchNetwork]
  );

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
}
