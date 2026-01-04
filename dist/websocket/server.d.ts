/**
 * Skill Builder WebSocket Server
 * Port 9029
 * Real-time skill events
 */
import { WebSocketServer } from 'ws';
export declare function startWebSocketServer(port: number): WebSocketServer;
export declare function broadcast(event: string, data: Record<string, unknown>): void;
export declare function broadcastSkillCreated(skillId: string, name: string): void;
export declare function broadcastSkillUpdated(skillId: string, version: number): void;
export declare function broadcastSkillMatched(skillId: string, taskDescription: string, confidence: number): void;
export declare function broadcastSkillUsed(skillId: string, outcome: string): void;
export declare function broadcastValidationResult(valid: boolean, errors: string[]): void;
export declare function closeWebSocketServer(): void;
export declare function getClientCount(): number;
//# sourceMappingURL=server.d.ts.map