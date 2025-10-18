import { getDevSmartAccount } from "./smartAccount";
import { USDC_TEST } from "./chain";
import { createDelegation } from "@metamask/delegation-toolkit";
import { debugSmartAccount, validateDelegationInput } from "./debug";

export type PeriodScope = {
  type: "erc20PeriodTransfer";
  tokenAddress: `0x${string}`;
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

export type CreateDelegationInput = {
  delegate: `0x${string}`;
  scope: PeriodScope;
};

export type RedeemInput = {
  signedDelegation: any;
  amount: bigint;
  to: `0x${string}`;
  token?: `0x${string}`;
};

export async function createDelegationWrapper(input: CreateDelegationInput) {
  console.log("Creating delegation with input:", input);

  const validationErrors = validateDelegationInput(input);
  if (validationErrors.length > 0) {
    throw new Error(`Input validation failed: ${validationErrors.join(", ")}`);
  }

  const sa = await getDevSmartAccount();
  debugSmartAccount(sa);

  if (!sa.address || !sa.environment) {
    throw new Error("Smart account is not initialised correctly.");
  }

  const delegation = createDelegation({
    from: sa.address,
    to: input.delegate,
    environment: sa.environment,
    scope: input.scope,
  });

  console.log("Delegation created:", delegation);
  const signature = await sa.signDelegation({ delegation });
  console.log("Delegation signed");
  return { ...delegation, signature };
}

export async function redeemDelegation(_: RedeemInput) {
  throw new Error("redeemDelegation is deprecated. Use redeemDelegationSimple instead.");
}

export async function createDelegationWithMetaMask(_: any, __: CreateDelegationInput) {
  throw new Error("createDelegationWithMetaMask is not supported in this build.");
}

export async function redeemDelegationGasless() {
  throw new Error("Gasless redemption is temporarily disabled.");
}

export async function redeemDelegationReal() {
  throw new Error("Use direct ERC-20 transfers for now – redeemDelegationReal is disabled.");
}

export const toUsdc = (n: number) => BigInt(Math.floor(n * 1_000_000));
export const DEFAULT_USDC = USDC_TEST as `0x${string}`;
