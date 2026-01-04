/**
 * Skill Builder WebSocket Server
 * Port 9029
 * Real-time skill events
 */
import { WebSocketServer, WebSocket } from 'ws';
let wss = null;
const clients = new Set();
export function startWebSocketServer(port) {
    wss = new WebSocketServer({ port });
    wss.on('connection', (ws) => {
        clients.add(ws);
        console.error(`WebSocket client connected. Total clients: ${clients.size}`);
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            server: 'skill-builder',
            timestamp: Date.now()
        }));
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // Handle ping/pong
                if (message.type === 'ping') {
                    ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: Date.now()
                    }));
                }
            }
            catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        ws.on('close', () => {
            clients.delete(ws);
            console.error(`WebSocket client disconnected. Total clients: ${clients.size}`);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });
    console.error(`Skill Builder WebSocket server listening on port ${port}`);
    return wss;
}
export function broadcast(event, data) {
    const message = JSON.stringify({
        type: event,
        data,
        timestamp: Date.now()
    });
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}
export function broadcastSkillCreated(skillId, name) {
    broadcast('skill_created', { skill_id: skillId, name });
}
export function broadcastSkillUpdated(skillId, version) {
    broadcast('skill_updated', { skill_id: skillId, version });
}
export function broadcastSkillMatched(skillId, taskDescription, confidence) {
    broadcast('skill_matched', { skill_id: skillId, task_description: taskDescription, confidence });
}
export function broadcastSkillUsed(skillId, outcome) {
    broadcast('skill_used', { skill_id: skillId, outcome });
}
export function broadcastValidationResult(valid, errors) {
    broadcast('validation_result', { valid, errors });
}
export function closeWebSocketServer() {
    if (wss) {
        for (const client of clients) {
            client.close();
        }
        clients.clear();
        wss.close();
        wss = null;
    }
}
export function getClientCount() {
    return clients.size;
}
//# sourceMappingURL=server.js.map