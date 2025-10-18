/**
 * Delegation Environment for Monad Testnet
 * Với đầy đủ implementation addresses để tránh lỗi "Implementation type undefined"
 */

import { getDeleGatorEnvironment } from "@metamask/delegation-toolkit";

export const MONAD_CHAIN_ID = 10143 as const;
export const SEPOLIA_CHAIN_ID = 11155111 as const;

export const SUPPORTED_CHAIN_IDS = [MONAD_CHAIN_ID, SEPOLIA_CHAIN_ID] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

// Lấy base environment từ SDK
type BaseEnv = ReturnType<typeof getDeleGatorEnvironment>;

// Cache environments per chain
const ENV_CACHE: Partial<Record<SupportedChainId, BaseEnv>> = {};

function loadEnvironmentForChain(chainId: SupportedChainId): BaseEnv {
  // Return cached if available
  if (ENV_CACHE[chainId]) {
    return ENV_CACHE[chainId]!;
  }

  try {
    const env = getDeleGatorEnvironment(chainId);
    console.log(`✅ Delegation Environment loaded for chain ${chainId}:`, {
      chainId,
      DelegationManager: env.DelegationManager,
      EntryPoint: env.EntryPoint,
    });
    ENV_CACHE[chainId] = env;
    return env;
  } catch (error) {
    console.error(`❌ Failed to load environment for chain ${chainId}:`, error);
    throw new Error(
      `Delegation Environment not available for chain ${chainId}. ` +
      `Make sure DelegationManager is deployed on this network.`
    );
  }
}

// Load default chain (Monad) for backward compatibility
let BASE_ENV: BaseEnv = loadEnvironmentForChain(MONAD_CHAIN_ID);

/**
 * Enhanced environment với đầy đủ implementation addresses
 */
const EXECUTION_MODES = {
  SingleDefault: "0x0000000000000000000000000000000000000000000000000000000000000000" as const,
  SingleTry: "0x0001000000000000000000000000000000000000000000000000000000000000" as const,
  BatchDefault: "0x0100000000000000000000000000000000000000000000000000000000000000" as const,
  BatchTry: "0x0101000000000000000000000000000000000000000000000000000000000000" as const,
};

function resolveImplementations(base: BaseEnv["implementations"]) {
  if (!base) {
    return undefined;
  }

  const resolved = {
    ...base,
    HybridDeleGatorImpl:
      (process.env.NEXT_PUBLIC_HYBRID_IMPL as `0x${string}` | undefined) ?? base.HybridDeleGatorImpl,
    MultiSigDeleGatorImpl:
      (process.env.NEXT_PUBLIC_MULTISIG_IMPL as `0x${string}` | undefined) ?? base.MultiSigDeleGatorImpl,
    EIP7702StatelessDeleGatorImpl:
      (process.env.NEXT_PUBLIC_SA7702_IMPL as `0x${string}` | undefined) ?? base.EIP7702StatelessDeleGatorImpl,
  } as typeof base;

  console.log("📦 Implementation Contracts:", {
    Hybrid: resolved.HybridDeleGatorImpl ?? "NOT FOUND",
    Stateless7702: resolved.EIP7702StatelessDeleGatorImpl ?? "NOT FOUND",
    Multisig: resolved.MultiSigDeleGatorImpl ?? "NOT FOUND",
  });

  return resolved;
}

function buildEnvironment(base: BaseEnv) {
  const delegationManager = (process.env.NEXT_PUBLIC_DELEGATION_MANAGER as `0x${string}` | undefined) ?? base.DelegationManager;
  const entryPoint = (process.env.NEXT_PUBLIC_ENTRY_POINT as `0x${string}` | undefined) ?? base.EntryPoint;
  const simpleFactory = (process.env.NEXT_PUBLIC_SIMPLE_FACTORY as `0x${string}` | undefined) ?? base.SimpleFactory;

  return {
    ...base,
    DelegationManager: delegationManager,
    EntryPoint: entryPoint,
    SimpleFactory: simpleFactory,
    implementations: resolveImplementations(base.implementations),
    enums: {
      ...(base as any).enums,
      ExecutionMode: EXECUTION_MODES,
    },
  } as BaseEnv & {
    enums: {
      ExecutionMode: typeof EXECUTION_MODES;
    };
  };
}

const AUGMENTED_ENV = buildEnvironment(BASE_ENV);

export function resolveDelegationEnv(chainId: number) {
  const supported = SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
  if (!supported) {
    throw new Error(`Chain ${chainId} not supported. Supported chains: ${SUPPORTED_CHAIN_IDS.join(", ")}`);
  }
  
  const baseEnv = loadEnvironmentForChain(chainId as SupportedChainId);
  return buildEnvironment(baseEnv);
}

// Export legacy environment cho backward compatibility
export const DELEGATION_ENV = AUGMENTED_ENV;
export const DELEGATION_MANAGER = AUGMENTED_ENV.DelegationManager;

// Helper: Pad to bytes32
export function padToBytes32(value: string): `0x${string}` {
  if (!value || value === "0x") {
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }
  
  // Remove 0x prefix
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  
  // Pad to 64 hex chars (32 bytes)
  const padded = hex.padStart(64, "0");
  
  return `0x${padded}` as `0x${string}`;
}

// Helper: Generate random salt (32 bytes)
export function randomSalt32(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}

// Helper: Normalize delegation structure
export function normalizeDelegation(raw: any) {
  return {
    delegate: raw.delegate,
    delegator: raw.delegator,
    authority: padToBytes32(raw.authority),
    caveats: (raw.caveats ?? []).map((c: any) => ({
      enforcer: c.enforcer,
      terms: c.terms || "0x",
      args: c.args || "0x",
    })),
    salt: padToBytes32(raw.salt),
    signature: raw.signature,
  };
}



