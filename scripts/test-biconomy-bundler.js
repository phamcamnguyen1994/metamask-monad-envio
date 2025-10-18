/**
 * Test Biconomy Bundler Compatibility
 * Check if Biconomy supports standard ERC-4337 methods
 */

const bundlerUrl = 'https://bundler.biconomy.io/api/v3/10143/bundler_FvL9KNEXNVUtBZSc5LrLWQ';
const userOpHash = '0xe5208c9aaf49a72e46202b718d4dc5b6624a3c0e8c38f4ad1d4eade8b595782d';

async function testBiconomyBundler() {
  console.log('🧪 Testing Biconomy Bundler Compatibility\n');
  console.log('Bundler URL:', bundlerUrl);
  console.log('Chain ID: 10143 (Monad Testnet)\n');
  
  // Test 1: Check supported entry points
  console.log('Test 1: Check supported entry points');
  try {
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_supportedEntryPoints',
        params: [],
        id: 1
      })
    });
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.log('⚠️ Method not supported or error:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('\n---\n');
  
  // Test 2: Get UserOperation receipt
  console.log('Test 2: Get UserOperation receipt');
  console.log('UserOp Hash:', userOpHash);
  try {
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
        id: 2
      })
    });
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.result) {
      console.log('\n🎉 UserOperation FOUND!');
      console.log('Success:', data.result.success);
      console.log('Transaction Hash:', data.result.receipt?.transactionHash);
    } else if (data.error) {
      console.log('\n⚠️ Error:', data.error.message);
    } else {
      console.log('\n❓ UserOperation not found (null result)');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('\n---\n');
  
  // Test 3: Get UserOperation by hash
  console.log('Test 3: Get UserOperation by hash');
  try {
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getUserOperationByHash',
        params: [userOpHash],
        id: 3
      })
    });
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.result) {
      console.log('\n📋 UserOperation Details:');
      console.log('Sender:', data.result.sender);
      console.log('Nonce:', data.result.nonce);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('\n---\n');
  
  // Test 4: Check chain ID
  console.log('Test 4: Check chain ID');
  try {
    const response = await fetch(bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 4
      })
    });
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.result) {
      const chainId = parseInt(data.result, 16);
      console.log('Chain ID (decimal):', chainId);
      console.log('Expected: 10143');
      console.log('Match:', chainId === 10143 ? '✅' : '❌');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('\n---\n');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('If all tests return valid responses → Biconomy is ERC-4337 compatible');
  console.log('If methods return "not supported" → Need Nexus SDK');
  console.log('If UserOp not found → Check Monad Explorer to verify submission');
  console.log('\n🔗 Check on Explorer:');
  console.log('https://testnet-explorer.monad.xyz/tx/' + userOpHash);
}

// Run tests
testBiconomyBundler().catch(console.error);

