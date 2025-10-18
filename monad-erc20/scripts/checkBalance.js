const { ethers } = require("hardhat");

async function main() {
  const tokenAddress = "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698"; // mUSDC address
  const token = await ethers.getContractAt("MonUSDC", tokenAddress);
  
  // Lấy deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Kiểm tra balance
  const balance = await token.balanceOf(deployer.address);
  const decimals = await token.decimals();
  const formattedBalance = ethers.formatUnits(balance, decimals);
  
  console.log("Deployer balance:", formattedBalance, "mUSDC");
  console.log("Raw balance:", balance.toString());
  
  // Kiểm tra total supply
  const totalSupply = await token.totalSupply();
  const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);
  
  console.log("Total supply:", formattedTotalSupply, "mUSDC");
  console.log("Raw total supply:", totalSupply.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
