/**
 * Cognitive Integration Validator
 * Validates that skills properly integrate with the 7-step cognitive loop
 */

import type {
  ParsedSkill,
  CognitiveIntegration,
  CognitiveValidationResult
} from '../types.js';

// Keywords that suggest destructive operations requiring ethics check
const DESTRUCTIVE_KEYWORDS = [
  'delete', 'remove', 'destroy', 'drop', 'truncate', 'wipe', 'clear',
  'move', 'rename', 'overwrite', 'replace', 'merge', 'consolidate',
  'archive', 'purge', 'clean', 'prune', 'dedupe', 'dedup'
];

// Keywords that suggest factual output requiring verification
const FACTUAL_KEYWORDS = [
  'analyze', 'report', 'summarize', 'extract', 'classify', 'categorize',
  'detect', 'identify', 'verify', 'validate', 'assess', 'evaluate',
  'calculate', 'compute', 'measure', 'estimate', 'predict', 'recommend'
];

// Keywords that suggest decision-making requiring ethics check
const DECISION_KEYWORDS = [
  'decide', 'choose', 'select', 'determine', 'recommend', 'suggest',
  'prioritize', 'rank', 'sort', 'filter', 'approve', 'reject', 'accept'
];

/**
 * Validate cognitive integration configuration for a skill
 */
export function validateCognitiveIntegration(
  parsed: ParsedSkill,
  strict: boolean = false
): CognitiveValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const ci = parsed.frontmatter.cognitive_integration;
  const description = parsed.frontmatter.description.toLowerCase();
  const steps = parsed.body.steps?.join(' ').toLowerCase() || '';
  const overview = parsed.body.overview?.toLowerCase() || '';
  const content = `${description} ${steps} ${overview}`;

  // Detect what cognitive phases the skill content suggests
  const hasDestructiveOps = DESTRUCTIVE_KEYWORDS.some(k => content.includes(k));
  const hasFactualOutput = FACTUAL_KEYWORDS.some(k => content.includes(k));
  const hasDecisionMaking = DECISION_KEYWORDS.some(k => content.includes(k));

  // Detected phases based on content analysis
  const detected_phases = {
    awareness: true, // All skills benefit from awareness
    ethics: hasDestructiveOps || hasDecisionMaking,
    verification: hasFactualOutput,
    experience: true, // All skills should record experiences
    learning: hasFactualOutput || hasDestructiveOps // Complex operations benefit from learning
  };

  // Validate cognitive_integration presence
  if (!ci) {
    if (strict) {
      errors.push('cognitive_integration is required for all skills');
    } else {
      warnings.push('Missing cognitive_integration - skill will not participate in cognitive loop');
    }

    // Generate recommendations based on content analysis
    recommendations.push('Add cognitive_integration to frontmatter:');
    recommendations.push(`  awareness: true`);
    recommendations.push(`  ethics_check: ${detected_phases.ethics ? 'true' : 'optional'}`);
    recommendations.push(`  verification: ${detected_phases.verification ? 'true' : 'optional'}`);
    recommendations.push(`  experience_record: true`);

    return {
      valid: !strict,
      errors,
      warnings,
      detected_phases,
      recommendations
    };
  }

  // Validate experience_record is true (mandatory)
  if (!ci.experience_record) {
    if (strict) {
      errors.push('experience_record must be true - all skills must learn from outcomes');
    } else {
      warnings.push('experience_record should be true for skills to learn from outcomes');
    }
  }

  // Check if destructive operations are missing ethics check
  if (hasDestructiveOps && ci.ethics_check === false) {
    if (strict) {
      errors.push('Skill involves destructive operations but ethics_check is false');
    } else {
      warnings.push('Skill involves destructive operations - consider adding ethics_check: true');
    }
    recommendations.push('Enable ethics_check to evaluate destructive operations with tenets-server');
  }

  // Check if decision-making operations are missing ethics check
  if (hasDecisionMaking && ci.ethics_check === false) {
    warnings.push('Skill involves decision-making - consider adding ethics_check: true or conditional');
    recommendations.push('Enable ethics_check for decision validation');
  }

  // Check if factual output is missing verification
  if (hasFactualOutput && ci.verification === false) {
    warnings.push('Skill produces factual output - consider adding verification: true');
    recommendations.push('Enable verification to validate factual claims with verifier-mcp');
  }

  // Check awareness is enabled (strongly recommended)
  if (ci.awareness === false) {
    warnings.push('awareness is disabled - skill execution will not be tracked by consciousness-mcp');
    recommendations.push('Enable awareness: true for meta-cognitive tracking');
  }

  // Additional validation for optional fields
  if (parsed.frontmatter.integrations && parsed.frontmatter.integrations.length > 0) {
    // Check if integrated skills exist (would need database access for full validation)
    recommendations.push(`Verify integrated skills exist: ${parsed.frontmatter.integrations.join(', ')}`);
  }

  if (parsed.frontmatter.signals && parsed.frontmatter.signals.length > 0) {
    // Validate signal names against known signals
    const knownSignals = [
      'SKILL_CREATED', 'SKILL_MATCHED', 'SKILL_USED', 'SKILL_DEPRECATED',
      'EXPERIENCE_RECORDED', 'PATTERN_EMERGED', 'LESSON_EXTRACTED',
      'ATTENTION_SHIFT', 'TENET_VIOLATION', 'VERIFICATION_RESULT'
    ];
    for (const signal of parsed.frontmatter.signals) {
      if (!knownSignals.includes(signal)) {
        warnings.push(`Unknown signal: ${signal}`);
      }
    }
  }

  // Check for Cognitive Hooks section in body (if cognitive integration is enabled)
  if (ci && !parsed.body.raw_body.toLowerCase().includes('cognitive hooks')) {
    recommendations.push('Consider adding a "## Cognitive Hooks" section documenting pre/post execution phases');
  }

  // Determine validity
  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    detected_phases,
    recommendations
  };
}

