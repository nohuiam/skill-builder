/**
 * InterLock Tumbler
 * Whitelist filtering for signals
 */
import { getSignalName } from './protocol.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let whitelist = new Set();
/**
 * Load tumbler configuration from interlock.json
 */
export function loadTumblerConfig() {
    try {
        const configPath = join(__dirname, '../../config/interlock.json');
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        if (config.tumbler?.whitelist) {
            whitelist = new Set(config.tumbler.whitelist);
        }
    }
    catch (error) {
        console.error('Failed to load tumbler config, using defaults:', error);
        // Default whitelist
        whitelist = new Set([
            'EXPERIENCE_RECORDED',
            'PATTERN_EMERGED',
            'LESSON_EXTRACTED',
            'OPERATION_COMPLETE',
            'HEARTBEAT'
        ]);
    }
}
/**
 * Check if a signal is allowed through the tumbler
 */
export function isSignalAllowed(signal) {
    const signalName = getSignalName(signal.signalType);
    return whitelist.has(signalName);
}
/**
 * Add a signal to the whitelist
 */
export function addToWhitelist(signalName) {
    whitelist.add(signalName);
}
/**
 * Remove a signal from the whitelist
 */
export function removeFromWhitelist(signalName) {
    whitelist.delete(signalName);
}
/**
 * Get current whitelist
 */
export function getWhitelist() {
    return Array.from(whitelist);
}
// Initialize on module load
loadTumblerConfig();
//# sourceMappingURL=tumbler.js.map