"use client";

import { useState } from "react";
import { createWalletClient, custom, createPublicClient, http, parseAbi } from "viem";
import { monadTestnet, USDC_TEST } from "@/lib/chain";
import { useMetaMask } from "./MetaMaskProvider";
import ClientOnly from "./ClientOnly";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
]);

function SimpleTransferInner() {
  const { account } = useMetaMask();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      setError("Please connect MetaMask first");
      return;
    }

    if (!recipient || !amount) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask not installed");
      }

      const walletClient = createWalletClient({
        account: account,
        transport: custom(ethereum),
        chain: monadTestnet,
      });

      const amountWei = BigInt(Math.floor(Number(amount) * 1_000_000));

      const hash = await walletClient.writeContract({
        address: USDC_TEST,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amountWei],
      });

      setTxHash(hash);
      setAmount("");
      
      console.log("✅ Transfer submitted:", hash);
      console.log("🔍 Check on Explorer:", `https://testnet-explorer.monad.xyz/tx/${hash}`);
    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#f8f9fa", 
      borderRadius: "8px", 
      border: "1px solid #e9ecef",
      maxWidth: "600px"
    }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>
        Transfer mUSDC
      </h3>
      
      <form onSubmit={handleTransfer}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
            Amount (mUSDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            min="0"
            step="0.000001"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !account}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !account ? 0.6 : 1
          }}
        >
          {loading ? "Transferring..." : account ? "Transfer mUSDC" : "Connect MetaMask First"}
        </button>
      </form>

      {error && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "6px"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {txHash && (
        <div style={{
          marginTop: "16px",
          padding: "16px",
          backgroundColor: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>✅ Transfer Successful!</h4>
          <div style={{ fontSize: "14px" }}>
            <div><strong>From:</strong> {account}</div>
            <div><strong>To:</strong> {recipient}</div>
            <div><strong>Amount:</strong> {amount} mUSDC</div>
            <div style={{ marginTop: "8px" }}>
              <a 
                href={`https://testnet-explorer.monad.xyz/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "underline" }}
              >
                View on Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimpleTransfer() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <SimpleTransferInner />
    </ClientOnly>
  );
}


