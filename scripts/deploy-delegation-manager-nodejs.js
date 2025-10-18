#!/usr/bin/env node

/**
 * Deploy DelegationManager using Node.js
 * Chạy: node scripts/deploy-delegation-manager-nodejs.js
 */

// Load environment variables
require('dotenv').config();

const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

async function deployDelegationManager() {
  try {
    console.log("🚀 Deploying DelegationManager using Node.js...");
    
    // Get private key from environment
    let privateKey = process.env.DEPLOY_PK || process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.log("❌ DEPLOY_PK environment variable not found");
      console.log("💡 Add to .env file: DEPLOY_PK=0x1234...");
      console.log("⚠️  WARNING: Never share your private key!");
      process.exit(1);
    }
    
    console.log("✅ Found private key in environment");

    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    console.log(`👤 Using account: ${account.address}`);

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

    // Create clients with fallback RPC
    const rpcUrl = process.env.MONAD_RPC_URL || monadChain.rpcUrls.default.http[0];
    console.log(`🔗 Using RPC: ${rpcUrl}`);
    
    const publicClient = createPublicClient({
      chain: monadChain,
      transport: http(rpcUrl, {
        timeout: 120000, // 2 minutes
        retryCount: 5,
        retryDelay: 5000
      })
    });

    const walletClient = createWalletClient({
      account,
      chain: monadChain,
      transport: http(rpcUrl, {
        timeout: 120000,
        retryCount: 5,
        retryDelay: 5000
      })
    });

    // Check connection
    console.log("🔗 Checking Monad testnet connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected to Monad testnet. Block: ${blockNumber}`);

    // Check balance
    const balance = await publicClient.getBalance({
      address: account.address
    });
    
    const balanceInEth = Number(balance) / Math.pow(10, 18);
    console.log(`💰 Balance: ${balanceInEth.toFixed(4)} MON`);

    if (balanceInEth < 0.01) {
      console.warn("⚠️ Low balance! You may need MON for gas fees.");
      console.log("💡 Get testnet MON from: https://faucet.monad.xyz");
      console.log(`💡 Faucet address: ${account.address}`);
    }

    // Import MetaMask Delegation Toolkit
    console.log("📦 Loading MetaMask Delegation Toolkit...");
    
    // Import available functions
    const toolkit = require('@metamask/delegation-toolkit');
    const { getDeleGatorEnvironment } = toolkit;
    
    console.log("📦 Available functions:", Object.keys(toolkit).filter(key => typeof toolkit[key] === 'function'));
    
    // Check if deployment functions are available
    if (!toolkit.deployDeleGatorEnvironment) {
      console.log("❌ deployDeleGatorEnvironment not available in current SDK version");
      console.log("💡 Current SDK version may not support deployment");
      console.log("🔧 Try using browser-based deployment instead");
      throw new Error("Deployment function not available in SDK");
    }
    
    const { deployDeleGatorEnvironment, overrideDeployedEnvironment } = toolkit;

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

    // Save contract address to .env file
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS=${env.contracts.DelegationManager.address}\n`;
    
    try {
      fs.appendFileSync(envPath, envContent);
      console.log("💾 Contract address saved to .env file");
    } catch (error) {
      console.log("⚠️ Could not save to .env file:", error.message);
      console.log(`💡 Manually add to .env: NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS=${env.contracts.DelegationManager.address}`);
    }

    // Create environment export file for app
    const envExportPath = path.join(__dirname, '..', 'delegation-environment.json');
    const envExport = {
      chainId: 10143,
      version: "1.3.0",
      contracts: {
        DelegationManager: {
          address: env.contracts.DelegationManager.address,
          abi: env.contracts.DelegationManager.abi
        }
      },
      deployedAt: new Date().toISOString(),
      deployedBy: account.address
    };

    try {
      fs.writeFileSync(envExportPath, JSON.stringify(envExport, null, 2));
      console.log("💾 Environment exported to delegation-environment.json");
    } catch (error) {
      console.log("⚠️ Could not export environment:", error.message);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Next steps:");
    console.log("   1. Restart your Next.js app to load new environment");
    console.log("   2. Test delegation creation");
    console.log("   3. Test delegation redeem");

    return env;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("PRIVATE_KEY")) {
      console.log("\n🔧 Setup instructions:");
      console.log("1. Get your private key from MetaMask");
      console.log("2. Set environment variable:");
      console.log("   Windows: set DEPLOY_PK=0x1234...");
      console.log("   Linux/Mac: export DEPLOY_PK=0x1234...");
      console.log("3. Run script again: node scripts/deploy-delegation-manager-nodejs.js");
    } else if (error.message.includes("Low balance")) {
      console.log("\n🔧 Get testnet MON:");
      console.log("1. Go to: https://faucet.monad.xyz");
      console.log(`2. Enter address: ${error.account || "your-address"}`);
      console.log("3. Request testnet MON");
    } else if (error.message.includes("Cannot find module")) {
      console.log("\n🔧 Install dependencies:");
      console.log("1. Run: npm install");
      console.log("2. Make sure @metamask/delegation-toolkit is installed");
    }
    
    process.exit(1);
  }
}

// Run deployment
deployDelegationManager();
