"use client";

import { useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseAbi } from "viem";
import { monadTestnet, USDC_TEST } from "@/lib/chain";
import { switchToMonadNetwork } from "@/lib/network";
import { useMetaMask } from "@/components/MetaMaskProvider";
import ClientOnly from "./ClientOnly";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

function MetaMaskConnectInner() {
  const { account, smartAccount, ensureConnected, connect, disconnect, isConnecting, error: contextError, clearError } =
    useMetaMask();
  const [localError, setLocalError] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [eoaBalance, setEoaBalance] = useState<string>("");
  const [smartAccountBalance, setSmartAccountBalance] = useState<string>("");

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0]),
      }),
    []
  );

  const fetchBalance = async (address: `0x${string}`) => {
    try {
      const [balance, decimals] = await Promise.all([
        publicClient.readContract({
          address: USDC_TEST as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: USDC_TEST as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);
      return formatUnits(balance, Number(decimals));
    } catch (err) {
      console.error("Error fetching balance:", err);
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
  }, [account, smartAccount, publicClient]);

  const effectiveError = localError || contextError;

  const handleConnect = async () => {
    try {
      clearError();
      await connect();
    } catch (err) {
      console.error("MetaMask connect error:", err);
    }
  };

  const transferToSmartAccount = async () => {
    if (!transferAmount) {
      setLocalError("Please enter an amount before transferring.");
      return;
    }

    setTransferLoading(true);
    setTransferSuccess(null);
    setLocalError(null);

    try {
      const { account: ownerAccount, smartAccount: delegateSmartAccount } = await ensureConnected();
      await switchToMonadNetwork();

      const walletClient = createWalletClient({
        account: ownerAccount,
        transport: custom((window as any).ethereum),
        chain: monadTestnet,
      });

      const amountInWei = BigInt(Math.floor(Number(transferAmount) * 1_000_000));

      const txHash = await walletClient.writeContract({
        address: USDC_TEST as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [delegateSmartAccount.address as `0x${string}`, amountInWei],
      });

      setTransferSuccess(`Transfer submitted: ${txHash}`);
      
      // Update balances after transfer
      const [eoaBal, smartBal] = await Promise.all([
        fetchBalance(ownerAccount),
        fetchBalance(delegateSmartAccount.address)
      ]);
      setEoaBalance(eoaBal);
      setSmartAccountBalance(smartBal);
    } catch (err: any) {
      console.error("Transfer mUSDC error:", err);
      setLocalError(err?.message || "Unable to transfer mUSDC.");
    } finally {
      setTransferLoading(false);
    }
  };

  if (!account) {
    return (
      <section className="card stack-md">
        <header className="stack-sm">
          <span className="badge">MetaMask Smart Account</span>
          <h3 className="section-title">Connect MetaMask</h3>
          <p className="muted">Use the header button or click below to initialise your Smart Account on Monad.</p>
        </header>
        <button className="btn btn--primary" type="button" onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect MetaMask"}
        </button>
        {effectiveError && <div className="banner banner--danger">{effectiveError}</div>}
      </section>
    );
  }

  return (
    <section className="card stack-lg">
      <header className="stack-sm">
        <span className="badge">MetaMask Smart Account</span>
        <h3 className="section-title">Transfer mUSDC</h3>
        <p className="muted">Transfer tokens to your Smart Account for delegation features.</p>
      </header>

      <div className="surface stack-md">

        <label className="field">
          <span className="field__label">Amount (mUSDC)</span>
          <input
            className="input"
            type="number"
            min="0"
            placeholder="100"
            value={transferAmount}
            onChange={(event) => setTransferAmount(event.target.value)}
          />
        </label>

        <div className="stack-sm">
          <button className="btn btn--primary" type="button" onClick={transferToSmartAccount} disabled={transferLoading}>
            {transferLoading ? "Transferring..." : "Transfer to Smart Account"}
          </button>
        </div>
      </div>

      {effectiveError && <div className="banner banner--danger">{effectiveError}</div>}
      {transferSuccess && <div className="banner banner--success">{transferSuccess}</div>}
    </section>
  );
}

export default function MetaMaskConnect() {
  const fallback = (
    <section className="card stack-md">
      <span className="badge">MetaMask Smart Account</span>
      <p className="muted">Loading MetaMask state...</p>
    </section>
  );

  return (
    <ClientOnly fallback={fallback}>
      <MetaMaskConnectInner />
    </ClientOnly>
  );
}
