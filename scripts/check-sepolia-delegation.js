/**
 * Check if Sepolia delegation environment is available
 */

const { getDeleGatorEnvironment } = require("@metamask/delegation-toolkit");

const SEPOLIA_CHAIN_ID = 11155111;

async function checkSepoliaEnvironment() {
  console.log("\n🔍 Checking Sepolia Delegation Environment...\n");

  try {
    const env = getDeleGatorEnvironment(SEPOLIA_CHAIN_ID);

    console.log("✅ Sepolia Environment Found!\n");
    console.log("📍 Contract Addresses:");
    console.log(`  DelegationManager: ${env.DelegationManager}`);
    console.log(`  EntryPoint: ${env.EntryPoint}`);
    console.log(`  SimpleFactory: ${env.SimpleFactory}`);

    if (env.implementations) {
      console.log("\n📦 Implementation Contracts:");
      console.log(`  HybridDeleGator: ${env.implementations.HybridDeleGatorImpl || 'N/A'}`);
      console.log(`  MultiSigDeleGator: ${env.implementations.MultiSigDeleGatorImpl || 'N/A'}`);
      console.log(`  EIP7702Stateless: ${env.implementations.EIP7702StatelessDeleGatorImpl || 'N/A'}`);
    }

    if (env.caveatEnforcers) {
      console.log("\n🔒 Caveat Enforcers:");
      Object.entries(env.caveatEnforcers).forEach(([name, address]) => {
        console.log(`  ${name}: ${address}`);
      });
    }

    console.log("\n✅ Sepolia is fully supported!");
    console.log("💡 You can use delegation features on Sepolia WITHOUT deploying anything!");
    
    return true;
  } catch (error) {
    console.error("❌ Sepolia Environment NOT Found!");
    console.error("Error:", error.message);
    console.log("\n⚠️  You would need to deploy delegation contracts to Sepolia.");
    console.log("💡 See: https://docs.metamask.io/delegation-toolkit/how-to/configure/");
    return false;
  }
}

checkSepoliaEnvironment()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });

