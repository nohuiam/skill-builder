/**
 * match_skill Tool
 * Find skills that match a task description (semantic matching)
 */

import { getDatabase } from '../database/schema.js';
import { matchSkills } from '../services/skill-matcher.js';
import { MatchSkillInput, MatchSkillOutput, SKILL_CONFIG } from '../types.js';

export function matchSkill(input: MatchSkillInput): MatchSkillOutput {
  const db = getDatabase();

  // Get all active skills
  const skills = db.getSkillMetadata(false);

  // Find matches
  const minConfidence = input.min_confidence ?? SKILL_CONFIG.MIN_MATCH_CONFIDENCE;
  const matches = matchSkills(input.task_description, skills, minConfidence);

  return {
    matches,
    best_match: matches.length > 0 ? matches[0].skill_id : undefined
  };
}