/**
 * Generate default cognitive integration based on skill content
 */
export function generateDefaultCognitiveIntegration(
  parsed: ParsedSkill
): CognitiveIntegration {
  const description = parsed.frontmatter.description.toLowerCase();
  const steps = parsed.body.steps?.join(' ').toLowerCase() || '';
  const overview = parsed.body.overview?.toLowerCase() || '';
  const content = `${description} ${steps} ${overview}`;

  const hasDestructiveOps = DESTRUCTIVE_KEYWORDS.some(k => content.includes(k));
  const hasFactualOutput = FACTUAL_KEYWORDS.some(k => content.includes(k));
  const hasDecisionMaking = DECISION_KEYWORDS.some(k => content.includes(k));

  return {
    awareness: true,
    ethics_check: hasDestructiveOps || hasDecisionMaking ? true : 'optional',
    verification: hasFactualOutput ? true : 'optional',
    experience_record: true,
    learning: 'optional'
  };
}

/**
 * Check if a skill has proper cognitive integration for its operation type
 */
export function hasSufficientCognitiveIntegration(
  parsed: ParsedSkill
): { sufficient: boolean; missing: string[] } {
  const ci = parsed.frontmatter.cognitive_integration;
  const missing: string[] = [];

  if (!ci) {
    return { sufficient: false, missing: ['cognitive_integration block'] };
  }

  // Experience record is always required
  if (!ci.experience_record) {
    missing.push('experience_record');
  }

  // Generate recommendations based on content
  const validation = validateCognitiveIntegration(parsed, false);

  if (validation.detected_phases.ethics && ci.ethics_check === false) {
    missing.push('ethics_check (detected destructive/decision operations)');
  }

  if (validation.detected_phases.verification && ci.verification === false) {
    missing.push('verification (detected factual output)');
  }

  return {
    sufficient: missing.length === 0,
    missing
  };
}
