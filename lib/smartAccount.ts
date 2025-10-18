import { privateKeyToAccount } from "viem/accounts";
import { publicClient } from "./clients";
import { monadTestnet } from "./chain";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { DELEGATION_ENV } from "./delegationEnv";
import { getEthereumProvider } from "./ethereum";

export type SmartAccount = {
  address: `0x${string}`;
  client?: any;                // PublicClient or BundlerClient for SDK calls
  signDelegation: (payload: any) => Promise<`0x${string}`>;
  encodeRedeemCalldata: (args: {
    delegations: any[][];
    modes: number[];          // ExecutionMode enums
    executions: any[][];
  }) => `0x${string}`;
  environment: any;            // từ SDK (cần cho createDelegation)
  walletClient?: any;          // For deployment
  getFactoryArgs?: () => Promise<{ factory: `0x${string}`; factoryData: `0x${string}` }>; // For deployment
};

let _sa: SmartAccount | null = null;

export async function getDevSmartAccount(): Promise<SmartAccount> {
  if (_sa) return _sa;

  // Kiểm tra nếu đang ở browser environment
  if (typeof window !== "undefined" && window.ethereum) {
    throw new Error("Sử dụng getMetaMaskSmartAccount() thay vì getDevSmartAccount() trong browser");
  }

  const pk = process.env.DEV_PRIVATE_KEY;
  if (!pk) {
    throw new Error("DEV_PRIVATE_KEY không được cấu hình trong environment variables");
  }

  const signer = privateKeyToAccount(pk as `0x${string}`);

  // Sử dụng singleton environment
  console.log("✅ Using DelegationManager:", DELEGATION_ENV.DelegationManager);

  // Tạo MetaMask Smart Account với environment
  const saImpl = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,   // Hybrid smart account
    deployParams: [signer.address, [], [], []],
    deploySalt: "0x",
    signer: { account: signer },
    environment: DELEGATION_ENV, // Use singleton environment
  });

  _sa = {
    address: saImpl.address as `0x${string}`,
    signDelegation: async (payload: any) => {
      return saImpl.signDelegation(payload);
    },
    encodeRedeemCalldata: (args) => {
      // Sử dụng DelegationManager encoder từ environment
      const env = saImpl.environment as any;
      if (env?.contracts?.DelegationManager?.encode?.redeemDelegations) {
        return env.contracts.DelegationManager.encode.redeemDelegations({
          delegations: args.delegations,
          modes: args.modes,
          executions: args.executions,
        });
      }
      return '0x' as `0x${string}`;
    },
    environment: saImpl.environment,
  };
  return _sa;
}

// Function để tạo Smart Account từ MetaMask (cho browser)
export async function getMetaMaskSmartAccount(): Promise<SmartAccount> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask không được cài đặt");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (accounts.length === 0) {
    throw new Error("Không có tài khoản nào được kết nối");
  }

  const userAccount = accounts[0];

  // Tạo wallet client
  const { createWalletClient, custom } = await import("viem");
  const walletClient = createWalletClient({
    account: userAccount as `0x${string}`,
    transport: custom(window.ethereum),
    chain: monadTestnet,
  });

  // Sử dụng singleton environment
  console.log("✅ Using DelegationManager:", DELEGATION_ENV.DelegationManager);

  // Tạo MetaMask Smart Account với environment
  const saImpl = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [userAccount, [], [], []],
    deploySalt: "0x",
    signer: { walletClient },
    environment: DELEGATION_ENV, // Use singleton environment
  });

  // Create bundler client for UserOps (needed for SDK redeemDelegations)
  const bundlerClient = publicClient; // For now, use publicClient as bundler
  
  return {
    address: saImpl.address as `0x${string}`,
    client: bundlerClient, // Expose client for SDK
    signDelegation: async (payload: any) => {
      try {
        console.log("🔐 Trying native MetaMask smart account signer...");
        const nativeSignature = await saImpl.signDelegation({
          delegation: payload,
          chainId: monadTestnet.id,
        });
        if (nativeSignature) {
          console.log("✅ Native signer succeeded!");
          return nativeSignature;
        }
      } catch (nativeError) {
        console.warn("⚠️ Native signDelegation failed, falling back to manual EIP-712:", nativeError);
      }

      console.log("📝 Manual EIP-712 signing fallback");
      console.log("Payload:", {
        delegator: payload.delegator || payload.from,
        delegate: payload.delegate || payload.to,
        authority: payload.authority,
        caveatsCount: Array.isArray(payload.caveats) ? payload.caveats.length : "N/A",
        salt: payload.salt,
      });

      const { signDelegationManual } = await import("./manualDelegationSigning");
      const signature = await signDelegationManual(walletClient, payload);

      console.log("✅ Delegation signed with manual fallback:", signature);
      return signature;
    },
    encodeRedeemCalldata: (args) => {
      // ❌ Không dùng fallback '0x' nữa - throw error nếu không có DelegationManager
      if (!DELEGATION_ENV || !DELEGATION_ENV.DelegationManager) {
        throw new Error(
          "DelegationManager not available in environment. " +
          "Cannot encode redeem calldata."
        );
      }
      
      console.log("✅ Encoding redeem calldata with DelegationManager");
      // Note: Trong thực tế, SDK không expose encode function trực tiếp
      // Nên function này chỉ để placeholder, sử dụng SDK redeemDelegations thay thế
      throw new Error("Use redeemDelegations from SDK instead of encodeRedeemCalldata");
    },
    environment: saImpl.environment || {},
    walletClient, // Expose walletClient for deployment
    getFactoryArgs: saImpl.getFactoryArgs
      ? async () => {
          const result = await saImpl.getFactoryArgs!();
          if (!result?.factory || !result?.factoryData) {
            throw new Error("Factory arguments unavailable for this smart account implementation.");
          }
          return {
            factory: result.factory as `0x${string}`,
            factoryData: result.factoryData as `0x${string}`,
          };
        }
      : undefined,
  };
}

