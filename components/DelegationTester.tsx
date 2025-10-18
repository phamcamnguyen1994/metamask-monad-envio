"use client";

import { useState } from "react";
import { useMetaMask } from "@/components/MetaMaskProvider";
import { switchToMonadNetwork } from "@/lib/network";

type StoredDelegation = {
  from: string;
  to: string;
  status?: string;
  createdAt?: string;
  scope?: {
    periodDuration?: number;
    periodAmount?: string | number;
  };
  caveats?: Array<{
    periodDuration?: number;
    periodAmount?: string | number;
  }>;
  signature?: string;
};

type TestResult = {
  delegator: string;
  delegate: string;
  requestedAmount: number;
  availableAmount: number;
  periodRemaining: number;
  canWithdraw: boolean;
  testStatus: "SUCCESS" | "FAILED";
  message: string;
  timestamp: string;
  signature: string;
};

export default function DelegationTester() {
  const { ensureConnected } = useMetaMask();
  const [delegatorAddress, setDelegatorAddress] = useState<`0x${string}`>("0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C");
  const [delegateAddress, setDelegateAddress] = useState<`0x${string}`>("0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string>("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      await switchToMonadNetwork();

      const { smartAccount: delegateSmartAccount } = await ensureConnected();

      if (delegateSmartAccount.address.toLowerCase() !== delegateAddress.toLowerCase()) {
        throw new Error(
          `Current account (${delegateSmartAccount.address}) does not match the delegate address (${delegateAddress}).`
        );
      }

      const existingDelegations: StoredDelegation[] = JSON.parse(localStorage.getItem("delegations") || "[]");

      const delegation = existingDelegations.find((record) =>
        record.from?.toLowerCase() === delegatorAddress.toLowerCase() &&
        record.to?.toLowerCase() === delegateAddress.toLowerCase() &&
        (record.status ?? "ACTIVE") === "ACTIVE"
      );

      if (!delegation) {
        throw new Error("No active delegation found. Please create a delegation first.");
      }

      const now = Math.floor(Date.now() / 1000);
      const createdAt = delegation.createdAt ? Math.floor(new Date(delegation.createdAt).getTime() / 1000) : now;
      const elapsed = now - createdAt;

      let periodDuration = 3600;
      let availableAmount = 1000;

      if (delegation.scope) {
        periodDuration = delegation.scope.periodDuration ?? periodDuration;
        const scopedAmount = typeof delegation.scope.periodAmount === "string"
          ? Number(delegation.scope.periodAmount) / 1_000_000
          : (delegation.scope.periodAmount ?? availableAmount);
        availableAmount = scopedAmount || availableAmount;
      } else if (delegation.caveats && delegation.caveats.length > 0) {
        const caveat = delegation.caveats[0];
        periodDuration = caveat.periodDuration ?? periodDuration;
        const caveatAmount = typeof caveat.periodAmount === "string"
          ? Number(caveat.periodAmount) / 1_000_000
          : (caveat.periodAmount ?? availableAmount);
        availableAmount = caveatAmount || availableAmount;
      }

      const periodRemaining = Math.max(0, periodDuration - elapsed);
      const canWithdraw = amount <= availableAmount && periodRemaining > 0;

      const testResult: TestResult = {
        delegator: delegatorAddress,
        delegate: delegateAddress,
        requestedAmount: amount,
        availableAmount,
        periodRemaining,
        canWithdraw,
        testStatus: canWithdraw ? "SUCCESS" : "FAILED",
        message: canWithdraw
          ? `Delegate account can withdraw ${amount} mUSDC from the delegator.`
          : `Cannot withdraw: ${amount > availableAmount ? "Requested amount exceeds the allowance." : "The delegation period has ended."}`,
        timestamp: new Date().toISOString(),
        signature: delegation.signature ? "Signed" : "Missing signature",
      };

      setResult(testResult);
    } catch (err) {
      console.error("Delegation test error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>Delegation Test (Local Data)</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Validate a saved delegation stored in localStorage.
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label>
            Delegator Address (Account A)
            <input
              value={delegatorAddress}
              onChange={(event) => setDelegatorAddress(event.target.value as `0x${string}`)}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              placeholder="0x..."
            />
          </label>
        </div>

        <div>
          <label>
            Delegate Address (Account B)
            <input
              value={delegateAddress}
              onChange={(event) => setDelegateAddress(event.target.value as `0x${string}`)}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              placeholder="0x..."
            />
          </label>
        </div>

        <div>
          <label>
            Amount to test (mUSDC)
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              min="1"
              max="1000"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Testing..." : "Run Delegation Test"}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#ffe6e6",
            border: "1px solid #ff6b6b",
            borderRadius: 8,
            color: "#d63031",
            marginTop: 16,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            padding: 12,
            backgroundColor: result.canWithdraw ? "#e0ffe0" : "#fff3cd",
            border: `1px solid ${result.canWithdraw ? "#00b894" : "#ffc107"}`,
            borderRadius: 8,
            color: result.canWithdraw ? "#00b894" : "#856404",
            marginTop: 16,
          }}
        >
          <strong>{result.canWithdraw ? "Success" : "Blocked"} - Test Result: {result.testStatus}</strong>
          <div style={{ marginTop: 8 }}>
            <p>
              <strong>Delegator:</strong> {result.delegator}
            </p>
            <p>
              <strong>Delegate:</strong> {result.delegate}
            </p>
            <p>
              <strong>Requested amount:</strong> {result.requestedAmount} mUSDC
            </p>
            <p>
              <strong>Available amount:</strong> {result.availableAmount} mUSDC
            </p>
            <p>
              <strong>Can withdraw:</strong> {result.canWithdraw ? "Yes" : "No"}
            </p>
            <p>
              <strong>Period remaining:</strong> {result.periodRemaining} seconds
            </p>
            <p>
              <strong>Message:</strong> {result.message}
            </p>
            <p>
              <strong>Signature status:</strong> {result.signature}
            </p>
            <p>
              <strong>Tested at:</strong> {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>

          {result.canWithdraw && (
            <div style={{ marginTop: 12, padding: 8, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
              <strong>Next step:</strong> Trigger the delegation contract call to redeem funds on-chain.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <h4>How to use this tester:</h4>
        <ol>
          <li>
            <strong>Connect the delegate wallet:</strong> Ensure MetaMask is connected to the delegate account.
          </li>
          <li>
            <strong>Fill in the addresses:</strong> Provide the delegator and delegate account addresses.
          </li>
          <li>
            <strong>Select an amount:</strong> Choose the amount you want to test.
          </li>
          <li>
            <strong>Run the test:</strong> Confirm that the delegation permits the withdrawal.
          </li>
        </ol>

        <h4>Expected results:</h4>
        <ul>
          <li>
            <strong>Success:</strong> Account B is allowed to redeem tokens from account A.
          </li>
          <li>
            <strong>Failed:</strong> The delegate is not authorised or the amount exceeds the limit.
          </li>
        </ul>
      </div>
    </div>
  );
}
