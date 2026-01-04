/**
 * SKILL.md Parser
 * Parses YAML frontmatter + Markdown body following Anthropic's specification
 */
import { ParsedSkill, SkillFrontmatter, SkillBody } from '../types.js';
/**
 * Parse a SKILL.md file content into structured data
 */
export declare function parseSkillMd(content: string): ParsedSkill;
/**
 * Generate SKILL.md content from structured data
 */
export declare function generateSkillMd(frontmatter: SkillFrontmatter, body: Partial<SkillBody>): string;
/**
 * Validate SKILL.md structure
 */
export declare function validateSkillMd(content: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
//# sourceMappingURL=skill-parser.d.ts.map