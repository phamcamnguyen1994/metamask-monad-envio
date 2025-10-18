/**
 * Check revert reason của transaction
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

async function checkRevertReason() {
  try {
    const txHash = "0xa58878ddecf4c12fffe6d42e9482e94afcd0de10a365221ee706d62b321b42e9";
    
    console.log("🔍 Checking transaction revert reason");
    console.log("TX:", txHash);
    console.log("");
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 3000
      })
    });
    
    // Get transaction
    console.log("⏳ Fetching transaction...");
    const tx = await publicClient.getTransaction({ hash: txHash });
    
    console.log("✅ Transaction:");
    console.log("  - From:", tx.from);
    console.log("  - To:", tx.to);
    console.log("  - Value:", tx.value.toString());
    console.log("  - Gas:", tx.gas.toString());
    console.log("");
    
    // Get receipt
    console.log("⏳ Fetching receipt...");
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    
    console.log("✅ Receipt:");
    console.log("  - Status:", receipt.status);
    console.log("  - Gas Used:", receipt.gasUsed.toString());
    console.log("  - Block:", receipt.blockNumber.toString());
    console.log("");
    
    if (receipt.status === 'reverted') {
      console.log("❌ TRANSACTION REVERTED!");
      console.log("");
      
      // Try to simulate the transaction to get revert reason
      console.log("🔍 Attempting to get revert reason...");
      
      try {
        await publicClient.call({
          to: tx.to,
          from: tx.from,
          data: tx.input,
          value: tx.value,
        });
      } catch (error) {
        console.log("");
        console.log("========================================");
        console.log("❌ REVERT REASON:");
        console.log("========================================");
        console.log(error.message);
        console.log("========================================");
        console.log("");
        
        // Parse common errors
        if (error.message.includes("InvalidDelegation")) {
          console.log("⚠️ Delegation signature không hợp lệ!");
          console.log("");
          console.log("Có thể do:");
          console.log("1. Salt không khớp");
          console.log("2. Signature sai");
          console.log("3. Delegator address sai");
          console.log("4. Authority không hợp lệ");
        } else if (error.message.includes("InsufficientBalance")) {
          console.log("⚠️ Insufficient balance!");
        } else if (error.message.includes("Expired")) {
          console.log("⚠️ Delegation đã hết hạn!");
        } else if (error.message.includes("Unauthorized")) {
          console.log("⚠️ Không có quyền thực hiện action này!");
        }
      }
    } else {
      console.log("✅ Transaction SUCCESS!");
    }
    
    // Log input data để debug
    console.log("");
    console.log("📋 Input Data:");
    console.log(tx.input);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("rate limit")) {
      console.log("");
      console.log("⚠️ RPC rate limited. Check manually:");
      console.log("https://testnet.monadexplorer.com/tx/0xa58878ddecf4c12fffe6d42e9482e94afcd0de10a365221ee706d62b321b42e9");
    }
  }
}

checkRevertReason();


