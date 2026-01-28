/**
 * Skill Builder Database Schema
 * SQLite database for skill management
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Skill,
  SkillMetadata,
  SkillRow,
  SkillFileRow,
  SkillUsageRow,
  SkillVersionRow,
  BundledFile,
  SkillUsage,
  SkillVersion,
  CognitiveIntegration,
} from '../types.js';

/**
 * Safely parse JSON, returning defaultValue if parsing fails
 */
function safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    console.error(`Failed to parse JSON: ${json.substring(0, 100)}...`);
    return defaultValue;
  }
}

// Singleton database instance
let dbInstance: DatabaseManager | null = null;

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    // Skills table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        full_content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        token_count_layer1 INTEGER DEFAULT 0,
        token_count_layer2 INTEGER DEFAULT 0,
        file_path TEXT,
        tags TEXT,
        cognitive_metadata TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        deprecated_at INTEGER,
        usage_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0
      )
    `);

    // Migration: Add cognitive_metadata column if not exists
    try {
      this.db.exec(`ALTER TABLE skills ADD COLUMN cognitive_metadata TEXT`);
    } catch {
      // Column already exists
    }

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills(tags)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skills_deprecated ON skills(deprecated_at)`);

    // Skill files table (Layer 3 bundled files)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_files (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        token_count INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skill_files_skill ON skill_files(skill_id)`);

    // Skill usages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_usages (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL,
        outcome TEXT NOT NULL,
        context TEXT,
        notes TEXT,
        duration_ms INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skill_usages_skill ON skill_usages(skill_id)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skill_usages_outcome ON skill_usages(outcome)`);

    // Skill versions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skill_versions (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_skill_versions_skill ON skill_versions(skill_id)`);
  }

  // =============================================================================
  // Skill CRUD Operations
  // =============================================================================

  insertSkill(skill: Omit<Skill, 'bundled_files' | 'success_rate'>): string {
    const id = skill.id || uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO skills (
        id, name, description, full_content, version,
        token_count_layer1, token_count_layer2, file_path, tags, cognitive_metadata,
        created_at, updated_at, deprecated_at, usage_count, success_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      skill.name,
      skill.description,
      skill.full_content,
      skill.version || 1,
      skill.token_count_layer1 || 0,
      skill.token_count_layer2 || 0,
      skill.file_path || null,
      skill.tags ? JSON.stringify(skill.tags) : null,
      skill.cognitive_integration ? JSON.stringify(skill.cognitive_integration) : null,
      skill.created_at || Date.now(),
      skill.updated_at || null,
      skill.deprecated_at || null,
      skill.usage_count || 0,
      skill.success_count || 0
    );

    // Save initial version
    this.insertVersion({
      id: uuidv4(),
      skill_id: id,
      version: skill.version || 1,
      content: skill.full_content,
      created_at: Date.now()
    });

    return id;
  }

  getSkill(id: string): Skill | null {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE id = ?');
    const row = stmt.get(id) as SkillRow | undefined;

    if (!row) return null;

    return this.rowToSkill(row);
  }

  getSkillByName(name: string): Skill | null {
    const stmt = this.db.prepare('SELECT * FROM skills WHERE name = ?');
    const row = stmt.get(name) as SkillRow | undefined;

    if (!row) return null;

    return this.rowToSkill(row);
  }

  updateSkill(id: string, updates: Partial<Omit<Skill, 'id' | 'created_at' | 'bundled_files'>>): boolean {
    const skill = this.getSkill(id);
    if (!skill) return false;

    const newVersion = (skill.version || 1) + 1;
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.full_content !== undefined) {
      fields.push('full_content = ?');
      values.push(updates.full_content);
    }
    if (updates.token_count_layer1 !== undefined) {
      fields.push('token_count_layer1 = ?');
      values.push(updates.token_count_layer1);
    }
    if (updates.token_count_layer2 !== undefined) {
      fields.push('token_count_layer2 = ?');
      values.push(updates.token_count_layer2);
    }
    if (updates.file_path !== undefined) {
      fields.push('file_path = ?');
      values.push(updates.file_path);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.cognitive_integration !== undefined) {
      fields.push('cognitive_metadata = ?');
      values.push(JSON.stringify(updates.cognitive_integration));
    }
    if (updates.deprecated_at !== undefined) {
      fields.push('deprecated_at = ?');
      values.push(updates.deprecated_at);
    }

    fields.push('version = ?');
    values.push(newVersion);
    fields.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    const stmt = this.db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    // Save version if content changed
    if (updates.full_content) {
      this.insertVersion({
        id: uuidv4(),
        skill_id: id,
        version: newVersion,
        content: updates.full_content,
        created_at: Date.now()
      });
    }

    return result.changes > 0;
  }

  deprecateSkill(id: string): boolean {
    const stmt = this.db.prepare('UPDATE skills SET deprecated_at = ? WHERE id = ?');
    const result = stmt.run(Date.now(), id);
    return result.changes > 0;
  }

  deleteSkill(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM skills WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // =============================================================================
  // Skill Queries
  // =============================================================================

  getAllSkills(includeDeprecated: boolean = false): Skill[] {
    const query = includeDeprecated
      ? 'SELECT * FROM skills ORDER BY created_at DESC'
      : 'SELECT * FROM skills WHERE deprecated_at IS NULL ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all() as SkillRow[];

    return rows.map(row => this.rowToSkill(row));
  }

  getSkillMetadata(includeDeprecated: boolean = false): SkillMetadata[] {
    const query = includeDeprecated
      ? 'SELECT * FROM skills ORDER BY usage_count DESC'
      : 'SELECT * FROM skills WHERE deprecated_at IS NULL ORDER BY usage_count DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all() as SkillRow[];

    return rows.map(row => this.rowToMetadata(row));
  }

  searchSkills(search: string, includeDeprecated: boolean = false): Skill[] {
    const searchPattern = `%${search.toLowerCase()}%`;
    const baseQuery = `
      SELECT * FROM skills
      WHERE (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)
    `;
    const query = includeDeprecated
      ? `${baseQuery} ORDER BY usage_count DESC`
      : `${baseQuery} AND deprecated_at IS NULL ORDER BY usage_count DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(searchPattern, searchPattern, searchPattern) as SkillRow[];

    return rows.map(row => this.rowToSkill(row));
  }

  getSkillsByTags(tags: string[], includeDeprecated: boolean = false): Skill[] {
    const skills = this.getAllSkills(includeDeprecated);
    return skills.filter(skill => {
      const skillTags = skill.tags || [];
      return tags.some(tag => skillTags.includes(tag));
    });
  }

  // =============================================================================
  // Skill Files (Layer 3)
  // =============================================================================

  insertSkillFile(file: Omit<BundledFile, 'id'>): string {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO skill_files (id, skill_id, file_name, file_path, file_type, token_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      file.skill_id,
      file.file_name,
      file.file_path,
      file.file_type || null,
      file.token_count || null,
      file.created_at || Date.now()
    );

    return id;
  }

  getSkillFiles(skillId: string): BundledFile[] {
    const stmt = this.db.prepare('SELECT * FROM skill_files WHERE skill_id = ?');
    const rows = stmt.all(skillId) as SkillFileRow[];

    return rows.map(row => ({
      id: row.id,
      skill_id: row.skill_id,
      file_name: row.file_name,
      file_path: row.file_path,
      file_type: row.file_type || '',
      token_count: row.token_count || 0,
      created_at: row.created_at
    }));
  }

  deleteSkillFile(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM skill_files WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // =============================================================================
  // Skill Usage Tracking
  // =============================================================================

  insertUsage(usage: Omit<SkillUsage, 'id'>): string {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO skill_usages (id, skill_id, outcome, context, notes, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      usage.skill_id,
      usage.outcome,
      usage.context ? JSON.stringify(usage.context) : null,
      usage.notes || null,
      usage.duration_ms || null,
      usage.created_at || Date.now()
    );

    // Update skill usage count and success count
    const updateStmt = this.db.prepare(`
      UPDATE skills SET
        usage_count = usage_count + 1,
        success_count = success_count + ?
      WHERE id = ?
    `);
    updateStmt.run(usage.outcome === 'success' ? 1 : 0, usage.skill_id);

    return id;
  }

  getSkillUsages(skillId: string, limit: number = 100): SkillUsage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM skill_usages
      WHERE skill_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(skillId, limit) as SkillUsageRow[];

    return rows.map(row => ({
      id: row.id,
      skill_id: row.skill_id,
      outcome: row.outcome as 'success' | 'failure' | 'partial',
      context: safeJsonParse<Record<string, unknown> | undefined>(row.context, undefined),
      notes: row.notes || undefined,
      duration_ms: row.duration_ms || undefined,
      created_at: row.created_at
    }));
  }

  getSkillSuccessRate(skillId: string): number {
    const skill = this.getSkill(skillId);
    if (!skill || skill.usage_count === 0) return 0;
    return skill.success_count / skill.usage_count;
  }

  // =============================================================================
  // Skill Versions
  // =============================================================================

  insertVersion(version: SkillVersion): string {
    const stmt = this.db.prepare(`
      INSERT INTO skill_versions (id, skill_id, version, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      version.id,
      version.skill_id,
      version.version,
      version.content,
      version.created_at
    );

    return version.id;
  }

  getSkillVersions(skillId: string): SkillVersion[] {
    const stmt = this.db.prepare(`
      SELECT * FROM skill_versions
      WHERE skill_id = ?
      ORDER BY version DESC
    `);
    const rows = stmt.all(skillId) as SkillVersionRow[];

    return rows.map(row => ({
      id: row.id,
      skill_id: row.skill_id,
      version: row.version,
      content: row.content,
      created_at: row.created_at
    }));
  }

  getSkillVersion(skillId: string, version: number): SkillVersion | null {
    const stmt = this.db.prepare(`
      SELECT * FROM skill_versions
      WHERE skill_id = ? AND version = ?
    `);
    const row = stmt.get(skillId, version) as SkillVersionRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      skill_id: row.skill_id,
      version: row.version,
      content: row.content,
      created_at: row.created_at
    };
  }

  // =============================================================================
  // Statistics
  // =============================================================================

  getStats(): {
    totalSkills: number;
    activeSkills: number;
    deprecatedSkills: number;
    totalUsages: number;
    overallSuccessRate: number;
    avgTokensLayer1: number;
    avgTokensLayer2: number;
  } {
    const skills = this.db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
    const active = this.db.prepare('SELECT COUNT(*) as count FROM skills WHERE deprecated_at IS NULL').get() as { count: number };
    const deprecated = this.db.prepare('SELECT COUNT(*) as count FROM skills WHERE deprecated_at IS NOT NULL').get() as { count: number };
    const usages = this.db.prepare('SELECT COUNT(*) as count FROM skill_usages').get() as { count: number };
    const successRate = this.db.prepare(`
      SELECT
        CASE WHEN SUM(usage_count) > 0
          THEN CAST(SUM(success_count) AS FLOAT) / SUM(usage_count)
          ELSE 0
        END as rate
      FROM skills
    `).get() as { rate: number };
    const avgTokens = this.db.prepare(`
      SELECT
        AVG(token_count_layer1) as avg1,
        AVG(token_count_layer2) as avg2
      FROM skills
    `).get() as { avg1: number | null; avg2: number | null };

    return {
      totalSkills: skills.count,
      activeSkills: active.count,
      deprecatedSkills: deprecated.count,
      totalUsages: usages.count,
      overallSuccessRate: successRate.rate || 0,
      avgTokensLayer1: avgTokens.avg1 || 0,
      avgTokensLayer2: avgTokens.avg2 || 0
    };
  }

  // =============================================================================
  // Helpers
  // =============================================================================

  private rowToSkill(row: SkillRow): Skill {
    const bundledFiles = this.getSkillFiles(row.id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      full_content: row.full_content,
      version: row.version,
      token_count_layer1: row.token_count_layer1,
      token_count_layer2: row.token_count_layer2,
      file_path: row.file_path || undefined,
      tags: safeJsonParse<string[]>(row.tags, []),
      cognitive_integration: safeJsonParse<CognitiveIntegration | undefined>(row.cognitive_metadata, undefined),
      created_at: row.created_at,
      updated_at: row.updated_at || undefined,
      deprecated_at: row.deprecated_at || undefined,
      usage_count: row.usage_count,
      success_count: row.success_count,
      success_rate: row.usage_count > 0 ? row.success_count / row.usage_count : 0,
      bundled_files: bundledFiles
    };
  }

  private rowToMetadata(row: SkillRow): SkillMetadata {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tags: safeJsonParse<string[]>(row.tags, []),
      token_count_layer1: row.token_count_layer1,
      token_count_layer2: row.token_count_layer2,
      usage_count: row.usage_count,
      success_rate: row.usage_count > 0 ? row.success_count / row.usage_count : 0,
      created_at: row.created_at,
      deprecated_at: row.deprecated_at || undefined,
      cognitive_integration: safeJsonParse<CognitiveIntegration | undefined>(row.cognitive_metadata, undefined)
    };
  }

  close(): void {
    this.db.close();
  }
}

// =============================================================================
// Singleton Management
// =============================================================================

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export function setDatabase(db: DatabaseManager): void {
  dbInstance = db;
}

export function resetDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
