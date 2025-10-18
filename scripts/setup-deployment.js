#!/usr/bin/env node

/**
 * Setup script để chuẩn bị deploy DelegationStorage
 * Chạy: node scripts/setup-deployment.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function setupDeployment() {
  console.log("🔧 Setting up DelegationStorage deployment...");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '..', '.env');
    const envExists = fs.existsSync(envPath);
    
    if (envExists) {
      console.log("✅ .env file found");
    } else {
      console.log("📝 Creating .env file...");
      fs.writeFileSync(envPath, "# Environment variables\n");
    }

    // Get private key
    console.log("\n🔑 Private Key Setup:");
    console.log("1. Open MetaMask");
    console.log("2. Click account icon → Account details");
    console.log("3. Click 'Export Private Key'");
    console.log("4. Copy the private key (starts with 0x)");
    console.log("⚠️  WARNING: Never share your private key!");
    console.log("💡 Use a test account private key only");
    
    const privateKey = await new Promise((resolve) => {
      rl.question('\nEnter your private key (0x...): ', (answer) => {
        resolve(answer.trim());
      });
    });

    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.log("❌ Invalid private key format");
      console.log("💡 Private key should start with 0x and be 66 characters long");
      process.exit(1);
    }

    // Add private key to .env
    const envContent = `PRIVATE_KEY=${privateKey}\n`;
    fs.appendFileSync(envPath, envContent);
    console.log("✅ Private key saved to .env file");

    // Check balance
    console.log("\n💰 Balance Check:");
    console.log("1. Go to: https://explorer.monad.xyz");
    console.log("2. Search for your address");
    console.log("3. Check if you have MON tokens");
    console.log("4. If not, get from: https://faucet.monad.xyz");

    const hasBalance = await new Promise((resolve) => {
      rl.question('\nDo you have MON tokens for gas? (y/n): ', (answer) => {
        resolve(answer.toLowerCase().startsWith('y'));
      });
    });

    if (!hasBalance) {
      console.log("\n💡 Get testnet MON:");
      console.log("1. Go to: https://faucet.monad.xyz");
      console.log("2. Enter your address");
      console.log("3. Request testnet MON");
      console.log("4. Wait for tokens to arrive");
      console.log("5. Run deployment script again");
      process.exit(1);
    }

    console.log("\n✅ Setup completed!");
    console.log("🚀 Ready to deploy DelegationStorage contract");
    console.log("📝 Run: node scripts/deploy-node.js");

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  } finally {
    rl.close();
  }
}

// Run setup
setupDeployment();


