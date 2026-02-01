/**
 * InterLock UDP Socket
 * Handles mesh communication using shared @bop/interlock package
 */
import { InterlockSocket as SharedInterlockSocket, } from '@bop/interlock';
import { SignalTypes } from '../types.js';
import { createSignal } from './protocol.js';
import { isSignalAllowed } from './tumbler.js';
import { handleSignal } from './handlers.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let sharedSocket = null;
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
 * Convert shared signal format to local format
 */
function convertToLocalSignal(sharedSignal) {
    return {
        signalType: sharedSignal.type,
        version: 0x0100,
        timestamp: sharedSignal.timestamp || Math.floor(Date.now() / 1000),
        payload: {
            sender: sharedSignal.data.serverId || 'unknown',
            ...sharedSignal.data,
        },
    };
}
/**
 * Start the InterLock UDP socket
 */
export async function startSocket(port) {
    serverPort = port;
    loadPeers();
    // Convert peers to shared package format
    const peerConfig = {};
    for (const peer of peers) {
        peerConfig[peer.name] = { host: 'localhost', port: peer.port };
    }
    // Create shared socket
    sharedSocket = new SharedInterlockSocket({
        port,
        serverId: 'skill-builder',
        heartbeat: {
            interval: 30000,
            timeout: 90000,
        },
        peers: peerConfig,
    });
    // Set up signal handler
    sharedSocket.on('signal', (sharedSignal, rinfo) => {
        const signal = convertToLocalSignal(sharedSignal);
        // Check tumbler whitelist
        if (!isSignalAllowed(signal)) {
            return;
        }
        // Route to handler
        handleSignal(signal);
    });
    sharedSocket.on('error', (error) => {
        console.error('InterLock socket error:', error);
    });
    await sharedSocket.start();
    console.error(`InterLock socket listening on port ${port}`);
    return sharedSocket;
}
/**
 * Send a signal to a specific peer
 */
export function sendToPeer(peerName, signal) {
    if (!sharedSocket) {
        console.error('Socket not initialized');
        return;
    }
    const peer = peers.find(p => p.name === peerName);
    if (!peer) {
        console.error(`Unknown peer: ${peerName}`);
        return;
    }
    const signalInput = {
        type: signal.signalType,
        data: {
            serverId: signal.payload.sender,
            ...signal.payload,
        },
    };
    sharedSocket.send('localhost', peer.port, signalInput).catch((error) => {
        console.error(`Failed to send to ${peerName}:`, error);
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
    broadcastSignal(signal, ['consciousness-mcp', 'experience-layer']);
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
    broadcastSignal(signal, ['consciousness-mcp']);
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
    broadcastSignal(signal, ['consciousness-mcp']);
}
/**
 * Emit SKILL_VALIDATION_FAILED signal
 */
export function emitSkillValidationFailed(skillId, errors) {
    const signal = createSignal(SignalTypes.SKILL_VALIDATION_FAILED, 'skill-builder', {
        skill_id: skillId,
        errors
    });
    broadcastSignal(signal, ['consciousness-mcp']);
}
/**
 * Close the socket
 */
export async function closeSocket() {
    if (sharedSocket) {
        await sharedSocket.stop();
        sharedSocket = null;
    }
}
/**
 * Get socket status
 */
export function getSocketStatus() {
    return {
        listening: sharedSocket !== null,
        port: serverPort,
        peerCount: peers.length
    };
}
//# sourceMappingURL=socket.js.map