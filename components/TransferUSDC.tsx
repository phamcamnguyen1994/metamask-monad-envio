"use client";

import { useMemo, useState } from "react";
import { createWalletClient, custom, createPublicClient, http, parseAbi, formatUnits } from "viem";
import { monadTestnet, USDC_TEST } from "@/lib/chain";
import ClientOnly from "./ClientOnly";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

const getEthereum = () =>
  typeof window !== "undefined" ? (window as typeof window & { ethereum?: any }).ethereum : undefined;

function TransferUSDCInner() {
  const [fromAccount, setFromAccount] = useState<string | null>(null);
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("");

  const ethereum = useMemo(() => getEthereum(), []);
  const isMetaMaskInstalled = Boolean(ethereum);

  const connectAndGetBalance = async () => {
    const provider = ethereum ?? getEthereum();
    if (!provider) {
      setError("MetaMask is not installed.");
      return;
    }

    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts.length) {
        throw new Error("No MetaMask account is connected.");
      }

      const account = accounts[0];
      setFromAccount(account);

      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0]),
      });

      const [tokenBalance, decimals] = await Promise.all([
        publicClient.readContract({
          address: USDC_TEST as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account as `0x${string}`],
        }),
        publicClient.readContract({
          address: USDC_TEST as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      setBalance(formatUnits(tokenBalance, Number(decimals)));
      setError(null);
    } catch (err) {
      console.error("MetaMask connect error:", err);
      setError(err instanceof Error ? err.message : "Unable to connect to MetaMask.");
    }
  };

  const transferUSDC = async () => {
    if (!fromAccount || !toAccount || !amount) {
      setError("Please complete all fields before transferring.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const provider = ethereum ?? getEthereum();
      if (!provider) {
        throw new Error("MetaMask is not installed.");
      }

      const walletClient = createWalletClient({
        account: fromAccount as `0x${string}`,
        transport: custom(provider),
        chain: monadTestnet,
      });

      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0]),
      });

      const decimals = await publicClient.readContract({
        address: USDC_TEST as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      });

      const multiplier = 10 ** Number(decimals);
      const amountWei = BigInt(Math.floor(parseFloat(amount) * multiplier));

      const hash = await walletClient.writeContract({
        address: USDC_TEST as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAccount as `0x${string}`, amountWei],
      });

      setSuccess(`Transfer submitted. Tx hash: ${hash}`);

      setTimeout(connectAndGetBalance, 2000);
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err instanceof Error ? err.message : "Unable to submit transfer.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div style={{ padding: 20, border: "1px solid #ff6b6b", borderRadius: 8, backgroundColor: "#ffe0e0" }}>
        <h3>MetaMask required</h3>
        <p>Install the MetaMask browser extension to continue.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
      <h3>Transfer mUSDC</h3>
      <p>Move mUSDC from your EOA to a smart account before creating delegations.</p>

      {!fromAccount ? (
        <div>
          <p>Connect MetaMask to view your balance:</p>
          <button
            onClick={connectAndGetBalance}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Connect and load balance
          </button>
        </div>
      ) : (
        <div>
          <p>
            <strong>Connected account:</strong> {fromAccount}
          </p>
          {balance && (
            <p>
              <strong>Balance:</strong> {balance} mUSDC
            </p>
          )}

          <div style={{ display: "grid", gap: 12, maxWidth: 500, marginTop: 16 }}>
            <label>
              Recipient (smart account)
              <input
                type="text"
                value={toAccount}
                onChange={(event) => setToAccount(event.target.value)}
                placeholder="0x..."
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />
            </label>

            <label>
              Amount (mUSDC)
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="100"
                style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
              />
            </label>

            <button
              onClick={transferUSDC}
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
              {loading ? "Transferring..." : "Transfer mUSDC"}
            </button>
          </div>
        </div>
      )}

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

      {success && (
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
          <strong>Success:</strong> {success}
        </div>
      )}
    </div>
  );
}

export default function TransferUSDC() {
  return (
    <ClientOnly
      fallback={
        <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
          <h3>Transfer mUSDC</h3>
          <p>Loading...</p>
        </div>
      }
    >
      <TransferUSDCInner />
    </ClientOnly>
  );
}
