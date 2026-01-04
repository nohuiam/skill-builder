/**
 * update_skill Tool
 * Update an existing SKILL.md
 */
import { getDatabase } from '../database/schema.js';
import { parseSkillMd, generateSkillMd } from '../parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens } from '../services/token-counter.js';
export function updateSkill(input) {
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