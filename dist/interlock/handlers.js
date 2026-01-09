/**
 * InterLock Signal Handlers
 * Routes incoming signals to appropriate handlers
 */
import { SignalTypes } from '../types.js';
import { getDatabase } from '../database/schema.js';
import { getSignalName } from './protocol.js';
// Registered handlers
export const handlers = new Map();
/**
 * Register a handler for a signal type
 */
export function registerHandler(signalType, handler) {
    handlers.set(signalType, handler);
}
/**
 * Handle an incoming signal
 */
export function handleSignal(signal) {
    const handler = handlers.get(signal.signalType);
    const signalName = getSignalName(signal.signalType);
    if (handler) {
        try {
            handler(signal);
        }
        catch (error) {
            console.error(`Error handling signal ${signalName}:`, error);
        }
    }
    else {
        // Unknown signal - log but don't error
        console.error(`No handler for signal: ${signalName} (0x${signal.signalType.toString(16)})`);
    }
}
// =============================================================================
// Built-in Handlers
// =============================================================================
// Handle EXPERIENCE_RECORDED from experience-layer
registerHandler(SignalTypes.EXPERIENCE_RECORDED, (signal) => {
    const { sender } = signal.payload;
    console.error(`Received EXPERIENCE_RECORDED from ${sender}`);
    // Could update skill recommendations based on experience outcomes
});
// Handle PATTERN_EMERGED from experience-layer
registerHandler(SignalTypes.PATTERN_EMERGED, (signal) => {
    const { sender, pattern_id, description } = signal.payload;
    console.error(`Received PATTERN_EMERGED from ${sender}`);
    // Could suggest creating a new skill based on the pattern
    if (pattern_id !== undefined) {
        console.error(`Pattern ${pattern_id}: ${description}`);
    }
});
// Handle LESSON_EXTRACTED from experience-layer
registerHandler(SignalTypes.LESSON_EXTRACTED, (signal) => {
    const { sender, lesson_id, statement } = signal.payload;
    console.error(`Received LESSON_EXTRACTED from ${sender}`);
    // Could auto-generate a skill from the lesson
    if (lesson_id !== undefined) {
        console.error(`Lesson ${lesson_id}: ${statement}`);
    }
});
// Handle OPERATION_COMPLETE from any server
registerHandler(SignalTypes.OPERATION_COMPLETE, (signal) => {
    // Track if operation used a skill
    const { sender, skill_id, outcome, ...rest } = signal.payload;
    if (skill_id && outcome) {
        try {
            const db = getDatabase();
            db.insertUsage({
                skill_id,
                outcome: outcome,
                context: { sender, ...rest },
                created_at: Date.now()
            });
        }
        catch (error) {
            console.error('Failed to record skill usage:', error);
        }
    }
});
// Handle HEARTBEAT
registerHandler(SignalTypes.HEARTBEAT, (_signal) => {
    // Just log heartbeats at debug level
    // const { sender } = signal.payload;
    // console.error(`Heartbeat from ${sender}`);
});
/**
 * Initialize default handlers
 */
export function initHandlers() {
    // Handlers are registered above at module load time
    console.error('InterLock handlers initialized');
}
//# sourceMappingURL=handlers.js.map