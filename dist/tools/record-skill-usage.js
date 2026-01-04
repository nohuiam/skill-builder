/**
 * record_skill_usage Tool
 * Track skill usage outcome for learning
 */
import { getDatabase } from '../database/schema.js';
export function recordSkillUsage(input) {
    const db = getDatabase();
    // Verify skill exists
    const skill = db.getSkill(input.skill_id);
    if (!skill) {
        throw new Error(`Skill not found: ${input.skill_id}`);
    }
    // Record usage
    db.insertUsage({
        skill_id: input.skill_id,
        outcome: input.outcome,
        notes: input.notes,
        duration_ms: input.duration_ms,
        context: input.context,
        created_at: Date.now()
    });
    // Get updated skill for stats
    const updatedSkill = db.getSkill(input.skill_id);
    return {
        recorded: true,
        skill_id: input.skill_id,
        total_uses: updatedSkill?.usage_count || 1,
        success_rate: updatedSkill?.success_rate || 0
    };
}
//# sourceMappingURL=record-skill-usage.js.map