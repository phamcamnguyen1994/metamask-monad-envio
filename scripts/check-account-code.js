/**
 * Check if account has bytecode (is a contract)
 */

const { createPublicClient, http } = require('viem');

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

async function checkAccountCode() {
  try {
    const accounts = [
      { name: "Smart Account A", address: "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C" },
      { name: "Smart Account B", address: "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f" },
      { name: "DelegationManager", address: "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" }
    ];
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 3000
      })
    });
    
    console.log("🔍 Checking account bytecode...");
    console.log("");
    
    for (const account of accounts) {
      console.log(`${account.name}:`);
      console.log(`  Address: ${account.address}`);
      
      const code = await publicClient.getCode({ address: account.address });
      
      if (!code || code === '0x') {
        console.log(`  Code: ❌ EMPTY (EOA or not deployed)`);
      } else {
        console.log(`  Code: ✅ HAS CODE (${code.length} bytes)`);
        console.log(`  Code preview: ${code.slice(0, 66)}...`);
      }
      console.log("");
    }
    
    console.log("========================================");
    console.log("⚠️ DIAGNOSIS:");
    console.log("========================================");
    
    const codeA = await publicClient.getCode({ address: accounts[0].address });
    const codeB = await publicClient.getCode({ address: accounts[1].address });
    
    if (!codeA || codeA === '0x') {
      console.log("❌ PROBLEM FOUND!");
      console.log("");
      console.log("Smart Account A (0x1bd5...) không có bytecode!");
      console.log("");
      console.log("💡 GIẢI PHÁP:");
      console.log("1. Smart Account A là EOA được 'upgrade' qua EIP-7702");
      console.log("2. NHƯNG transaction 0x26337a459b7bb0c46003a6e3da6224e2a00f8c9625915c928be8984c5617a9b4");
      console.log("   chỉ là proxy deployment, KHÔNG phải Smart Account A deployment!");
      console.log("");
      console.log("3. Bạn CẦN deploy Smart Account A thật sự:");
      console.log("   a) Vào /delegation");
      console.log("   b) Connect Ví A (EOA 0x1bd5...)");
      console.log("   c) Click 'Deploy Smart Account via Factory'");
      console.log("   d) Sau khi deploy, Smart Account A sẽ có địa chỉ KHÁC (không phải 0x1bd5...)!");
      console.log("");
      console.log("4. SAU ĐÓ:");
      console.log("   - Transfer USDC từ EOA A đến Smart Account A mới");
      console.log("   - Tạo delegation MỚI với Smart Account A address mới");
      console.log("   - Redeem delegation");
    } else if (!codeB || codeB === '0x') {
      console.log("❌ Smart Account B không có bytecode!");
    } else {
      console.log("✅ Cả 2 Smart Accounts đều có bytecode!");
      console.log("");
      console.log("🤔 Nếu vẫn revert, có thể do:");
      console.log("1. Delegation signature không hợp lệ");
      console.log("2. Caveat enforcer reject (periodAmount, timestamp, etc.)");
      console.log("3. DelegationManager logic issue");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkAccountCode();


