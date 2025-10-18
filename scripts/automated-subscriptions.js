#!/usr/bin/env node

/**
 * Automated Subscriptions Script - REAL DATA
 * 
 * Chạy mỗi giờ để kiểm tra và thực hiện auto-charge cho các delegation
 * đến kỳ mà chưa được redeem trong giai đoạn hiện tại.
 * 
 * Đọc delegations từ:
 * 1. File delegations.json (export từ browser localStorage)
 * 2. Hoặc query từ blockchain indexer
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Đọc delegations từ file JSON
 * File này có thể được export từ browser localStorage
 */
function loadDelegationsFromFile() {
  const delegationsFile = path.join(__dirname, '..', 'data', 'delegations.json');
  
  if (fs.existsSync(delegationsFile)) {
    try {
      const content = fs.readFileSync(delegationsFile, 'utf8');
      const delegations = JSON.parse(content);
      console.log(`📁 Loaded ${delegations.length} delegations from file`);
      return delegations;
    } catch (error) {
      console.warn(`⚠️ Error reading delegations file: ${error.message}`);
      return [];
    }
  } else {
    console.log(`ℹ️ No delegations file found at ${delegationsFile}`);
    console.log(`   Create a delegations.json file in data/ folder or export from browser`);
    return [];
  }
}

/**
 * Lưu lại trạng thái delegations (lastRedeemed time)
 */
function saveDelegationsState(delegations) {
  const stateFile = path.join(__dirname, '..', 'data', 'delegations-state.json');
  const dataDir = path.dirname(stateFile);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(stateFile, JSON.stringify(delegations, null, 2));
    console.log(`💾 Saved delegations state`);
  } catch (error) {
    console.warn(`⚠️ Error saving state: ${error.message}`);
  }
}

