/**
 * Disk Loader
 * Loads SKILL.md files from disk into the skill-builder database
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database/schema.js';
import { parseSkillMd } from './parser/skill-parser.js';
import { countLayer1Tokens, countLayer2Tokens } from './services/token-counter.js';
/**
 * Recursively find all SKILL.md files in a directory
 */
function findSkillFiles(dir) {
    const skillFiles = [];
    try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            // Skip node_modules and hidden directories
            if (entry === 'node_modules' || entry.startsWith('.')) {
                continue;
            }
            const fullPath = join(dir, entry);
            try {
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    // Recurse into subdirectories
                    skillFiles.push(...findSkillFiles(fullPath));
                }
                else if (entry === 'SKILL.md' || entry.endsWith('.skill.md')) {
                    skillFiles.push(fullPath);
                }
            }
            catch {
                // Skip files we can't stat
            }
        }
    }
    catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
    }
    return skillFiles;
}
/**
 * Load skills from disk into the database
 */
export async function loadSkillsFromDisk(directories) {
    const db = getDatabase();
    const result = {
        loaded: 0,
        skipped: 0,
        errors: []
    };
    // Get existing skill names for idempotency check
    const existingSkills = new Set();
    try {
        const skills = db.getAllSkills(true);
        for (const skill of skills) {
            existingSkills.add(skill.name.toLowerCase());
        }
    }
    catch {
        // Database might be empty
    }
    // Find all skill files
    const allSkillFiles = [];
    for (const dir of directories) {
        try {
            const files = findSkillFiles(dir);
            allSkillFiles.push(...files);
        }
        catch (error) {
            result.errors.push(`Error scanning ${dir}: ${error}`);
        }
    }
    console.error(`Found ${allSkillFiles.length} skill files to process`);
    // Process each skill file
    for (const filePath of allSkillFiles) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const parsed = parseSkillMd(content);
            // Get skill name from frontmatter or directory name
            const skillName = parsed.frontmatter.name || basename(dirname(filePath));
            if (!skillName) {
                result.errors.push(`${filePath}: No skill name found`);
                continue;
            }
            // Idempotency check
            if (existingSkills.has(skillName.toLowerCase())) {
                console.error(`Skipping ${skillName} (already exists)`);
                result.skipped++;
                continue;
            }
            // Calculate token counts
            const description = parsed.frontmatter.description || '';
            const layer1Tokens = countLayer1Tokens(skillName, description);
            const layer2Tokens = countLayer2Tokens(content);
            // Generate skill ID
            const skillId = uuidv4();
            // Insert into database
            db.insertSkill({
                id: skillId,
                name: skillName,
                description: description,
                full_content: content,
                version: 1,
                token_count_layer1: layer1Tokens,
                token_count_layer2: layer2Tokens,
                tags: parsed.frontmatter.tags || [],
                created_at: Date.now(),
                usage_count: 0,
                success_count: 0
            });
            console.error(`Loaded skill: ${skillName} from ${filePath}`);
            existingSkills.add(skillName.toLowerCase());
            result.loaded++;
        }
        catch (error) {
            result.errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    console.error(`Disk loader complete: ${result.loaded} loaded, ${result.skipped} skipped, ${result.errors.length} errors`);
    return result;
}
/**
 * Default skill directories to scan
 */
export const DEFAULT_SKILL_DIRECTORIES = [
    '/Users/macbook/Documents/claude_home/repo/claude-skills',
    '/Users/macbook/Documents/claude_home/repo/bop/skills'
];
//# sourceMappingURL=disk-loader.js.map