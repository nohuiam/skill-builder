/**
 * InterLock UDP Socket
 * Handles mesh communication
 */
import dgram from 'dgram';
import { Signal } from '../types.js';
/**
 * Start the InterLock UDP socket
 */
export declare function startSocket(port: number): dgram.Socket;
/**
 * Send a signal to a specific peer
 */
export declare function sendToPeer(peerName: string, signal: Signal): void;
/**
 * Broadcast a signal to multiple peers
 */
export declare function broadcastSignal(signal: Signal, peerNames?: string[]): void;
/**
 * Emit SKILL_CREATED signal
 */
export declare function emitSkillCreated(skillId: string, name: string): void;
/**
 * Emit SKILL_MATCHED signal
 */
export declare function emitSkillMatched(skillId: string, taskDescription: string, confidence: number): void;
/**
 * Emit SKILL_USED signal
 */
export declare function emitSkillUsed(skillId: string, outcome: string): void;
/**
 * Emit SKILL_DEPRECATED signal
 */
export declare function emitSkillDeprecated(skillId: string, reason?: string): void;
/**
 * Emit SKILL_VALIDATION_FAILED signal
 */
export declare function emitSkillValidationFailed(skillId: string, errors: string[]): void;
/**
 * Close the socket
 */
export declare function closeSocket(): void;
/**
 * Get socket status
 */
export declare function getSocketStatus(): {
    listening: boolean;
    port: number;
    peerCount: number;
};
//# sourceMappingURL=socket.d.ts.map