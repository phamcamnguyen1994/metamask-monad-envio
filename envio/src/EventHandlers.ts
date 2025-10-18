/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MonUSDC,
  MonUSDC_Transfer,
  DelegationManager,
  DelegationManager_EnabledDelegation,
  DelegationManager_RedeemedDelegation,
} from "generated";

// Handler for mUSDC Transfer events
MonUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: MonUSDC_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };

  context.Transfer.set(entity);
});

// Handler for DelegationManager EnabledDelegation events
DelegationManager.EnabledDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_EnabledDelegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    delegator: event.params.delegator,
    delegate: event.params.delegate,
    createdAt: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    status: "ACTIVE",
  };

  context.Delegation.set(entity);
});

// Handler for DelegationManager RedeemedDelegation events
DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_RedeemedDelegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };

  context.Redemption.set(entity);
});

