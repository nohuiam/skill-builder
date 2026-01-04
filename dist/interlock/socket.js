/**
 * InterLock UDP Socket
 * Handles mesh communication
 */
import dgram from 'dgram';
import { SignalTypes } from '../types.js';
import { encodeSignal, decodeSignal, createSignal } from './protocol.js';
import { isSignalAllowed } from './tumbler.js';
import { handleSignal } from './handlers.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let socket = null;
let serverPort = 3029;
let peers = [];
/**
 * Load peer configuration
 */
function loadPeers() {
    try {
        const configPath = join(__dirname, '../../config/interlock.json');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        peers = config.peers || [];
    }
    catch (error) {
        console.error('Failed to load peers config:', error);
        peers = [];
    }
}
/**
 * Start the InterLock UDP socket
 */
export function startSocket(port) {
    serverPort = port;
    loadPeers();
    socket = dgram.createSocket('udp4');
    socket.on('message', (msg, rinfo) => {
        const signal = decodeSignal(msg);
        // Silently ignore invalid/incompatible signals from other servers
        if (!signal) {
            return;
        }
        // Check tumbler whitelist
        if (!isSignalAllowed(signal)) {
            return;
        }
        // Route to handler
        handleSignal(signal);
    });
    socket.on('error', (error) => {
        console.error('InterLock socket error:', error);
    });
    socket.bind(port, () => {
        console.error(`InterLock socket listening on port ${port}`);
    });
    return socket;
}
/**
 * Send a signal to a specific peer
 */
export function sendToPeer(peerName, signal) {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }
    const peer = peers.find(p => p.name === peerName);
    if (!peer) {
        console.error(`Unknown peer: ${peerName}`);
        return;
    }
    const buffer = encodeSignal(signal);
    socket.send(buffer, peer.port, 'localhost', (error) => {
        if (error) {
            console.error(`Failed to send to ${peerName}:`, error);
        }
    });
}
/**
 * Broadcast a signal to multiple peers
 */
export function broadcastSignal(signal, peerNames) {
    const targetPeers = peerNames
        ? peers.filter(p => peerNames.includes(p.name))
        : peers;
    for (const peer of targetPeers) {
        sendToPeer(peer.name, signal);
    }
}
/**
 * Emit SKILL_CREATED signal
 */
export function emitSkillCreated(skillId, name) {
    const signal = createSignal(SignalTypes.SKILL_CREATED, 'skill-builder', {
        skill_id: skillId,
        name
    });
    broadcastSignal(signal, ['consciousness', 'experience-layer']);
}
/**
 * Emit SKILL_MATCHED signal
 */
export function emitSkillMatched(skillId, taskDescription, confidence) {
    const signal = createSignal(SignalTypes.SKILL_MATCHED, 'skill-builder', {
        skill_id: skillId,
        task_description: taskDescription,
        confidence
    });
    broadcastSignal(signal, ['consciousness']);
}
/**
 * Emit SKILL_USED signal
 */
export function emitSkillUsed(skillId, outcome) {
    const signal = createSignal(SignalTypes.SKILL_USED, 'skill-builder', {
        skill_id: skillId,
        outcome
    });
    broadcastSignal(signal, ['experience-layer']);
}
/**
 * Emit SKILL_DEPRECATED signal
 */
export function emitSkillDeprecated(skillId, reason) {
    const signal = createSignal(SignalTypes.SKILL_DEPRECATED, 'skill-builder', {
        skill_id: skillId,
        reason
    });
    broadcastSignal(signal, ['consciousness']);
}
/**
 * Emit SKILL_VALIDATION_FAILED signal
 */
export function emitSkillValidationFailed(skillId, errors) {
    const signal = createSignal(SignalTypes.SKILL_VALIDATION_FAILED, 'skill-builder', {
        skill_id: skillId,
        errors
    });
    broadcastSignal(signal, ['consciousness']);
}
/**
 * Close the socket
 */
export function closeSocket() {
    if (socket) {
        socket.close();
        socket = null;
    }
}
/**
 * Get socket status
 */
export function getSocketStatus() {
    return {
        listening: socket !== null,
        port: serverPort,
        peerCount: peers.length
    };
}
//# sourceMappingURL=socket.js.map