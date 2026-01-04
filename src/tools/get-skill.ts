/**
 * get_skill Tool
 * Retrieve full skill content (Layer 1 + Layer 2)
 */

import { getDatabase } from '../database/schema.js';
import { GetSkillInput, GetSkillOutput } from '../types.js';

export function getSkill(input: GetSkillInput): GetSkillOutput {
  const db = getDatabase();

  let skill;

  if (input.skill_id) {
    skill = db.getSkill(input.skill_id);
  } else if (input.name) {
    skill = db.getSkillByName(input.name);
  } else {
    throw new Error('Must provide skill_id or name');
  }

  if (!skill) {
    throw new Error(`Skill not found: ${input.skill_id || input.name}`);
  }

  return {
    skill_id: skill.id,
    name: skill.name,
    description: skill.description,
    full_content: skill.full_content,
    token_counts: {
      layer1: skill.token_count_layer1,
      layer2: skill.token_count_layer2
    },
    usage_count: skill.usage_count,
    success_rate: skill.success_rate,
    bundled_files: skill.bundled_files.map(f => f.file_name)
  };
}
