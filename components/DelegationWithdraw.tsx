"use client";

import React, { useMemo, useState, useEffect } from "react";
import { erc20Abi } from "viem";
import { monadTestnet, USDC_TEST } from "@/lib/chain";
import { useMetaMask } from "@/components/MetaMaskProvider";
import { switchToMonadNetwork } from "@/lib/network";

const getEthereum = () =>
  typeof window !== "undefined" ? (window as typeof window & { ethereum?: any }).ethereum : undefined;

type WithdrawResult = {
  delegator: string;
  delegate: string;
  requestedAmount: number;
  actualWithdrawn?: number;
  transactionHash: string;
  status: string;
  timestamp: string;
  gasless: boolean;
  blockNumber?: string;
  gasUsed?: string;
  userOpHash?: string;
  message?: string;
};

export default function DelegationWithdraw() {
  const { ensureConnected, smartAccount } = useMetaMask();
  const [delegatorAddress, setDelegatorAddress] = useState<`0x${string}`>(
    "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C"
  );
  const [delegateAddress, setDelegateAddress] = useState<`0x${string}`>(
    smartAccount?.address || "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f"
  );
  const [withdrawAmount, setWithdrawAmount] = useState(10);
  const [useGasless, setUseGasless] = useState(true); // Default to true (gasless redemption)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [error, setError] = useState<string>("");

  const ethereum = useMemo(() => getEthereum(), []);
  
  // Auto-update delegate address when Smart Account changes
  useEffect(() => {
    if (smartAccount?.address) {
      setDelegateAddress(smartAccount.address);
    }
  }, [smartAccount]);

  const withdrawFromDelegation = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (withdrawAmount <= 0) {
        throw new Error("Amount must be greater than zero.");
      }

      await switchToMonadNetwork();

      const { smartAccount: delegateSmartAccount } = await ensureConnected();
      if (!delegateSmartAccount) {
        throw new Error("Unable to initialise the MetaMask smart account for the delegate.");
      }

      if (delegateSmartAccount.address.toLowerCase() !== delegateAddress.toLowerCase()) {
        throw new Error(
          `Connected delegate ${delegateSmartAccount.address} does not match the configured delegate ${delegateAddress}.`
        );
      }

      const storedDelegations = JSON.parse(localStorage.getItem("delegations") || "[]");
      const delegation = storedDelegations.find(
        (entry: any) =>
          entry.delegator?.toLowerCase() === delegatorAddress.toLowerCase() &&
          entry.delegate?.toLowerCase() === delegateAddress.toLowerCase() &&
          entry.status === "ACTIVE"
      );

      if (!delegation) {
        throw new Error(`No active delegation found from ${delegatorAddress} to ${delegateAddress}.`);
      }

      if (useGasless) {
        try {
          const { redeemDelegationSimple } = await import("@/lib/delegation-simple");
          const gaslessResult = await redeemDelegationSimple(delegation, withdrawAmount);

          setResult({
            delegator: gaslessResult.delegator,
            delegate: gaslessResult.delegate,
            requestedAmount: withdrawAmount,
            transactionHash: gaslessResult.transactionHash,
            status: gaslessResult.status,
            timestamp: gaslessResult.timestamp,
            gasless: true,
            blockNumber: gaslessResult.blockNumber,
            gasUsed: gaslessResult.gasUsed,
            userOpHash: gaslessResult.userOpHash,
            message: gaslessResult.message,
          });
          return;
        } catch (gaslessError) {
          console.error("Gasless redemption failed:", gaslessError);
          throw new Error(
            `Gasless withdrawal failed. Switch to the direct transfer option or retry later.\n\n${
              gaslessError instanceof Error ? gaslessError.message : String(gaslessError)
            }`
          );
        }
      }

      const provider = ethereum ?? getEthereum();
      if (!provider) {
        throw new Error("MetaMask is not available. Install the extension to submit a direct transfer.");
      }

      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts.length) {
        throw new Error("No MetaMask account is connected.");
      }

      const currentEOA = accounts[0] as `0x${string}`;
      
      // Use current connected account instead of requiring specific delegator
      console.log("💰 Using current EOA for direct transfer:", currentEOA);
      console.log("📍 Transfer FROM:", currentEOA);
      console.log("📍 Transfer TO:", delegateAddress);
      console.log("💵 Amount:", withdrawAmount, "mUSDC");

      const { createWalletClient, custom, createPublicClient, http } = await import("viem");

      const walletClient = createWalletClient({
        account: currentEOA,
        transport: custom(provider),
        chain: monadTestnet,
      });

      const scaledAmount = BigInt(Math.floor(withdrawAmount * 1_000_000));

      const transactionHash = await walletClient.writeContract({
        address: USDC_TEST as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [delegateAddress, scaledAmount],
      });

      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0], {
          timeout: 60_000,
          retryCount: 3,
          retryDelay: 3_000,
        }),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        timeout: 60_000,
      });

      const statusString = String(receipt.status).toLowerCase();
      if (statusString === "reverted" || statusString === "0x0" || statusString === "0") {
        throw new Error(`Transfer reverted on chain. Transaction hash: ${transactionHash}`);
      }

      const withdrawResult = {
        delegator: currentEOA,  // Use current connected account
        delegate: delegateAddress,
        requestedAmount: withdrawAmount,
        actualWithdrawn: withdrawAmount,
        transactionHash,
        status:
          statusString === "success" || statusString === "0x1" || statusString === "1"
            ? "SUCCESS"
            : String(receipt.status),
        timestamp: new Date().toISOString(),
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
        gasless: false,
      };

      setResult(withdrawResult);

      // Save to localStorage for dashboard display
      try {
        const redemptionHistory = JSON.parse(localStorage.getItem("redemptionHistory") || "[]");
        redemptionHistory.unshift({
          id: transactionHash,
          delegator: currentEOA,
          delegate: delegateAddress,
          amount: withdrawAmount,
          txHash: transactionHash,
          timestamp: new Date().toISOString(),
          blockNumber: receipt.blockNumber?.toString() || "",
        });
        // Keep only last 50 redemptions
        localStorage.setItem("redemptionHistory", JSON.stringify(redemptionHistory.slice(0, 50)));
      } catch (storageError) {
        console.warn("Failed to save redemption to localStorage:", storageError);
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        border: "1px solid #e9ecef",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 600 }}>Withdraw mUSDC</h3>
        <p style={{ margin: "0 0 16px 0", color: "#555", fontSize: "14px" }}>
          Use the delegation toolkit redemption (gasless) when available. If it fails, switch to the direct transfer option
          and connect with the delegator account.
        </p>

        <form onSubmit={withdrawFromDelegation} style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: "14px", fontWeight: 500 }}>
              Delegator address (Account A)
            </label>
            <input
              value={delegatorAddress}
              onChange={(event) => setDelegatorAddress(event.target.value as `0x${string}`)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: "14px",
              }}
              placeholder="0x..."
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: "14px", fontWeight: 500 }}>
              Delegate address (Account B)
            </label>
            <input
              value={delegateAddress}
              onChange={(event) => setDelegateAddress(event.target.value as `0x${string}`)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: "14px",
              }}
              placeholder="0x..."
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: "14px", fontWeight: 500 }}>
              Amount to withdraw (mUSDC)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(Number(event.target.value))}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: "14px",
              }}
              min="1"
            />
          </div>

          {/* Gasless redemption is always enabled - checkbox hidden */}
          <div style={{ marginBottom: 16, display: "none" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={useGasless}
                onChange={(event) => setUseGasless(event.target.checked)}
              />
              <span>Use gasless redemption (bundler)</span>
            </label>
            <div style={{ fontSize: "12px", color: "#666", marginTop: 4, marginLeft: 24 }}>
              {useGasless
                ? "Delegate signs a UserOperation via Pimlico bundler."
                : "Delegator EOA must confirm a regular ERC-20 transfer."}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: loading ? "#ccc" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Processing..." : "Submit withdrawal"}
          </button>
        </form>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: 6,
            marginBottom: 16,
            whiteSpace: "pre-line",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
            borderRadius: 6,
          }}
        >
          <h4 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#155724" }}>
            🎉 Withdrawal Successful!
          </h4>
          {result.message && (
            <div style={{ 
              marginBottom: "16px", 
              padding: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {result.message}
            </div>
          )}
          <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
            <div>
              <strong>Amount:</strong> {result.requestedAmount} mUSDC
            </div>
            <div>
              <strong>Mode:</strong> {result.gasless ? "⚡ Gasless (via Pimlico)" : "Direct transfer"}
            </div>
            <div>
              <strong>Tx hash:</strong>{" "}
              <a 
                href={`https://testnet.monadexplorer.com/tx/${result.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "underline" }}
              >
                {result.transactionHash.slice(0, 10)}...{result.transactionHash.slice(-8)}
              </a>
            </div>
            <div>
              <strong>Status:</strong> <span style={{ color: "#28a745", fontWeight: "bold" }}>{result.status}</span>
            </div>
            {result.blockNumber && (
              <div>
                <strong>Block:</strong> {result.blockNumber}
              </div>
            )}
            {result.gasUsed && (
              <div>
                <strong>Gas used:</strong> {result.gasUsed}
              </div>
            )}
            {result.userOpHash && (
              <div>
                <strong>UserOp hash:</strong>{" "}
                <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                  {result.userOpHash.slice(0, 10)}...{result.userOpHash.slice(-8)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
