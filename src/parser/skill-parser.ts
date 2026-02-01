/**
 * SKILL.md Parser
 * Parses YAML frontmatter + Markdown body following Anthropic's specification
 */

import { parse as parseYAML } from 'yaml';
import {
  ParsedSkill,
  SkillFrontmatter,
  SkillBody,
  SKILL_CONFIG,
  CognitiveIntegration
} from '../types.js';

/**
 * Parse a SKILL.md file content into structured data
 */
export function parseSkillMd(content: string): ParsedSkill {
  const { frontmatter, body } = extractFrontmatter(content);

  const parsedFrontmatter = parseFrontmatter(frontmatter);
  const parsedBody = parseBody(body);

  return {
    frontmatter: parsedFrontmatter,
    body: parsedBody,
    raw_content: content
  };
}

/**
 * Extract YAML frontmatter from content
 */
function extractFrontmatter(content: string): { frontmatter: string; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found, treat entire content as body
    return {
      frontmatter: '',
      body: content
    };
  }

  return {
    frontmatter: match[1].trim(),
    body: match[2].trim()
  };
}

/**
 * Parse YAML frontmatter into structured data
 */
function parseFrontmatter(frontmatter: string): SkillFrontmatter {
  if (!frontmatter) {
    return {
      name: '',
      description: ''
    };
  }

  try {
    const parsed = parseYAML(frontmatter) as Record<string, unknown>;

    const result: SkillFrontmatter = {
      name: String(parsed.name || ''),
      description: String(parsed.description || ''),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : undefined
    };

    // Parse cognitive_integration if present
    if (parsed.cognitive_integration && typeof parsed.cognitive_integration === 'object') {
      const ci = parsed.cognitive_integration as Record<string, unknown>;
      result.cognitive_integration = {
        awareness: parseCognitiveFieldSimple(ci.awareness),
        ethics_check: parseCognitiveField(ci.ethics_check),
        verification: parseCognitiveField(ci.verification),
        experience_record: ci.experience_record === true,
        learning: ci.learning !== undefined ? parseCognitiveFieldSimple(ci.learning) : undefined
      };
    }

    // Parse optional extended fields
    if (Array.isArray(parsed.triggers)) {
      result.triggers = parsed.triggers.map(String);
    }

    if (typeof parsed.instance === 'string' &&
        ['planner', 'builder', 'tester', 'orchestrator'].includes(parsed.instance)) {
      result.instance = parsed.instance as 'planner' | 'builder' | 'tester' | 'orchestrator';
    }

    if (Array.isArray(parsed.integrations)) {
      result.integrations = parsed.integrations.map(String);
    }

    if (Array.isArray(parsed.signals)) {
      result.signals = parsed.signals.map(String);
    }

    return result;
  } catch (error) {
    console.error('Failed to parse YAML frontmatter:', error);
    return {
      name: '',
      description: ''
    };
  }
}

/**
 * Parse a cognitive field value that can be boolean, 'optional', or 'conditional'
 */
function parseCognitiveField(value: unknown): boolean | 'optional' | 'conditional' {
  if (value === true || value === false) {
    return value;
  }
  if (value === 'optional' || value === 'conditional') {
    return value;
  }
  return false;
}

/**
 * Parse a cognitive field value that only accepts boolean or 'optional' (not 'conditional')
 * Used for awareness and learning fields
 */
function parseCognitiveFieldSimple(value: unknown): boolean | 'optional' {
  if (value === true || value === false) {
    return value;
  }
  if (value === 'optional') {
    return value;
  }
  // If 'conditional' is provided for a simple field, treat as 'optional'
  if (value === 'conditional') {
    return 'optional';
  }
  return false;
}

/**
 * Format a cognitive field value for YAML output
 */
function formatCognitiveValue(value: boolean | 'optional' | 'conditional' | undefined): string {
  if (value === true || value === false) {
    return String(value);
  }
  return value || 'false';
}

/**
 * Parse Markdown body into sections
 */
function parseBody(body: string): SkillBody {
  const sections: SkillBody = {
    raw_body: body
  };

  // Extract Overview section
  sections.overview = extractSection(body, ['overview', 'description', 'about']);

  // Extract Prerequisites section
  const prereqContent = extractSection(body, ['prerequisites', 'requirements', 'dependencies']);
  if (prereqContent) {
    sections.prerequisites = extractListItems(prereqContent);
  }

  // Extract Steps section
  const stepsContent = extractSection(body, ['steps', 'procedure', 'instructions', 'execution']);
  if (stepsContent) {
    sections.steps = extractListItems(stepsContent);
  }

  // Extract Examples section
  const examplesContent = extractSection(body, ['examples', 'usage', 'use cases']);
  if (examplesContent) {
    sections.examples = extractCodeBlocks(examplesContent) || [examplesContent];
  }

  // Extract Error Handling section
  sections.error_handling = extractSection(body, ['error handling', 'errors', 'troubleshooting', 'error recovery']);

  // Extract Limitations section
  sections.limitations = extractSection(body, ['limitations', 'limits', 'constraints', 'what this skill cannot do']);

  return sections;
}

/**
 * Extract a section by heading
 */
function extractSection(body: string, headingVariants: string[]): string | undefined {
  // Create regex pattern for section headings
  const headingPatterns = headingVariants.map(h =>
    `^#+\\s*${escapeRegex(h)}\\s*$`
  ).join('|');

  const sectionRegex = new RegExp(
    `(${headingPatterns})\\s*\\n([\\s\\S]*?)(?=^#+\\s|$)`,
    'gmi'
  );

  const match = sectionRegex.exec(body);
  if (!match) return undefined;

  return match[2].trim();
}

