"use client";

import { useMemo, useState } from "react";
import { createWalletClient, custom, createPublicClient, http } from "viem";
import { monadTestnet } from "@/lib/chain";
import { getDeleGatorEnvironment } from "@metamask/delegation-toolkit";
import ClientOnly from "./ClientOnly";

function EIP7702UpgradeInner() {
  const [account, setAccount] = useState<string | null>(null);
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

  const upgradeToSmartAccount = async () => {
    if (!isMetaMaskInstalled || !ethereum) {
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

      const environment = getDeleGatorEnvironment(monadTestnet.id);
      const delegationImpl = environment.implementations.EIP7702StatelessDeleGatorImpl;

      if (!delegationImpl) {
        throw new Error("Delegation implementation address is missing for Monad.");
      }

      const nonce = BigInt(await publicClient.getTransactionCount({ address: userAccount }));
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

      const authorization = {
        chainId: BigInt(monadTestnet.id),
        invoker: userAccount,
        nonce,
        expiry,
        calls: [
          {
            target: userAccount,
            data: "0x",
            value: BigInt(0),
            gasLimit: BigInt(0),
          },
        ],
        delegate: delegationImpl,
        context: "0x",
      };

      const signature = (await ethereum.request({
        method: "eth_signTypedData_v4",
        params: [
          userAccount,
          JSON.stringify({
            domain: {
              name: "EIP-7702",
              version: "1",
              chainId: monadTestnet.id,
              verifyingContract: delegationImpl,
            },
            types: {
              Authorization: [
                { name: "chainId", type: "uint256" },
                { name: "invoker", type: "address" },
                { name: "nonce", type: "uint256" },
                { name: "expiry", type: "uint256" },
                { name: "calls", type: "Call[]" },
                { name: "delegate", type: "address" },
                { name: "context", type: "bytes" },
              ],
              Call: [
                { name: "target", type: "address" },
                { name: "data", type: "bytes" },
                { name: "value", type: "uint256" },
                { name: "gasLimit", type: "uint256" },
              ],
            },
            primaryType: "Authorization",
            message: authorization,
          }),
        ],
      })) as `0x${string}`;

      const txHash = await walletClient.sendTransaction({
        authorizationList: [
          {
            ...authorization,
            signature,
          } as any,
        ],
        data: "0x",
        to: "0x0000000000000000000000000000000000000000",
      });

      setSuccess(`Upgrade submitted. Transaction hash: ${txHash}`);
    } catch (err) {
      console.error("EIP-7702 upgrade error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div style={{ padding: 20, border: "1px solid #ff6b6b", borderRadius: 8, backgroundColor: "#ffe0e0" }}>
        <h3>MetaMask Required</h3>
        <p>Install the MetaMask browser extension to upgrade an EOA with EIP-7702.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
      <h3>EIP-7702 Upgrade (EOA to Smart Account)</h3>
      <p style={{ color: "#555", fontSize: "14px" }}>
        Submit an authorization that upgrades your Externally Owned Account into a MetaMask smart account on Monad testnet.
      </p>

      <div style={{ marginBottom: 16 }}>
        {account ? (
          <p style={{ margin: 0 }}>
            <strong>Connected EOA:</strong> {account}
          </p>
        ) : (
          <p style={{ margin: 0 }}>Connect MetaMask with the EOA you want to upgrade.</p>
        )}
      </div>

      <ol style={{ margin: "0 0 16px 20px", color: "#555", fontSize: "14px" }}>
        <li>Connect MetaMask and select the delegator account.</li>
        <li>Click the upgrade button below.</li>
        <li>Approve the typed-data signature in MetaMask.</li>
        <li>Confirm the transaction that finalises the upgrade.</li>
      </ol>

      <button
        onClick={upgradeToSmartAccount}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#22c55e",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Submitting..." : "Upgrade EOA to Smart Account"}
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
    </div>
  );
}

export default function EIP7702Upgrade() {
  return (
    <ClientOnly
      fallback={
        <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
          <h3>EIP-7702 Upgrade</h3>
          <p>Loading MetaMask state...</p>
        </div>
      }
    >
      <EIP7702UpgradeInner />
    </ClientOnly>
  );
}
