/**
 * Deploy DelegationManager và Override Environment
 * Theo hướng dẫn chính thức từ MetaMask
 */

async function deployAndOverrideEnvironment() {
  try {
    console.log("🚀 Deploying DelegationManager and overriding environment...");
    
    // Import MetaMask SDK
    const { 
      deployDeleGatorEnvironment, 
      overrideDeployedEnvironment,
      getDeleGatorEnvironment 
    } = await import('@metamask/delegation-toolkit');
    
    const { createWalletClient, createPublicClient, custom, http } = await import('viem');

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

    // Check if environment already exists
    console.log("🔍 Checking for existing environment...");
    try {
      const existingEnv = getDeleGatorEnvironment(10143);
      if (existingEnv && existingEnv.contracts?.DelegationManager) {
        console.log("✅ Existing environment found!");
        console.log(`📍 DelegationManager: ${existingEnv.contracts.DelegationManager.address}`);
        return existingEnv;
      }
    } catch (error) {
      console.log("⚠️ No existing environment found, deploying new one...");
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

    // Create clients
    const publicClient = createPublicClient({
      chain: monadChain,
      transport: http(monadChain.rpcUrls.default.http[0])
    });

    const walletClient = createWalletClient({
      account: accounts[0],
      transport: custom(window.ethereum),
      chain: monadChain,
    });

    console.log("✅ Connected to Monad testnet");

    // Deploy DelegationManager environment
    console.log("🚀 Deploying DelegationManager...");
    const env = await deployDeleGatorEnvironment(
      walletClient,
      publicClient,
      monadChain
    );
    
    console.log("✅ DelegationManager deployed successfully!");
    console.log(`📍 DelegationManager: ${env.contracts.DelegationManager.address}`);
    console.log(`🔗 View on Explorer: https://explorer.monad.xyz/address/${env.contracts.DelegationManager.address}`);

    // Override deployed environment
    console.log("🔄 Overriding deployed environment...");
    overrideDeployedEnvironment(10143, "1.3.0", env);
    
    console.log("✅ Environment overridden successfully!");
    console.log("🎉 From now on, getDeleGatorEnvironment(10143) will return your deployed environment");

    // Verify override worked
    const newEnv = getDeleGatorEnvironment(10143);
    console.log(`✅ Verification: DelegationManager at ${newEnv.contracts.DelegationManager.address}`);

    // Save environment globally
    window.delegationEnvironment = env;
    console.log("💾 Environment saved to window.delegationEnvironment");

    return env;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Auto-run
deployAndOverrideEnvironment();
