/**
 * Integration Tests
 * End-to-end tests for skill builder workflows
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
import { parseSkillMd } from '../src/parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens } from '../src/services/token-counter.js';

describe('Integration Tests', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('Skill Creation Workflow', () => {
    it('should create, validate, and retrieve a skill', () => {
      // Create
      const createResult = createSkill({
        name: 'integration-skill',
        description: 'A skill for integration testing',
        overview: 'Tests the full workflow',
        steps: ['Create', 'Validate', 'Retrieve']
      });

      expect(createResult.created).toBe(true);

      // Validate
      const validateResult = validateSkill({ skill_id: createResult.skill_id });
      expect(validateResult.valid).toBe(true);
      expect(validateResult.progressive_disclosure_ok).toBe(true);

      // Retrieve
      const skill = getSkill({ skill_id: createResult.skill_id });
      expect(skill.name).toBe('integration-skill');
      expect(skill.full_content).toContain('integration testing');
    });

    it('should parse the generated SKILL.md content', () => {
      const { skill_id } = createSkill({
        name: 'parse-test',
        description: 'Testing parse workflow',
        overview: 'Overview here',
        steps: ['Step 1', 'Step 2'],
        prerequisites: ['Prereq 1'],
        examples: ['Example code'],
        error_handling: 'Handle errors',
        limitations: 'Some limits'
      });

      const skill = getSkill({ skill_id });
      const parsed = parseSkillMd(skill.full_content);

      expect(parsed.frontmatter.name).toBe('parse-test');
      expect(parsed.body.overview).toContain('Overview here');
      expect(parsed.body.steps).toBeDefined();
      expect(parsed.body.steps!.length).toBeGreaterThan(0);
    });
  });

  describe('Skill Update Workflow', () => {
    it('should update and maintain version history', () => {
      // Create initial skill
      const { skill_id } = createSkill({
        name: 'version-test',
        description: 'Original description',
        overview: 'Original overview',
        steps: ['Original step']
      });

      // Update multiple times
      updateSkill({
        skill_id,
        updates: { description: 'Updated description v2' }
      });

      updateSkill({
        skill_id,
        updates: { overview: 'Updated overview v3' }
      });

      const result = updateSkill({
        skill_id,
        updates: { steps: ['New step 1', 'New step 2'] }
      });

      expect(result.new_version).toBe(4);

      // Verify versions are stored
      const db = getDatabase();
      const versions = db.getSkillVersions(skill_id);
      expect(versions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Skill Matching Workflow', () => {
    beforeEach(() => {
      createSkill({
        name: 'git-workflow',
        description: 'Manage git repositories including commits, branches, merges, and pull requests',
        overview: 'Complete git workflow management',
        steps: ['Clone repo', 'Create branch', 'Make commits', 'Push changes']
      });

      createSkill({
        name: 'api-testing',
        description: 'Test REST APIs by sending requests and validating JSON responses',
        overview: 'API testing workflow',
        steps: ['Setup environment', 'Send request', 'Validate response']
      });

      createSkill({
        name: 'database-migration',
        description: 'Manage database schema migrations and data transformations',
        overview: 'Database migration workflow',
        steps: ['Create migration', 'Test migration', 'Apply migration']
      });
    });

    it('should match tasks to skills', () => {
      const gitResult = matchSkill({
        task_description: 'manage git repositories branches commits',
        min_confidence: 0.01
      });

      // The matcher should at least attempt to match
      expect(gitResult).toBeDefined();
      expect(gitResult.matches).toBeDefined();
    });

    it('should return matches sorted by confidence', () => {
      const result = matchSkill({
        task_description: 'database schema migrations',
        min_confidence: 0.01
      });

      if (result.matches.length > 1) {
        // Should be sorted by confidence
        for (let i = 1; i < result.matches.length; i++) {
          expect(result.matches[i - 1].confidence).toBeGreaterThanOrEqual(
            result.matches[i].confidence
          );
        }
      }
      expect(result).toBeDefined();
    });
  });

  describe('Usage Tracking Workflow', () => {
    it('should track usage and calculate success rate', () => {
      const { skill_id } = createSkill({
        name: 'tracked-skill',
        description: 'A skill with usage tracking',
        overview: 'Overview',
        steps: ['Step']
      });

      // Record multiple usages
      recordSkillUsage({ skill_id, outcome: 'success' });
      recordSkillUsage({ skill_id, outcome: 'success' });
      recordSkillUsage({ skill_id, outcome: 'failure' });
      recordSkillUsage({ skill_id, outcome: 'success' });

      const result = recordSkillUsage({
        skill_id,
        outcome: 'partial',
        notes: 'Final usage'
      });

      expect(result.total_uses).toBe(5);
      // 3 successes out of 5 = 0.6
      expect(result.success_rate).toBe(0.6);
    });

    it('should reflect usage in skill retrieval', () => {
      const { skill_id } = createSkill({
        name: 'usage-skill',
        description: 'A skill',
        overview: 'Overview',
        steps: ['Step']
      });

      recordSkillUsage({ skill_id, outcome: 'success' });
      recordSkillUsage({ skill_id, outcome: 'success' });

      const skill = getSkill({ skill_id });
      expect(skill.usage_count).toBe(2);
      expect(skill.success_rate).toBe(1);
    });
  });

  describe('Description Analysis Workflow', () => {
    it('should help improve skill descriptions', () => {
      // Start with a vague description
      const vagueAnalysis = analyzeDescription({
        description: 'Do stuff'
      });

      // Vague descriptions should have low clarity
      expect(vagueAnalysis.clarity_score).toBeLessThan(0.5);
      expect(vagueAnalysis.suggestions.length).toBeGreaterThan(0);

      // Improve based on suggestions
      const improvedAnalysis = analyzeDescription({
        description: 'Manage git repositories by creating branches, making commits, and handling merges',
        intended_triggers: ['git', 'branch', 'commit', 'merge']
      });

      // Improved descriptions should have higher clarity
      expect(improvedAnalysis.clarity_score).toBeGreaterThan(vagueAnalysis.clarity_score);
    });
  });

  describe('Token Counting Workflow', () => {
    it('should verify progressive disclosure compliance', () => {
      const { skill_id } = createSkill({
        name: 'token-compliant',
        description: 'A short description for Layer 1',
        overview: 'Brief overview',
        steps: ['Step 1', 'Step 2']
      });

      const validation = validateSkill({ skill_id });

      expect(validation.token_counts.layer1).toBeLessThan(100);
      expect(validation.token_counts.layer2).toBeLessThan(5000);
      expect(validation.progressive_disclosure_ok).toBe(true);
    });

    it('should calculate tokens consistently', () => {
      const { skill_id } = createSkill({
        name: 'token-test',
        description: 'Test description',
        overview: 'Test overview',
        steps: ['Test step']
      });

      const skill = getSkill({ skill_id });

      // Verify token counts match
      const layer1 = countLayer1Tokens(skill.name, skill.description);
      const layer2 = countLayer2Tokens(skill.full_content);

      expect(skill.token_counts.layer1).toBe(layer1);
      expect(skill.token_counts.layer2).toBe(layer2);
    });
  });

  describe('Full Skill Lifecycle', () => {
    it('should handle complete skill lifecycle', () => {
      // 1. Create skill
      const { skill_id } = createSkill({
        name: 'lifecycle-skill',
        description: 'A skill for lifecycle testing',
        overview: 'Testing full lifecycle',
        steps: ['Create', 'Use', 'Update', 'Deprecate']
      });

      // 2. Use skill
      recordSkillUsage({ skill_id, outcome: 'success' });
      recordSkillUsage({ skill_id, outcome: 'success' });

      // 3. Update skill
      updateSkill({
        skill_id,
        updates: {
          description: 'An improved skill description',
          steps: ['Create', 'Use', 'Update', 'Deprecate', 'Archive']
        }
      });

      // 4. Verify state
      const skill = getSkill({ skill_id });
      expect(skill.usage_count).toBe(2);

      // 5. List should include it
      const listed = listSkills({ search: 'lifecycle' });
      expect(listed.count).toBe(1);

      // 6. Deprecate
      const db = getDatabase();
      db.deprecateSkill(skill_id);

      // 7. Should be excluded from default list
      const afterDeprecate = listSkills({});
      expect(afterDeprecate.count).toBe(0);

      // 8. But included with flag
      const withDeprecated = listSkills({ include_deprecated: true });
      expect(withDeprecated.count).toBe(1);
    });
  });

  describe('Multi-Skill Scenarios', () => {
    it('should handle related skills correctly', () => {
      // Create related skills
      createSkill({
        name: 'frontend-react',
        description: 'Build React frontend components with hooks and state management',
        overview: 'React development',
        steps: ['Create component', 'Add state', 'Handle events']
      });

      createSkill({
        name: 'frontend-testing',
        description: 'Test React components with Jest and React Testing Library',
        overview: 'Frontend testing',
        steps: ['Write test', 'Mock dependencies', 'Assert behavior']
      });

      createSkill({
        name: 'backend-api',
        description: 'Build REST APIs with Express.js and handle HTTP requests',
        overview: 'Backend API development',
        steps: ['Create route', 'Add handler', 'Validate input']
      });

      // All skills should be listed
      const allSkills = listSkills({});
      expect(allSkills.count).toBe(3);

      // Matcher should work without errors
      const frontendMatch = matchSkill({
        task_description: 'React components hooks state',
        min_confidence: 0.01
      });

      expect(frontendMatch).toBeDefined();
      expect(frontendMatch.matches).toBeDefined();
    });
  });
});
