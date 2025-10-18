module ContractType = {
  @genType
  type t = 
    | @as("DelegationManager") DelegationManager
    | @as("MonUSDC") MonUSDC

  let name = "CONTRACT_TYPE"
  let variants = [
    DelegationManager,
    MonUSDC,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("Delegation") Delegation
    | @as("Redemption") Redemption
    | @as("Transfer") Transfer
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    Delegation,
    Redemption,
    Transfer,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
