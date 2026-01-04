/**
 * Services Tests
 * Tests for token counter and skill matcher
 */

import { describe, it, expect } from '@jest/globals';
import {
  countTokens,
  countLayer1Tokens,
  countLayer2Tokens,
  checkProgressiveDisclosure
} from '../src/services/token-counter.js';
import {
  matchSkills,
  analyzeDescription
} from '../src/services/skill-matcher.js';
import { SkillMetadata } from '../src/types.js';

describe('Token Counter', () => {
  describe('countTokens', () => {
    it('should estimate tokens for short text', () => {
      const tokens = countTokens('Hello world');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate tokens for longer text', () => {
      const text = 'This is a longer piece of text that contains multiple words and should result in a higher token count.';
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThan(20);
    });

    it('should handle empty string', () => {
      const tokens = countTokens('');
      expect(tokens).toBe(0);
    });

    it('should estimate approximately 4 chars per token', () => {
      const text = 'test'; // 4 chars = ~1 token
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThanOrEqual(1);
      expect(tokens).toBeLessThanOrEqual(2);
    });
  });

  describe('countLayer1Tokens', () => {
    it('should count tokens for name and description', () => {
      const tokens = countLayer1Tokens('test-skill', 'A skill for testing');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should be relatively small for metadata', () => {
      const tokens = countLayer1Tokens('my-skill', 'This is a short description');
      expect(tokens).toBeLessThan(100);
    });
  });

  describe('countLayer2Tokens', () => {
    it('should count tokens for full content', () => {
      const content = `---
name: test
description: Test skill
---

# Test Skill

## Steps
1. Step one
2. Step two
`;
      const tokens = countLayer2Tokens(content);
      expect(tokens).toBeGreaterThan(20);
    });
  });

  describe('checkProgressiveDisclosure', () => {
    it('should pass for valid token counts', () => {
      const result = checkProgressiveDisclosure(50, 3000);
      expect(result.ok).toBe(true);
    });

    it('should fail if layer1 too large', () => {
      const result = checkProgressiveDisclosure(150, 3000);
      expect(result.ok).toBe(false);
      expect(result.layer1Ok).toBe(false);
    });

    it('should fail if layer2 too large', () => {
      const result = checkProgressiveDisclosure(50, 6000);
      expect(result.ok).toBe(false);
      expect(result.layer2Ok).toBe(false);
    });

    it('should return warnings for exceeding limits', () => {
      const result = checkProgressiveDisclosure(150, 6000);
      expect(result.warnings.length).toBe(2);
    });
  });
});

describe('Skill Matcher', () => {
  const mockSkills: SkillMetadata[] = [
    {
      id: 'skill-1',
      name: 'git-workflow',
      description: 'Manage git repositories, commits, branches, and pull requests',
      tags: ['git', 'version-control'],
      token_count_layer1: 20,
      token_count_layer2: 500,
      usage_count: 10,
      success_rate: 0.9,
      created_at: Date.now()
    },
    {
      id: 'skill-2',
      name: 'api-testing',
      description: 'Test REST APIs, validate responses, and check authentication',
      tags: ['testing', 'api'],
      token_count_layer1: 25,
      token_count_layer2: 600,
      usage_count: 5,
      success_rate: 0.8,
      created_at: Date.now()
    },
    {
      id: 'skill-3',
      name: 'code-review',
      description: 'Review code changes, provide feedback, and check for issues',
      tags: ['review', 'code-quality'],
      token_count_layer1: 22,
      token_count_layer2: 450,
      usage_count: 15,
      success_rate: 0.95,
      created_at: Date.now()
    }
  ];

  describe('matchSkills', () => {
    it('should match task to relevant skill', () => {
      const matches = matchSkills(
        'I need to create a new git branch and make a commit',
        mockSkills,
        0.1
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].skill_id).toBe('skill-1');
    });

    it('should return multiple matches when relevant', () => {
      const matches = matchSkills(
        'review the code and test the API',
        mockSkills,
        0.1
      );
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by minimum confidence', () => {
      const matches = matchSkills(
        'something completely unrelated to any skill',
        mockSkills,
        0.5
      );
      expect(matches.length).toBe(0);
    });

    it('should sort matches by confidence', () => {
      const matches = matchSkills(
        'git commit and branch management',
        mockSkills,
        0.1
      );
      if (matches.length > 1) {
        expect(matches[0].confidence).toBeGreaterThanOrEqual(matches[1].confidence);
      }
    });

    it('should handle empty skills array', () => {
      const matches = matchSkills('any task', [], 0.1);
      expect(matches).toHaveLength(0);
    });

    it('should handle empty task description', () => {
      const matches = matchSkills('', mockSkills, 0.1);
      expect(matches).toHaveLength(0);
    });
  });

  describe('analyzeDescription', () => {
    it('should analyze description clarity', () => {
      const analysis = analyzeDescription(
        'Manage git repositories, commits, branches, and pull requests'
      );
      expect(analysis.clarity_score).toBeGreaterThan(0);
      expect(analysis.trigger_keywords.length).toBeGreaterThan(0);
    });

    it('should detect too broad descriptions', () => {
      const analysis = analyzeDescription('Do stuff');
      // A very vague description should have low clarity
      expect(analysis.clarity_score).toBeLessThan(0.5);
    });

    it('should detect too narrow descriptions', () => {
      const analysis = analyzeDescription('a');
      expect(analysis.too_narrow).toBe(true);
    });

    it('should provide suggestions', () => {
      const analysis = analyzeDescription('Do things');
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });

    it('should validate against intended triggers', () => {
      const analysis = analyzeDescription(
        'Manage git commits and branches',
        ['git', 'commit', 'branch']
      );
      // Should extract keywords from the description
      expect(analysis.trigger_keywords.length).toBeGreaterThan(0);
    });

    it('should handle well-formed descriptions', () => {
      const analysis = analyzeDescription(
        'Test REST APIs by sending HTTP requests, validating JSON responses, and checking authentication tokens'
      );
      expect(analysis.clarity_score).toBeGreaterThan(0.5);
      expect(analysis.too_broad).toBe(false);
      expect(analysis.too_narrow).toBe(false);
    });
  });
});
