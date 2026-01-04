/**
 * Skill Builder Database Schema
 * SQLite database for skill management
 */
import { Skill, SkillMetadata, BundledFile, SkillUsage, SkillVersion } from '../types.js';
export declare class DatabaseManager {
    private db;
    constructor(dbPath?: string);
    private initSchema;
    insertSkill(skill: Omit<Skill, 'bundled_files' | 'success_rate'>): string;
    getSkill(id: string): Skill | null;
    getSkillByName(name: string): Skill | null;
    updateSkill(id: string, updates: Partial<Omit<Skill, 'id' | 'created_at' | 'bundled_files'>>): boolean;
    deprecateSkill(id: string): boolean;
    deleteSkill(id: string): boolean;
    getAllSkills(includeDeprecated?: boolean): Skill[];
    getSkillMetadata(includeDeprecated?: boolean): SkillMetadata[];
    searchSkills(search: string, includeDeprecated?: boolean): Skill[];
    getSkillsByTags(tags: string[], includeDeprecated?: boolean): Skill[];
    insertSkillFile(file: Omit<BundledFile, 'id'>): string;
    getSkillFiles(skillId: string): BundledFile[];
    deleteSkillFile(id: string): boolean;
    insertUsage(usage: Omit<SkillUsage, 'id'>): string;
    getSkillUsages(skillId: string, limit?: number): SkillUsage[];
    getSkillSuccessRate(skillId: string): number;
    insertVersion(version: SkillVersion): string;
    getSkillVersions(skillId: string): SkillVersion[];
    getSkillVersion(skillId: string, version: number): SkillVersion | null;
    getStats(): {
        totalSkills: number;
        activeSkills: number;
        deprecatedSkills: number;
        totalUsages: number;
        overallSuccessRate: number;
        avgTokensLayer1: number;
        avgTokensLayer2: number;
    };
    private rowToSkill;
    private rowToMetadata;
    close(): void;
}
export declare function getDatabase(): DatabaseManager;
export declare function setDatabase(db: DatabaseManager): void;
export declare function resetDatabase(): void;
//# sourceMappingURL=schema.d.ts.map