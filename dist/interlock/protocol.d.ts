/**
 * InterLock Protocol
 * BaNano encoding/decoding for mesh signals
 */
import { Signal } from '../types.js';
/**
 * Encode a signal to Buffer for UDP transmission
 */
export declare function encodeSignal(signal: Signal): Buffer;
/**
 * Decode a Buffer to Signal
 * Returns null if buffer is invalid or malformed
 */
export declare function decodeSignal(buffer: Buffer): Signal | null;
/**
 * Create a new signal
 */
export declare function createSignal(code: number, sender: string, data?: Record<string, unknown>): Signal;
/**
 * Get signal name from code
 */
export declare function getSignalName(code: number): string;
/**
 * Get signal code from name
 */
export declare function getSignalCode(name: string): number | undefined;
//# sourceMappingURL=protocol.d.ts.map