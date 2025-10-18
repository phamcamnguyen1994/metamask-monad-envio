/**
 * Script deploy DelegationManager trong browser console
 * Copy và paste vào browser console khi đã connect MetaMask
 */

async function deployDelegationManager() {
  try {
    console.log("🚀 Deploying DelegationManager to Monad Testnet...");
    
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      throw new Error("MetaMask not found! Please install MetaMask extension.");
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length === 0) {
      throw new Error("No accounts found in MetaMask");
    }
    
    console.log(`👤 Using account: ${accounts[0]}`);

    // Switch to Monad testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa1ba' }], // 41434 in hex
      });
    } catch (switchError) {
      // Chain not added, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xa1ba',
          chainName: 'Monad Testnet',
          nativeCurrency: {
            name: 'Monad',
            symbol: 'MON',
            decimals: 18,
          },
          rpcUrls: ['https://rpc.monad.testnet'],
          blockExplorerUrls: ['https://explorer.monad.xyz'],
        }],
      });
    }

    console.log("✅ Connected to Monad testnet");

    // Check balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    
    const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
    console.log(`💰 Balance: ${balanceInEth.toFixed(4)} MON`);

    if (balanceInEth < 0.01) {
      console.warn("⚠️ Low balance! You may need MON for gas fees.");
      console.log("💡 Get testnet MON from: https://faucet.monad.xyz");
    }

    // Deploy DelegationManager using MetaMask SDK
    console.log("🚀 Deploying DelegationManager...");
    
    // Import SDK functions dynamically
    const { getMetaMaskSmartAccount } = await import('/lib/smartAccount.js');
    
    // Get smart account
    const smartAccount = await getMetaMaskSmartAccount();
    console.log(`🏦 Smart Account: ${smartAccount.address}`);
    
    // Deploy environment
    const { deployDeleGatorEnvironment } = await import('@metamask/delegation-toolkit/utils');
    
    const environment = await deployDeleGatorEnvironment(
      smartAccount.walletClient,
      smartAccount.publicClient,
      smartAccount.chain
    );
    
    console.log("✅ DelegationManager deployed successfully!");
    console.log(`📍 DelegationManager Address: ${environment.contracts.DelegationManager.address}`);
    
    // Save environment để sử dụng sau
    window.delegationEnvironment = environment;
    console.log("💾 Environment saved to window.delegationEnvironment");
    
    return environment;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("Cannot resolve module")) {
      console.log("\n🔧 Alternative: Deploy using existing tools");
      console.log("1. Go to: https://explorer.monad.xyz");
      console.log("2. Connect MetaMask to Monad testnet");
      console.log("3. Deploy DelegationManager contract manually");
      console.log("4. Or use MetaMask's built-in deployment tools");
    }
    
    throw error;
  }
}

// Chạy deployment
deployDelegationManager();
