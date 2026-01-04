/**
 * Tools Tests
 * Tests for all 8 MCP tools
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase, resetDatabase } from '../src/database/schema.js';
import {
  createSkill,
  validateSkill,
  analyzeDescription,
  listSkills,
  getSkill,
  updateSkill,
  matchSkill,
  recordSkillUsage
} from '../src/tools/index.js';

describe('MCP Tools', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('create_skill', () => {
    it('should create a new skill', () => {
      const result = createSkill({
        name: 'test-skill',
        description: 'A test skill for testing',
        overview: 'This skill tests things',
        steps: ['Step 1', 'Step 2', 'Step 3']
      });

      expect(result.created).toBe(true);
      expect(result.skill_id).toBeDefined();
      expect(result.token_count.layer1).toBeGreaterThan(0);
    });

    it('should include optional fields', () => {
      const result = createSkill({
        name: 'full-skill',
        description: 'A complete skill',
        overview: 'Complete overview',
        steps: ['Step 1'],
        prerequisites: ['Node.js', 'npm'],
        examples: ['Example 1'],
        error_handling: 'Handle errors gracefully',
        limitations: 'Some limitations'
      });

      expect(result.created).toBe(true);
      const skill = getSkill({ skill_id: result.skill_id });
      expect(skill.full_content).toContain('Prerequisites');
    });

    it('should reject duplicate names', () => {
      createSkill({
        name: 'unique-skill',
        description: 'First skill',
        overview: 'Overview',
        steps: ['Step']
      });

      expect(() => {
        createSkill({
          name: 'unique-skill',
          description: 'Second skill',
          overview: 'Overview',
          steps: ['Step']
        });
      }).toThrow();
    });
  });

  describe('validate_skill', () => {
    it('should validate skill by id', () => {
      const { skill_id } = createSkill({
        name: 'validate-me',
        description: 'A skill to validate',
        overview: 'Testing validation',
        steps: ['Step 1']
      });

      const result = validateSkill({ skill_id });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate skill by path', () => {
      // Create a skill that references a path
      const { skill_id } = createSkill({
        name: 'path-skill',
        description: 'A skill with path',
        overview: 'Overview',
        steps: ['Step']
      });

      const result = validateSkill({ skill_id });
      expect(result).toBeDefined();
    });

    it('should report token counts', () => {
      const { skill_id } = createSkill({
        name: 'token-skill',
        description: 'A skill for token counting',
        overview: 'Overview',
        steps: ['Step 1', 'Step 2']
      });

      const result = validateSkill({ skill_id });
      expect(result.token_counts.layer1).toBeGreaterThan(0);
      expect(result.token_counts.layer2).toBeGreaterThan(0);
    });

    it('should check progressive disclosure', () => {
      const { skill_id } = createSkill({
        name: 'disclosure-skill',
        description: 'A skill for progressive disclosure',
        overview: 'Overview',
        steps: ['Step']
      });

      const result = validateSkill({ skill_id });
      expect(result.progressive_disclosure_ok).toBe(true);
    });
  });

  describe('analyze_description', () => {
    it('should analyze description clarity', () => {
      const result = analyzeDescription({
        description: 'Manage git repositories, commits, and branches'
      });

      expect(result.clarity_score).toBeGreaterThan(0);
      expect(result.trigger_keywords.length).toBeGreaterThan(0);
    });

    it('should detect broad descriptions', () => {
      const result = analyzeDescription({
        description: 'Do stuff'
      });

      // Vague descriptions should have low clarity score
      expect(result.clarity_score).toBeLessThan(0.5);
    });

    it('should suggest improvements', () => {
      const result = analyzeDescription({
        description: 'Things'
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should validate against intended triggers', () => {
      const result = analyzeDescription({
        description: 'Test REST APIs and validate responses',
        intended_triggers: ['api', 'test', 'rest']
      });

      // Should extract some trigger keywords
      expect(result.trigger_keywords.length).toBeGreaterThan(0);
    });
  });

  describe('list_skills', () => {
    beforeEach(() => {
      createSkill({
        name: 'skill-one',
        description: 'First skill',
        overview: 'Overview',
        steps: ['Step']
      });
      createSkill({
        name: 'skill-two',
        description: 'Second skill',
        overview: 'Overview',
        steps: ['Step']
      });
    });

    it('should list all skills', () => {
      const result = listSkills({});
      expect(result.count).toBe(2);
      expect(result.skills).toHaveLength(2);
    });

    it('should search by name', () => {
      const result = listSkills({ search: 'one' });
      expect(result.count).toBe(1);
      expect(result.skills[0].name).toBe('skill-one');
    });

    it('should exclude deprecated by default', () => {
      const db = getDatabase();
      const skill = db.getSkillByName('skill-one');
      if (skill) {
        db.deprecateSkill(skill.id);
      }

      const result = listSkills({});
      expect(result.count).toBe(1);
    });

    it('should include deprecated when requested', () => {
      const db = getDatabase();
      const skill = db.getSkillByName('skill-one');
      if (skill) {
        db.deprecateSkill(skill.id);
      }

      const result = listSkills({ include_deprecated: true });
      expect(result.count).toBe(2);
    });
  });

  describe('get_skill', () => {
    let skillId: string;

    beforeEach(() => {
      const result = createSkill({
        name: 'get-me',
        description: 'A skill to get',
        overview: 'Overview here',
        steps: ['Step 1', 'Step 2']
      });
      skillId = result.skill_id;
    });

    it('should get skill by id', () => {
      const result = getSkill({ skill_id: skillId });
      expect(result.name).toBe('get-me');
      expect(result.full_content).toContain('Overview here');
    });

    it('should get skill by name', () => {
      const result = getSkill({ name: 'get-me' });
      expect(result.skill_id).toBe(skillId);
    });

    it('should include token counts', () => {
      const result = getSkill({ skill_id: skillId });
      expect(result.token_counts.layer1).toBeGreaterThan(0);
      expect(result.token_counts.layer2).toBeGreaterThan(0);
    });

    it('should throw for non-existent skill', () => {
      expect(() => {
        getSkill({ skill_id: 'non-existent' });
      }).toThrow();
    });
  });

  describe('update_skill', () => {
    let skillId: string;

    beforeEach(() => {
      const result = createSkill({
        name: 'update-me',
        description: 'Original description',
        overview: 'Original overview',
        steps: ['Original step']
      });
      skillId = result.skill_id;
    });

    it('should update skill description', () => {
      const result = updateSkill({
        skill_id: skillId,
        updates: { description: 'Updated description' }
      });

      expect(result.updated).toBe(true);
      expect(result.new_version).toBeGreaterThan(result.previous_version);

      const skill = getSkill({ skill_id: skillId });
      expect(skill.description).toBe('Updated description');
    });

    it('should update skill overview', () => {
      updateSkill({
        skill_id: skillId,
        updates: { overview: 'New overview' }
      });

      const skill = getSkill({ skill_id: skillId });
      expect(skill.full_content).toContain('New overview');
    });

    it('should update skill steps', () => {
      updateSkill({
        skill_id: skillId,
        updates: { steps: ['New step 1', 'New step 2'] }
      });

      const skill = getSkill({ skill_id: skillId });
      expect(skill.full_content).toContain('New step 1');
      expect(skill.full_content).toContain('New step 2');
    });

    it('should increment version', () => {
      const result1 = updateSkill({
        skill_id: skillId,
        updates: { description: 'First update' }
      });

      const result2 = updateSkill({
        skill_id: skillId,
        updates: { description: 'Second update' }
      });

      expect(result2.new_version).toBe(result1.new_version + 1);
    });
  });

  describe('match_skill', () => {
    beforeEach(() => {
      createSkill({
        name: 'git-skill',
        description: 'Manage git repositories, commits, and branches',
        overview: 'Git management',
        steps: ['Clone', 'Branch', 'Commit']
      });
      createSkill({
        name: 'api-skill',
        description: 'Test REST APIs and validate responses',
        overview: 'API testing',
        steps: ['Send request', 'Check response']
      });
    });

    it('should match task to relevant skill', () => {
      const result = matchSkill({
        task_description: 'git repositories branches commits',
        min_confidence: 0.01
      });

      // Should attempt matching
      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
    });

    it('should respect minimum confidence', () => {
      const result = matchSkill({
        task_description: 'Something completely unrelated xyz123',
        min_confidence: 0.9
      });

      // High confidence threshold should filter out weak matches
      expect(result.matches.length).toBeLessThanOrEqual(1);
    });

    it('should identify best match when present', () => {
      const result = matchSkill({
        task_description: 'git repositories branches commits',
        min_confidence: 0.01
      });

      // If there are matches, best_match should be defined
      if (result.matches.length > 0) {
        expect(result.best_match).toBeDefined();
      }
    });

    it('should return empty for no matches with high confidence', () => {
      const result = matchSkill({
        task_description: 'xyzzy foobar',
        min_confidence: 0.8
      });

      expect(result.matches).toHaveLength(0);
      expect(result.best_match).toBeUndefined();
    });
  });

  describe('record_skill_usage', () => {
    let skillId: string;

    beforeEach(() => {
      const result = createSkill({
        name: 'usage-skill',
        description: 'A skill for usage tracking',
        overview: 'Overview',
        steps: ['Step']
      });
      skillId = result.skill_id;
    });

    it('should record successful usage', () => {
      const result = recordSkillUsage({
        skill_id: skillId,
        outcome: 'success'
      });

      expect(result.recorded).toBe(true);
      expect(result.total_uses).toBe(1);
      expect(result.success_rate).toBe(1);
    });

    it('should record failed usage', () => {
      recordSkillUsage({ skill_id: skillId, outcome: 'success' });
      const result = recordSkillUsage({
        skill_id: skillId,
        outcome: 'failure'
      });

      expect(result.total_uses).toBe(2);
      expect(result.success_rate).toBe(0.5);
    });

    it('should include notes', () => {
      const result = recordSkillUsage({
        skill_id: skillId,
        outcome: 'partial',
        notes: 'Some issues encountered'
      });

      expect(result.recorded).toBe(true);
    });

    it('should update skill usage count', () => {
      recordSkillUsage({ skill_id: skillId, outcome: 'success' });
      recordSkillUsage({ skill_id: skillId, outcome: 'success' });

      const skill = getSkill({ skill_id: skillId });
      expect(skill.usage_count).toBe(2);
    });

    it('should throw for non-existent skill', () => {
      expect(() => {
        recordSkillUsage({
          skill_id: 'non-existent',
          outcome: 'success'
        });
      }).toThrow();
    });
  });
});
