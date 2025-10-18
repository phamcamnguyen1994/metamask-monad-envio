  @genType
module DelegationManager = {
  module RedeemedDelegation = Types.MakeRegister(Types.DelegationManager.RedeemedDelegation)
  module EnabledDelegation = Types.MakeRegister(Types.DelegationManager.EnabledDelegation)
}

  @genType
module MonUSDC = {
  module Transfer = Types.MakeRegister(Types.MonUSDC.Transfer)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
