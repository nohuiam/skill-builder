/**
 * Skill Builder Type Definitions
 * Based on Anthropic Claude Skills specification
 */
// =============================================================================
// InterLock Signals
// =============================================================================
export const SignalTypes = {
    // Incoming signals
    EXPERIENCE_RECORDED: 0xF0,
    PATTERN_EMERGED: 0xF1,
    LESSON_EXTRACTED: 0xF2,
    OPERATION_COMPLETE: 0xFF,
    HEARTBEAT: 0x00,
    // Outgoing signals
    SKILL_CREATED: 0xA0,
    SKILL_MATCHED: 0xA1,
    SKILL_USED: 0xA2,
    SKILL_DEPRECATED: 0xA3,
    SKILL_VALIDATION_FAILED: 0xA4,
};
// =============================================================================
// Configuration
// =============================================================================
export const SKILL_CONFIG = {
    // Progressive disclosure limits
    LAYER1_MAX_TOKENS: 100,
    LAYER2_MAX_TOKENS: 5000,
    // Validation thresholds
    MIN_DESCRIPTION_LENGTH: 20,
    MAX_DESCRIPTION_LENGTH: 500,
    // Matching thresholds
    MIN_MATCH_CONFIDENCE: 0.05, // Lowered from 0.3 to support short queries
    HIGH_MATCH_CONFIDENCE: 0.7,
    // Skill directories to index
    SKILL_DIRECTORIES: [
        '/Users/macbook/Documents/claude_home/repo/claude-skills/',
        '/Users/macbook/Documents/claude_home/repo/bop/skills/'
    ]
};
//# sourceMappingURL=types.js.map