/**
 * Database Tests
 * Tests for DatabaseManager CRUD operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { getDatabase, resetDatabase, DatabaseManager } from '../src/database/schema.js';
import { Skill, SkillUsage, SkillVersion, BundledFile } from '../src/types.js';

// Sample data
const sampleSkillMd = `---
name: test-skill
description: A test skill
---
# Test Skill
## Steps
1. Test step
`;

const sampleSkillData: Omit<Skill, 'bundled_files' | 'success_rate'> = {
  id: 'skill-123',
  name: 'sample-skill',
  description: 'A sample skill for testing',
  full_content: sampleSkillMd,
  version: 1,
  token_count_layer1: 25,
  token_count_layer2: 150,
  file_path: '/test/skills/sample.md',
  tags: ['test', 'sample'],
  created_at: Date.now(),
  usage_count: 0,
  success_count: 0
};

describe('DatabaseManager', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    resetDatabase();
    db = getDatabase();
  });

  describe('Skill CRUD', () => {
    it('should insert a skill', () => {
      db.insertSkill(sampleSkillData);
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill).toBeDefined();
      expect(skill?.name).toBe(sampleSkillData.name);
    });

    it('should get skill by name', () => {
      db.insertSkill(sampleSkillData);
      const skill = db.getSkillByName(sampleSkillData.name);
      expect(skill).toBeDefined();
      expect(skill?.id).toBe(sampleSkillData.id);
    });

    it('should list all skills', () => {
      db.insertSkill(sampleSkillData);
      db.insertSkill({ ...sampleSkillData, id: 'skill-456', name: 'second-skill' });
      const skills = db.getAllSkills();
      expect(skills).toHaveLength(2);
    });

    it('should update a skill', () => {
      db.insertSkill(sampleSkillData);
      db.updateSkill(sampleSkillData.id, { description: 'Updated description' });
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.description).toBe('Updated description');
    });

    it('should deprecate a skill', () => {
      db.insertSkill(sampleSkillData);
      db.deprecateSkill(sampleSkillData.id);
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.deprecated_at).toBeDefined();
    });

    it('should filter deprecated skills', () => {
      db.insertSkill(sampleSkillData);
      db.insertSkill({ ...sampleSkillData, id: 'skill-456', name: 'deprecated-skill' });
      db.deprecateSkill('skill-456');

      const active = db.getAllSkills(false);
      expect(active).toHaveLength(1);

      const all = db.getAllSkills(true);
      expect(all).toHaveLength(2);
    });

    it('should search skills by name', () => {
      db.insertSkill(sampleSkillData);
      db.insertSkill({ ...sampleSkillData, id: 'skill-456', name: 'other-skill', description: 'Different' });
      // Search for 'sample' should find at least the sample-skill
      const results = db.searchSkills('other');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(s => s.name === 'other-skill')).toBe(true);
    });

    it('should filter skills by tags', () => {
      db.insertSkill(sampleSkillData);
      db.insertSkill({
        ...sampleSkillData,
        id: 'skill-456',
        name: 'other-skill',
        tags: ['other']
      });
      const results = db.getSkillsByTags(['test']);
      expect(results).toHaveLength(1);
    });
  });

  describe('Usage Tracking', () => {
    beforeEach(() => {
      db.insertSkill(sampleSkillData);
    });

    it('should insert usage record', () => {
      db.insertUsage({
        skill_id: sampleSkillData.id,
        outcome: 'success',
        context: { test: true },
        created_at: Date.now()
      });
      const usages = db.getSkillUsages(sampleSkillData.id);
      expect(usages).toHaveLength(1);
    });

    it('should update skill usage count on insert', () => {
      db.insertUsage({
        skill_id: sampleSkillData.id,
        outcome: 'success',
        created_at: Date.now()
      });
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.usage_count).toBe(1);
    });

    it('should update success count for successful outcomes', () => {
      db.insertUsage({
        skill_id: sampleSkillData.id,
        outcome: 'success',
        created_at: Date.now()
      });
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.success_count).toBe(1);
    });

    it('should not update success count for failures', () => {
      db.insertUsage({
        skill_id: sampleSkillData.id,
        outcome: 'failure',
        created_at: Date.now()
      });
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.success_count).toBe(0);
    });

    it('should list usages with pagination', () => {
      for (let i = 0; i < 5; i++) {
        db.insertUsage({
          skill_id: sampleSkillData.id,
          outcome: 'success',
          created_at: Date.now()
        });
      }
      const usages = db.getSkillUsages(sampleSkillData.id, 2);
      expect(usages).toHaveLength(2);
    });

    it('should calculate success rate', () => {
      db.insertUsage({ skill_id: sampleSkillData.id, outcome: 'success', created_at: Date.now() });
      db.insertUsage({ skill_id: sampleSkillData.id, outcome: 'failure', created_at: Date.now() });
      const rate = db.getSkillSuccessRate(sampleSkillData.id);
      expect(rate).toBe(0.5);
    });
  });

  describe('Bundled Files', () => {
    beforeEach(() => {
      db.insertSkill(sampleSkillData);
    });

    it('should insert bundled file', () => {
      db.insertSkillFile({
        skill_id: sampleSkillData.id,
        file_name: 'helper.ts',
        file_path: '/test/skills/references/helper.ts',
        file_type: 'ts',
        token_count: 100,
        created_at: Date.now()
      });
      const files = db.getSkillFiles(sampleSkillData.id);
      expect(files).toHaveLength(1);
    });

    it('should get files for a skill', () => {
      db.insertSkillFile({
        skill_id: sampleSkillData.id,
        file_name: 'helper.ts',
        file_path: '/test/helper.ts',
        file_type: 'ts',
        token_count: 50,
        created_at: Date.now()
      });
      db.insertSkillFile({
        skill_id: sampleSkillData.id,
        file_name: 'utils.ts',
        file_path: '/test/utils.ts',
        file_type: 'ts',
        token_count: 75,
        created_at: Date.now()
      });
      const files = db.getSkillFiles(sampleSkillData.id);
      expect(files).toHaveLength(2);
    });

    it('should delete bundled file', () => {
      const fileId = db.insertSkillFile({
        skill_id: sampleSkillData.id,
        file_name: 'helper.ts',
        file_path: '/test/helper.ts',
        file_type: 'ts',
        token_count: 50,
        created_at: Date.now()
      });
      db.deleteSkillFile(fileId);
      const files = db.getSkillFiles(sampleSkillData.id);
      expect(files).toHaveLength(0);
    });
  });

  describe('Version History', () => {
    beforeEach(() => {
      db.insertSkill(sampleSkillData);
    });

    it('should insert version on skill creation', () => {
      const versions = db.getSkillVersions(sampleSkillData.id);
      expect(versions).toHaveLength(1);
    });

    it('should get specific version', () => {
      const version = db.getSkillVersion(sampleSkillData.id, 1);
      expect(version).toBeDefined();
      expect(version?.content).toBe(sampleSkillData.full_content);
    });

    it('should list all versions for a skill', () => {
      db.updateSkill(sampleSkillData.id, { full_content: 'Updated content' });
      const versions = db.getSkillVersions(sampleSkillData.id);
      expect(versions).toHaveLength(2);
    });

    it('should track version number correctly', () => {
      db.updateSkill(sampleSkillData.id, { full_content: 'v2' });
      db.updateSkill(sampleSkillData.id, { full_content: 'v3' });
      const skill = db.getSkill(sampleSkillData.id);
      expect(skill?.version).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should return correct stats', () => {
      db.insertSkill(sampleSkillData);
      db.insertUsage({ skill_id: sampleSkillData.id, outcome: 'success', created_at: Date.now() });
      db.insertUsage({ skill_id: sampleSkillData.id, outcome: 'success', created_at: Date.now() });

      const stats = db.getStats();
      expect(stats.totalSkills).toBe(1);
      expect(stats.totalUsages).toBe(2);
      expect(stats.overallSuccessRate).toBe(1);
    });

    it('should handle empty database', () => {
      const stats = db.getStats();
      expect(stats.totalSkills).toBe(0);
      expect(stats.totalUsages).toBe(0);
    });

    it('should track deprecated skills', () => {
      db.insertSkill(sampleSkillData);
      db.insertSkill({ ...sampleSkillData, id: 'skill-456', name: 'other-skill' });
      db.deprecateSkill('skill-456');

      const stats = db.getStats();
      expect(stats.activeSkills).toBe(1);
      expect(stats.deprecatedSkills).toBe(1);
    });
  });

  describe('Skill Metadata', () => {
    it('should return metadata without full content', () => {
      db.insertSkill(sampleSkillData);
      const metadata = db.getSkillMetadata();
      expect(metadata).toHaveLength(1);
      expect(metadata[0].name).toBe(sampleSkillData.name);
      expect((metadata[0] as unknown as Skill).full_content).toBeUndefined();
    });
  });
});
