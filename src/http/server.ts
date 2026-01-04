/**
 * Skill Builder HTTP REST API
 * Port 8029
 */

import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { getDatabase } from '../database/schema.js';
import { createSkill } from '../tools/create-skill.js';
import { validateSkill } from '../tools/validate-skill.js';
import { analyzeDescription } from '../tools/analyze-description.js';
import { listSkills } from '../tools/list-skills.js';
import { getSkill } from '../tools/get-skill.js';
import { updateSkill } from '../tools/update-skill.js';
import { matchSkill } from '../tools/match-skill.js';
import { recordSkillUsage } from '../tools/record-skill-usage.js';

let httpServer: Server | null = null;
const startTime = Date.now();

export function startHttpServer(port: number): Server {
  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    const db = getDatabase();
    const stats = db.getStats();
    res.json({
      status: 'healthy',
      server: 'skill-builder',
      version: '1.0.0',
      uptime: Date.now() - startTime,
      stats: {
        skills: stats.totalSkills,
        activeSkills: stats.activeSkills,
        totalUsages: stats.totalUsages,
        successRate: stats.overallSuccessRate
      }
    });
  });

  // Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const db = getDatabase();
    const stats = db.getStats();
    res.json(stats);
  });

  // List skills
  app.get('/api/skills', (req: Request, res: Response) => {
    try {
      const tags = req.query.tags ? String(req.query.tags).split(',') : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const includeDeprecated = req.query.include_deprecated === 'true';

      const result = listSkills({ tags, search, include_deprecated: includeDeprecated });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create skill
  app.post('/api/skills', (req: Request, res: Response) => {
    try {
      const result = createSkill(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get skill by ID
  app.get('/api/skills/:id', (req: Request, res: Response) => {
    try {
      const result = getSkill({ skill_id: req.params.id });
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update skill
  app.put('/api/skills/:id', (req: Request, res: Response) => {
    try {
      const result = updateSkill({ skill_id: req.params.id, updates: req.body });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Deprecate skill
  app.delete('/api/skills/:id', (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const success = db.deprecateSkill(req.params.id);
      if (success) {
        res.json({ deprecated: true, skill_id: req.params.id });
      } else {
        res.status(404).json({ error: 'Skill not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Validate skill
  app.post('/api/validate', (req: Request, res: Response) => {
    try {
      const result = validateSkill(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Analyze description
  app.post('/api/analyze-description', (req: Request, res: Response) => {
    try {
      const result = analyzeDescription(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Match skills
  app.post('/api/match', (req: Request, res: Response) => {
    try {
      const result = matchSkill(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Record skill usage
  app.post('/api/skills/:id/usage', (req: Request, res: Response) => {
    try {
      const result = recordSkillUsage({
        skill_id: req.params.id,
        ...req.body
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get skill usage history
  app.get('/api/skills/:id/usage', (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 100;
      const usages = db.getSkillUsages(req.params.id, limit);
      res.json({ usages, count: usages.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get skill files (Layer 3)
  app.get('/api/skills/:id/files', (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const files = db.getSkillFiles(req.params.id);
      res.json({ files, count: files.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Add skill file
  app.post('/api/skills/:id/files', (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const fileId = db.insertSkillFile({
        skill_id: req.params.id,
        file_name: req.body.file_name,
        file_path: req.body.file_path,
        file_type: req.body.file_type,
        token_count: req.body.token_count,
        created_at: Date.now()
      });
      res.status(201).json({ file_id: fileId, created: true });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete skill file
  app.delete('/api/skills/:id/files/:fileId', (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const success = db.deleteSkillFile(req.params.fileId);
      if (success) {
        res.json({ deleted: true, file_id: req.params.fileId });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  httpServer = app.listen(port, () => {
    console.error(`Skill Builder HTTP server listening on port ${port}`);
  });

  return httpServer;
}

export function closeHttpServer(): void {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
}
