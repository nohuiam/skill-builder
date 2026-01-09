/**
 * Disk Loader
 * Loads SKILL.md files from disk into the skill-builder database
 */
interface LoadResult {
    loaded: number;
    skipped: number;
    errors: string[];
}
/**
 * Load skills from disk into the database
 */
export declare function loadSkillsFromDisk(directories: string[]): Promise<LoadResult>;
/**
 * Default skill directories to scan
 */
export declare const DEFAULT_SKILL_DIRECTORIES: string[];
export {};
//# sourceMappingURL=disk-loader.d.ts.map