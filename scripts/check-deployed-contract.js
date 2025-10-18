/**
 * Check deployed Smart Account address from transaction
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

async function checkDeployedContract() {
  try {
    const txHash = "0x26337a459b7bb0c46003a6e3da6224e2a00f8c9625915c928be8984c5617a9b4";
    
    console.log("🔍 Checking transaction:", txHash);
    console.log("");
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 3000
      })
    });
    
    // Get transaction receipt
    console.log("⏳ Fetching transaction receipt...");
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    
    console.log("✅ Transaction Receipt:");
    console.log("  - Status:", receipt.status);
    console.log("  - Block:", receipt.blockNumber.toString());
    console.log("  - From:", receipt.from);
    console.log("  - To:", receipt.to || "CONTRACT CREATION");
    console.log("  - Gas Used:", receipt.gasUsed.toString());
    console.log("");
    
    // Get transaction details
    console.log("⏳ Fetching transaction details...");
    const tx = await publicClient.getTransaction({ hash: txHash });
    
    console.log("✅ Transaction Details:");
    console.log("  - From:", tx.from);
    console.log("  - To:", tx.to || "CONTRACT CREATION");
    console.log("  - Value:", tx.value.toString());
    console.log("");
    
    // Check if this is a contract creation or contract call
    if (!tx.to) {
      // Direct contract creation
      console.log("🏭 CONTRACT CREATION DETECTED!");
      console.log("");
      console.log("========================================");
      console.log("✅ DEPLOYED CONTRACT ADDRESS:");
      console.log(receipt.contractAddress);
      console.log("========================================");
      console.log("");
      console.log("🔗 Check on Explorer:");
      console.log(`https://testnet.monadexplorer.com/address/${receipt.contractAddress}`);
    } else {
      // Contract call (factory deployment)
      console.log("🏭 CONTRACT CALL (Factory Deployment)");
      console.log("  - Factory:", tx.to);
      console.log("");
      
      // Parse logs to find deployed contract
      console.log("📋 Logs:");
      receipt.logs.forEach((log, idx) => {
        console.log(`  Log ${idx}:`);
        console.log(`    - Address: ${log.address}`);
        console.log(`    - Topics:`, log.topics);
        
        // Check if this is a contract creation event
        // Usually the first topic is the event signature
        // and subsequent topics contain addresses
        if (log.topics.length > 1) {
          // Try to extract address from topics
          const possibleAddress = '0x' + log.topics[1].slice(26); // Remove '0x' and take last 40 chars
          console.log(`    - Possible Address: ${possibleAddress}`);
        }
      });
      
      console.log("");
      console.log("========================================");
      console.log("⚠️ FACTORY DEPLOYMENT");
      console.log("========================================");
      console.log("Factory Address:", tx.to);
      console.log("");
      console.log("🔍 To find deployed contract:");
      console.log("1. Check logs above for contract address");
      console.log("2. Or check transaction on Explorer:");
      console.log(`   https://testnet.monadexplorer.com/tx/${txHash}`);
      console.log("3. Look for 'Internal Transactions' tab");
      console.log("4. The 'To' address in internal txn is your Smart Account!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("rate limit")) {
      console.log("");
      console.log("⚠️ RPC rate limited. Please check manually:");
      console.log("https://testnet.monadexplorer.com/tx/0x26337a459b7bb0c46003a6e3da6224e2a00f8c9625915c928be8984c5617a9b4");
      console.log("");
      console.log("Look for:");
      console.log("1. 'Internal Transactions' tab");
      console.log("2. The 'To' address is your Smart Account A");
    }
  }
}

checkDeployedContract();


