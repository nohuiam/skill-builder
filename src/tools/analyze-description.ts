/**
 * analyze_description Tool
 * Evaluate description field for semantic triggering effectiveness
 */

import { analyzeDescription as analyzeDescriptionService } from '../services/skill-matcher.js';
import { AnalyzeDescriptionInput, DescriptionAnalysis } from '../types.js';

export function analyzeDescription(input: AnalyzeDescriptionInput): DescriptionAnalysis {
  // Validate input
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object with description');
  }
  if (!input.description || typeof input.description !== 'string') {
    throw new Error('description is required and must be a string');
  }
  if (input.description.trim().length === 0) {
    throw new Error('description cannot be empty');
  }
  if (input.description.length > 10000) {
    throw new Error('description exceeds maximum length of 10000 characters');
  }
  if (input.intended_triggers !== undefined) {
    if (!Array.isArray(input.intended_triggers)) {
      throw new Error('intended_triggers must be an array of strings');
    }
    if (!input.intended_triggers.every(t => typeof t === 'string')) {
      throw new Error('intended_triggers must contain only strings');
    }
  }

  return analyzeDescriptionService(input.description, input.intended_triggers);
}
