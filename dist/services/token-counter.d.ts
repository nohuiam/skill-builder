/**
 * Token Counter Service
 * Estimates token counts for progressive disclosure layers
 *
 * Note: This uses a simple heuristic (4 chars per token) as a reasonable
 * approximation for Claude/GPT tokenizers without requiring API calls.
 * For production, consider using tiktoken or the Claude tokenizer.
 */
/**
 * Estimate token count for a string
 */
export declare function countTokens(text: string): number;
/**
 * Count tokens for Layer 1 (frontmatter only)
 */
export declare function countLayer1Tokens(name: string, description: string): number;
/**
 * Count tokens for Layer 2 (full SKILL.md content)
 */
export declare function countLayer2Tokens(fullContent: string): number;
/**
 * Check if content fits within progressive disclosure limits
 */
export declare function checkProgressiveDisclosure(layer1Tokens: number, layer2Tokens: number): {
    ok: boolean;
    layer1Ok: boolean;
    layer2Ok: boolean;
    warnings: string[];
};
/**
 * Get token count breakdown for a skill
 */
export declare function getTokenBreakdown(content: string, name: string, description: string): {
    layer1: number;
    layer2: number;
    breakdown: {
        name: number;
        description: number;
        body: number;
        total: number;
    };
};
//# sourceMappingURL=token-counter.d.ts.map