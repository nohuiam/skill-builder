/**
 * analyze_description Tool
 * Evaluate description field for semantic triggering effectiveness
 */

import { analyzeDescription as analyzeDescriptionService } from '../services/skill-matcher.js';
import { AnalyzeDescriptionInput, DescriptionAnalysis } from '../types.js';

export function analyzeDescription(input: AnalyzeDescriptionInput): DescriptionAnalysis {
  return analyzeDescriptionService(input.description, input.intended_triggers);
}
