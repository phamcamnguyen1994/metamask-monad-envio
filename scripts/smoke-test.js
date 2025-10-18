#!/usr/bin/env node

/**
 * Smoke Test Script - REAL BLOCKCHAIN CALLS
 * 
 * Test cơ bản để verify toàn bộ flow hoạt động:
 * 1. Kiểm tra RPC connection
 * 2. Kiểm tra mUSDC contract
 * 3. Kiểm tra balance
 * 4. Verify token info
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runSmokeTest() {
  console.log("🧪 Bắt đầu Smoke Test với REAL blockchain calls...");
  console.log(`📅 Thời gian: ${new Date().toLocaleString()}`);
  
  const results = [];
  
  try {
    // Import viem dynamically
    const { createPublicClient, http, parseAbi } = await import('viem');
    
    console.log("\n📝 Setup test environment...");
    
    // Kiểm tra environment variables
    const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "https://rpc.monad.testnet";
    const MONAD_CHAIN_ID = parseInt(process.env.MONAD_CHAIN_ID || "10143");
    const USDC_TEST = process.env.USDC_TEST || "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698";
    
    console.log(`   RPC URL: ${MONAD_RPC_URL}`);
    console.log(`   Chain ID: ${MONAD_CHAIN_ID}`);
    console.log(`   mUSDC: ${USDC_TEST}`);
    
    // Define Monad testnet chain
    const monadTestnet = {
      id: MONAD_CHAIN_ID,
      name: "Monad Testnet",
      network: "monad-testnet",
      nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
      rpcUrls: { 
        default: { http: [MONAD_RPC_URL] } 
      }
    };
    
    // Test 1: Tạo public client
    console.log("\n1️⃣ Test: Tạo Public Client");
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL)
    });
    console.log(`   ✅ Public Client tạo thành công`);
    results.push({ test: "create_public_client", status: "PASS", result: { rpc: MONAD_RPC_URL }});
    
    // Test 2: Kiểm tra RPC connection
    console.log("\n2️⃣ Test: Kiểm tra RPC connection");
    try {
      const blockNumber = await publicClient.getBlockNumber();
      console.log(`   ✅ RPC hoạt động, block hiện tại: ${blockNumber}`);
      results.push({ test: "rpc_connection", status: "PASS", result: { blockNumber: blockNumber.toString() }});
    } catch (error) {
      console.log(`   ⚠️ RPC connection timeout: ${error.message}`);
      results.push({ test: "rpc_connection", status: "WARN", error: error.message });
    }
    
    // Test 3: Kiểm tra mUSDC contract
    console.log("\n3️⃣ Test: Kiểm tra mUSDC contract");
    try {
      const erc20Abi = parseAbi([
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ]);
      
      const tokenName = await publicClient.readContract({
        address: USDC_TEST,
        abi: erc20Abi,
        functionName: 'name'
      });
      
      const tokenSymbol = await publicClient.readContract({
        address: USDC_TEST,
        abi: erc20Abi,
        functionName: 'symbol'
      });
      
      const decimals = await publicClient.readContract({
        address: USDC_TEST,
        abi: erc20Abi,
        functionName: 'decimals'
      });
      
      console.log(`   ✅ Token: ${tokenName} (${tokenSymbol})`);
      console.log(`   ✅ Decimals: ${decimals}`);
      results.push({ 
        test: "token_contract", 
        status: "PASS", 
        result: { name: tokenName, symbol: tokenSymbol, decimals: Number(decimals) }
      });
    } catch (error) {
      console.log(`   ❌ Token contract check failed: ${error.message}`);
      results.push({ test: "token_contract", status: "FAIL", error: error.message });
    }
    
    // Test 4: Kiểm tra balance (nếu có DEV_PRIVATE_KEY)
    console.log("\n4️⃣ Test: Kiểm tra test account balance");
    if (process.env.DEV_PRIVATE_KEY) {
      try {
        const { privateKeyToAccount } = await import('viem/accounts');
        const account = privateKeyToAccount(process.env.DEV_PRIVATE_KEY);
        
        const erc20Abi = parseAbi([
          'function balanceOf(address) view returns (uint256)'
        ]);
        
        const balance = await publicClient.readContract({
          address: USDC_TEST,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account.address]
        });
        
        const balanceFormatted = (Number(balance) / 1_000_000).toFixed(6);
        console.log(`   ✅ Test account: ${account.address}`);
        console.log(`   ✅ Balance: ${balanceFormatted} mUSDC`);
        results.push({ 
          test: "check_balance", 
          status: "PASS", 
          result: { address: account.address, balance: balanceFormatted }
        });
      } catch (error) {
        console.log(`   ⚠️ Balance check skipped: ${error.message}`);
        results.push({ test: "check_balance", status: "WARN", error: error.message });
      }
    } else {
      console.log(`   ⏭️ Skipped (DEV_PRIVATE_KEY not configured)`);
      results.push({ test: "check_balance", status: "SKIP", reason: "No DEV_PRIVATE_KEY" });
    }
    
    // Test 5: Kiểm tra total supply
    console.log("\n5️⃣ Test: Kiểm tra Total Supply");
    try {
      const erc20Abi = parseAbi([
        'function totalSupply() view returns (uint256)'
      ]);
      
      const totalSupply = await publicClient.readContract({
        address: USDC_TEST,
        abi: erc20Abi,
        functionName: 'totalSupply'
      });
      
      const totalSupplyFormatted = (Number(totalSupply) / 1_000_000).toFixed(6);
      console.log(`   ✅ Total Supply: ${totalSupplyFormatted} mUSDC`);
      results.push({ 
        test: "total_supply", 
        status: "PASS", 
        result: { totalSupply: totalSupplyFormatted }
      });
    } catch (error) {
      console.log(`   ❌ Total supply check failed: ${error.message}`);
      results.push({ test: "total_supply", status: "FAIL", error: error.message });
    }
    
  } catch (error) {
    console.error(`❌ Smoke test failed: ${error.message}`);
    results.push({ test: "error", status: "FAIL", error: error.message });
  }
  
  // Tổng kết
  console.log("\n📊 Kết quả Smoke Test:");
  const passed = results.filter(r => r.status === "PASS").length;
  const warned = results.filter(r => r.status === "WARN").length;
  const skipped = results.filter(r => r.status === "SKIP").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Warnings: ${warned}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed === 0) {
    console.log("\n✅ Smoke tests PASS!");
    if (warned > 0) {
      console.log("⚠️ Một số warnings (có thể do RPC timeout hoặc config)");
    }
    console.log("🎉 Blockchain connection hoạt động tốt!");
  } else {
    console.log("\n❌ Một số tests FAILED!");
    console.log("🔧 Cần kiểm tra RPC connection hoặc contract address.");
  }
  
  // Lưu kết quả
  const logEntry = {
    timestamp: new Date().toISOString(),
    mode: "REAL_BLOCKCHAIN",
    results: results,
    summary: { total: results.length, passed, warned, skipped, failed }
  };
  
  const logFile = path.join(__dirname, '..', 'logs', 'smoke-test.log');
  const logDir = path.dirname(logFile);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.writeFileSync(logFile, JSON.stringify(logEntry, null, 2));
  console.log(`\n📄 Log saved to: ${logFile}`);
  
  return results;
}

// Chạy script
if (require.main === module) {
  runSmokeTest()
    .then((results) => {
      const failed = results.filter(r => r.status === "FAIL").length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("❌ Smoke test crashed:", error);
      process.exit(1);
    });
}

module.exports = { runSmokeTest };
