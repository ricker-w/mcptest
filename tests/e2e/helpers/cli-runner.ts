import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const CLI_PATH = resolve(process.cwd(), 'dist/cli/index.js');

/** Result of a CLI invocation */
export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/** Options for running the CLI */
export interface RunCliOptions {
  /** Working directory for the CLI process */
  cwd?: string;
  /** Additional environment variables (merged with process.env) */
  env?: Record<string, string>;
  /** Timeout in milliseconds before the process is killed (default: 30000) */
  timeoutMs?: number;
}

/**
 * Runs the mcptest CLI as a child process and returns the result.
 * Launches the built dist/cli/index.js with Node.js.
 */
export async function runCli(args: string[], options: RunCliOptions = {}): Promise<CliResult> {
  const { cwd, env, timeoutMs = 30000 } = options;

  return new Promise((resolve_fn, reject) => {
    const startTime = Date.now();

    const child = spawn('node', [CLI_PATH, ...args], {
      cwd,
      env: { ...process.env, ...env },
      timeout: timeoutMs,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      resolve_fn({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        durationMs,
      });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Measures the startup time of the mcptest CLI by running --version.
 * Returns the duration in milliseconds.
 */
export async function measureStartupTime(): Promise<number> {
  const result = await runCli(['--version']);
  return result.durationMs;
}
