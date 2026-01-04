/**
 * list_skills Tool
 * List all skills with Layer 1 metadata
 */
import { getDatabase } from '../database/schema.js';
export function listSkills(input) {
    const db = getDatabase();
    let skills = db.getSkillMetadata(input.include_deprecated || false);
    // Filter by search term
    if (input.search) {
        const searchLower = input.search.toLowerCase();
        skills = skills.filter(skill => skill.name.toLowerCase().includes(searchLower) ||
            skill.description.toLowerCase().includes(searchLower));
    }
    // Filter by tags
    if (input.tags && input.tags.length > 0) {
        skills = skills.filter(skill => {
            const skillTags = skill.tags || [];
            return input.tags.some(tag => skillTags.includes(tag));
        });
    }
    return {
        skills,
        count: skills.length
    };
}
//# sourceMappingURL=list-skills.js.map