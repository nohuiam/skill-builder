/**
 * update_skill Tool
 * Update an existing SKILL.md
 */
import { getDatabase } from '../database/schema.js';
import { parseSkillMd, generateSkillMd } from '../parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens } from '../services/token-counter.js';
export function updateSkill(input) {
    // Validate input
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid input: expected an object with skill_id and updates');
    }
    if (!input.skill_id || typeof input.skill_id !== 'string') {
        throw new Error('skill_id is required and must be a string');
    }
    if (input.skill_id.trim().length === 0) {
        throw new Error('skill_id cannot be empty');
    }
    if (!input.updates || typeof input.updates !== 'object') {
        throw new Error('updates is required and must be an object');
    }
    // Validate update fields if provided
    if (input.updates.name !== undefined) {
        if (typeof input.updates.name !== 'string' || input.updates.name.trim().length === 0) {
            throw new Error('updates.name must be a non-empty string');
        }
        if (input.updates.name.length > 100) {
            throw new Error('updates.name exceeds maximum length of 100 characters');
        }
    }
    if (input.updates.description !== undefined) {
        if (typeof input.updates.description !== 'string') {
            throw new Error('updates.description must be a string');
        }
        if (input.updates.description.length > 10000) {
            throw new Error('updates.description exceeds maximum length of 10000 characters');
        }
    }
    if (input.updates.tags !== undefined && !Array.isArray(input.updates.tags)) {
        throw new Error('updates.tags must be an array');
    }
    const db = getDatabase();
    // Get existing skill
    const skill = db.getSkill(input.skill_id);
    if (!skill) {
        throw new Error(`Skill not found: ${input.skill_id}`);
    }
    const previousVersion = skill.version;
    // Parse existing content
    const parsed = parseSkillMd(skill.full_content);
    // Apply updates to frontmatter
    const newFrontmatter = {
        name: input.updates.name ?? parsed.frontmatter.name,
        description: input.updates.description ?? parsed.frontmatter.description,
        tags: input.updates.tags ?? parsed.frontmatter.tags
    };
    // Apply updates to body
    const newBody = {
        overview: input.updates.overview ?? parsed.body.overview,
        prerequisites: input.updates.prerequisites ?? parsed.body.prerequisites,
        steps: input.updates.steps ?? parsed.body.steps,
        examples: input.updates.examples ?? parsed.body.examples,
        error_handling: input.updates.error_handling ?? parsed.body.error_handling,
        limitations: input.updates.limitations ?? parsed.body.limitations,
        raw_body: ''
    };
    // Generate new content
    const newContent = generateSkillMd(newFrontmatter, newBody);
    // Calculate new token counts
    const layer1Tokens = countLayer1Tokens(newFrontmatter.name, newFrontmatter.description);
    const layer2Tokens = countLayer2Tokens(newContent);
    // Update database
    db.updateSkill(input.skill_id, {
        name: newFrontmatter.name,
        description: newFrontmatter.description,
        full_content: newContent,
        token_count_layer1: layer1Tokens,
        token_count_layer2: layer2Tokens,
        tags: newFrontmatter.tags
    });
    // Get updated skill for new version
    const updatedSkill = db.getSkill(input.skill_id);
    return {
        updated: true,
        skill_id: input.skill_id,
        previous_version: previousVersion,
        new_version: updatedSkill?.version || previousVersion + 1
    };
}
//# sourceMappingURL=update-skill.js.map