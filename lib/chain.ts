import { defineChain } from "viem/utils";
import { sepolia } from "viem/chains";

export const monadTestnet = defineChain({
  id: Number(process.env.MONAD_CHAIN_ID ?? 10143),
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { 
    default: { 
      http: [
        process.env.MONAD_RPC_URL ?? "https://rpc.ankr.com/monad_testnet", // Ankr RPC - stable!
        "https://rpc.monad.testnet" // Fallback URL
      ] 
    } 
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet-explorer.monad.xyz",
    },
  },
});

export const sepoliaTestnet = sepolia;

// Chain registry
export const SUPPORTED_CHAINS = {
  monad: monadTestnet,
  sepolia: sepoliaTestnet,
} as const;

export type SupportedChainKey = keyof typeof SUPPORTED_CHAINS;

// USDC addresses per chain
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [monadTestnet.id]: "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698", // mUSDC on Monad
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
};

// Legacy export for backward compatibility
export const USDC_TEST = USDC_ADDRESSES[monadTestnet.id];

// Get current chain from env or default
export function getCurrentChain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? monadTestnet.id);
  return Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId) ?? monadTestnet;
}

// Get USDC address for chain
export function getUSDCAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[monadTestnet.id];
}
