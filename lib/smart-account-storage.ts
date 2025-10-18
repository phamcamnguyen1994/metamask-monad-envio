import { createWalletClient, createPublicClient, custom, http, parseAbi } from "viem";
import { monadTestnet } from "./chain";
import { getEthereumProvider } from "./ethereum";

const smartAccountAbi = parseAbi([
  "function setDelegation(bytes delegationData) external",
  "function getDelegation(address delegator, address delegate) external view returns (bytes)",
  "function hasDelegation(address delegator, address delegate) external view returns (bool)",
  "function removeDelegation(address delegate) external"
]);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

function hexToBytes(hex: `0x${string}`): Uint8Array {
  const length = (hex.length - 2) / 2;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return bytes;
}

export async function storeDelegationInSmartAccount(
  delegation: any,
  smartAccountAddress: string
) {
  try {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error("MetaMask not found");
    }

    const accounts = (await ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const delegator = accounts[0] as `0x${string}`;

    const walletClient = createWalletClient({
      account: delegator,
      transport: custom(ethereum),
      chain: monadTestnet,
    });

    const hexData = bytesToHex(textEncoder.encode(JSON.stringify(delegation)));

    const txHash = await walletClient.writeContract({
      account: delegator,
      address: smartAccountAddress as `0x${string}`,
      abi: smartAccountAbi,
      functionName: "setDelegation",
      args: [hexData],
    });

    console.log(`Delegation stored in Smart Account: ${txHash}`);
    return txHash;
  } catch (error: any) {
    console.error("Failed to store delegation in Smart Account:", error);
    throw error;
  }
}

export async function getDelegationFromSmartAccount(
  delegator: string,
  delegate: string,
  smartAccountAddress: string
) {
  try {
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(monadTestnet.rpcUrls.default.http[0]),
    });

    const hasDelegation = await publicClient.readContract({
      address: smartAccountAddress as `0x${string}`,
      abi: smartAccountAbi,
      functionName: "hasDelegation",
      args: [delegator as `0x${string}`, delegate as `0x${string}`],
    });

    if (!hasDelegation) {
      return null;
    }

    const delegationData = (await publicClient.readContract({
      address: smartAccountAddress as `0x${string}`,
      abi: smartAccountAbi,
      functionName: "getDelegation",
      args: [delegator as `0x${string}`, delegate as `0x${string}`],
    })) as `0x${string}`;

    const decodedData = textDecoder.decode(hexToBytes(delegationData));
    return JSON.parse(decodedData);
  } catch (error: any) {
    console.error("Failed to read delegation from Smart Account:", error);
    return null;
  }
}

export async function getDelegationHybrid(
  delegator: string,
  delegate: string,
  smartAccountAddress?: string
) {
  try {
    if (smartAccountAddress) {
      const onChainDelegation = await getDelegationFromSmartAccount(delegator, delegate, smartAccountAddress);
      if (onChainDelegation) {
        return onChainDelegation;
      }
    }
  } catch (error) {
    console.log("Smart Account delegation not available, trying localStorage...");
  }

  const existingDelegations = JSON.parse(localStorage.getItem("delegations") || "[]");
  const delegation = existingDelegations.find(
    (d: any) =>
      d.delegator.toLowerCase() === delegator.toLowerCase() &&
      d.delegate.toLowerCase() === delegate.toLowerCase() &&
      d.status === "ACTIVE"
  );

  return delegation || null;
}
