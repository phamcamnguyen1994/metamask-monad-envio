"use client";

import { useEffect, useMemo, useState } from "react";
import { createPublicClient, formatUnits, http, parseAbi } from "viem";
import { monadTestnet, sepoliaTestnet, getUSDCAddress } from "@/lib/chain";
import { useMetaMask } from "@/components/MetaMaskProvider";
import ClientOnly from "./ClientOnly";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

function formatAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function AccountOverviewInner() {
  const { account, smartAccount, chainId } = useMetaMask();
  const [eoaBalance, setEoaBalance] = useState<string>("");
  const [smartAccountBalance, setSmartAccountBalance] = useState<string>("");

  // Get current chain and USDC address
  const currentChain = chainId === 11155111 ? sepoliaTestnet : monadTestnet;
  const usdcAddress = getUSDCAddress(chainId || monadTestnet.id);
  const tokenSymbol = chainId === 11155111 ? "USDC" : "mUSDC";

  const publicClient = useMemo(
    () => {
      // For Monad, use fallback RPC if primary fails
      const rpcUrls = currentChain.id === 10143 
        ? [
            currentChain.rpcUrls.default.http[0],
            "https://rpc.monad.testnet", // Fallback
          ]
        : currentChain.rpcUrls.default.http;

      return createPublicClient({
        chain: currentChain,
        transport: http(rpcUrls[0], {
          timeout: 30_000, // 30s timeout
          retryCount: 2,
          retryDelay: 1000,
        }),
      });
    },
    [currentChain]
  );

  const fetchBalance = async (address: `0x${string}`) => {
    try {
      const [balance, decimals] = await Promise.all([
        publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);
      
      return formatUnits(balance, Number(decimals));
    } catch (err: any) {
      console.error(`❌ Error fetching ${tokenSymbol} balance for ${address}:`, err);
      
      // Check if it's Monad RPC error
      if (chainId === 10143 && err?.message?.includes("stake weighted qos")) {
        console.warn("⚠️  Monad RPC temporarily unavailable. Balance display disabled.");
        return "RPC Error";
      }
      
      return "0";
    }
  };

  useEffect(() => {
    if (!account) {
      setEoaBalance("");
      setSmartAccountBalance("");
      return;
    }

    const updateBalances = async () => {
      const eoaBal = await fetchBalance(account);
      setEoaBalance(eoaBal);
      
      if (smartAccount) {
        const smartBal = await fetchBalance(smartAccount.address);
        setSmartAccountBalance(smartBal);
      }
    };

    updateBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, smartAccount?.address, chainId, usdcAddress]);

  if (!account) {
    return null;
  }

  return (
    <div style={{ 
      display: "flex", 
      gap: "20px", 
      alignItems: "center",
      fontSize: "14px",
      color: "#666",
      flexWrap: "nowrap"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: "500", color: "#333" }}>EOA:</span>
        <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{formatAddress(account)}</span>
        <span style={{ fontSize: "12px" }}>({eoaBalance} {tokenSymbol})</span>
      </div>
      
      {smartAccount && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "500", color: "#333" }}>Smart:</span>
          <span style={{ fontFamily: "monospace", fontSize: "13px" }}>{formatAddress(smartAccount.address)}</span>
          <span style={{ fontSize: "12px" }}>({smartAccountBalance} {tokenSymbol})</span>
        </div>
      )}
    </div>
  );
}

export default function AccountOverview() {
  return (
    <ClientOnly fallback={null}>
      <AccountOverviewInner />
    </ClientOnly>
  );
}
