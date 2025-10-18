/**
 * Check USDC balance of Smart Account A
 */

const { createPublicClient, http } = require('viem');

const USDC_ADDRESS = "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698"; // mUSDC on Monad

const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { 
    default: { 
      http: ["https://rpc.monad-testnet.fastlane.xyz/eyJhIjoiMHhhZkRCOWVFMTMxOEFFYUFhMkVlM0U3YTA4NTAyMDAyODc1RjA0MkNBIiwidCI6MTc2MDE4NjEyNSwicyI6IjB4ODAyODYxNGU1OWNhYmUzN2RlZTI2OGNhNzU2YTkyODJiZmNkY2U1OWZlYWJjYTc1MWY2NGI0YWI0ZDZlODUyNzQyYzcyZThmNmQxNDZkNjJkZDk3M2MxZTY5MWZiY2ZmOGMxZDc0NGM2ODg5NTQ3ODZkYmMwOGJmNTlkZjU4OGIxYyJ9"] 
    } 
  }
};

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    name: "decimals",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view"
  }
];

async function checkBalance() {
  try {
    const smartAccountA = "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C"; // Smart Account A (same as EOA)
    
    console.log("🔍 Checking USDC balance for Smart Account A");
    console.log("Address:", smartAccountA);
    console.log("");
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 3000
      })
    });
    
    // Get balance
    console.log("⏳ Fetching USDC balance...");
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [smartAccountA]
    });
    
    // Get decimals
    const decimals = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "decimals"
    });
    
    const formattedBalance = Number(balance) / Math.pow(10, decimals);
    
    console.log("");
    console.log("========================================");
    console.log("✅ USDC BALANCE:");
    console.log("========================================");
    console.log("Address:", smartAccountA);
    console.log("Balance:", formattedBalance, "mUSDC");
    console.log("Raw:", balance.toString());
    console.log("========================================");
    console.log("");
    
    if (formattedBalance === 0) {
      console.log("❌ PROBLEM: Balance is 0!");
      console.log("");
      console.log("⚠️ Smart Account A không có USDC!");
      console.log("");
      console.log("📝 ACTION REQUIRED:");
      console.log("1. Transfer USDC từ EOA khác vào Smart Account A:");
      console.log(`   To: ${smartAccountA}`);
      console.log("   Amount: Ít nhất 1111 mUSDC (hoặc nhiều hơn)");
      console.log("");
      console.log("2. Sau đó tạo lại delegation");
      console.log("3. Và redeem lại");
    } else if (formattedBalance < 1111) {
      console.log("⚠️ WARNING: Balance thấp hơn delegation amount!");
      console.log(`   Current: ${formattedBalance} mUSDC`);
      console.log(`   Required: 1111 mUSDC`);
      console.log("");
      console.log("📝 ACTION REQUIRED:");
      console.log("1. Transfer thêm USDC vào Smart Account A");
      console.log("2. Hoặc giảm withdrawal amount xuống dưới", formattedBalance, "mUSDC");
    } else {
      console.log("✅ Balance đủ để withdraw!");
      console.log("");
      console.log("🤔 Nếu vẫn revert, có thể do:");
      console.log("1. Delegation signature không hợp lệ");
      console.log("2. Delegation đã hết hạn (period expired)");
      console.log("3. DelegationManager chưa được authorized");
      console.log("4. Caveat enforcer reject transaction");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkBalance();

