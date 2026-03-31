import type { McptestConfig } from 'mcptest';

export default {
  server: 'node dist/index.js',
  transport: 'stdio',
  timeout: 30000,
  mode: 'conservative',
} satisfies Partial<McptestConfig>;
