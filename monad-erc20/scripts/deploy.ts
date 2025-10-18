import { ethers } from "hardhat";

async function main() {
  const decs = 6;
  const MonUSDC = await ethers.getContractFactory("MonUSDC");
  const token = await MonUSDC.deploy(decs);
  await token.waitForDeployment();
  console.log("mUSDC deployed:", await token.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });

