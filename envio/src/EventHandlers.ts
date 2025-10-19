/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  DelegationManager,
  DelegationManager_EnabledDelegation,
  DelegationManager_RedeemedDelegation,
  MUSDC,
  MUSDC_Transfer,
} from "generated";

DelegationManager.EnabledDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_EnabledDelegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    delegator: event.params.delegator,
    delegate: event.params.delegate,
  };

  context.DelegationManager_EnabledDelegation.set(entity);
});

MUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: MUSDC_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.MUSDC_Transfer.set(entity);
});

DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_RedeemedDelegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    rootDelegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
  };

  context.DelegationManager_RedeemedDelegation.set(entity);
});
