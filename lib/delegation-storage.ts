import { createPublicClient, createWalletClient, custom, http } from "viem";
import { monadTestnet, USDC_TEST } from "./chain";
import { getEthereumProvider } from "./ethereum";

/**
 * Lưu delegation vào blockchain thay vì localStorage
 */

// Simple Delegation Storage Contract ABI
const delegationStorageAbi = [
  {
    "inputs": [
      {"name": "delegator", "type": "address"},
      {"name": "delegate", "type": "address"},
      {"name": "authority", "type": "bytes32"},
      {"name": "caveats", "type": "bytes[]"},
      {"name": "signature", "type": "bytes"}
    ],
    "name": "storeDelegation",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "delegator", "type": "address"},
      {"name": "delegate", "type": "address"}
    ],
    "name": "getDelegation",
    "outputs": [
      {"name": "authority", "type": "bytes32"},
      {"name": "caveats", "type": "bytes[]"},
      {"name": "signature", "type": "bytes"},
      {"name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "delegator", "type": "address"},
      {"name": "delegate", "type": "address"}
    ],
    "name": "isDelegationActive",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract address (deployed on Monad testnet)
const DELEGATION_STORAGE_ADDRESS = process.env.NEXT_PUBLIC_DELEGATION_STORAGE_ADDRESS || 
  (typeof window !== 'undefined' && (window as any).delegationStorageAddress) ||
  "0xe84B332E28Cf0e6549ca25E944fb9c4484C633e1"; // Deployed DelegationStorage

export async function storeDelegationOnChain(delegation: any) {
  try {
    console.log("💾 Storing delegation on blockchain...");
    
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error("MetaMask not found");
    }

    const accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    });

    const delegator = accounts[0] as `0x${string}`;
    const walletClient = createWalletClient({
      account: delegator,
      transport: custom(ethereum),
      chain: monadTestnet,
    });

    // Store delegation on chain
    const txHash = await walletClient.writeContract({
      account: delegator,
      address: DELEGATION_STORAGE_ADDRESS,
      abi: delegationStorageAbi,
      functionName: "storeDelegation",
      args: [
        delegation.delegator,
        delegation.delegate,
        delegation.authority,
        delegation.caveats,
        delegation.signature
      ],
    });

    console.log(`✅ Delegation stored on blockchain: ${txHash}`);
    return txHash;

  } catch (error: any) {
    console.error("❌ Failed to store delegation on chain:", error);
    throw error;
  }
}

export async function getDelegationFromChain(delegator: string, delegate: string) {
  try {
    console.log("📖 Reading delegation from blockchain...");
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0])
    });

    // Check if delegation exists
    const isActive = await publicClient.readContract({
      address: DELEGATION_STORAGE_ADDRESS,
      abi: delegationStorageAbi,
      functionName: "isDelegationActive",
      args: [delegator as `0x${string}`, delegate as `0x${string}`]
    });

    if (!isActive) {
      console.log("❌ No active delegation found on chain");
      return null;
    }

    // Get delegation data
    const [authority, caveats, signature, timestamp] = await publicClient.readContract({
      address: DELEGATION_STORAGE_ADDRESS,
      abi: delegationStorageAbi,
      functionName: "getDelegation",
      args: [delegator as `0x${string}`, delegate as `0x${string}`]
    });

    const delegation = {
      delegator,
      delegate,
      authority,
      caveats,
      signature,
      timestamp,
      status: "ACTIVE"
    };

    console.log("✅ Delegation loaded from blockchain");
    return delegation;

  } catch (error: any) {
    console.error("❌ Failed to read delegation from chain:", error);
    return null;
  }
}

/**
 * Hybrid approach: Try blockchain first, fallback to localStorage
 */
export async function getDelegation(delegator: string, delegate: string) {
  try {
    // Try blockchain first
    const onChainDelegation = await getDelegationFromChain(delegator, delegate);
    if (onChainDelegation) {
      return onChainDelegation;
    }
  } catch (error) {
    console.log("⚠️ Blockchain delegation not available, trying localStorage...");
  }

  // Fallback to localStorage
  const existingDelegations = JSON.parse(localStorage.getItem('delegations') || '[]');
  const delegation = existingDelegations.find((d: any) => 
    d.delegator.toLowerCase() === delegator.toLowerCase() &&
    d.delegate.toLowerCase() === delegate.toLowerCase() &&
    d.status === "ACTIVE"
  );

  if (delegation) {
    console.log("✅ Delegation loaded from localStorage");
    return delegation;
  }

  return null;
}
