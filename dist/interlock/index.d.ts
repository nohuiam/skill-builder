/**
 * InterLock Module
 * Main exports for mesh communication
 */
export { startSocket, closeSocket, sendToPeer, broadcastSignal, getSocketStatus } from './socket.js';
export { encodeSignal, decodeSignal, createSignal, getSignalName, encode, decode, isValidSignal } from './protocol.js';
export { isSignalAllowed, addToWhitelist, removeFromWhitelist, getWhitelist, loadTumblerConfig } from './tumbler.js';
export { registerHandler, handleSignal, handlers, initHandlers } from './handlers.js';
export { emitSkillCreated, emitSkillMatched, emitSkillUsed, emitSkillDeprecated, emitSkillValidationFailed } from './socket.js';
/**
 * Start the InterLock mesh
 */
export declare function startInterlock(port: number): Promise<void>;
/**
 * Close the InterLock mesh
 */
export declare function closeInterlock(): Promise<void>;
//# sourceMappingURL=index.d.ts.map