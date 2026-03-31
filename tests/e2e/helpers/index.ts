/**
 * E2E test helpers — re-exports all helper modules for convenient imports.
 *
 * Usage:
 *   import { runCli, StdioServerProcess, startSseFixtureServer, parseJUnitXml, createTmpDir } from '../helpers/index.js';
 */

export type { CliResult, RunCliOptions } from './cli-runner.js';
export { runCli, measureStartupTime } from './cli-runner.js';

export { StdioServerProcess } from './server-manager.js';

export type { SseFixtureTool, SseFixtureOptions, SseFixtureResult } from './sse-server.js';
export { startSseFixtureServer } from './sse-server.js';

export type { ParsedJUnit, JUnitSuite, JUnitTestCase } from './xml-validator.js';
export { parseJUnitXml, assertJUnitValid, readJUnitFile } from './xml-validator.js';

export { createTmpDir } from './tmp-dir.js';
