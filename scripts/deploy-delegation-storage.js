#!/usr/bin/env node

/**
 * Deploy DelegationStorage contract to Monad testnet
 * Chạy: node scripts/deploy-delegation-storage.js
 */

console.log("🚀 Deploying DelegationStorage contract...");

async function deployDelegationStorage() {
  try {
    // Import viem
    const { createWalletClient, createPublicClient, custom, http, parseAbi } = await import("viem");

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

    // Check if running in browser
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log("🌐 Browser environment detected");
      
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
          params: [{ chainId: '0xa1ba' }],
        });
      } catch (switchError) {
        // Add chain if not exists
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

      // Create clients
      const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(monadTestnet.rpcUrls.default.http[0])
      });

      const walletClient = createWalletClient({
        account: accounts[0] as `0x${string}`,
        transport: custom(window.ethereum),
        chain: monadTestnet,
      });

      // Contract ABI (simplified)
      const contractAbi = parseAbi([
        "constructor()",
        "function storeDelegation(address _delegate, bytes32 _authority, bytes[] calldata _caveats, bytes calldata _signature) external",
        "function getDelegation(address _delegator, address _delegate) external view returns (bytes32 authority, bytes[] memory caveats, bytes memory signature, uint256 timestamp, bool isActive)",
        "function isDelegationActive(address _delegator, address _delegate) external view returns (bool)"
      ]);

      // Contract bytecode (simplified - you'd need to compile the actual contract)
      const contractBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556101a5806100326000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063a9059cbb14610051578063dd62ed3e1461007d578063f2fde38b146100ab575b600080fd5b61007b6004803603810190610076919061010d565b6100c7565b005b6100856100cd565b6040516100a29190610159565b60405180910390f35b6100c560048036038101906100c0919061010d565b6100d6565b005b5050565b60008054905090565b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008135905061010781610174565b92915050565b60006020828403121561011f57600080fd5b600061012d848285016100f8565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061015f82610136565b9050919050565b61016f81610154565b82525050565b600060208201905061018a6000830184610166565b92915050565b61019981610154565b81146101a457600080fd5b5056fea26469706673582212207d..."; // Simplified bytecode

      console.log("🚀 Deploying DelegationStorage contract...");
      
      // Deploy contract
      const hash = await walletClient.deployContract({
        abi: contractAbi,
        bytecode: contractBytecode,
        args: [],
      });

      console.log(`📝 Deployment transaction: ${hash}`);

      // Wait for deployment
      console.log("⏳ Waiting for deployment confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60000
      });

      if (receipt.contractAddress) {
        console.log("✅ DelegationStorage deployed successfully!");
        console.log(`📍 Contract Address: ${receipt.contractAddress}`);
        console.log(`🔗 View on Explorer: https://explorer.monad.xyz/address/${receipt.contractAddress}`);
        
        // Save contract address
        window.delegationStorageAddress = receipt.contractAddress;
        console.log("💾 Contract address saved to window.delegationStorageAddress");
        
        return receipt.contractAddress;
      } else {
        throw new Error("Contract deployment failed");
      }

    } else {
      console.log("🖥️ Node.js environment detected");
      console.log("❌ Cannot deploy from Node.js without private key");
      console.log("💡 Run this script in browser console with MetaMask connected");
      throw new Error("Browser environment required");
    }

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("Browser environment required")) {
      console.log("\n🔧 How to deploy:");
      console.log("1. Open your dApp in browser");
      console.log("2. Connect MetaMask to Monad testnet");
      console.log("3. Copy this script to browser console");
      console.log("4. Run the script");
    }
    
    process.exit(1);
  }
}

// Run deployment
deployDelegationStorage();
