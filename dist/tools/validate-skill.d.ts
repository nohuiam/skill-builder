/**
 * validate_skill Tool
 * Check SKILL.md structure, frontmatter, token counts per layer
 * Includes cognitive integration validation for the 7-step cognitive loop
 */
import { ValidateSkillInput, ValidationResult } from '../types.js';
export interface ValidateSkillOptions {
    /** Whether to require cognitive_integration (default: false for backward compatibility) */
    strict_cognitive?: boolean;
}
export declare function validateSkill(input: ValidateSkillInput, options?: ValidateSkillOptions): ValidationResult;
//# sourceMappingURL=validate-skill.d.ts.map