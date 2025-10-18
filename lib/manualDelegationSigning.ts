import { getAddress, type WalletClient } from "viem";

export const DELEGATION_DOMAIN = {
  name: "DelegationManager",
  version: "1",
  chainId: 10143,
  verifyingContract: "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3" as `0x${string}`,
};

export const DELEGATION_TYPES = {
  Delegation: [
    { name: "delegate", type: "address" },
    { name: "delegator", type: "address" },
    { name: "authority", type: "bytes32" },
    { name: "caveats", type: "Caveat[]" },
    { name: "salt", type: "bytes32" },
  ],
  Caveat: [
    { name: "enforcer", type: "address" },
    { name: "terms", type: "bytes" },
    { name: "args", type: "bytes" },
  ],
} as const;

export async function signDelegationManual(
  walletClient: WalletClient,
  delegation: any
): Promise<`0x${string}`> {
  console.log("Manual EIP-712 signing...");
  console.log("Domain:", DELEGATION_DOMAIN);

  const account = walletClient.account;
  const accountAddress =
    typeof account === "string" ? account : account?.address;

  if (!accountAddress) {
    throw new Error("Wallet client does not expose an account address for signing.");
  }

  const message = {
    delegate: getAddress(delegation.delegate),
    delegator: getAddress(delegation.delegator),
    authority: delegation.authority,
    caveats: (delegation.caveats || []).map((c: any) => ({
      enforcer: getAddress(c.enforcer),
      terms: c.terms || "0x",
      args: c.args || "0x",
    })),
    salt: delegation.salt,
  };

  console.log("Message:", message);

  const signature = await walletClient.signTypedData({
    account: accountAddress,
    domain: DELEGATION_DOMAIN,
    types: DELEGATION_TYPES,
    primaryType: "Delegation",
    message,
  });

  console.log("Signature:", signature);
  return signature as `0x${string}`;
}
