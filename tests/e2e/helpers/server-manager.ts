import { type ChildProcess, spawn } from 'node:child_process';

/**
 * Manages the lifecycle of a stdio MCP server process for E2E tests.
 * Wraps a child process and provides start/stop semantics.
 */
export class StdioServerProcess {
  private process: ChildProcess | null = null;

  /**
   * Starts the fixture server by spawning the given command.
   * Waits 200ms after spawn to allow the server to initialise.
   *
   * @param command - Executable to run (e.g. "node")
   * @param args - Arguments to pass to the command
   * @param options - Optional timeout and extra environment variables
   */
  async start(
    command: string,
    args: string[] = [],
    options: { timeoutMs?: number; env?: Record<string, string> } = {},
  ): Promise<void> {
    const { env } = options;

    this.process = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Give the server a moment to initialise before returning
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
  }

  /**
   * Stops the server by sending SIGTERM and waiting for the process to exit.
   * No-ops if the server is not running.
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    const proc = this.process;
    this.process = null;

    await new Promise<void>((resolve) => {
      proc.on('close', () => resolve());
      proc.kill('SIGTERM');
    });
  }

  /**
   * Returns true if the server process is currently running.
   */
  get isRunning(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }
}
