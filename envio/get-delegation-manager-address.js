// Get DelegationManager contract address for Monad testnet
const { getDeleGatorEnvironment } = require('@metamask/delegation-toolkit');

const MONAD_CHAIN_ID = 10143;

try {
  const env = getDeleGatorEnvironment(MONAD_CHAIN_ID);
  
  console.log('📋 DelegationManager Contract Info:');
  console.log('Chain ID:', MONAD_CHAIN_ID);
  console.log('DelegationManager:', env.DelegationManager);
  console.log('EntryPoint:', env.EntryPoint);
  console.log('');
  console.log('Copy this address to config.yaml:');
  console.log(env.DelegationManager);
  
} catch (error) {
  console.error('Error:', error.message);
  console.log('');
  console.log('Note: DelegationManager might not be deployed on Monad testnet yet.');
  console.log('Check MetaMask Delegation Toolkit documentation for supported networks.');
}


