/**
 * Browser-compatible script deploy DelegationManager
 * Không dùng ES modules import
 */

async function deployDelegationManager() {
  try {
    console.log("🚀 Deploying DelegationManager (browser-compatible)...");
    
    // Check if MetaMask SDK is available globally
    if (typeof window.metamaskDelegationToolkit === 'undefined') {
      console.log("❌ MetaMask Delegation Toolkit not loaded");
      console.log("💡 Please ensure the SDK is loaded in your app");
      
      // Try to load from CDN
      console.log("🔄 Attempting to load SDK from CDN...");
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@metamask/delegation-toolkit@latest/dist/index.js';
      script.onload = () => {
        console.log("✅ SDK loaded from CDN");
        deployDelegationManager();
      };
      script.onerror = () => {
        console.error("❌ Failed to load SDK from CDN");
        console.log("💡 Please use the app's built-in delegation functionality");
      };
      document.head.appendChild(script);
      return;
    }

    // Monad testnet config (chainId: 10143)
    const monadChain = {
      id: 10143,
      name: 'Monad Testnet',
      network: 'monad-testnet',
      nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.monad.testnet'],
        },
      },
      blockExplorers: {
        default: {
          name: 'Monad Explorer',
          url: 'https://explorer.monad.xyz',
        },
      },
      testnet: true,
    };

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    console.log(`👤 Using account: ${accounts[0]}`);

    // Switch to Monad testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2797' }], // 10143 in hex
      });
    } catch (switchError) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2797', // 10143 in hex
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

    // Use the app's existing delegation functionality
    console.log("🔄 Using app's delegation functionality...");
    
    // Check if smart account is available
    if (typeof window.getMetaMaskSmartAccount === 'function') {
      console.log("✅ Smart Account functionality available");
      
      try {
        const smartAccount = await window.getMetaMaskSmartAccount();
        console.log(`🏦 Smart Account: ${smartAccount.address}`);
        
        if (smartAccount.environment && smartAccount.environment.contracts) {
          console.log("✅ Delegation environment available");
          
          if (smartAccount.environment.contracts.DelegationManager) {
            console.log(`✅ DelegationManager found: ${smartAccount.environment.contracts.DelegationManager.address}`);
            console.log("🎉 Delegation functionality is ready!");
            return smartAccount.environment;
          } else {
            console.log("❌ DelegationManager not found in environment");
            console.log("💡 Need to deploy DelegationManager");
          }
        } else {
          console.log("❌ Delegation environment not available");
          console.log("💡 Need to setup delegation environment");
        }
      } catch (error) {
        console.error("❌ Smart Account error:", error);
      }
    } else {
      console.log("❌ Smart Account functionality not available");
      console.log("💡 Please use the app's delegation form");
    }

    console.log("\n💡 Alternative approach:");
    console.log("1. Go to /delegation page");
    console.log("2. Create a delegation");
    console.log("3. The app will handle DelegationManager deployment automatically");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("User rejected")) {
      console.log("💡 Please approve the transaction in MetaMask");
    } else if (error.message.includes("insufficient funds")) {
      console.log("💡 Get testnet MON from: https://faucet.monad.xyz");
    }
  }
}

// Auto-run
deployDelegationManager();
