/**
 * InterLock Signal Handlers
 * Routes incoming signals to appropriate handlers
 */
import { Signal } from '../types.js';
type SignalHandler = (signal: Signal) => void;
export declare const handlers: Map<number, SignalHandler>;
/**
 * Register a handler for a signal code
 */
export declare function registerHandler(code: number, handler: SignalHandler): void;
/**
 * Handle an incoming signal
 */
export declare function handleSignal(signal: Signal): void;
/**
 * Initialize default handlers
 */
export declare function initHandlers(): void;
export {};
//# sourceMappingURL=handlers.d.ts.map