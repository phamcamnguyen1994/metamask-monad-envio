import { createPublicClient, http } from "viem";
import { monadTestnet } from "./chain";

// Lấy RPC URL với fallback
const getRpcUrl = () => {
  const envUrl = process.env.MONAD_RPC_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl;
  }
  // Use stable Ankr RPC as fallback
  return "https://rpc.ankr.com/monad_testnet";
};

// Public client with timeout and retry config
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(getRpcUrl(), {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 2000
  })
});

// Bundler và Paymaster URLs (có thể để trống cho demo)
export const bundlerRpcUrl = process.env.BUNDLER_RPC_URL || "";
export const paymasterRpcUrl = process.env.PAYMASTER_RPC_URL || "";

