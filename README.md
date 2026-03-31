# mcptest

[![npm version](https://badge.fury.io/js/mcptest.svg)](https://badge.fury.io/js/mcptest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zero-config test runner for MCP (Model Context Protocol) servers**

---

## Features

- **Zero configuration** — auto-detects your MCP server from `package.json` or `mcptest.config.ts`
- **Protocol compliance testing** — validates conformance to MCP spec 2025-06-18
- **Schema validation** — checks `inputSchema` of every tool against JSON Schema
- **JUnit XML output** — drop-in CI/CD integration with `--reporter junit`
- **SSE transport support** — test servers over stdio or Server-Sent Events
- **Fast startup** — cold start under 500ms

---

## Installation

```bash
# Global install
npm install -g mcptest

# Or use directly with npx
npx mcptest run
```

---

## Quick Start

**Step 1: Install mcptest in your MCP server project**

```bash
cd my-mcp-server
npm install --save-dev mcptest
```

**Step 2: Run mcptest**

```bash
npx mcptest run
```

**Step 3: mcptest auto-detects your server and runs tests**

mcptest reads your `package.json` to find the server entry point, connects via stdio, and automatically generates and runs protocol compliance tests for every tool your server exposes.

```
mcptest v0.1.0
Auto-detected server: node dist/index.js (stdio)

  initialize            PASS
  tools/list            PASS
  tools/call: add       PASS
  tools/call: subtract  PASS
  Schema: add           PASS
  Schema: subtract      PASS

  6 passed  0 failed  (312ms)
```

**Step 4: Fix any FAIL results**

Each failure includes a clear message explaining what went wrong and how to fix it:

```
  tools/call: divide    FAIL
  Error: Tool response missing required field "content"
  Expected: { content: [...] }
  Received: { result: 0 }
```

**Step 5: Integrate with CI/CD**

Add JUnit XML output for test result tracking in your pipeline:

```bash
npx mcptest run --reporter junit --output test-results.xml
```

---

## Commands

### `mcptest run [options]`

Run protocol compliance and schema tests against your MCP server.

| Option | Default | Description |
|--------|---------|-------------|
| `--server <cmd>` | auto-detect | Server launch command (e.g. `node dist/index.js`) |
| `--transport <type>` | `stdio` | Transport type: `stdio` or `sse` |
| `--url <url>` | — | SSE server URL (required when `--transport sse`) |
| `--timeout <ms>` | `30000` | Per-test timeout in milliseconds |
| `--reporter <type>` | `default` | Output format: `default` or `junit` |
| `--output <file>` | — | Write report to file (requires `--reporter junit`) |
| `--mode <mode>` | `conservative` | Test generation mode: `conservative` or `strict` |

### `mcptest validate [target] [options]`

Validate tool `inputSchema` definitions without running a live server.

| Option | Default | Description |
|--------|---------|-------------|
| `[target]` | `.` | Path to MCP server source or built file |
| `--strict` | `false` | Fail on warnings as well as errors |

### `mcptest init [options]`

Initialize a `mcptest.config.ts` configuration file in the current directory.

| Option | Default | Description |
|--------|---------|-------------|
| `--transport <type>` | `stdio` | Pre-fill transport type in generated config |

---

## Configuration

Create `mcptest.config.ts` in your project root to override defaults:

```typescript
import type { McptestConfig } from 'mcptest';

export default {
  server: 'node dist/index.js',
  transport: 'stdio',
  timeout: 30000,
  mode: 'conservative',
} satisfies Partial<McptestConfig>;
```

Configuration file is optional — mcptest works without one by auto-detecting your server.

---

## CI/CD Integration

### GitHub Actions

```yaml
name: MCP Protocol Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx mcptest run --reporter junit --output test-results.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results.xml
```

The JUnit XML output is compatible with GitHub Actions test reporting, Jenkins, GitLab CI, and most other CI systems.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
