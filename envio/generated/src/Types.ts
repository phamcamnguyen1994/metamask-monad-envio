// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  readonly DelegationManager_EnabledDelegation: {
    /**
     * Load the entity DelegationManager_EnabledDelegation from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.DelegationManager_EnabledDelegation_t | undefined>,
    /**
     * Load the entity DelegationManager_EnabledDelegation from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.DelegationManager_EnabledDelegation_t>,
    readonly getWhere: Entities.DelegationManager_EnabledDelegation_indexedFieldOperations,
    /**
     * Returns the entity DelegationManager_EnabledDelegation from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.DelegationManager_EnabledDelegation_t) => Promise<Entities.DelegationManager_EnabledDelegation_t>,
    /**
     * Set the entity DelegationManager_EnabledDelegation in the storage.
     */
    readonly set: (entity: Entities.DelegationManager_EnabledDelegation_t) => void,
    /**
     * Delete the entity DelegationManager_EnabledDelegation from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly MUSDC_Transfer: {
    /**
     * Load the entity MUSDC_Transfer from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.MUSDC_Transfer_t | undefined>,
    /**
     * Load the entity MUSDC_Transfer from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.MUSDC_Transfer_t>,
    readonly getWhere: Entities.MUSDC_Transfer_indexedFieldOperations,
    /**
     * Returns the entity MUSDC_Transfer from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.MUSDC_Transfer_t) => Promise<Entities.MUSDC_Transfer_t>,
    /**
     * Set the entity MUSDC_Transfer in the storage.
     */
    readonly set: (entity: Entities.MUSDC_Transfer_t) => void,
    /**
     * Delete the entity MUSDC_Transfer from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

