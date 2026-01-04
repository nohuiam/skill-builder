/**
 * analyze_description Tool
 * Evaluate description field for semantic triggering effectiveness
 */
import { analyzeDescription as analyzeDescriptionService } from '../services/skill-matcher.js';
export function analyzeDescription(input) {
    return analyzeDescriptionService(input.description, input.intended_triggers);
}
//# sourceMappingURL=analyze-description.js.map