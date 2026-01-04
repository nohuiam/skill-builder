/**
 * InterLock Signal Handlers
 * Routes incoming signals to appropriate handlers
 */

import { Signal, SignalTypes } from '../types.js';
import { getDatabase } from '../database/schema.js';

// Handler function type
type SignalHandler = (signal: Signal) => void;

// Registered handlers
export const handlers: Map<number, SignalHandler> = new Map();

/**
 * Register a handler for a signal code
 */
export function registerHandler(code: number, handler: SignalHandler): void {
  handlers.set(code, handler);
}

/**
 * Handle an incoming signal
 */
export function handleSignal(signal: Signal): void {
  const handler = handlers.get(signal.code);

  if (handler) {
    try {
      handler(signal);
    } catch (error) {
      console.error(`Error handling signal ${signal.name}:`, error);
    }
  } else {
    // Unknown signal - log but don't error
    console.error(`No handler for signal: ${signal.name} (0x${signal.code.toString(16)})`);
  }
}

// =============================================================================
// Built-in Handlers
// =============================================================================

// Handle EXPERIENCE_RECORDED from experience-layer
registerHandler(SignalTypes.EXPERIENCE_RECORDED, (signal) => {
  console.error(`Received EXPERIENCE_RECORDED from ${signal.sender}`);
  // Could update skill recommendations based on experience outcomes
});

// Handle PATTERN_EMERGED from experience-layer
registerHandler(SignalTypes.PATTERN_EMERGED, (signal) => {
  console.error(`Received PATTERN_EMERGED from ${signal.sender}`);
  // Could suggest creating a new skill based on the pattern
  if (signal.data) {
    const { pattern_id, description } = signal.data as { pattern_id?: number; description?: string };
    console.error(`Pattern ${pattern_id}: ${description}`);
  }
});

// Handle LESSON_EXTRACTED from experience-layer
registerHandler(SignalTypes.LESSON_EXTRACTED, (signal) => {
  console.error(`Received LESSON_EXTRACTED from ${signal.sender}`);
  // Could auto-generate a skill from the lesson
  if (signal.data) {
    const { lesson_id, statement } = signal.data as { lesson_id?: number; statement?: string };
    console.error(`Lesson ${lesson_id}: ${statement}`);
  }
});

// Handle OPERATION_COMPLETE from any server
registerHandler(SignalTypes.OPERATION_COMPLETE, (signal) => {
  // Track if operation used a skill
  if (signal.data) {
    const { skill_id, outcome } = signal.data as { skill_id?: string; outcome?: string };
    if (skill_id && outcome) {
      try {
        const db = getDatabase();
        db.insertUsage({
          skill_id,
          outcome: outcome as 'success' | 'failure' | 'partial',
          context: signal.data,
          created_at: Date.now()
        });
      } catch (error) {
        console.error('Failed to record skill usage:', error);
      }
    }
  }
});

// Handle HEARTBEAT
registerHandler(SignalTypes.HEARTBEAT, (signal) => {
  // Just log heartbeats at debug level
  // console.error(`Heartbeat from ${signal.sender}`);
});

/**
 * Initialize default handlers
 */
export function initHandlers(): void {
  // Handlers are registered above at module load time
  console.error('InterLock handlers initialized');
}
