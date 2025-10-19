module ContractType = {
  @genType
  type t = 
    | @as("DelegationManager") DelegationManager
    | @as("MUSDC") MUSDC

  let name = "CONTRACT_TYPE"
  let variants = [
    DelegationManager,
    MUSDC,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("DelegationManager_EnabledDelegation") DelegationManager_EnabledDelegation
    | @as("MUSDC_Transfer") MUSDC_Transfer
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    DelegationManager_EnabledDelegation,
    MUSDC_Transfer,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
