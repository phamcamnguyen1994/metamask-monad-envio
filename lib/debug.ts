// Debug utilities để kiểm tra smart account và environment

export function debugSmartAccount(sa: any) {
  console.log("=== Smart Account Debug ===");
  console.log("Address:", sa?.address);
  console.log("Environment:", sa?.environment);
  console.log("Has signDelegation:", typeof sa?.signDelegation);
  console.log("Has encodeRedeemCalldata:", typeof sa?.encodeRedeemCalldata);
  
  if (sa?.environment) {
    console.log("Environment contracts:", Object.keys(sa.environment.contracts || {}));
    console.log("Environment enums:", Object.keys(sa.environment.enums || {}));
  }
  console.log("==========================");
}

export function validateAddress(address: string): boolean {
  if (!address) return false;
  if (typeof address !== 'string') return false;
  if (address.length !== 42) return false;
  if (!address.startsWith('0x')) return false;
  return true;
}

export function validateDelegationInput(input: any): string[] {
  const errors: string[] = [];
  
  if (!input.delegate) {
    errors.push("Delegate address is required");
  } else if (!validateAddress(input.delegate)) {
    errors.push("Delegate address is invalid");
  }
  
  if (!input.scope) {
    errors.push("Scope is required");
  } else {
    if (!input.scope.type) errors.push("Scope type is required");
    if (!input.scope.tokenAddress) errors.push("Token address is required");
    if (!input.scope.periodAmount) errors.push("Period amount is required");
    if (!input.scope.periodDuration) errors.push("Period duration is required");
  }
  
  return errors;
}
