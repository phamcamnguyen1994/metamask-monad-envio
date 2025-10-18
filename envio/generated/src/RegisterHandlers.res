@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require(`../${Path.relativePathToRootFromGenerated}/${handlerPathRelativeToRoot}`)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

%%private(
  let makeGeneratedConfig = () => {
    let chains = [
      {
        let contracts = [
          {
            InternalConfig.name: "MonUSDC",
            abi: Types.MonUSDC.abi,
            addresses: [
              "0x3A13C20987Ac0e6840d9CB6e917085F72D17E698"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.MonUSDC.Transfer.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
          {
            InternalConfig.name: "DelegationManager",
            abi: Types.DelegationManager.abi,
            addresses: [
              "0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3"->Address.Evm.fromStringOrThrow
,
            ],
            events: [
              (Types.DelegationManager.EnabledDelegation.register() :> Internal.eventConfig),
              (Types.DelegationManager.RedeemedDelegation.register() :> Internal.eventConfig),
              (Types.DelegationManager.DisabledDelegation.register() :> Internal.eventConfig),
            ],
            startBlock: None,
          },
        ]
        let chain = ChainMap.Chain.makeUnsafe(~chainId=10143)
        {
          InternalConfig.confirmedBlockThreshold: 200,
          startBlock: 0,
          id: 10143,
          contracts,
          sources: NetworkSources.evm(~chain, ~contracts=[{name: "MonUSDC",events: [Types.MonUSDC.Transfer.register()],abi: Types.MonUSDC.abi}, {name: "DelegationManager",events: [Types.DelegationManager.EnabledDelegation.register(), Types.DelegationManager.RedeemedDelegation.register(), Types.DelegationManager.DisabledDelegation.register()],abi: Types.DelegationManager.abi}], ~hyperSync=None, ~allEventSignatures=[Types.MonUSDC.eventSignatures, Types.DelegationManager.eventSignatures]->Belt.Array.concatMany, ~shouldUseHypersyncClientDecoder=true, ~rpcs=[{url: "https://rpc.ankr.com/monad_testnet", sourceFor: Sync, syncConfig: {}}], ~lowercaseAddresses=false)
        }
      },
    ]

    Config.make(
      ~shouldRollbackOnReorg=true,
      ~shouldSaveFullHistory=false,
      ~isUnorderedMultichainMode=false,
      ~chains,
      ~enableRawEvents=false,
      ~batchSize=?Env.batchSize,
      ~preloadHandlers=false,
      ~lowercaseAddresses=false,
      ~shouldUseHypersyncClientDecoder=true,
    )
  }

  let config: ref<option<Config.t>> = ref(None)
)

let registerAllHandlers = () => {
  let configWithoutRegistrations = makeGeneratedConfig()
  EventRegister.startRegistration(
    ~ecosystem=configWithoutRegistrations.ecosystem,
    ~multichain=configWithoutRegistrations.multichain,
    ~preloadHandlers=configWithoutRegistrations.preloadHandlers,
  )

  registerContractHandlers(
    ~contractName="DelegationManager",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="MonUSDC",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )

  let generatedConfig = {
    // Need to recreate initial config one more time,
    // since configWithoutRegistrations called register for event
    // before they were ready
    ...makeGeneratedConfig(),
    registrations: Some(EventRegister.finishRegistration()),
  }
  config := Some(generatedConfig)
  generatedConfig
}

let getConfig = () => {
  switch config.contents {
  | Some(config) => config
  | None => registerAllHandlers()
  }
}

let getConfigWithoutRegistrations = makeGeneratedConfig
