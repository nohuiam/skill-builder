/**
 * record_skill_usage Tool
 * Track skill usage outcome for learning
 */

import { getDatabase } from '../database/schema.js';
import { RecordSkillUsageInput, RecordSkillUsageOutput } from '../types.js';

export function recordSkillUsage(input: RecordSkillUsageInput): RecordSkillUsageOutput {
  // Validate input
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object with skill_id and outcome');
  }
  if (!input.skill_id || typeof input.skill_id !== 'string') {
    throw new Error('skill_id is required and must be a string');
  }
  if (input.skill_id.trim().length === 0) {
    throw new Error('skill_id cannot be empty');
  }
  const validOutcomes = ['success', 'failure', 'partial'];
  if (!input.outcome || !validOutcomes.includes(input.outcome)) {
    throw new Error(`outcome is required and must be one of: ${validOutcomes.join(', ')}`);
  }
  if (input.duration_ms !== undefined && (typeof input.duration_ms !== 'number' || input.duration_ms < 0)) {
    throw new Error('duration_ms must be a non-negative number');
  }

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
