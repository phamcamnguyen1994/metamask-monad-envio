#!/usr/bin/env node

/**
 * Script kiểm tra delegation có được lưu vào blockchain không
 * Chạy: node scripts/check-delegation-blockchain.js
 */

// Load environment variables
require('dotenv').config();

const { createPublicClient, http } = require('viem');

async function checkDelegationOnBlockchain() {
  try {
    console.log("🔍 Checking delegation storage on blockchain...");
    
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

    // DelegationStorage contract address
    const DELEGATION_STORAGE_ADDRESS = "0xe84B332E28Cf0e6549ca25E944fb9c4484C633e1";
    
    // Contract ABI
    const contractAbi = [
      {
        "inputs": [
          {"name": "_delegator", "type": "address"},
          {"name": "_delegate", "type": "address"}
        ],
        "name": "isDelegationActive",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
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
      }
    ];

    // Create public client
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 2000
      })
    });

    // Check connection
    console.log("🔗 Checking Monad testnet connection...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected to Monad testnet. Block: ${blockNumber}`);

    // Delegation details from your message
    const delegator = "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C";
    const delegate = "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f";

    console.log(`\n🔍 Checking delegation:`);
    console.log(`   Delegator: ${delegator}`);
    console.log(`   Delegate: ${delegate}`);
    console.log(`   Contract: ${DELEGATION_STORAGE_ADDRESS}`);

    // Check if delegation is active on blockchain
    console.log("\n📖 Reading delegation from blockchain...");
    
    try {
      const isActive = await publicClient.readContract({
        address: DELEGATION_STORAGE_ADDRESS,
        abi: contractAbi,
        functionName: "isDelegationActive",
        args: [delegator, delegate]
      });

      console.log(`✅ Delegation active status: ${isActive}`);

      if (isActive) {
        // Get delegation details
        const [authority, caveats, signature, timestamp, isActiveStatus] = await publicClient.readContract({
          address: DELEGATION_STORAGE_ADDRESS,
          abi: contractAbi,
          functionName: "getDelegation",
          args: [delegator, delegate]
        });

        console.log(`\n📄 Delegation details from blockchain:`);
        console.log(`   Authority: ${authority}`);
        console.log(`   Caveats: ${caveats.length} items`);
        console.log(`   Signature: ${signature.slice(0, 10)}...`);
        console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
        console.log(`   Active: ${isActiveStatus}`);

        console.log("\n✅ SUCCESS: Delegation is stored on blockchain!");
        console.log("🎉 Blockchain storage is working correctly!");

      } else {
        console.log("\n❌ Delegation not found on blockchain");
        console.log("💡 This means delegation was only saved to localStorage");
        console.log("🔧 Need to create new delegation to test blockchain storage");
      }

    } catch (error) {
      console.error("❌ Error reading from blockchain:", error.message);
      
      if (error.message.includes("execution reverted")) {
        console.log("💡 Contract call reverted - delegation not found on blockchain");
      } else if (error.message.includes("HTTP request failed")) {
        console.log("💡 RPC connection issue - check network connection");
      }
    }

    // Check contract code
    console.log("\n🔍 Checking contract deployment...");
    const code = await publicClient.getCode({
      address: DELEGATION_STORAGE_ADDRESS
    });

    if (code && code !== '0x') {
      console.log(`✅ DelegationStorage contract is deployed`);
      console.log(`   Code length: ${code.length} characters`);
    } else {
      console.log(`❌ No contract found at ${DELEGATION_STORAGE_ADDRESS}`);
    }

  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

// Run check
checkDelegationOnBlockchain();


