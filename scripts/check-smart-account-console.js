/**
 * Check Smart Account Address
 * 
 * HOW TO USE:
 * 1. Mở trang http://localhost:3000/delegation trong browser
 * 2. Mở Developer Console (F12)
 * 3. Copy toàn bộ code này và paste vào Console
 * 4. Press Enter
 * 5. Connect Ví A khi được hỏi
 * 6. Smart Account A address sẽ hiện ra!
 */

(async () => {
  try {
    console.log("🔍 Checking Smart Account Address...");
    
    if (!window.ethereum) {
      throw new Error("MetaMask not installed!");
    }
    
    // Request accounts
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get EOA address
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const eoaAddress = accounts[0];
    
    console.log("✅ EOA Address:", eoaAddress);
    console.log("⏳ Computing Smart Account...");
    
    // Import dependencies
    const { toMetaMaskSmartAccount } = await import('@metamask/delegation-toolkit');
    const { createWalletClient, custom } = await import('viem');
    
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
    
    // Create wallet client
    const walletClient = createWalletClient({
      account: eoaAddress,
      transport: custom(window.ethereum),
      chain: monadTestnet,
    });
    
    // Get Smart Account
    const smartAccount = await toMetaMaskSmartAccount({
      client: walletClient,
      type: 'MultiSig',
    });
    
    console.log("");
    console.log("========================================");
    console.log("✅ RESULTS:");
    console.log("========================================");
    console.log("EOA Address:          ", eoaAddress);
    console.log("Smart Account Address:", smartAccount.address);
    console.log("========================================");
    console.log("");
    console.log("🔗 Check on Explorer:");
    console.log(`https://explorer.monad.xyz/address/${smartAccount.address}`);
    console.log("");
    console.log("⚠️ IMPORTANT:");
    console.log(`Khi tạo delegation, phải dùng Smart Account Address:`);
    console.log(`${smartAccount.address}`);
    console.log("");
    console.log("KHÔNG PHẢI EOA address:", eoaAddress);
    console.log("");
    
    // Also alert for easy copy
    alert(
      `✅ Smart Account Address:\n\n${smartAccount.address}\n\n` +
      `(EOA: ${eoaAddress})\n\n` +
      `Check on Explorer:\nhttps://explorer.monad.xyz/address/${smartAccount.address}`
    );
    
  } catch (error) {
    console.error("❌ Error:", error);
    alert(`❌ Error: ${error.message}`);
  }
})();

