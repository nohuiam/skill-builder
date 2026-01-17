/**
 * Skill Builder HTTP REST API
 * Port 8029
 */

import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database/schema.js';
import { createSkill } from '../tools/create-skill.js';
import { validateSkill } from '../tools/validate-skill.js';
import { analyzeDescription } from '../tools/analyze-description.js';
import { listSkills } from '../tools/list-skills.js';
import { getSkill } from '../tools/get-skill.js';
import { updateSkill } from '../tools/update-skill.js';
import { matchSkill } from '../tools/match-skill.js';
import { recordSkillUsage } from '../tools/record-skill-usage.js';
import { tools } from '../tools/index.js';

// Tool handler map for gateway integration
const TOOL_HANDLERS: Record<string, (args: any) => any> = {
  create_skill: createSkill,
  validate_skill: validateSkill,
  analyze_description: analyzeDescription,
  list_skills: listSkills,
  get_skill: getSkill,
  update_skill: updateSkill,
  match_skill: matchSkill,
  record_skill_usage: recordSkillUsage
};

const SERVER_NAME = 'skill-builder';

// Trace context for distributed tracing (Linus audit recommendation)
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      trace?: TraceContext;
    }
  }
}

function createTraceContext(parent?: Partial<TraceContext>): TraceContext {
  return {
    traceId: parent?.traceId ?? randomUUID(),
    spanId: randomUUID(),
    parentSpanId: parent?.spanId
  };
}

function parseTraceparent(header: string): { traceId: string; parentSpanId: string } | null {
  const parts = header.split('-');
  if (parts.length < 3) return null;
  return { traceId: parts[1], parentSpanId: parts[2] };
}

function formatTraceparent(trace: TraceContext): string {
  return `00-${trace.traceId}-${trace.spanId}-01`;
}

let httpServer: Server | null = null;
const startTime = Date.now();

export function startHttpServer(port: number): Server {
  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, traceparent');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Distributed tracing middleware (Linus audit recommendation)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip tracing for health checks
    if (req.path === '/health') {
      next();
      return;
    }

    // Extract or create trace context
    const traceparent = req.headers['traceparent'] as string;
    let trace: TraceContext;

    if (traceparent) {
      const parsed = parseTraceparent(traceparent);
      if (parsed) {
        trace = createTraceContext({ traceId: parsed.traceId, spanId: parsed.parentSpanId });
      } else {
        trace = createTraceContext();
      }
    } else {
      trace = createTraceContext();
    }

    req.trace = trace;

    // Set response headers for trace propagation
    res.setHeader('X-Trace-ID', trace.traceId);
    res.setHeader('X-Span-ID', trace.spanId);
    res.setHeader('traceparent', formatTraceparent(trace));

    next();
  });

  // Health check (standardized cognitive server format)
  app.get('/health', (req: Request, res: Response) => {
    const db = getDatabase();
    const stats = db.getStats();
    res.json({
      status: 'healthy',
      server: 'skill-builder',
      version: '1.0.0',
      uptime_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      stats: {
        skills: stats.totalSkills,
        activeSkills: stats.activeSkills,
        totalUsages: stats.totalUsages,
        successRate: stats.overallSuccessRate
      },
      interlock: null  // skill-builder does not have InterLock
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

  // Gateway integration: List all MCP tools
  app.get('/api/tools', (req: Request, res: Response) => {
    const toolList = tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
    res.json({ tools: toolList, count: toolList.length });
  });

  // Gateway integration: Execute MCP tool via HTTP
  app.post('/api/tools/:toolName', async (req: Request, res: Response) => {
    const { toolName } = req.params;
    const args = req.body.arguments || req.body;

    const handler = TOOL_HANDLERS[toolName];
    if (!handler) {
      res.status(404).json({ success: false, error: `Tool '${toolName}' not found` });
      return;
    }

    try {
      const result = await handler(args);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
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
