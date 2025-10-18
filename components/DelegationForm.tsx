"use client";

import { useState } from "react";
import { DEFAULT_USDC } from "@/lib/delegation";
import { switchToMonadNetwork } from "@/lib/network";
import { deploySmartAccount } from "@/lib/smartAccount";
import { useMetaMask } from "@/components/MetaMaskProvider";

export default function DelegationForm() {
  const { ensureConnected } = useMetaMask();
  const [delegate, setDelegate] = useState<`0x${string}`>("0x1234567890123456789012345678901234567890");
  const [amount, setAmount] = useState(10);
  const [period, setPeriod] = useState(604800);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployLoading, setDeployLoading] = useState(false);

  const handleDeploySmartAccount = async () => {
    setDeployLoading(true);
    setError(null);

    try {
      await switchToMonadNetwork();
      const { smartAccount } = await ensureConnected();
      const txHash = await deploySmartAccount(smartAccount);

      if (txHash && txHash !== "0x") {
        alert(`Smart Account deployed!\nTX: ${txHash}\n\nYou can create a delegation right away.`);
      } else {
        alert("Smart Account is already deployed.");
      }
    } catch (err: any) {
      console.error("Deploy error:", err);
      setError(err?.message || "Failed to deploy Smart Account.");
    } finally {
      setDeployLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await switchToMonadNetwork();

      if (!delegate || delegate.length !== 42 || !delegate.startsWith("0x")) {
        throw new Error("Delegate address must start with 0x and contain exactly 42 characters.");
      }

      const { smartAccount } = await ensureConnected();

      const scope = {
        type: "erc20PeriodTransfer" as const,
        tokenAddress: DEFAULT_USDC,
        periodAmount: BigInt(amount * 1_000_000),
        periodDuration: period,
        startDate: Math.floor(Date.now() / 1000),
      };

      const { createDelegation } = await import("@metamask/delegation-toolkit");
      const { randomSalt32 } = await import("@/lib/delegationEnv");

      const delegation = createDelegation({
        from: smartAccount.address,
        to: delegate as `0x${string}`,
        scope,
        salt: randomSalt32(),
        environment: smartAccount.environment,
      });

      const normalized = {
        ...delegation,
        delegator: delegation.delegator ?? smartAccount.address,
        delegate: delegation.delegate ?? delegate,
      };

      const signature = await smartAccount.signDelegation(normalized);

      const signedDelegation = {
        ...normalized,
        signature,
        id: `delegation_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
        amount: amount, // Save the amount for dashboard display
      };

      const existingDelegations = JSON.parse(localStorage.getItem("delegations") || "[]");
      existingDelegations.push(signedDelegation);
      localStorage.setItem(
        "delegations",
        JSON.stringify(existingDelegations, (key, value) => (typeof value === "bigint" ? value.toString() : value))
      );

      setResult(signedDelegation);
    } catch (err: any) {
      console.error("Delegation error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      border: "1px solid #e9ecef" 
    }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>Setup & Deploy</h3>
        <p style={{ margin: "0 0 16px 0", color: "#666", fontSize: "14px" }}>
          Deploy your Smart Account before creating delegations.
        </p>
        <button
          type="button"
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: deployLoading ? "not-allowed" : "pointer",
            opacity: deployLoading ? 0.6 : 1
          }}
          onClick={handleDeploySmartAccount}
          disabled={deployLoading}
        >
          {deployLoading ? "Deploying..." : "Deploy Smart Account"}
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
            Delegate address
          </label>
          <input
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px"
            }}
            value={delegate}
            onChange={(event) => setDelegate(event.target.value as `0x${string}`)}
            placeholder="0x... (Smart Account or EOA)"
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Any Monad address can become the delegate.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
              Limit per period (mUSDC)
            </label>
            <input
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
              Period duration (seconds)
            </label>
            <input
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px"
              }}
              type="number"
              min="60"
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Example: 604800 = 1 week
            </div>
          </div>
        </div>

        <button 
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
          disabled={loading}
        >
          {loading ? "Creating delegation..." : "Create delegation"}
        </button>
      </form>

      {error && (
        <div style={{
          padding: "12px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: "16px",
          backgroundColor: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>✅ Delegation Created</h4>
          <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
            <div><strong>Delegator:</strong> {result.delegator}</div>
            <div><strong>Delegate:</strong> {result.delegate}</div>
            <div><strong>Amount:</strong> {amount} mUSDC per {period} seconds</div>
            <div><strong>Status:</strong> {result.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}

