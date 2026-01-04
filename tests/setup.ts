/**
 * Test Setup for Skill Builder
 */

import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(30000);

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Keep warn and error for debugging
    warn: console.warn,
    error: console.error,
  };
}
