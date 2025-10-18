/**
 * Quick Test Script - Verify Core Components
 * Run: node scripts/quick-test.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 QUICK TEST - METAMASK DELEGATION PROJECT');
console.log('='.repeat(50));

// Test 1: Environment file
console.log('\n📋 TEST 1: Environment Setup');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_PIMLICO_API_KEY=') && 
      !envContent.includes('YOUR_PIMLICO_API_KEY')) {
    console.log('✅ Pimlico API key configured');
  } else {
    console.log('❌ Pimlico API key not configured properly');
    console.log('   → Edit .env and set NEXT_PUBLIC_PIMLICO_API_KEY');
  }
  
  if (envContent.includes('MONAD_CHAIN_ID=10143')) {
    console.log('✅ Monad chain ID configured');
  } else {
    console.log('❌ Monad chain ID missing');
  }
} else {
  console.log('❌ .env file not found');
  console.log('   → Run: copy env.example .env');
}

// Test 2: Core files exist
console.log('\n📋 TEST 2: Core Files');
const coreFiles = [
  'lib/aa.ts',
  'lib/smartAccount.ts', 
  'lib/delegation.ts',
  'lib/delegation-simple.ts',
  'lib/delegationEnv.ts',
  'components/DelegationForm.tsx',
  'components/DelegationWithdraw.tsx',
  'components/MetaMaskConnect.tsx'
];

let missingFiles = 0;
coreFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles++;
  }
});

// Test 3: Package dependencies
console.log('\n📋 TEST 3: Dependencies');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@metamask/delegation-toolkit',
    'viem',
    'next',
    'react',
    'typescript'
  ];
  
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep} - NOT INSTALLED`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Test 4: Contract addresses
console.log('\n📋 TEST 4: Contract Configuration');
try {
  const delegationEnvPath = path.join(__dirname, '..', 'lib', 'delegationEnv.ts');
  if (fs.existsSync(delegationEnvPath)) {
    const envContent = fs.readFileSync(delegationEnvPath, 'utf8');
    
    if (envContent.includes('0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3')) {
      console.log('✅ DelegationManager address configured');
    } else {
      console.log('❌ DelegationManager address missing');
    }
    
    if (envContent.includes('chainId: 10143')) {
      console.log('✅ Chain ID configured for Monad testnet');
    } else {
      console.log('❌ Chain ID not configured');
    }
    
    if (envContent.includes('0x3A13C20987Ac0e6840d9CB6e917085F72D17E698')) {
      console.log('✅ USDC contract address configured');
    } else {
      console.log('❌ USDC contract address missing');
    }
  } else {
    console.log('❌ delegationEnv.ts not found');
  }
} catch (error) {
  console.log('❌ Error reading delegationEnv.ts:', error.message);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));

if (missingFiles === 0) {
  console.log('✅ All core files present');
} else {
  console.log(`❌ ${missingFiles} files missing`);
}

console.log('\n🚀 NEXT STEPS:');
console.log('1. Ensure .env is configured with your Pimlico API key');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000');
console.log('4. Follow TESTING_CHECKLIST.md');

console.log('\n📚 DOCUMENTATION:');
console.log('- PROJECT_LOGIC.md - Complete project overview');
console.log('- TESTING_CHECKLIST.md - Step-by-step testing guide');
console.log('- DELEGATION_SUCCESS_SUMMARY.md - Success cases');

console.log('\n🎯 READY TO TEST!');
