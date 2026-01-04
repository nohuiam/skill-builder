/**
 * create_skill Tool
 * Generate a SKILL.md file following Anthropic's specification
 */
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema.js';
import { generateSkillMd } from '../parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens } from '../services/token-counter.js';
export function createSkill(input) {
    const db = getDatabase();
    // Build frontmatter
    const frontmatter = {
        name: input.name,
        description: input.description,
        tags: input.tags
    };
    // Build body
    const body = {
        overview: input.overview,
        prerequisites: input.prerequisites,
        steps: input.steps,
        examples: input.examples,
        error_handling: input.error_handling,
        limitations: input.limitations,
        raw_body: ''
    };
    // Generate SKILL.md content
    const fullContent = generateSkillMd(frontmatter, body);
    // Calculate token counts
    const layer1Tokens = countLayer1Tokens(input.name, input.description);
    const layer2Tokens = countLayer2Tokens(fullContent);
    // Generate skill ID
    const skillId = uuidv4();
    // Insert into database
    db.insertSkill({
        id: skillId,
        name: input.name,
        description: input.description,
        full_content: fullContent,
        version: 1,
        token_count_layer1: layer1Tokens,
        token_count_layer2: layer2Tokens,
        tags: input.tags || [],
        created_at: Date.now(),
        usage_count: 0,
        success_count: 0
    });
    return {
        skill_id: skillId,
        path: `skills/${input.name}/SKILL.md`,
        created: true,
        token_count: {
            layer1: layer1Tokens,
            layer2: layer2Tokens
        }
    };
}
//# sourceMappingURL=create-skill.js.map