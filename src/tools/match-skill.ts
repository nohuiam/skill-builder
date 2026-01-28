/**
 * match_skill Tool
 * Find skills that match a task description (semantic matching)
 */

import { getDatabase } from '../database/schema.js';
import { matchSkills } from '../services/skill-matcher.js';
import { MatchSkillInput, MatchSkillOutput, SKILL_CONFIG } from '../types.js';

export function matchSkill(input: MatchSkillInput): MatchSkillOutput {
  // Validate input
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object with task_description');
  }
  if (!input.task_description || typeof input.task_description !== 'string') {
    throw new Error('task_description is required and must be a string');
  }
  if (input.task_description.trim().length === 0) {
    throw new Error('task_description cannot be empty');
  }
  if (input.task_description.length > 10000) {
    throw new Error('task_description exceeds maximum length of 10000 characters');
  }
  if (input.min_confidence !== undefined) {
    if (typeof input.min_confidence !== 'number' || input.min_confidence < 0 || input.min_confidence > 1) {
      throw new Error('min_confidence must be a number between 0 and 1');
    }
  }

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
