/**
 * InterLock Tumbler
 * Whitelist filtering for signals
 */
import { Signal } from '../types.js';
/**
 * Load tumbler configuration from interlock.json
 */
export declare function loadTumblerConfig(): void;
/**
 * Check if a signal is allowed through the tumbler
 */
export declare function isSignalAllowed(signal: Signal): boolean;
/**
 * Add a signal to the whitelist
 */
export declare function addToWhitelist(signalName: string): void;
/**
 * Remove a signal from the whitelist
 */
export declare function removeFromWhitelist(signalName: string): void;
/**
 * Get current whitelist
 */
export declare function getWhitelist(): string[];
//# sourceMappingURL=tumbler.d.ts.map