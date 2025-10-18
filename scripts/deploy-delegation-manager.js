#!/usr/bin/env node

/**
 * Script để deploy DelegationManager contract trên Monad testnet
 * Chạy: node scripts/deploy-delegation-manager.js
 */

console.log("🚀 Deploying DelegationManager to Monad Testnet...");

async function deployDelegationManager() {
  try {
    // Import dynamic để tránh lỗi module trong Node.js
    const { createWalletClient, custom, http, createPublicClient } = await import("viem");
    const { deployDeleGatorEnvironment } = await import("@metamask/delegation-toolkit/utils");

    // Monad testnet chain config
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
        public: {
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

    // Tạo clients
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 2000
      })
    });

    // Kiểm tra connection
    console.log("🔗 Checking Monad testnet connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected to Monad testnet. Block: ${blockNumber}`);

    // Tạo wallet client (cần MetaMask hoặc private key)
    console.log("⚠️  Cần MetaMask hoặc private key để deploy...");
    
    // Option 1: Sử dụng MetaMask (trong browser)
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log("🌐 Detected MetaMask in browser environment");
      
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        throw new Error("No accounts found in MetaMask");
      }
      
      const walletClient = createWalletClient({
        account: accounts[0],
        transport: custom(window.ethereum),
        chain: monadTestnet,
      });
      
      console.log(`👤 Using account: ${accounts[0]}`);
      
      // Deploy DelegationManager
      console.log("🚀 Deploying DelegationManager...");
      const environment = await deployDeleGatorEnvironment(
        walletClient,
        publicClient,
        monadTestnet
      );
      
      console.log("✅ DelegationManager deployed successfully!");
      console.log(`📍 DelegationManager Address: ${environment.contracts.DelegationManager.address}`);
      
      return environment;
      
    } else {
      // Option 2: Sử dụng private key (trong Node.js)
      console.log("🖥️  Node.js environment detected");
      console.log("❌ Cannot deploy from Node.js without private key");
      console.log("💡 Solutions:");
      console.log("   1. Run this script in browser console");
      console.log("   2. Add private key to environment variables");
      console.log("   3. Use MetaMask browser extension");
      
      throw new Error("Deployment requires MetaMask or private key");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("Cannot deploy from Node.js")) {
      console.log("\n🔧 Alternative deployment methods:");
      console.log("1. Run in browser console:");
      console.log("   - Open browser dev tools");
      console.log("   - Paste this script in console");
      console.log("   - Make sure MetaMask is connected");
      console.log("\n2. Use MetaMask directly:");
      console.log("   - Go to https://explorer.monad.xyz");
      console.log("   - Connect MetaMask to Monad testnet");
      console.log("   - Deploy DelegationManager contract");
    }
    
    process.exit(1);
  }
}

// Chạy deployment
deployDelegationManager();


