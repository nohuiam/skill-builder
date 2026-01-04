/**
 * Token Counter Service
 * Estimates token counts for progressive disclosure layers
 *
 * Note: This uses a simple heuristic (4 chars per token) as a reasonable
 * approximation for Claude/GPT tokenizers without requiring API calls.
 * For production, consider using tiktoken or the Claude tokenizer.
 */

import { SKILL_CONFIG } from '../types.js';

// Average characters per token (approximation for Claude/GPT)
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a string
 */
export function countTokens(text: string): number {
  if (!text) return 0;

  // Simple heuristic: ~4 characters per token
  // This is a reasonable approximation for English text
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Use a weighted average of character-based and word-based estimates
  const charBasedEstimate = Math.ceil(charCount / CHARS_PER_TOKEN);
  const wordBasedEstimate = Math.ceil(wordCount * 1.3); // Words are ~1.3 tokens on average

  return Math.round((charBasedEstimate + wordBasedEstimate) / 2);
}

/**
 * Count tokens for Layer 1 (frontmatter only)
 */
export function countLayer1Tokens(name: string, description: string): number {
  // Layer 1 = name + description + YAML overhead
  const frontmatterContent = `name: ${name}\ndescription: ${description}`;
  return countTokens(frontmatterContent) + 5; // +5 for YAML delimiters and formatting
}

/**
 * Count tokens for Layer 2 (full SKILL.md content)
 */
export function countLayer2Tokens(fullContent: string): number {
  return countTokens(fullContent);
}

/**
 * Check if content fits within progressive disclosure limits
 */
export function checkProgressiveDisclosure(
  layer1Tokens: number,
  layer2Tokens: number
): {
  ok: boolean;
  layer1Ok: boolean;
  layer2Ok: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const layer1Ok = layer1Tokens <= SKILL_CONFIG.LAYER1_MAX_TOKENS;
  const layer2Ok = layer2Tokens <= SKILL_CONFIG.LAYER2_MAX_TOKENS;

  if (!layer1Ok) {
    warnings.push(
      `Layer 1 (metadata) exceeds limit: ${layer1Tokens} tokens > ${SKILL_CONFIG.LAYER1_MAX_TOKENS} max`
    );
  }

  if (!layer2Ok) {
    warnings.push(
      `Layer 2 (full content) exceeds limit: ${layer2Tokens} tokens > ${SKILL_CONFIG.LAYER2_MAX_TOKENS} max`
    );
  }

  return {
    ok: layer1Ok && layer2Ok,
    layer1Ok,
    layer2Ok,
    warnings
  };
}

/**
 * Get token count breakdown for a skill
 */
export function getTokenBreakdown(content: string, name: string, description: string): {
  layer1: number;
  layer2: number;
  breakdown: {
    name: number;
    description: number;
    body: number;
    total: number;
  };
} {
  const nameTokens = countTokens(name);
  const descTokens = countTokens(description);
  const layer1 = countLayer1Tokens(name, description);
  const layer2 = countLayer2Tokens(content);

  // Estimate body tokens (total minus frontmatter)
  const bodyTokens = layer2 - layer1;

  return {
    layer1,
    layer2,
    breakdown: {
      name: nameTokens,
      description: descTokens,
      body: Math.max(0, bodyTokens),
      total: layer2
    }
  };
}
