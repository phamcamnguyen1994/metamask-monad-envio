"use client";

import { useState } from "react";
import { DEFAULT_USDC, toUsdc } from "@/lib/delegation";
import { switchToMonadNetwork } from "@/lib/network";
import { createWalletClient, custom, parseAbi } from "viem";
import { monadTestnet } from "@/lib/chain";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)"
]);

export default function SocialPayPage() {
  const [to, setTo] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [amount, setAmount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setTxHash(null);
    setError(null);

    try {
      await switchToMonadNetwork();

      const ethereum = (window as typeof window & { ethereum?: any }).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts.length) {
        throw new Error("No MetaMask account is connected.");
      }

      const account = accounts[0];

      const walletClient = createWalletClient({
        account: account as `0x${string}`,
        transport: custom(ethereum),
        chain: monadTestnet,
      });

      const amountWei = toUsdc(amount);

      const hash = await walletClient.writeContract({
        address: DEFAULT_USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amountWei],
      });

      setTxHash(hash);
    } catch (err) {
      console.error("Social tip error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Social Tip</h2>
      <p>Send mUSDC directly from your EOA to any recipient on Monad.</p>

      <div style={{ marginBottom: 20, padding: 16, backgroundColor: "#e3f2fd", borderRadius: 8 }}>
        <h4>How it works</h4>
        <ul>
          <li><strong>Social Tip</strong> uses your EOA for direct transfers.</li>
          <li><strong>Delegation</strong> relies on a smart account with allowances.</li>
          <li>Make sure your EOA holds enough mUSDC before sending.</li>
        </ul>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <label>
          Recipient address
          <input
            value={to}
            onChange={(event) => setTo(event.target.value as `0x${string}`)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            placeholder="0x..."
          />
        </label>
        <label>
          Amount (mUSDC)
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            min={0}
          />
        </label>
        <button
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Sending..." : "Send mUSDC"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: "#ffe0e0",
            border: "1px solid #ff6b6b",
            borderRadius: 8,
            color: "#d63031",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {txHash && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: "#e8f5e8",
            border: "1px solid #00b894",
            borderRadius: 8,
            color: "#00b894",
          }}
        >
          <strong>Success!</strong>
          <p>
            Transaction hash: <code>{txHash}</code>
          </p>
        </div>
      )}
    </div>
  );
}