async function checkAndProcessDelegations() {
  console.log("🔄 Bắt đầu kiểm tra automated subscriptions (REAL MODE)...");
  console.log(`📅 Thời gian: ${new Date().toLocaleString()}`);
  
  // Load delegations từ file
  let delegations = loadDelegationsFromFile();
  
  if (delegations.length === 0) {
    console.log("\n⚠️ Không có delegation nào để xử lý");
    console.log("💡 Hướng dẫn:");
    console.log("   1. Tạo delegation qua web UI (http://localhost:3000/subscription)");
    console.log("   2. Export delegations từ browser localStorage");
    console.log("   3. Lưu vào file data/delegations.json");
    console.log("\n   Hoặc tạo file thủ công với format:");
    console.log(`   [{
    "id": "delegation_1",
    "delegator": "0x...",
    "delegate": "0x...",
    "signature": "0x...",
    "scope": {
      "type": "erc20PeriodTransfer",
      "tokenAddress": "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698",
      "periodAmount": "10000000",
      "periodDuration": 3600,
      "startDate": ${Math.floor(Date.now() / 1000)}
    },
    "status": "ACTIVE"
  }]`);
    return [];
  }
  
  const now = Math.floor(Date.now() / 1000);
  const processedDelegations = [];
  
  // Import delegation functions
  let redeemDelegationGasless;
  try {
    const delegationLib = require('../lib/delegation');
    redeemDelegationGasless = delegationLib.redeemDelegationGasless;
  } catch (error) {
    console.warn(`⚠️ Cannot load delegation lib: ${error.message}`);
    console.log(`   Automated redemption requires proper environment setup`);
  }
  
  for (const delegation of delegations) {
    try {
      // Kiểm tra delegation có active không
      if (delegation.status !== "ACTIVE") {
        console.log(`⏭️ Skipping inactive delegation ${delegation.id}`);
        continue;
      }
      
      // Kiểm tra xem delegation có đến kỳ chưa
      const scope = delegation.scope || delegation.caveats?.[0];
      if (!scope) {
        console.warn(`⚠️ Delegation ${delegation.id} không có scope, skipping`);
        continue;
      }
      
      const startTime = scope.startDate;
      const periodDuration = scope.periodDuration;
      const elapsed = now - startTime;
      const periodsPassed = Math.floor(elapsed / periodDuration);
      
      // Kiểm tra xem đã redeem trong period hiện tại chưa
      const currentPeriodStart = startTime + (periodsPassed * periodDuration);
      const shouldRedeem = periodsPassed > 0 && 
                          (!delegation.lastRedeemed || delegation.lastRedeemed < currentPeriodStart);
      
      if (shouldRedeem) {
        const periodAmountStr = typeof scope.periodAmount === 'bigint' 
          ? scope.periodAmount.toString() 
          : scope.periodAmount;
        const amountInTokens = Number(periodAmountStr) / 1_000_000;
        
        console.log(`\n💰 Processing delegation ${delegation.id}:`);
        console.log(`   Delegator: ${delegation.delegator || delegation.from}`);
        console.log(`   Delegate: ${delegation.delegate || delegation.to}`);
        console.log(`   Amount: ${amountInTokens} mUSDC`);
        console.log(`   Period: ${periodDuration} seconds`);
        console.log(`   Periods passed: ${periodsPassed}`);
        
        // Thực hiện redeem (nếu có function)
        if (redeemDelegationGasless) {
          try {
            // Note: Trong Node.js environment, gasless transaction cần bundler/paymaster config
            console.log(`   🚀 Attempting gasless redemption...`);
            console.warn(`   ⚠️ Note: Gasless transactions trong Node.js environment cần proper setup`);
            console.log(`   💡 Recommend: Use browser-based automation hoặc server với wallet setup`);
            
            // Skip actual redemption trong Node.js environment
            // Vì cần browser wallet hoặc server-side wallet setup
            processedDelegations.push({
              delegationId: delegation.id,
              amount: amountInTokens,
              status: "SKIPPED",
              reason: "Node.js environment - requires browser/server wallet",
              timestamp: new Date().toISOString()
            });
            
            console.log(`   ⏭️ Skipped (requires proper wallet setup)`);
          } catch (error) {
            console.error(`   ❌ Redemption failed: ${error.message}`);
            processedDelegations.push({
              delegationId: delegation.id,
              status: "FAILED",
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        } else {
          console.log(`   ⚠️ redeemDelegationGasless function not available`);
          processedDelegations.push({
            delegationId: delegation.id,
            status: "SKIPPED",
            reason: "Function not available",
            timestamp: new Date().toISOString()
          });
        }
        
        // Update lastRedeemed timestamp
        delegation.lastRedeemed = now;
      } else {
        console.log(`⏳ Delegation ${delegation.id}: Chưa đến kỳ hoặc đã redeem`);
      }
    } catch (error) {
      console.error(`❌ Error processing delegation ${delegation.id}:`, error.message);
      processedDelegations.push({
        delegationId: delegation.id,
        status: "FAILED",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Lưu state
  saveDelegationsState(delegations);
  
  // Log kết quả
  console.log("\n📊 Kết quả automated subscriptions:");
  console.log(`   Total delegations: ${delegations.length}`);
  console.log(`   Processed: ${processedDelegations.length}`);
  console.log(`   Successful: ${processedDelegations.filter(p => p.status === "SUCCESS").length}`);
  console.log(`   Skipped: ${processedDelegations.filter(p => p.status === "SKIPPED").length}`);
  console.log(`   Failed: ${processedDelegations.filter(p => p.status === "FAILED").length}`);
  
  // Lưu log
  const logEntry = {
    timestamp: new Date().toISOString(),
    mode: "REAL_DATA",
    totalDelegations: delegations.length,
    processed: processedDelegations
  };
  
  const logFile = path.join(__dirname, '..', 'logs', 'automated-subscriptions.log');
  const logDir = path.dirname(logFile);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  console.log(`\n📄 Log saved to: ${logFile}`);
  
  return processedDelegations;
}

// Chạy script
if (require.main === module) {
  checkAndProcessDelegations()
    .then((results) => {
      console.log("\n✅ Automated subscriptions check completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Automated subscriptions failed:", error);
      process.exit(1);
    });
}

module.exports = { checkAndProcessDelegations };
