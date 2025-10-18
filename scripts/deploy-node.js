#!/usr/bin/env node

/**
 * Deploy DelegationStorage contract using Node.js
 * Chạy: node scripts/deploy-node.js
 */

// Load environment variables
require('dotenv').config();

const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

async function deployDelegationStorage() {
  try {
    console.log("🚀 Deploying DelegationStorage contract using Node.js...");
    
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

    // Create clients with fallback RPC
    const rpcUrl = process.env.MONAD_RPC_URL || monadTestnet.rpcUrls.default.http[0];
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(rpcUrl, {
        timeout: 120000, // 2 minutes
        retryCount: 5,
        retryDelay: 5000
      })
    });

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
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

    // Contract ABI (simplified)
    const contractAbi = [
      {
        "inputs": [
          {"name": "_delegate", "type": "address"},
          {"name": "_authority", "type": "bytes32"},
          {"name": "_caveats", "type": "bytes[]"},
          {"name": "_signature", "type": "bytes"}
        ],
        "name": "storeDelegation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_delegator", "type": "address"},
          {"name": "_delegate", "type": "address"}
        ],
        "name": "getDelegation",
        "outputs": [
          {"name": "authority", "type": "bytes32"},
          {"name": "caveats", "type": "bytes[]"},
          {"name": "signature", "type": "bytes"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "isActive", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_delegator", "type": "address"},
          {"name": "_delegate", "type": "address"}
        ],
        "name": "isDelegationActive",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // Contract bytecode (simplified - you'd need actual compiled bytecode)
    const contractBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556101a5806100326000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063a9059cbb14610051578063dd62ed3e1461007d578063f2fde38b146100ab575b600080fd5b61007b6004803603810190610076919061010d565b6100c7565b005b6100856100cd565b6040516100a29190610159565b60405180910390f35b6100c560048036038101906100c0919061010d565b6100d6565b005b5050565b60008054905090565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008135905061010781610174565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061015f82610136565b9050919050565b61016f81610154565b82525050565b600060208201905061018a6000830184610166565b92915050565b61019981610154565b81146101a457600080fd5b5056fea26469706673582212207d...";

    console.log("🚀 Deploying DelegationStorage contract...");
    
    // Deploy contract
    const hash = await walletClient.deployContract({
      abi: contractAbi,
      bytecode: contractBytecode,
      args: [],
    });

    console.log(`📝 Deployment transaction: ${hash}`);
    console.log("⏳ Waiting for deployment confirmation...");

    // Wait for deployment
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 120000 // 2 minutes
    });

    if (receipt.contractAddress) {
      console.log("✅ DelegationStorage deployed successfully!");
      console.log(`📍 Contract Address: ${receipt.contractAddress}`);
      console.log(`🔗 View on Explorer: https://explorer.monad.xyz/address/${receipt.contractAddress}`);
      
      // Save contract address to .env file
      const fs = require('fs');
      const path = require('path');
      
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = `NEXT_PUBLIC_DELEGATION_STORAGE_ADDRESS=${receipt.contractAddress}\n`;
      
      try {
        fs.appendFileSync(envPath, envContent);
        console.log("💾 Contract address saved to .env file");
      } catch (error) {
        console.log("⚠️ Could not save to .env file:", error.message);
        console.log(`💡 Manually add to .env: NEXT_PUBLIC_DELEGATION_STORAGE_ADDRESS=${receipt.contractAddress}`);
      }
      
      return receipt.contractAddress;
    } else {
      throw new Error("Contract deployment failed");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("PRIVATE_KEY")) {
      console.log("\n🔧 Setup instructions:");
      console.log("1. Get your private key from MetaMask");
      console.log("2. Set environment variable:");
      console.log("   Windows: set PRIVATE_KEY=0x1234...");
      console.log("   Linux/Mac: export PRIVATE_KEY=0x1234...");
      console.log("3. Run script again: node scripts/deploy-node.js");
    } else if (error.message.includes("Low balance")) {
      console.log("\n🔧 Get testnet MON:");
      console.log("1. Go to: https://faucet.monad.xyz");
      console.log(`2. Enter address: ${error.account || "your-address"}`);
      console.log("3. Request testnet MON");
    }
    
    process.exit(1);
  }
}

// Run deployment
deployDelegationStorage();
