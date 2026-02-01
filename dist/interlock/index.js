/**
 * InterLock Module
 * Main exports for mesh communication
 */
export { startSocket, closeSocket, sendToPeer, broadcastSignal, getSocketStatus } from './socket.js';
export { encodeSignal, decodeSignal, createSignal, getSignalName, encode, decode, isValidSignal } from './protocol.js';
export { isSignalAllowed, addToWhitelist, removeFromWhitelist, getWhitelist, loadTumblerConfig } from './tumbler.js';
export { registerHandler, handleSignal, handlers, initHandlers } from './handlers.js';
export { emitSkillCreated, emitSkillMatched, emitSkillUsed, emitSkillDeprecated, emitSkillValidationFailed } from './socket.js';
import { startSocket, closeSocket } from './socket.js';
import { initHandlers } from './handlers.js';
let started = false;
/**
 * Start the InterLock mesh
 */
export async function startInterlock(port) {
    if (started) {
        console.error('InterLock already started');
        return;
    }
    initHandlers();
    await startSocket(port);
    started = true;
    console.error(`InterLock mesh started on port ${port}`);
}
/**
 * Close the InterLock mesh
 */
export async function closeInterlock() {
    if (!started) {
        return;
    }
    await closeSocket();
    started = false;
    console.error('InterLock mesh closed');
}
//# sourceMappingURL=index.js.map