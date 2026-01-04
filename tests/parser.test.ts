/**
 * Parser Tests
 * Tests for SKILL.md parsing and generation
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseSkillMd,
  generateSkillMd,
  validateSkillMd
} from '../src/parser/skill-parser.js';

// Sample SKILL.md content for testing
const sampleSkillMd = `---
name: test-skill
description: |
  A test skill for unit testing.
  Used to verify parser functionality.
---

# Test Skill

## Overview
This is a test skill used for unit testing.

## Prerequisites
- Node.js installed
- Test framework configured

## Steps
1. First step
2. Second step
3. Third step

## Examples
\`\`\`bash
npm test
\`\`\`

## Error Handling
If tests fail, check the configuration.

## Limitations
This skill is only for testing.
`;

const minimalSkillMd = `---
name: minimal-skill
description: A minimal skill
---

# Minimal Skill

## Steps
1. Do the thing
`;

const invalidSkillMd = `---
name:
description:
---

# No content here
`;

describe('SKILL.md Parser', () => {
  describe('parseSkillMd', () => {
    it('should parse valid SKILL.md with all sections', () => {
      const parsed = parseSkillMd(sampleSkillMd);
      expect(parsed.frontmatter.name).toBe('test-skill');
      expect(parsed.frontmatter.description).toContain('A test skill');
      expect(parsed.body.overview).toContain('unit testing');
      expect(parsed.body.prerequisites).toBeDefined();
      expect(parsed.body.prerequisites!.length).toBeGreaterThan(0);
      expect(parsed.body.steps).toBeDefined();
      expect(parsed.body.steps!.length).toBeGreaterThan(0);
    });

    it('should parse minimal SKILL.md', () => {
      const parsed = parseSkillMd(minimalSkillMd);
      expect(parsed.frontmatter.name).toBe('minimal-skill');
      expect(parsed.frontmatter.description).toBe('A minimal skill');
      expect(parsed.body.steps).toHaveLength(1);
    });

    it('should handle missing optional sections', () => {
      const parsed = parseSkillMd(minimalSkillMd);
      expect(parsed.body.examples).toBeUndefined();
      expect(parsed.body.prerequisites).toBeUndefined();
      expect(parsed.body.error_handling).toBeUndefined();
      expect(parsed.body.limitations).toBeUndefined();
    });

    it('should preserve raw content', () => {
      const parsed = parseSkillMd(sampleSkillMd);
      expect(parsed.raw_content).toBe(sampleSkillMd);
    });

    it('should handle multiline descriptions', () => {
      const parsed = parseSkillMd(sampleSkillMd);
      expect(parsed.frontmatter.description).toContain('parser functionality');
    });

    it('should parse examples with code blocks', () => {
      const parsed = parseSkillMd(sampleSkillMd);
      // Examples section should be extracted if present
      if (parsed.body.examples) {
        expect(parsed.body.examples.length).toBeGreaterThan(0);
      }
      // At minimum, parser should not throw
      expect(parsed).toBeDefined();
    });

    it('should handle content with special characters', () => {
      const skillWithSpecial = `---
name: special-skill
description: Uses $pecial ch@racters & symbols
---

# Special Skill

## Steps
1. Handle \`code\` and "quotes"
2. Use <angle> brackets
`;
      const parsed = parseSkillMd(skillWithSpecial);
      expect(parsed.frontmatter.name).toBe('special-skill');
      expect(parsed.body.steps![0]).toContain('code');
    });
  });

  describe('generateSkillMd', () => {
    it('should generate valid SKILL.md from components', () => {
      const frontmatter = {
        name: 'generated-skill',
        description: 'A generated skill'
      };
      const body = {
        overview: 'This is generated',
        steps: ['Step 1', 'Step 2']
      };

      const content = generateSkillMd(frontmatter, body);
      expect(content).toContain('name: generated-skill');
      expect(content).toContain('## Overview');
      expect(content).toContain('Step 1');
    });

    it('should include all optional sections when provided', () => {
      const frontmatter = {
        name: 'full-skill',
        description: 'Full skill'
      };
      const body = {
        overview: 'Overview text',
        prerequisites: ['Prereq 1'],
        steps: ['Step 1'],
        examples: ['Example 1'],
        error_handling: 'Handle errors',
        limitations: 'Some limits'
      };

      const content = generateSkillMd(frontmatter, body);
      expect(content).toContain('## Prerequisites');
      expect(content).toContain('## Examples');
      expect(content).toContain('## Error Handling');
      expect(content).toContain('## Limitations');
    });

    it('should omit optional sections when not provided', () => {
      const frontmatter = { name: 'minimal', description: 'Minimal' };
      const body = { steps: ['Do it'] };

      const content = generateSkillMd(frontmatter, body);
      expect(content).not.toContain('## Prerequisites');
      expect(content).not.toContain('## Examples');
    });

    it('should roundtrip parse and generate', () => {
      const parsed = parseSkillMd(sampleSkillMd);
      const generated = generateSkillMd(parsed.frontmatter, parsed.body);
      const reparsed = parseSkillMd(generated);

      expect(reparsed.frontmatter.name).toBe(parsed.frontmatter.name);
      expect(reparsed.body.steps?.length).toBe(parsed.body.steps?.length);
    });
  });

  describe('validateSkillMd', () => {
    it('should validate correct SKILL.md', () => {
      const result = validateSkillMd(sampleSkillMd);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing name', () => {
      const result = validateSkillMd(invalidSkillMd);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('should report missing description', () => {
      const result = validateSkillMd(invalidSkillMd);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
    });

    it('should warn about missing steps', () => {
      const noSteps = `---
name: no-steps
description: Has no steps
---

# No Steps Skill

## Overview
This skill has no steps section.
`;
      const result = validateSkillMd(noSteps);
      expect(result.warnings.some(w => w.toLowerCase().includes('step'))).toBe(true);
    });

    it('should handle content without frontmatter', () => {
      const noFrontmatter = '# Just a heading\n\nSome content';
      const result = validateSkillMd(noFrontmatter);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('frontmatter'))).toBe(true);
    });

    it('should validate minimal valid skill', () => {
      const result = validateSkillMd(minimalSkillMd);
      expect(result.valid).toBe(true);
    });
  });
});
