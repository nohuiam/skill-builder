/**
 * InterLock UDP Socket
 * Handles mesh communication using shared @bop/interlock package
 */

import {
  InterlockSocket as SharedInterlockSocket,
  type Signal as SharedSignal,
  type SignalInput,
  type RemoteInfo,
} from '@bop/interlock';
import { Signal, SignalTypes } from '../types.js';
import { createSignal, encodeSignal } from './protocol.js';
import { isSignalAllowed } from './tumbler.js';
import { handleSignal } from './handlers.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let sharedSocket: SharedInterlockSocket | null = null;
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
 * Convert shared signal format to local format
 */
function convertToLocalSignal(sharedSignal: SharedSignal): Signal {
  return {
    signalType: sharedSignal.type,
    version: 0x0100,
    timestamp: sharedSignal.timestamp || Math.floor(Date.now() / 1000),
    payload: {
      sender: sharedSignal.data.serverId as string || 'unknown',
      ...sharedSignal.data,
    },
  };
}

/**
 * Start the InterLock UDP socket
 */
export async function startSocket(port: number): Promise<SharedInterlockSocket> {
  serverPort = port;
  loadPeers();

  // Convert peers to shared package format
  const peerConfig: Record<string, { host: string; port: number }> = {};
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
  sharedSocket.on('signal', (sharedSignal: SharedSignal, rinfo: RemoteInfo) => {
    const signal = convertToLocalSignal(sharedSignal);

    // Check tumbler whitelist
    if (!isSignalAllowed(signal)) {
      return;
    }

    // Route to handler
    handleSignal(signal);
  });

  sharedSocket.on('error', (error: Error) => {
    console.error('InterLock socket error:', error);
  });

  await sharedSocket.start();
  console.error(`InterLock socket listening on port ${port}`);

  return sharedSocket;
}

/**
 * Send a signal to a specific peer
 */
export function sendToPeer(peerName: string, signal: Signal): void {
  if (!sharedSocket) {
    console.error('Socket not initialized');
    return;
  }

  const peer = peers.find(p => p.name === peerName);
  if (!peer) {
    console.error(`Unknown peer: ${peerName}`);
    return;
  }

  const signalInput: SignalInput = {
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
  broadcastSignal(signal, ['consciousness-mcp', 'experience-layer']);
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
  broadcastSignal(signal, ['consciousness-mcp']);
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
  broadcastSignal(signal, ['consciousness-mcp']);
}

/**
 * Emit SKILL_VALIDATION_FAILED signal
 */
export function emitSkillValidationFailed(skillId: string, errors: string[]): void {
  const signal = createSignal(SignalTypes.SKILL_VALIDATION_FAILED, 'skill-builder', {
    skill_id: skillId,
    errors
  });
  broadcastSignal(signal, ['consciousness-mcp']);
}

/**
 * Close the socket
 */
export async function closeSocket(): Promise<void> {
  if (sharedSocket) {
    await sharedSocket.stop();
    sharedSocket = null;
  }
}

/**
 * Get socket status
 */
export function getSocketStatus(): { listening: boolean; port: number; peerCount: number } {
  return {
    listening: sharedSocket !== null,
    port: serverPort,
    peerCount: peers.length
  };
}
