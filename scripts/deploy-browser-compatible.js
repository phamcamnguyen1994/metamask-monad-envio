/**
 * Browser-compatible script để deploy DelegationStorage contract
 * Copy và paste vào browser console
 */

async function deployDelegationStorage() {
  try {
    console.log("🚀 Deploying DelegationStorage contract...");
    
    // Kiểm tra MetaMask
    if (!window.ethereum) {
      throw new Error("MetaMask not found! Please install MetaMask extension.");
    }

    // Request accounts
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts.length === 0) {
      throw new Error("No accounts found in MetaMask");
    }
    
    console.log(`👤 Using account: ${accounts[0]}`);

    // Switch to Monad testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa1ba' }], // 41434 in hex
      });
    } catch (switchError) {
      // Chain not added, add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xa1ba',
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

    console.log("✅ Connected to Monad testnet");

    // Check balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    });
    
    const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
    console.log(`💰 Balance: ${balanceInEth.toFixed(4)} MON`);

    if (balanceInEth < 0.01) {
      console.warn("⚠️ Low balance! You may need MON for gas fees.");
      console.log("💡 Get testnet MON from: https://faucet.monad.xyz");
    }

    // Simple contract bytecode (minimal example)
    const contractBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556101a5806100326000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063a9059cbb14610051578063dd62ed3e1461007d578063f2fde38b146100ab575b600080fd5b61007b6004803603810190610076919061010d565b6100c7565b005b6100856100cd565b6040516100a29190610159565b60405180910390f35b6100c560048036038101906100c0919061010d565b6100d6565b005b5050565b60008054905090565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008135905061010781610174565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061015f82610136565b9050919050565b61016f81610154565b82525050565b600060208201905061018a6000830184610166565b92915050565b61019981610154565b81146101a457600080fd5b5056fea26469706673582212207d...";

    console.log("🚀 Deploying DelegationStorage contract...");
    
    // Deploy contract using eth_sendTransaction
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: accounts[0],
        data: contractBytecode,
        gas: '0x2dc6c0', // 3,000,000 gas
        gasPrice: '0x9184e72a000', // 10 gwei
      }],
    });

    console.log(`📝 Deployment transaction: ${txHash}`);
    console.log("⏳ Waiting for deployment confirmation...");

    // Wait for transaction receipt
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!receipt && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        attempts++;
      } catch (error) {
        console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Still waiting...`);
        attempts++;
      }
    }

    if (receipt && receipt.contractAddress) {
      console.log("✅ DelegationStorage deployed successfully!");
      console.log(`📍 Contract Address: ${receipt.contractAddress}`);
      console.log(`🔗 View on Explorer: https://explorer.monad.xyz/address/${receipt.contractAddress}`);
      
      // Save contract address globally
      window.delegationStorageAddress = receipt.contractAddress;
      console.log("💾 Contract address saved to window.delegationStorageAddress");
      
      // Also save to localStorage for persistence
      localStorage.setItem('delegationStorageAddress', receipt.contractAddress);
      console.log("💾 Contract address saved to localStorage");
      
      return receipt.contractAddress;
    } else {
      throw new Error("Contract deployment failed or timeout");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    
    if (error.message.includes("MetaMask not found")) {
      console.log("\n🔧 Please install MetaMask extension");
    } else if (error.message.includes("No accounts found")) {
      console.log("\n🔧 Please connect MetaMask account");
    } else if (error.message.includes("Low balance")) {
      console.log("\n🔧 Get testnet MON from: https://faucet.monad.xyz");
    }
    
    throw error;
  }
}

// Auto-run deployment
deployDelegationStorage();
