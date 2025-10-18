/**
 * Deploy DelegationManager contract cho MetaMask Delegation Framework
 * Chạy trong browser console với MetaMask connected
 */

async function deployDelegationManager() {
  try {
    console.log("🚀 Deploying DelegationManager for MetaMask Framework...");
    
    // Import MetaMask SDK
    const { deployDeleGatorEnvironment } = await import('@metamask/delegation-toolkit/utils');
    const { createWalletClient, createPublicClient, custom, http } = await import('viem');
    
    // Monad testnet config
    const monadTestnet = {
      id: 41434,
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
        params: [{ chainId: '0xa1ba' }],
      });
    } catch (switchError) {
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

    // Create clients
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0])
    });

    const walletClient = createWalletClient({
      account: accounts[0],
      transport: custom(window.ethereum),
      chain: monadTestnet,
    });

    console.log("✅ Connected to Monad testnet");

    // Deploy DelegationManager environment
    console.log("🚀 Deploying DelegationManager...");
    const environment = await deployDeleGatorEnvironment(
      walletClient,
      publicClient,
      monadTestnet
    );
    
    console.log("✅ DelegationManager deployed successfully!");
    console.log(`📍 DelegationManager: ${environment.contracts.DelegationManager.address}`);
    
    // Save environment
    window.delegationEnvironment = environment;
    console.log("💾 Environment saved to window.delegationEnvironment");
    
    return environment;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Auto-run
deployDelegationManager();
