const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying DelegationStorage contract...");
  
  const DelegationStorage = await ethers.getContractFactory("DelegationStorage");
  const delegationStorage = await DelegationStorage.deploy();
  
  await delegationStorage.waitForDeployment();
  
  const address = await delegationStorage.getAddress();
  console.log("✅ DelegationStorage deployed:", address);
  console.log("🔗 View on Explorer: https://explorer.monad.xyz/address/" + address);
  
  // Save address to file
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, '..', '..', '.env');
  const envContent = `NEXT_PUBLIC_DELEGATION_STORAGE_ADDRESS=${address}\n`;
  
  try {
    fs.appendFileSync(envPath, envContent);
    console.log("💾 Contract address saved to .env file");
  } catch (error) {
    console.log("⚠️ Could not save to .env file:", error.message);
    console.log(`💡 Manually add to .env: NEXT_PUBLIC_DELEGATION_STORAGE_ADDRESS=${address}`);
  }
  
  return address;
}

main().catch((e) => { 
  console.error(e); 
  process.exit(1); 
});
