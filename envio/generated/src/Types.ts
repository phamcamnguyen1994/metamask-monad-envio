// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type LoaderContext = {
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
  readonly Delegation: {
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Delegation_t | undefined>,
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Delegation_t>,
    readonly getWhere: Entities.Delegation_indexedFieldOperations,
    /**
     * Returns the entity Delegation from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Delegation_t) => Promise<Entities.Delegation_t>,
    /**
     * Set the entity Delegation in the storage.
     */
    readonly set: (entity: Entities.Delegation_t) => void,
    /**
     * Delete the entity Delegation from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Redemption: {
    /**
     * Load the entity Redemption from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Redemption_t | undefined>,
    /**
     * Load the entity Redemption from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Redemption_t>,
    readonly getWhere: Entities.Redemption_indexedFieldOperations,
    /**
     * Returns the entity Redemption from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Redemption_t) => Promise<Entities.Redemption_t>,
    /**
     * Set the entity Redemption in the storage.
     */
    readonly set: (entity: Entities.Redemption_t) => void,
    /**
     * Delete the entity Redemption from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transfer: {
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transfer_t | undefined>,
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transfer_t>,
    readonly getWhere: Entities.Transfer_indexedFieldOperations,
    /**
     * Returns the entity Transfer from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transfer_t) => Promise<Entities.Transfer_t>,
    /**
     * Set the entity Transfer in the storage.
     */
    readonly set: (entity: Entities.Transfer_t) => void,
    /**
     * Delete the entity Transfer from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

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
  readonly Delegation: {
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Delegation_t | undefined>,
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Delegation_t>,
    /**
     * Returns the entity Delegation from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Delegation_t) => Promise<Entities.Delegation_t>,
    /**
     * Set the entity Delegation in the storage.
     */
    readonly set: (entity: Entities.Delegation_t) => void,
    /**
     * Delete the entity Delegation from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Redemption: {
    /**
     * Load the entity Redemption from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Redemption_t | undefined>,
    /**
     * Load the entity Redemption from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Redemption_t>,
    /**
     * Returns the entity Redemption from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Redemption_t) => Promise<Entities.Redemption_t>,
    /**
     * Set the entity Redemption in the storage.
     */
    readonly set: (entity: Entities.Redemption_t) => void,
    /**
     * Delete the entity Redemption from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transfer: {
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transfer_t | undefined>,
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transfer_t>,
    /**
     * Returns the entity Transfer from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transfer_t) => Promise<Entities.Transfer_t>,
    /**
     * Set the entity Transfer in the storage.
     */
    readonly set: (entity: Entities.Transfer_t) => void,
    /**
     * Delete the entity Transfer from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};
