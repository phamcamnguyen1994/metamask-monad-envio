/**
 * Script test delegation đơn giản trong browser console
 * Không cần deploy DelegationManager mới
 */

async function testSimpleDelegation() {
  try {
    console.log("🧪 Testing Simple Delegation...");
    
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      throw new Error("MetaMask not found!");
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    console.log(`👤 Connected account: ${accounts[0]}`);

    // Check localStorage for existing delegations
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    console.log(`📋 Found ${delegations.length} delegations in localStorage`);
    
    if (delegations.length === 0) {
      console.log("❌ No delegations found!");
      console.log("💡 Go to /delegation page to create a delegation first");
      return;
    }

    // Show delegations
    delegations.forEach((d, i) => {
      console.log(`\n📄 Delegation ${i + 1}:`);
      console.log(`   Delegator: ${d.delegator}`);
      console.log(`   Delegate: ${d.delegate}`);
      console.log(`   Status: ${d.status}`);
      console.log(`   Created: ${d.createdAt}`);
    });

    // Test delegation validation
    const activeDelegations = delegations.filter(d => d.status === 'ACTIVE');
    console.log(`\n✅ Active delegations: ${activeDelegations.length}`);

    if (activeDelegations.length > 0) {
      const delegation = activeDelegations[0];
      console.log(`\n🔍 Testing delegation validation:`);
      console.log(`   Signature: ${delegation.signature.slice(0, 10)}...`);
      console.log(`   Authority: ${delegation.authority}`);
      console.log(`   Caveats: ${delegation.caveats.length} items`);
      
      // Show caveats details
      delegation.caveats.forEach((caveat, i) => {
        console.log(`   Caveat ${i + 1}: ${caveat.type}`);
        if (caveat.periodAmount) {
          console.log(`     Period Amount: ${caveat.periodAmount}`);
        }
      });
    }

    console.log("\n✅ Delegation test completed!");
    console.log("💡 To test redemption:");
    console.log("   1. Go to /withdraw-delegation");
    console.log("   2. Check 'Use Gasless Transaction'");
    console.log("   3. Click 'Ví A chuyển Token cho Ví B'");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Chạy test
testSimpleDelegation();
