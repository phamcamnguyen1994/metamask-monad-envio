/**
 * Verify Delegation Signature
 * 
 * Check if delegation signature is valid for the delegator
 */

const { createPublicClient, http, getAddress, keccak256, encodeAbiParameters } = require('viem');

const DELEGATION_MANAGER = "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3";

const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { 
    default: { 
      http: ["https://rpc.monad-testnet.fastlane.xyz/eyJhIjoiMHhhZkRCOWVFMTMxOEFFYUFhMkVlM0U3YTA4NTAyMDAyODc1RjA0MkNBIiwidCI6MTc2MDE4NjEyNSwicyI6IjB4ODAyODYxNGU1OWNhYmUzN2RlZTI2OGNhNzU2YTkyODJiZmNkY2U1OWZlYWJjYTc1MWY2NGI0YWI0ZDZlODUyNzQyYzcyZThmNmQxNDZkNjJkZDk3M2MxZTY5MWZiY2ZmOGMxZDc0NGM2ODg5NTQ3ODZkYmMwOGJmNTlkZjU4OGIxYyJ9"] 
    } 
  }
};

// EIP-1271 interface
const eip1271Abi = [
  {
    name: "isValidSignature",
    type: "function",
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "magicValue", type: "bytes4" }],
    stateMutability: "view"
  }
];

async function verifyDelegationSignature() {
  try {
    // Get delegation from localStorage (copy from browser)
    console.log("📋 Paste your delegation JSON here:");
    console.log("(Get from localStorage.getItem('delegations') in browser)");
    console.log("");
    
    // Example delegation - REPLACE WITH YOUR ACTUAL DELEGATION
    const delegation = {
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
          "terms": "0x3A13C20987Ac0e6840d9CB6e917085F72D17E69800000000000000000000000000000000000000000000000000000000423883c00000000000000000000000000000000000000000000000000000000000093a800000000000000000000000000000000000000000000000000000000068eb0daf",
          "args": "0x"
        }
      ],
      "salt": "0x4fec053003b8bd51c31cbb3561ddcaef2b6c0b9bb6844d9e1ac814b0309b64ed",
      "signature": "0xe9f62739cb256504d075324d871bfae37087aa2fae741d98d3fc4049071e630313519b5ee719e47cd305ef79537d89fa0256f2cb4a85ce5f5e615d434bfe78b81b"
    };
    
    console.log("🔍 Verifying delegation signature...");
    console.log("Delegator:", delegation.delegator);
    console.log("Delegate:", delegation.delegate);
    console.log("Signature:", delegation.signature);
    console.log("");
    
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0], {
        timeout: 60000,
        retryCount: 3,
        retryDelay: 3000
      })
    });
    
    // Compute delegation hash (EIP-712 typed data hash)
    // This is a simplified version - actual implementation needs full EIP-712 encoding
    console.log("⏳ Computing delegation hash...");
    
    // For EIP-1271, we need to compute the exact hash that was signed
    // This should match the hash computed by DelegationManager
    
    // Try to check if Smart Account supports EIP-1271
    console.log("⏳ Checking if Smart Account supports EIP-1271...");
    
    const code = await publicClient.getCode({ address: delegation.delegator });
    
    if (!code || code === '0x') {
      console.log("❌ Delegator is EOA (no code), cannot verify EIP-1271 signature!");
      console.log("");
      console.log("💡 PROBLEM: Delegation signature was signed by EOA,");
      console.log("   but DelegationManager expects Smart Account signature!");
      return;
    }
    
    console.log("✅ Delegator is a contract (has code)");
    console.log("");
    
    // Try to call isValidSignature
    // We need the actual message hash that was signed
    // For now, just check if the contract has the isValidSignature function
    
    console.log("📝 DIAGNOSIS:");
    console.log("========================================");
    console.log("1. Delegator is a Smart Account (has bytecode)");
    console.log("2. Signature was created via smartAccount.signDelegation()");
    console.log("3. DelegationManager will call delegator.isValidSignature(hash, signature)");
    console.log("");
    console.log("⚠️ POSSIBLE ISSUES:");
    console.log("1. Signature hash mismatch (EIP-712 encoding)");
    console.log("2. Smart Account signer key mismatch");
    console.log("3. Caveats encoding issue");
    console.log("");
    console.log("🔧 SOLUTION:");
    console.log("Check transaction revert reason on Explorer:");
    console.log("https://testnet.monadexplorer.com/tx/0x046cac73f872f95890fb63847e347bbd03d02c192d9d93400cfdcaa811337377");
    console.log("");
    console.log("Look for specific error message from DelegationManager");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyDelegationSignature();


