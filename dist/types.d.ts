/**
 * Skill Builder Type Definitions
 * Based on Anthropic Claude Skills specification
 */
/**
 * Layer 1 metadata - always loaded for matching (~100 tokens)
 */
export interface SkillMetadata {
    id: string;
    name: string;
    description: string;
    tags: string[];
    token_count_layer1: number;
    token_count_layer2: number;
    usage_count: number;
    success_rate: number;
    created_at: number;
    deprecated_at?: number;
}
/**
 * Full skill with Layer 1 + Layer 2 content
 */
export interface Skill extends SkillMetadata {
    full_content: string;
    file_path?: string;
    version: number;
    updated_at?: number;
    success_count: number;
    bundled_files: BundledFile[];
}
/**
 * Layer 3 - Bundled reference files
 */
export interface BundledFile {
    id: string;
    skill_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    token_count: number;
    created_at: number;
}
/**
 * Parsed SKILL.md structure following Anthropic spec
 */
export interface ParsedSkill {
    frontmatter: SkillFrontmatter;
    body: SkillBody;
    raw_content: string;
}
/**
 * YAML frontmatter in SKILL.md
 */
export interface SkillFrontmatter {
    name: string;
    description: string;
    tags?: string[];
}
/**
 * Markdown body sections in SKILL.md
 */
export interface SkillBody {
    overview?: string;
    prerequisites?: string[];
    steps?: string[];
    examples?: string[];
    error_handling?: string;
    limitations?: string;
    raw_body: string;
}
/**
 * Result of matching a task to skills
 */
export interface SkillMatch {
    skill_id: string;
    name: string;
    description: string;
    confidence: number;
    triggered_by: string[];
}
/**
 * Skill usage record
 */
export interface SkillUsage {
    id: string;
    skill_id: string;
    outcome: 'success' | 'failure' | 'partial';
    context?: Record<string, unknown>;
    notes?: string;
    duration_ms?: number;
    created_at: number;
}
/**
 * Skill version for history/rollback
 */
export interface SkillVersion {
    id: string;
    skill_id: string;
    version: number;
    content: string;
    created_at: number;
}
/**
 * Result of validating a SKILL.md file
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    token_counts: {
        layer1: number;
        layer2: number;
    };
    progressive_disclosure_ok: boolean;
    description_analysis?: DescriptionAnalysis;
}
/**
 * Analysis of description field effectiveness
 */
export interface DescriptionAnalysis {
    clarity_score: number;
    trigger_keywords: string[];
    suggestions: string[];
    too_broad: boolean;
    too_narrow: boolean;
}
export interface CreateSkillInput {
    name: string;
    description: string;
    overview: string;
    steps: string[];
    examples?: string[];
    prerequisites?: string[];
    error_handling?: string;
    limitations?: string;
    tags?: string[];
}
export interface SkillConflict {
    existing_skill_id: string;
    existing_skill_name: string;
    overlap_score: number;
    shared_keywords: string[];
    shared_tags: string[];
    recommendation: string;
}
export interface CreateSkillOutput {
    skill_id: string;
    path: string;
    created: true;
    token_count: {
        layer1: number;
        layer2: number;
    };
    conflicts?: SkillConflict[];
}
export interface ValidateSkillInput {
    skill_id?: string;
    path?: string;
    content?: string;
}
export interface AnalyzeDescriptionInput {
    description: string;
    intended_triggers?: string[];
}
export interface ListSkillsInput {
    tags?: string[];
    search?: string;
    include_deprecated?: boolean;
}
export interface ListSkillsOutput {
    skills: SkillMetadata[];
    count: number;
}
export interface GetSkillInput {
    skill_id?: string;
    name?: string;
}
export interface GetSkillOutput {
    skill_id: string;
    name: string;
    description: string;
    full_content: string;
    token_counts: {
        layer1: number;
        layer2: number;
    };
    usage_count: number;
    success_rate: number;
    bundled_files: string[];
}
export interface UpdateSkillInput {
    skill_id: string;
    updates: Partial<{
        name: string;
        description: string;
        overview: string;
        steps: string[];
        examples: string[];
        prerequisites: string[];
        error_handling: string;
        limitations: string;
        tags: string[];
    }>;
}
export interface UpdateSkillOutput {
    updated: true;
    skill_id: string;
    previous_version: number;
    new_version: number;
}
export interface MatchSkillInput {
    task_description: string;
    context?: Record<string, unknown>;
    min_confidence?: number;
}
export interface MatchSkillOutput {
    matches: SkillMatch[];
    best_match?: string;
}
export interface RecordSkillUsageInput {
    skill_id: string;
    outcome: 'success' | 'failure' | 'partial';
    notes?: string;
    duration_ms?: number;
    context?: Record<string, unknown>;
}
export interface RecordSkillUsageOutput {
    recorded: true;
    skill_id: string;
    total_uses: number;
    success_rate: number;
}
export declare const SignalTypes: {
    readonly EXPERIENCE_RECORDED: 240;
    readonly PATTERN_EMERGED: 241;
    readonly LESSON_EXTRACTED: 242;
    readonly OPERATION_COMPLETE: 255;
    readonly HEARTBEAT: 0;
    readonly SKILL_CREATED: 160;
    readonly SKILL_MATCHED: 161;
    readonly SKILL_USED: 162;
    readonly SKILL_DEPRECATED: 163;
    readonly SKILL_VALIDATION_FAILED: 164;
};
export type SignalCode = typeof SignalTypes[keyof typeof SignalTypes];
export interface Signal {
    signalType: number;
    version: number;
    timestamp: number;
    payload: {
        sender: string;
        [key: string]: unknown;
    };
}
export declare const SKILL_CONFIG: {
    readonly LAYER1_MAX_TOKENS: 100;
    readonly LAYER2_MAX_TOKENS: 5000;
    readonly MIN_DESCRIPTION_LENGTH: 20;
    readonly MAX_DESCRIPTION_LENGTH: 500;
    readonly MIN_MATCH_CONFIDENCE: 0.3;
    readonly HIGH_MATCH_CONFIDENCE: 0.7;
    readonly SKILL_DIRECTORIES: readonly ["/Users/macbook/Documents/claude_home/repo/claude-skills/", "/Users/macbook/Documents/claude_home/repo/bop/skills/"];
};
export interface SkillRow {
    id: string;
    name: string;
    description: string;
    full_content: string;
    version: number;
    token_count_layer1: number;
    token_count_layer2: number;
    file_path: string | null;
    tags: string | null;
    created_at: number;
    updated_at: number | null;
    deprecated_at: number | null;
    usage_count: number;
    success_count: number;
}
export interface SkillFileRow {
    id: string;
    skill_id: string;
    file_name: string;
    file_path: string;
    file_type: string | null;
    token_count: number | null;
    created_at: number;
}
export interface SkillUsageRow {
    id: string;
    skill_id: string;
    outcome: string;
    context: string | null;
    notes: string | null;
    duration_ms: number | null;
    created_at: number;
}
export interface SkillVersionRow {
    id: string;
    skill_id: string;
    version: number;
    content: string;
    created_at: number;
}
//# sourceMappingURL=types.d.ts.map