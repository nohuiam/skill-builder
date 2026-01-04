/**
 * InterLock Protocol
 * BaNano encoding/decoding for mesh signals
 */

import { Signal, SignalTypes } from '../types.js';

// Signal code to name mapping
const signalNames: Record<number, string> = {
  [SignalTypes.EXPERIENCE_RECORDED]: 'EXPERIENCE_RECORDED',
  [SignalTypes.PATTERN_EMERGED]: 'PATTERN_EMERGED',
  [SignalTypes.LESSON_EXTRACTED]: 'LESSON_EXTRACTED',
  [SignalTypes.OPERATION_COMPLETE]: 'OPERATION_COMPLETE',
  [SignalTypes.HEARTBEAT]: 'HEARTBEAT',
  [SignalTypes.SKILL_CREATED]: 'SKILL_CREATED',
  [SignalTypes.SKILL_MATCHED]: 'SKILL_MATCHED',
  [SignalTypes.SKILL_USED]: 'SKILL_USED',
  [SignalTypes.SKILL_DEPRECATED]: 'SKILL_DEPRECATED',
  [SignalTypes.SKILL_VALIDATION_FAILED]: 'SKILL_VALIDATION_FAILED',
};

// Name to code mapping
const signalCodes: Record<string, number> = Object.entries(signalNames).reduce(
  (acc, [code, name]) => ({ ...acc, [name]: parseInt(code) }),
  {}
);

/**
 * Encode a signal to Buffer for UDP transmission
 */
export function encodeSignal(signal: Signal): Buffer {
  const senderBuffer = Buffer.from(signal.sender, 'utf8');
  const dataBuffer = signal.data ? Buffer.from(JSON.stringify(signal.data), 'utf8') : Buffer.alloc(0);

  // Format: [code:1][timestamp:8][senderLen:2][sender:N][dataLen:4][data:N]
  const totalLength = 1 + 8 + 2 + senderBuffer.length + 4 + dataBuffer.length;
  const buffer = Buffer.alloc(totalLength);

  let offset = 0;

  // Signal code (1 byte)
  buffer.writeUInt8(signal.code, offset);
  offset += 1;

  // Timestamp (8 bytes)
  buffer.writeBigUInt64BE(BigInt(signal.timestamp), offset);
  offset += 8;

  // Sender length (2 bytes) + sender
  buffer.writeUInt16BE(senderBuffer.length, offset);
  offset += 2;
  senderBuffer.copy(buffer, offset);
  offset += senderBuffer.length;

  // Data length (4 bytes) + data
  buffer.writeUInt32BE(dataBuffer.length, offset);
  offset += 4;
  dataBuffer.copy(buffer, offset);

  return buffer;
}

/**
 * Decode a Buffer to Signal
 */
export function decodeSignal(buffer: Buffer): Signal {
  let offset = 0;

  // Signal code
  const code = buffer.readUInt8(offset);
  offset += 1;

  // Timestamp
  const timestamp = Number(buffer.readBigUInt64BE(offset));
  offset += 8;

  // Sender
  const senderLen = buffer.readUInt16BE(offset);
  offset += 2;
  const sender = buffer.slice(offset, offset + senderLen).toString('utf8');
  offset += senderLen;

  // Data
  const dataLen = buffer.readUInt32BE(offset);
  offset += 4;
  const data = dataLen > 0
    ? JSON.parse(buffer.slice(offset, offset + dataLen).toString('utf8'))
    : undefined;

  return {
    code,
    name: getSignalName(code),
    sender,
    timestamp,
    data
  };
}

/**
 * Create a new signal
 */
export function createSignal(
  code: number,
  sender: string,
  data?: Record<string, unknown>
): Signal {
  return {
    code,
    name: getSignalName(code),
    sender,
    timestamp: Date.now(),
    data
  };
}

/**
 * Get signal name from code
 */
export function getSignalName(code: number): string {
  return signalNames[code] || `UNKNOWN_${code.toString(16).toUpperCase()}`;
}

/**
 * Get signal code from name
 */
export function getSignalCode(name: string): number | undefined {
  return signalCodes[name];
}
