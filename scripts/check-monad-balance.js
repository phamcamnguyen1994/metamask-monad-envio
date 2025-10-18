/**
 * Check Monad mUSDC balance for debugging
 */

const { createPublicClient, http, parseAbi } = require("viem");

const MONAD_CHAIN_ID = 10143;
const MONAD_RPC_URL = "https://rpc.ankr.com/monad_testnet"; // Ankr RPC - works better!
const USDC_ADDRESS = "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]);

async function checkBalance(address) {
  console.log("\n🔍 Checking Monad mUSDC Balance...\n");
  console.log(`Network: Monad Testnet (Chain ID: ${MONAD_CHAIN_ID})`);
  console.log(`RPC URL: ${MONAD_RPC_URL.slice(0, 50)}...`);
  console.log(`Token Address: ${USDC_ADDRESS}`);
  console.log(`Checking Address: ${address}\n`);

  const publicClient = createPublicClient({
    chain: {
      id: MONAD_CHAIN_ID,
      name: "Monad Testnet",
      network: "monad-testnet",
      nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
      rpcUrls: {
        default: { http: [MONAD_RPC_URL] },
      },
    },
    transport: http(MONAD_RPC_URL, {
      timeout: 30_000,
    }),
  });

  try {
    console.log("📞 Fetching token info...");
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "name",
      }),
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    console.log(`✅ Token: ${name} (${symbol})`);
    console.log(`✅ Decimals: ${decimals}\n`);

    console.log("💰 Fetching balance...");
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });

    const formatted = Number(balance) / Math.pow(10, Number(decimals));
    
    console.log(`\n✅ Balance: ${formatted} ${symbol}`);
    console.log(`   Raw: ${balance.toString()}`);
    
    if (formatted === 0) {
      console.log("\n⚠️  Balance is ZERO!");
      console.log("💡 Possible reasons:");
      console.log("   1. Address has no mUSDC");
      console.log("   2. You're checking the wrong address");
      console.log("   3. RPC connection issue");
      console.log("\n💰 To get mUSDC, use the faucet or mint script!");
    }

    return formatted;
  } catch (error) {
    console.error("\n❌ Error checking balance:");
    console.error(error.message);
    console.error("\n🔧 Debug info:");
    console.error("   - Check if RPC URL is accessible");
    console.error("   - Check if token contract is deployed");
    console.error("   - Try using a different RPC endpoint");
    throw error;
  }
}

// Get address from command line or use example
const testAddress = process.argv[2] || "0x963a2d0be2eb5d785c6e73ec904fce8d65691773";

checkBalance(testAddress)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nScript failed:", err.message);
    process.exit(1);
  });

