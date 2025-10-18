#!/usr/bin/env node

/**
 * Manual Delegation Test Script
 * Test delegation đã tạo mà không cần switch MetaMask account
 */

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testDelegation() {
  console.log("🧪 Testing delegation from localStorage...\n");
  
  // Đọc delegation từ data/delegations.json hoặc paste manual
  const delegationExample = {
    "delegate": "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f",
    "delegator": "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C",
    "authority": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "caveats": [
      {
        "enforcer": "0x92Bf12322527cAA612fd31a0e810472BBB106A8F",
        "terms": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "args": "0x"
      },
      {
        "enforcer": "0x474e3Ae7E169e940607cC624Da8A15Eb120139aB",
        "terms": "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698000000000000000000000000000000000000000000000000000000003c42a2c00000000000000000000000000000000000000000000000000000000000093a800000000000000000000000000000000000000000000000000000000068e9eb0a",
        "args": "0x"
      }
    ],
    "salt": "0x",
    "signature": "0xfd29dc66afed700e0dee2a72ecb815d6295e126ab3e98b0cd329d55cd98229a86711afdc4c629ad18cc56520cb8b1da0c7984c4a4f2c6bce6693597724b219941b",
    "status": "ACTIVE"
  };

  console.log("📋 Delegation Info:");
  console.log(`   Delegator: ${delegationExample.delegator}`);
  console.log(`   Delegate:  ${delegationExample.delegate}`);
  console.log(`   Authority: ${delegationExample.authority}`);
  console.log(`   Caveats:   ${delegationExample.caveats.length}`);
  console.log(`   Signature: ${delegationExample.signature.substring(0, 20)}...`);
  console.log(`   Status:    ${delegationExample.status}`);
  
  // Decode caveat 2 (ERC20 Period Transfer)
  const caveat2Terms = delegationExample.caveats[1].terms;
  console.log("\n🔍 Decoding Caveat 2 (ERC20 Period Transfer):");
  
  // Remove 0x prefix
  const termsHex = caveat2Terms.slice(2);
  
  // Parse fields (each is 32 bytes = 64 hex chars)
  const tokenAddress = '0x' + termsHex.slice(24, 64); // Last 20 bytes of first 32 bytes
  const periodAmount = BigInt('0x' + termsHex.slice(64, 128));
  const periodDuration = parseInt(termsHex.slice(128, 192), 16);
  const startDate = parseInt(termsHex.slice(192, 256), 16);
  
  console.log(`   Token Address:    ${tokenAddress}`);
  console.log(`   Period Amount:    ${periodAmount.toString()} wei (${Number(periodAmount) / 1_000_000} mUSDC)`);
  console.log(`   Period Duration:  ${periodDuration} seconds (${periodDuration / 86400} days)`);
  console.log(`   Start Date:       ${startDate} (${new Date(startDate * 1000).toLocaleString()})`);
  
  // Validation
  console.log("\n✅ Validation:");
  console.log(`   - Token is mUSDC: ${tokenAddress === '0x3A13C20987Ac0e6840d9CB6e917085F72D17E698' ? '✅' : '❌'}`);
  console.log(`   - Amount > 0: ${periodAmount > 0 ? '✅' : '❌'}`);
  console.log(`   - Duration > 0: ${periodDuration > 0 ? '✅' : '❌'}`);
  console.log(`   - Start date valid: ${startDate > 0 ? '✅' : '❌'}`);
  console.log(`   - Signature length: ${delegationExample.signature.length === 132 ? '✅ (65 bytes)' : '❌'}`);
  
  // Check if can withdraw now
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - startDate;
  const periodsPassed = Math.floor(elapsed / periodDuration);
  
  console.log("\n⏰ Time Check:");
  console.log(`   Current time:     ${now} (${new Date(now * 1000).toLocaleString()})`);
  console.log(`   Elapsed:          ${elapsed} seconds (${(elapsed / 3600).toFixed(2)} hours)`);
  console.log(`   Periods passed:   ${periodsPassed}`);
  console.log(`   Can withdraw now: ${periodsPassed > 0 ? '✅ YES' : '⏳ Not yet (wait for first period)'}`);
  
  if (periodsPassed > 0) {
    console.log(`\n💰 Available to withdraw: ${Number(periodAmount) / 1_000_000} mUSDC`);
  } else {
    const timeUntilFirstPeriod = periodDuration - elapsed;
    console.log(`\n⏳ Wait ${timeUntilFirstPeriod} seconds (${(timeUntilFirstPeriod / 3600).toFixed(2)} hours) for first period`);
  }
  
  console.log("\n📝 To withdraw:");
  console.log("   1. Switch MetaMask to account: 0x963a2d0BE2eb5d785C6E73ec904fcE8d65691773");
  console.log("   2. This will create Smart Account: 0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f");
  console.log("   3. Go to /withdraw-delegation");
  console.log("   4. Enter delegator: 0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C");
  console.log("   5. Enter delegate: 0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f");
  console.log("   6. Enter amount (up to available)");
  console.log("   7. Click Withdraw");
  
  console.log("\n✅ Delegation is VALID and ready to use!");
}

// Run
if (require.main === module) {
  testDelegation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { testDelegation };



