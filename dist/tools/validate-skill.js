/**
 * validate_skill Tool
 * Check SKILL.md structure, frontmatter, token counts per layer
 * Includes cognitive integration validation for the 7-step cognitive loop
 */
import { getDatabase } from '../database/schema.js';
import { parseSkillMd, validateSkillMd } from '../parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens, checkProgressiveDisclosure } from '../services/token-counter.js';
import { analyzeDescription } from '../services/skill-matcher.js';
import { validateCognitiveIntegration } from '../services/cognitive-validator.js';
export function validateSkill(input, options = {}) {
    let content;
    const { strict_cognitive = false } = options;
    // Get content from skill_id, path, or direct content
    if (input.content) {
        content = input.content;
    }
    else if (input.skill_id) {
        const db = getDatabase();
        const skill = db.getSkill(input.skill_id);
        if (!skill) {
            return {
                valid: false,
                errors: [`Skill not found: ${input.skill_id}`],
                warnings: [],
                token_counts: { layer1: 0, layer2: 0 },
                progressive_disclosure_ok: false
            };
        }
        content = skill.full_content;
    }
    else if (input.path) {
        // In a real implementation, we'd read from the file system
        // For now, return an error
        return {
            valid: false,
            errors: ['File path reading not implemented - use skill_id or content'],
            warnings: [],
            token_counts: { layer1: 0, layer2: 0 },
            progressive_disclosure_ok: false
        };
    }
    else {
        return {
            valid: false,
            errors: ['Must provide skill_id, path, or content'],
            warnings: [],
            token_counts: { layer1: 0, layer2: 0 },
            progressive_disclosure_ok: false
        };
    }
    // Validate structure
    const structureValidation = validateSkillMd(content);
    // Parse the content
    const parsed = parseSkillMd(content);
    // Calculate token counts
    const layer1Tokens = countLayer1Tokens(parsed.frontmatter.name, parsed.frontmatter.description);
    const layer2Tokens = countLayer2Tokens(content);
    // Check progressive disclosure
    const pdCheck = checkProgressiveDisclosure(layer1Tokens, layer2Tokens);
    // Analyze description
    const descAnalysis = analyzeDescription(parsed.frontmatter.description);
    // Validate cognitive integration
    const cognitiveValidation = validateCognitiveIntegration(parsed, strict_cognitive);
    // Combine all validation results
    const errors = [...structureValidation.errors];
    const warnings = [...structureValidation.warnings, ...pdCheck.warnings];
    // Add cognitive validation results
    if (cognitiveValidation.errors.length > 0) {
        errors.push(...cognitiveValidation.errors);
    }
    if (cognitiveValidation.warnings.length > 0) {
        warnings.push(...cognitiveValidation.warnings);
    }
    // Include cognitive recommendations in warnings if any
    if (cognitiveValidation.recommendations.length > 0) {
        warnings.push(`Cognitive recommendations: ${cognitiveValidation.recommendations.join('; ')}`);
    }
    return {
        valid: structureValidation.valid && pdCheck.ok && cognitiveValidation.valid,
        errors,
        warnings,
        token_counts: {
            layer1: layer1Tokens,
            layer2: layer2Tokens
        },
        progressive_disclosure_ok: pdCheck.ok,
        description_analysis: descAnalysis,
        cognitive_validation: cognitiveValidation
    };
}
//# sourceMappingURL=validate-skill.js.map