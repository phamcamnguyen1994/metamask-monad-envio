/**
 * Script tìm existing DelegationManager trên Monad testnet
 * Chạy trong browser console
 */

async function findExistingDelegationManager() {
  try {
    console.log("🔍 Searching for existing DelegationManager on Monad testnet...");
    
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      throw new Error("MetaMask not found!");
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    console.log(`👤 Using account: ${accounts[0]}`);

    // Switch to Monad testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa1ba' }], // 41434 in hex
      });
    } catch (switchError) {
      console.log("❌ Please add Monad testnet to MetaMask first");
      return;
    }

    console.log("✅ Connected to Monad testnet");

    // Common DelegationManager addresses on different networks
    const commonAddresses = [
      '0xbe4138886cb096bdc1b930f2f0ca7892aa234d78', // Sepolia
      '0x0000000000000000000000000000000000000000', // Placeholder
    ];

    console.log("🔍 Checking common DelegationManager addresses...");
    
    for (const address of commonAddresses) {
      try {
        const code = await window.ethereum.request({
          method: 'eth_getCode',
          params: [address, 'latest'],
        });
        
        if (code && code !== '0x') {
          console.log(`✅ Found contract at ${address}`);
          console.log(`   Code length: ${code.length} characters`);
        } else {
          console.log(`❌ No contract at ${address}`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${address}: ${error.message}`);
      }
    }

    // Check MetaMask SDK environment
    console.log("\n🔍 Checking MetaMask SDK environment...");
    
    try {
      // Import SDK functions
      const { getMetaMaskSmartAccount } = await import('/lib/smartAccount.js');
      
      const smartAccount = await getMetaMaskSmartAccount();
      console.log(`🏦 Smart Account: ${smartAccount.address}`);
      
      // Check if environment has DelegationManager
      if (smartAccount.environment && smartAccount.environment.contracts) {
        console.log("✅ Smart Account environment found");
        
        if (smartAccount.environment.contracts.DelegationManager) {
          const dm = smartAccount.environment.contracts.DelegationManager;
          console.log(`✅ DelegationManager found: ${dm.address}`);
          console.log(`   ABI functions: ${dm.abi.length} functions`);
          
          // Test if contract exists on chain
          const code = await window.ethereum.request({
            method: 'eth_getCode',
            params: [dm.address, 'latest'],
          });
          
          if (code && code !== '0x') {
            console.log(`✅ DelegationManager is deployed at ${dm.address}`);
            console.log("🎉 You can use delegation redemption!");
          } else {
            console.log(`❌ DelegationManager not deployed at ${dm.address}`);
            console.log("💡 Need to deploy DelegationManager first");
          }
        } else {
          console.log("❌ DelegationManager not found in environment");
        }
      } else {
        console.log("❌ Smart Account environment not available");
      }
      
    } catch (error) {
      console.log(`❌ Error checking SDK environment: ${error.message}`);
    }

    console.log("\n💡 Next steps:");
    console.log("1. If DelegationManager found: Test delegation redemption");
    console.log("2. If not found: Deploy DelegationManager or use regular transfer");
    console.log("3. Check Monad Explorer: https://explorer.monad.xyz");
    
  } catch (error) {
    console.error("❌ Search failed:", error);
  }
}

// Chạy search
findExistingDelegationManager();


