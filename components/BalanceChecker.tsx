"use client";

import { useState } from "react";
import { createPublicClient, http, parseAbi } from "viem";
import { monadTestnet, sepoliaTestnet, getUSDCAddress } from "@/lib/chain";
import { useMetaMask } from "./MetaMaskProvider";
import ClientOnly from "./ClientOnly";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
]);

type NetworkType = "monad" | "sepolia";

function BalanceCheckerInner() {
  const { chainId } = useMetaMask();
  const [address, setAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("monad");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    address: string;
    network: string;
    tokenInfo: { name: string; symbol: string; decimals: number };
    balance: { raw: string; formatted: string };
    totalSupply: { raw: string; formatted: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select network based on connected wallet
  const currentNetwork = chainId === 11155111 ? "sepolia" : "monad";
  const effectiveNetwork = selectedNetwork;

  const checkBalance = async () => {
    if (!address || address.length !== 42 || !address.startsWith("0x")) {
      setError("Please enter a valid address (42 characters starting with 0x).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Network-specific configuration
      const networkConfig = effectiveNetwork === "sepolia" 
        ? {
            chain: sepoliaTestnet,
            tokenAddress: getUSDCAddress(sepoliaTestnet.id),
            rpcUrls: [
              process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/9da1f96d3ca24c4e81089a685509cb4b",
              "https://rpc.sepolia.org",
              "https://ethereum-sepolia-rpc.publicnode.com"
            ],
            networkName: "Sepolia Testnet"
          }
        : {
            chain: monadTestnet,
            tokenAddress: getUSDCAddress(monadTestnet.id),
            rpcUrls: [
              "https://rpc.ankr.com/monad_testnet", // Stable Ankr RPC
              "https://rpc.monad.testnet",
              "https://testnet-rpc.monad.xyz"
            ],
            networkName: "Monad Testnet"
          };

      console.log(`🔍 Checking balance on ${networkConfig.networkName}`);
      console.log(`📍 USDC Address: ${networkConfig.tokenAddress}`);

      let publicClient;
      let lastError: unknown;

      for (const rpcUrl of networkConfig.rpcUrls) {
        try {
          console.log(`Connecting to RPC: ${rpcUrl}`);
          publicClient = createPublicClient({
            chain: networkConfig.chain,
            transport: http(rpcUrl, {
              timeout: 30_000,
              retryCount: 3,
              retryDelay: 2_000,
            }),
          });

          const chainIdCheck = await publicClient.getChainId();
          console.log(`✅ Connected to Chain ID: ${chainIdCheck}`);
          break;
        } catch (rpcError) {
          console.warn(`❌ RPC ${rpcUrl} failed:`, rpcError);
          lastError = rpcError;
          publicClient = null;
        }
      }

      if (!publicClient) {
        throw new Error(
          `All RPC endpoints failed for ${networkConfig.networkName}. Last error: ${(lastError as any)?.message || "Unknown error"}`
        );
      }

      const token = {
        address: networkConfig.tokenAddress,
        abi: erc20Abi,
      };

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        publicClient.readContract({ ...token, functionName: "name" }),
        publicClient.readContract({ ...token, functionName: "symbol" }),
        publicClient.readContract({ ...token, functionName: "decimals" }),
        publicClient.readContract({ ...token, functionName: "totalSupply" }),
      ]);

      const balance = await publicClient.readContract({
        ...token,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const decimalCount = Number(decimals);
      const divisor = Math.pow(10, decimalCount);
      const formattedBalance = Number(balance) / divisor;
      const formattedTotalSupply = Number(totalSupply) / divisor;

      setResult({
        address,
        network: networkConfig.networkName,
        tokenInfo: { name, symbol, decimals: decimalCount },
        balance: {
          raw: balance.toString(),
          formatted: formattedBalance.toFixed(6),
        },
        totalSupply: {
          raw: totalSupply.toString(),
          formatted: formattedTotalSupply.toFixed(6),
        },
      });
    } catch (err: any) {
      console.error("Balance check error:", err);
      setError(err.message || "Unable to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
      <h3>Balance Checker (USDC)</h3>
      <p>Look up USDC token balance for any address on Monad or Sepolia testnet.</p>

      <div style={{ display: "grid", gap: 12, maxWidth: 600 }}>
        <label>
          Network
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={() => setSelectedNetwork("monad")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor: selectedNetwork === "monad" ? "#007bff" : "#f0f0f0",
                color: selectedNetwork === "monad" ? "white" : "#333",
                border: "1px solid #ccc",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: selectedNetwork === "monad" ? "bold" : "normal",
              }}
            >
              🟣 Monad {currentNetwork === "monad" && "(Connected)"}
            </button>
            <button
              onClick={() => setSelectedNetwork("sepolia")}
              style={{
                flex: 1,
                padding: "8px 16px",
                backgroundColor: selectedNetwork === "sepolia" ? "#007bff" : "#f0f0f0",
                color: selectedNetwork === "sepolia" ? "white" : "#333",
                border: "1px solid #ccc",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: selectedNetwork === "sepolia" ? "bold" : "normal",
              }}
            >
              🔵 Sepolia {currentNetwork === "sepolia" && "(Connected)"}
            </button>
          </div>
          <small style={{ color: "#666", fontSize: "0.85em" }}>
            {selectedNetwork === "monad" 
              ? "mUSDC: 0x3A13C20987Ac0e6840d9CB6e917085F72D17E698"
              : "USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"}
          </small>
        </label>

        <label>
          Address to look up
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x1234567890123456789012345678901234567890"
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={checkBalance}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Checking..." : `Check Balance on ${selectedNetwork === "monad" ? "Monad" : "Sepolia"}`}
          </button>
        </div>

        {error && (
          <div
            style={{
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

        {result && (
          <div
            style={{
              padding: 16,
              backgroundColor: "#e8f5e8",
              border: "1px solid #00b894",
              borderRadius: 8,
              color: "#00b894",
            }}
          >
            <h4>✅ Balance details</h4>
            <div style={{ marginTop: 12 }}>
              <p>
                <strong>Network:</strong> {result.network}
              </p>
              <p>
                <strong>Token:</strong> {result.tokenInfo.name} ({result.tokenInfo.symbol})
              </p>
              <p>
                <strong>Decimals:</strong> {result.tokenInfo.decimals}
              </p>
              <p>
                <strong>Address:</strong> {result.address}
              </p>
              <p style={{ fontSize: "1.1em", fontWeight: "bold" }}>
                <strong>Balance:</strong> {result.balance.formatted} {result.tokenInfo.symbol}
              </p>
              <p style={{ fontSize: "0.85em", color: "#666" }}>
                <strong>Raw balance:</strong> {result.balance.raw}
              </p>
              <p>
                <strong>Total supply:</strong> {result.totalSupply.formatted} {result.tokenInfo.symbol}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BalanceChecker() {
  return (
    <ClientOnly
      fallback={
        <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8, marginBottom: 20 }}>
          <h3>Balance Checker</h3>
          <p>Loading...</p>
        </div>
      }
    >
      <BalanceCheckerInner />
    </ClientOnly>
  );
}
