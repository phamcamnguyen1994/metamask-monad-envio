import assert from "assert";
import { 
  TestHelpers,
  DelegationManager_EnabledDelegation
} from "generated";
const { MockDb, DelegationManager } = TestHelpers;

describe("DelegationManager contract EnabledDelegation event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for DelegationManager contract EnabledDelegation event
  const event = DelegationManager.EnabledDelegation.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("DelegationManager_EnabledDelegation is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await DelegationManager.EnabledDelegation.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualDelegationManagerEnabledDelegation = mockDbUpdated.entities.DelegationManager_EnabledDelegation.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedDelegationManagerEnabledDelegation: DelegationManager_EnabledDelegation = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      delegationHash: event.params.delegationHash,
      delegator: event.params.delegator,
      delegate: event.params.delegate,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualDelegationManagerEnabledDelegation, expectedDelegationManagerEnabledDelegation, "Actual DelegationManagerEnabledDelegation should be the same as the expectedDelegationManagerEnabledDelegation");
  });
});
