/**
 * Cognitive Integration Validator
 * Validates that skills properly integrate with the 7-step cognitive loop
 */
import type { ParsedSkill, CognitiveIntegration, CognitiveValidationResult } from '../types.js';
/**
 * Validate cognitive integration configuration for a skill
 */
export declare function validateCognitiveIntegration(parsed: ParsedSkill, strict?: boolean): CognitiveValidationResult;
/**
 * Generate default cognitive integration based on skill content
 */
export declare function generateDefaultCognitiveIntegration(parsed: ParsedSkill): CognitiveIntegration;
/**
 * Check if a skill has proper cognitive integration for its operation type
 */
export declare function hasSufficientCognitiveIntegration(parsed: ParsedSkill): {
    sufficient: boolean;
    missing: string[];
};
//# sourceMappingURL=cognitive-validator.d.ts.map