/**
 * Extract list items from content
 */
function extractListItems(content: string): string[] {
  const items: string[] = [];

  // Match numbered lists (1. 2. 3. etc)
  const numberedRegex = /^\d+\.\s+(.+)$/gm;
  let match;
  while ((match = numberedRegex.exec(content)) !== null) {
    items.push(match[1].trim());
  }

  // Match bullet lists (- * etc)
  const bulletRegex = /^[-*]\s+(.+)$/gm;
  while ((match = bulletRegex.exec(content)) !== null) {
    items.push(match[1].trim());
  }

  // If no list items found, split by newlines
  if (items.length === 0) {
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  return items;
}

/**
 * Extract code blocks from content
 */
function extractCodeBlocks(content: string): string[] | undefined {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const blocks: string[] = [];

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks.length > 0 ? blocks : undefined;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate SKILL.md content from structured data
 */
export function generateSkillMd(
  frontmatter: SkillFrontmatter,
  body: Partial<SkillBody>
): string {
  const lines: string[] = [];

  // Generate frontmatter
  lines.push('---');
  lines.push(`name: ${frontmatter.name}`);

  // Handle multiline description
  if (frontmatter.description.includes('\n')) {
    lines.push('description: |');
    frontmatter.description.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
  } else {
    lines.push(`description: ${frontmatter.description}`);
  }

  if (frontmatter.tags && frontmatter.tags.length > 0) {
    lines.push(`tags: [${frontmatter.tags.join(', ')}]`);
  }

  // Generate cognitive_integration if present
  if (frontmatter.cognitive_integration) {
    const ci = frontmatter.cognitive_integration;
    lines.push('cognitive_integration:');
    lines.push(`  awareness: ${formatCognitiveValue(ci.awareness)}`);
    lines.push(`  ethics_check: ${formatCognitiveValue(ci.ethics_check)}`);
    lines.push(`  verification: ${formatCognitiveValue(ci.verification)}`);
    lines.push(`  experience_record: ${ci.experience_record}`);
    if (ci.learning !== undefined) {
      lines.push(`  learning: ${formatCognitiveValue(ci.learning)}`);
    }
  }

  // Generate optional extended fields
  if (frontmatter.triggers && frontmatter.triggers.length > 0) {
    lines.push(`triggers: [${frontmatter.triggers.map(t => `"${t}"`).join(', ')}]`);
  }

  if (frontmatter.instance) {
    lines.push(`instance: ${frontmatter.instance}`);
  }

  if (frontmatter.integrations && frontmatter.integrations.length > 0) {
    lines.push(`integrations: [${frontmatter.integrations.map(i => `"${i}"`).join(', ')}]`);
  }

  if (frontmatter.signals && frontmatter.signals.length > 0) {
    lines.push(`signals: [${frontmatter.signals.join(', ')}]`);
  }

  lines.push('---');
  lines.push('');

  // Generate body
  lines.push(`# ${frontmatter.name}`);
  lines.push('');

  if (body.overview) {
    lines.push('## Overview');
    lines.push('');
    lines.push(body.overview);
    lines.push('');
  }

  if (body.prerequisites && body.prerequisites.length > 0) {
    lines.push('## Prerequisites');
    lines.push('');
    body.prerequisites.forEach(prereq => {
      lines.push(`- ${prereq}`);
    });
    lines.push('');
  }

  if (body.steps && body.steps.length > 0) {
    lines.push('## Steps');
    lines.push('');
    body.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');
  }

  if (body.examples && body.examples.length > 0) {
    lines.push('## Examples');
    lines.push('');
    body.examples.forEach(example => {
      lines.push('```');
      lines.push(example);
      lines.push('```');
      lines.push('');
    });
  }

  if (body.error_handling) {
    lines.push('## Error Handling');
    lines.push('');
    lines.push(body.error_handling);
    lines.push('');
  }

  if (body.limitations) {
    lines.push('## Limitations');
    lines.push('');
    lines.push(body.limitations);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Validate SKILL.md structure
 */
export function validateSkillMd(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = parseSkillMd(content);

    // Check required fields
    if (!parsed.frontmatter.name) {
      errors.push('Missing required field: name in frontmatter');
    }

    if (!parsed.frontmatter.description) {
      errors.push('Missing required field: description in frontmatter');
    }

    // Check description length
    if (parsed.frontmatter.description) {
      if (parsed.frontmatter.description.length < SKILL_CONFIG.MIN_DESCRIPTION_LENGTH) {
        warnings.push(`Description is too short (${parsed.frontmatter.description.length} chars). Recommended minimum: ${SKILL_CONFIG.MIN_DESCRIPTION_LENGTH}`);
      }
      if (parsed.frontmatter.description.length > SKILL_CONFIG.MAX_DESCRIPTION_LENGTH) {
        warnings.push(`Description is too long (${parsed.frontmatter.description.length} chars). Recommended maximum: ${SKILL_CONFIG.MAX_DESCRIPTION_LENGTH}`);
      }
    }

    // Check for recommended sections
    if (!parsed.body.overview) {
      warnings.push('Missing recommended section: Overview');
    }

    if (!parsed.body.steps || parsed.body.steps.length === 0) {
      warnings.push('Missing recommended section: Steps');
    }

    if (!parsed.body.examples || parsed.body.examples.length === 0) {
      warnings.push('Missing recommended section: Examples');
    }

  } catch (error) {
    errors.push(`Failed to parse SKILL.md: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
