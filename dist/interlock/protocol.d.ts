/**
 * InterLock Protocol - Official BaNano Binary Format
 *
 * 12-byte header:
 * Bytes 0-1:   Signal Type (uint16, big-endian)
 * Bytes 2-3:   Protocol Version (uint16, big-endian)
 * Bytes 4-7:   Payload Length (uint32, big-endian)
 * Bytes 8-11:  Timestamp (uint32, Unix seconds)
 * Bytes 12+:   Payload (JSON, UTF-8)
 */
import { Signal } from '../types.js';
/**
 * Get signal name from type code
 */
export declare function getSignalName(signalType: number): string;
/**
 * Encode a signal to BaNano binary format
 */
export declare function encode(signalType: number, sender: string, data?: Record<string, unknown>): Buffer;
/**
 * Decode a BaNano binary buffer to Signal
 * Returns null if buffer is invalid
 */
export declare function decode(buffer: Buffer): Signal | null;
/**
 * Check if a signal type is valid (known)
 */
export declare function isValidSignal(signalType: number): boolean;
/**
 * Create a Signal object for emitting
 */
export declare function createSignal(signalType: number, sender: string, data?: Record<string, unknown>): Signal;
export declare const encodeSignal: (signal: Signal) => Buffer;
export declare const decodeSignal: typeof decode;
//# sourceMappingURL=protocol.d.ts.map