#!/usr/bin/env node
/**
 * Skill Builder MCP Server
 * Port 3029 (UDP), 8029 (HTTP), 9029 (WebSocket)
 *
 * Manages SKILL.md files - the ecosystem's library of procedural knowledge
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { getDatabase, resetDatabase } from './database/schema.js';
import { tools, createSkill, validateSkill, analyzeDescription, listSkills, getSkill, updateSkill, matchSkill, recordSkillUsage } from './tools/index.js';
import { startHttpServer } from './http/server.js';
import { startWebSocketServer, closeWebSocketServer } from './websocket/server.js';
import { startInterlock, closeInterlock } from './interlock/index.js';
// Initialize database
getDatabase();
// Create MCP server
const server = new Server({
    name: 'skill-builder',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            case 'create_skill':
                result = createSkill(args);
                break;
            case 'validate_skill':
                result = validateSkill(args);
                break;
            case 'analyze_description':
                result = analyzeDescription(args);
                break;
            case 'list_skills':
                result = listSkills((args ?? {}));
                break;
            case 'get_skill':
                result = getSkill(args);
                break;
            case 'update_skill':
                result = updateSkill(args);
                break;
            case 'match_skill':
                result = matchSkill(args);
                break;
            case 'record_skill_usage':
                result = recordSkillUsage(args);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
            ],
            isError: true,
        };
    }
});
// Start all servers
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const mcpOnly = args.includes('--mcp-only');
    if (!mcpOnly) {
        // Start HTTP server
        try {
            startHttpServer(8029);
        }
        catch (error) {
            console.error('Failed to start HTTP server:', error);
        }
        // Start WebSocket server
        try {
            startWebSocketServer(9029);
        }
        catch (error) {
            console.error('Failed to start WebSocket server:', error);
        }
        // Start InterLock mesh
        try {
            startInterlock(3029);
        }
        catch (error) {
            console.error('Failed to start InterLock:', error);
        }
    }
    // Start MCP server on stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Skill Builder MCP server running on stdio');
}
// Handle shutdown
process.on('SIGINT', () => {
    console.error('Shutting down Skill Builder...');
    closeWebSocketServer();
    closeInterlock();
    resetDatabase();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.error('Shutting down Skill Builder...');
    closeWebSocketServer();
    closeInterlock();
    resetDatabase();
    process.exit(0);
});
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map