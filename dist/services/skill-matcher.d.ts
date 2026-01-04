/**
 * Skill Matcher Service
 * Semantic matching for skill discovery
 *
 * Uses simple text similarity and keyword matching.
 * For production, consider using embeddings or more sophisticated NLP.
 */
import { SkillMetadata, SkillMatch } from '../types.js';
/**
 * Match a task description to available skills
 */
export declare function matchSkills(taskDescription: string, skills: SkillMetadata[], minConfidence?: number): SkillMatch[];
/**
 * Analyze description effectiveness for triggering
 */
export declare function analyzeDescription(description: string, intendedTriggers?: string[]): {
    clarity_score: number;
    trigger_keywords: string[];
    suggestions: string[];
    too_broad: boolean;
    too_narrow: boolean;
};
//# sourceMappingURL=skill-matcher.d.ts.map