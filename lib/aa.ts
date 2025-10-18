import { createWalletClient, custom, createPublicClient, http } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { monadTestnet } from "./chain";
import { toMetaMaskSmartAccount, Implementation } from "@metamask/delegation-toolkit";
import { resolveDelegationEnv, MONAD_CHAIN_ID } from "./delegationEnv";

const getEthereum = () =>
  typeof window !== "undefined" ? (window as typeof window & { ethereum?: any }).ethereum : undefined;

export async function getOwnerWalletClient() {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("MetaMask not installed");
  }

  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const owner = accounts?.[0];
  if (!owner) {
    throw new Error("No MetaMask account connected");
  }

  console.log("Owner account:", owner);

  return createWalletClient({
    account: owner as `0x${string}`,
    transport: custom(ethereum),
    chain: monadTestnet,
  });
}

export function getPaymasterClient() {
  const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

  if (!pimlicoApiKey) {
    console.warn("⚠️  No Pimlico API key provided. Paymaster disabled.");
    return undefined;
  }

  console.log("Creating Pimlico paymaster client for chainId:", MONAD_CHAIN_ID);
  console.log("Pimlico API key present:", pimlicoApiKey ? "yes" : "no");

  // Pimlico uses chain name in URL (e.g., "monad-testnet")
  const chainName = MONAD_CHAIN_ID === 10143 ? "monad-testnet" : "sepolia";
  const paymasterUrl = `https://api.pimlico.io/v2/${chainName}/rpc?apikey=${pimlicoApiKey}`;
  console.log("Paymaster URL:", paymasterUrl.replace(pimlicoApiKey, "***"));

  return createPaymasterClient({
    transport: http(paymasterUrl, {
      timeout: 60_000,
      retryCount: 3,
      retryDelay: 3_000,
    }),
  });
}

export function getBundlerClient(includePaymaster: boolean = true) {
  const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

  console.log("Creating Pimlico bundler client for chainId:", MONAD_CHAIN_ID);
  console.log("Pimlico API key present:", pimlicoApiKey ? "yes" : "no");
  console.log("Include paymaster:", includePaymaster);

  if (!pimlicoApiKey) {
    throw new Error(
      "PIMLICO_API_KEY missing in environment. Get a free key from https://dashboard.pimlico.io and set NEXT_PUBLIC_PIMLICO_API_KEY."
    );
  }

  // Pimlico uses chain name in URL (e.g., "monad-testnet")
  const chainName = MONAD_CHAIN_ID === 10143 ? "monad-testnet" : "sepolia";
  const bundlerUrl = `https://api.pimlico.io/v2/${chainName}/rpc?apikey=${pimlicoApiKey}`;
  console.log("Bundler URL:", bundlerUrl.replace(pimlicoApiKey, "***"));

  // Create public client first
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0]),
  });

  // Get paymaster client (optional) - only if includePaymaster is true
  const paymasterClient = includePaymaster ? getPaymasterClient() : undefined;

  return createBundlerClient({
    client: publicClient,
    transport: http(bundlerUrl, {
      timeout: 60_000,
    }),
    paymaster: paymasterClient, // Optional - only if API key provided and includePaymaster is true
  });
}

export async function getDelegateSmartAccount() {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("MetaMask not installed or not running in a browser context");
  }

  const ownerWallet = await getOwnerWalletClient();
  const ownerEOA = ownerWallet.account.address;

  console.log("Preparing delegate smart account for:", ownerEOA);

  const bundlerClient = getBundlerClient();

  let entryPoint: `0x${string}` = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
  try {
    const response = await bundlerClient.request({
      method: "eth_supportedEntryPoints",
      params: [],
    } as any);

    const supportedEntryPoints = Array.isArray(response) ? (response as readonly string[]) : [];
    if (supportedEntryPoints.length > 0) {
      entryPoint = supportedEntryPoints[0] as `0x${string}`;
    }
  } catch (error) {
    console.warn("Unable to fetch supported entry points, using default fallback:", entryPoint);
  }

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0]),
  });

  const environment = resolveDelegationEnv(MONAD_CHAIN_ID);

  console.log("Entry point:", entryPoint);
  console.log("Delegation environment:", environment);

  try {
    const delegateSA = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      signer: { walletClient: ownerWallet },
      environment,
      deployParams: [ownerEOA, [], [], []],
      deploySalt: "0x",
    });

    if (!(delegateSA as any).implementationType) {
      Object.defineProperty(delegateSA, "implementationType", {
        value: Implementation.Hybrid,
        enumerable: true,
      });
    }

    console.log("Delegate smart account ready:", delegateSA.address);

    return {
      delegateSA,
      entryPoint,
      bundlerClient,
      environment,
      ownerWallet,
      publicClient,
    };
  } catch (error) {
    console.error("Failed to create delegate smart account:", error);
    throw error;
  }
}

export async function getMetaMaskSmartAccount() {
  const result = await getDelegateSmartAccount();
  return { account: result.delegateSA, bundler: result.bundlerClient };
}
