/**
 * InterLock UDP Socket
 * Handles mesh communication
 */

import dgram from 'dgram';
import { Signal, SignalTypes } from '../types.js';
import { encodeSignal, decodeSignal, createSignal } from './protocol.js';
import { isSignalAllowed } from './tumbler.js';
import { handleSignal } from './handlers.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let socket: dgram.Socket | null = null;
let serverPort: number = 3029;

interface Peer {
  name: string;
  port: number;
}

let peers: Peer[] = [];

/**
 * Load peer configuration
 */
function loadPeers(): void {
  try {
    const configPath = join(__dirname, '../../config/interlock.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    peers = config.peers || [];
  } catch (error) {
    console.error('Failed to load peers config:', error);
    peers = [];
  }
}

/**
 * Start the InterLock UDP socket
 */
export function startSocket(port: number): dgram.Socket {
  serverPort = port;
  loadPeers();

  socket = dgram.createSocket('udp4');

  socket.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    try {
      const signal = decodeSignal(msg);

      // Check tumbler whitelist
      if (!isSignalAllowed(signal)) {
        console.error(`Signal ${signal.name} blocked by tumbler`);
        return;
      }

      // Route to handler
      handleSignal(signal);
    } catch (error) {
      console.error('Failed to process incoming signal:', error);
    }
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
export function sendToPeer(peerName: string, signal: Signal): void {
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
export function broadcastSignal(signal: Signal, peerNames?: string[]): void {
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
export function emitSkillCreated(skillId: string, name: string): void {
  const signal = createSignal(SignalTypes.SKILL_CREATED, 'skill-builder', {
    skill_id: skillId,
    name
  });
  broadcastSignal(signal, ['consciousness', 'experience-layer']);
}

/**
 * Emit SKILL_MATCHED signal
 */
export function emitSkillMatched(skillId: string, taskDescription: string, confidence: number): void {
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
export function emitSkillUsed(skillId: string, outcome: string): void {
  const signal = createSignal(SignalTypes.SKILL_USED, 'skill-builder', {
    skill_id: skillId,
    outcome
  });
  broadcastSignal(signal, ['experience-layer']);
}

/**
 * Emit SKILL_DEPRECATED signal
 */
export function emitSkillDeprecated(skillId: string, reason?: string): void {
  const signal = createSignal(SignalTypes.SKILL_DEPRECATED, 'skill-builder', {
    skill_id: skillId,
    reason
  });
  broadcastSignal(signal, ['consciousness']);
}

/**
 * Emit SKILL_VALIDATION_FAILED signal
 */
export function emitSkillValidationFailed(skillId: string, errors: string[]): void {
  const signal = createSignal(SignalTypes.SKILL_VALIDATION_FAILED, 'skill-builder', {
    skill_id: skillId,
    errors
  });
  broadcastSignal(signal, ['consciousness']);
}

/**
 * Close the socket
 */
export function closeSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

/**
 * Get socket status
 */
export function getSocketStatus(): { listening: boolean; port: number; peerCount: number } {
  return {
    listening: socket !== null,
    port: serverPort,
    peerCount: peers.length
  };
}
