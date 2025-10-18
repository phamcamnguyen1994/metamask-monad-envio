/**
 * Browser console script để check delegation trên blockchain
 * Copy và paste vào browser console
 */

async function checkDelegationOnBlockchain() {
  try {
    console.log("🔍 Checking delegation on blockchain...");
    
    const contractAddress = "0xe84B332E28Cf0e6549ca25E944fb9c4484C633e1";
    const delegator = "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C";
    const delegate = "0xa51DbFfE49FA6Fe3fC873094e47184aE624cd76f";
    
    console.log(`📋 Contract: ${contractAddress}`);
    console.log(`👤 Delegator: ${delegator}`);
    console.log(`🎯 Delegate: ${delegate}`);
    
    // ABI encode isDelegationActive(delegator, delegate)
    // Function signature: isDelegationActive(address,address)
    // Method ID: 0x8d4e7c2a
    const methodId = "0x8d4e7c2a";
    const delegatorPadded = delegator.slice(2).padStart(64, '0');
    const delegatePadded = delegate.slice(2).padStart(64, '0');
    const data = methodId + delegatorPadded + delegatePadded;
    
    console.log(`📝 Call data: ${data}`);
    
    const result = await window.ethereum.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: data
      }, 'latest']
    });
    
    console.log(`📤 Result: ${result}`);
    
    const isActive = parseInt(result, 16) > 0;
    console.log(`✅ Delegation active on blockchain: ${isActive}`);
    
    if (isActive) {
      console.log("🎉 SUCCESS: Delegation is stored on blockchain!");
      console.log("✅ Blockchain storage is working correctly!");
      
      // Try to get delegation details
      console.log("\n📖 Getting delegation details...");
      
      // ABI encode getDelegation(delegator, delegate)
      // Function signature: getDelegation(address,address)
      // Method ID: 0x3e64a696
      const getMethodId = "0x3e64a696";
      const getData = getMethodId + delegatorPadded + delegatePadded;
      
      const delegationResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: getData
        }, 'latest']
      });
      
      console.log(`📄 Delegation data: ${delegationResult}`);
      console.log("✅ Full delegation details retrieved from blockchain!");
      
    } else {
      console.log("❌ Delegation not found on blockchain");
      console.log("💡 This means delegation was only saved to localStorage");
      console.log("🔧 Need to create new delegation to test blockchain storage");
    }
    
  } catch (error) {
    console.error("❌ Error checking delegation:", error);
    
    if (error.message.includes("execution reverted")) {
      console.log("💡 Contract call reverted - delegation not found on blockchain");
    } else if (error.message.includes("invalid address")) {
      console.log("💡 Contract address issue - check deployment");
    }
  }
}

// Auto-run
checkDelegationOnBlockchain();
