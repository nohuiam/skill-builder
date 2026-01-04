/**
 * Skill Builder MCP Tools
 * Exports all 8 tools and their definitions
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
export { createSkill } from './create-skill.js';
export { validateSkill } from './validate-skill.js';
export { analyzeDescription } from './analyze-description.js';
export { listSkills } from './list-skills.js';
export { getSkill } from './get-skill.js';
export { updateSkill } from './update-skill.js';
export { matchSkill } from './match-skill.js';
export { recordSkillUsage } from './record-skill-usage.js';

/**
 * MCP Tool Definitions
 */
export const tools: Tool[] = [
  {
    name: 'create_skill',
    description: 'Generate a SKILL.md file following Anthropic\'s specification. Creates a new skill with proper YAML frontmatter and Markdown body structure.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Unique name for the skill'
        },
        description: {
          type: 'string',
          description: 'Description of when to use this skill, what it does, and its boundaries'
        },
        overview: {
          type: 'string',
          description: 'Brief explanation of what this skill accomplishes'
        },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Step-by-step instructions for executing the skill'
        },
        examples: {
          type: 'array',
          items: { type: 'string' },
          description: 'Concrete usage examples'
        },
        prerequisites: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required tools, access, or context'
        },
        error_handling: {
          type: 'string',
          description: 'What to do when things go wrong'
        },
        limitations: {
          type: 'string',
          description: 'What this skill cannot or should not do'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization and discovery'
        }
      },
      required: ['name', 'description', 'overview', 'steps']
    }
  },
  {
    name: 'validate_skill',
    description: 'Check SKILL.md structure, frontmatter, and token counts. Validates against Anthropic\'s progressive disclosure requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'ID of skill to validate'
        },
        path: {
          type: 'string',
          description: 'Path to SKILL.md file'
        },
        content: {
          type: 'string',
          description: 'Raw SKILL.md content to validate'
        }
      }
    }
  },
  {
    name: 'analyze_description',
    description: 'Evaluate a skill description for semantic triggering effectiveness. Provides suggestions to improve discoverability.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'The description text to analyze'
        },
        intended_triggers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords/phrases that should trigger this skill'
        }
      },
      required: ['description']
    }
  },
  {
    name: 'list_skills',
    description: 'List all skills with Layer 1 metadata (name, description, tags, token counts, usage stats).',
    inputSchema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags'
        },
        search: {
          type: 'string',
          description: 'Search term to filter by name or description'
        },
        include_deprecated: {
          type: 'boolean',
          description: 'Include deprecated skills'
        }
      }
    }
  },
  {
    name: 'get_skill',
    description: 'Retrieve full skill content including Layer 1 metadata and Layer 2 instructions.',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'ID of skill to retrieve'
        },
        name: {
          type: 'string',
          description: 'Name of skill to retrieve'
        }
      }
    }
  },
  {
    name: 'update_skill',
    description: 'Update an existing SKILL.md. Creates a new version for history/rollback.',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'ID of skill to update'
        },
        updates: {
          type: 'object',
          description: 'Partial updates to apply',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            overview: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            examples: { type: 'array', items: { type: 'string' } },
            prerequisites: { type: 'array', items: { type: 'string' } },
            error_handling: { type: 'string' },
            limitations: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['skill_id', 'updates']
    }
  },
  {
    name: 'match_skill',
    description: 'Find skills that match a task description using semantic matching.',
    inputSchema: {
      type: 'object',
      properties: {
        task_description: {
          type: 'string',
          description: 'Description of the task to find skills for'
        },
        context: {
          type: 'object',
          description: 'Additional context for matching'
        },
        min_confidence: {
          type: 'number',
          description: 'Minimum confidence threshold (0-1)'
        }
      },
      required: ['task_description']
    }
  },
  {
    name: 'record_skill_usage',
    description: 'Track skill usage outcome for learning and improving recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'ID of skill that was used'
        },
        outcome: {
          type: 'string',
          enum: ['success', 'failure', 'partial'],
          description: 'Outcome of using the skill'
        },
        notes: {
          type: 'string',
          description: 'Notes about the usage'
        },
        duration_ms: {
          type: 'number',
          description: 'Duration of skill execution in milliseconds'
        },
        context: {
          type: 'object',
          description: 'Context in which skill was used'
        }
      },
      required: ['skill_id', 'outcome']
    }
  }
];
