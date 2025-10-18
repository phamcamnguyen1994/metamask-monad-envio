"use client";

import { useMemo, useState } from "react";
import { createWalletClient, custom, createPublicClient, http } from "viem";
import { monadTestnet } from "@/lib/chain";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import ClientOnly from "./ClientOnly";

type SmartAccountInstance = {
  address: string;
};

function SimpleSmartAccountInner() {
  const [account, setAccount] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<SmartAccountInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ethereum = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return (window as typeof window & { ethereum?: any }).ethereum;
  }, []);

  const isMetaMaskInstalled = Boolean(ethereum);

  const createSmartAccount = async () => {
    if (!ethereum) {
      setError("MetaMask extension is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts.length) {
        throw new Error("No MetaMask account is connected.");
      }

      const userAccount = accounts[0] as `0x${string}`;
      setAccount(userAccount);

      const walletClient = createWalletClient({
        account: userAccount,
        transport: custom(ethereum),
        chain: monadTestnet,
      });

      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0]),
      });

      const smartAccountImpl = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [userAccount, [], [], []],
        deploySalt: "0x",
        signer: { walletClient },
      });

      setSmartAccount({ address: smartAccountImpl.address });
      setSuccess(`Smart account deployed at ${smartAccountImpl.address}`);
    } catch (err) {
      console.error("Smart account creation error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div style={{ padding: 20, border: "1px solid #ff6b6b", borderRadius: 8, backgroundColor: "#ffe0e0" }}>
        <h3>MetaMask Required</h3>
        <p>Install the MetaMask browser extension to create a smart account.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
      <h3>Create a Smart Account (Quick Setup)</h3>
      <p style={{ color: "#555", fontSize: "14px" }}>
        Generate a MetaMask smart account without upgrading the existing EOA. You can fund it with mUSDC and use it for
        delegations on Monad.
      </p>

      <div style={{ marginBottom: 16 }}>
        {account ? (
          <p style={{ margin: 0 }}>
            <strong>Connected EOA:</strong> {account}
          </p>
        ) : (
          <p style={{ margin: 0 }}>Connect MetaMask to continue.</p>
        )}
      </div>

      {smartAccount && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#e8f5e8", borderRadius: 8 }}>
          <p style={{ margin: 0 }}>
            <strong>Smart Account:</strong> {smartAccount.address}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#2f855a" }}>
            This address is distinct from your EOA and can execute delegated transactions.
          </p>
        </div>
      )}

      <button
        onClick={createSmartAccount}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Creating..." : "Create Smart Account"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "#ffe0e0",
            border: "1px solid #ff6b6b",
            borderRadius: 8,
            color: "#d63031",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "#e8f5e8",
            border: "1px solid #00b894",
            borderRadius: 8,
            color: "#0f9d58",
          }}
        >
          <strong>Success:</strong> {success}
        </div>
      )}

      <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <h4 style={{ margin: "0 0 8px 0" }}>Quick checklist</h4>
        <ol style={{ margin: "0 0 0 20px", color: "#555", fontSize: "14px" }}>
          <li>Connect MetaMask with the delegator account.</li>
          <li>Click “Create Smart Account”.</li>
          <li>Fund the smart account with mUSDC if you plan to delegate allowance.</li>
          <li>Create delegations from the new smart account.</li>
        </ol>
      </div>
    </div>
  );
}

export default function SimpleSmartAccount() {
  return (
    <ClientOnly
      fallback={
        <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
          <h3>Create a Smart Account</h3>
          <p>Loading MetaMask state...</p>
        </div>
      }
    >
      <SimpleSmartAccountInner />
    </ClientOnly>
  );
}
