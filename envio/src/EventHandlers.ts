/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  MonUSDC,
  DelegationManager,
  // import entity types TRÙNG schema:
  Transfer,
  Delegation,
  Redemption,
} from "generated";

// mUSDC Transfer
MonUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
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

// DelegationManager EnabledDelegation
DelegationManager.EnabledDelegation.handler(async ({ event, context }) => {
  const entity: Delegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    delegator: event.params.delegator,
    delegate: event.params.delegate,
    createdAt: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    status: "enabled",
  };
  context.Delegation.set(entity);
});

// (TẠM TẮT) RedeemedDelegation – giữ code nhưng đừng đăng ký event trong config cho tới khi có ABI chuẩn
DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const entity: Redemption = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  };
  context.Redemption.set(entity);
});

