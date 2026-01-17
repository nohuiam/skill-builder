/**
 * Skill Builder HTTP REST API
 * Port 8029
 */
import { Server } from 'http';
interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
}
declare global {
    namespace Express {
        interface Request {
            trace?: TraceContext;
        }
    }
}
export declare function startHttpServer(port: number): Server;
export declare function closeHttpServer(): void;
export {};
//# sourceMappingURL=server.d.ts.map