// Deploy Smart Account on-chain
export async function deploySmartAccount(smartAccount: SmartAccount): Promise<`0x${string}`> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask không được cài đặt");
  }

  console.log("🚀 Deploying Smart Account:", smartAccount.address);

  // Get connected EOA
  const accounts = await window.ethereum.request({ 
    method: "eth_accounts" 
  }) as string[];
  
  if (!accounts || accounts.length === 0) {
    throw new Error("Không có tài khoản nào được kết nối");
  }

  const connectedEOA = accounts[0];
  console.log("👤 Connected EOA:", connectedEOA);

  const { createWalletClient, custom } = await import("viem");
  const { monadTestnet } = await import("./chain");
  
  const walletClient = createWalletClient({
    account: connectedEOA as `0x${string}`,
    transport: custom(window.ethereum),
    chain: monadTestnet,
  });

  // Check if Smart Account is already deployed
  const { publicClient } = await import("./clients");
  const bytecode = await publicClient.getBytecode({
    address: smartAccount.address
  });

  if (bytecode && bytecode !== "0x") {
    console.log("✅ Smart Account already deployed!");
    return "0x" as `0x${string}`; // Already deployed
  }

  console.log("📝 Smart Account not deployed yet, deploying...");
  console.log("💡 Using getFactoryArgs() method to deploy Smart Account");

  // Get factory and factoryData from smart account
  const factoryArgs = await (smartAccount as any).getFactoryArgs?.();
  
  if (!factoryArgs || !factoryArgs.factory || !factoryArgs.factoryData) {
    throw new Error(
      "Cannot get factory args from smart account. " +
      "Make sure you're using a MetaMask Smart Account with getFactoryArgs() method."
    );
  }
  
  const { factory, factoryData } = factoryArgs;
  
  console.log("📍 Factory:", factory);
  console.log("📋 Factory Data:", factoryData);

  // Deploy Smart Account by calling factory
  const txHash = await walletClient.sendTransaction({
    to: factory,
    data: factoryData,
  });

  console.log("✅ Smart Account deployment transaction sent:", txHash);
  console.log("⏳ Waiting for transaction confirmation...");

  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: 60000 // 60 seconds
  });

  console.log("📋 Receipt:", receipt);
  console.log("📋 Receipt status:", receipt.status);

  if (receipt.status === "success") {
    console.log("✅ Smart Account deployed successfully!");
    return txHash;
  } else {
    console.error("❌ Deployment failed with receipt:", receipt);
    throw new Error(
      `Smart Account deployment failed!\n` +
      `TX: ${txHash}\n` +
      `Status: ${receipt.status}\n` +
      `Check Explorer: https://explorer.monad.xyz/tx/${txHash}`
    );
  }
}
