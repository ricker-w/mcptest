# Contributing to mcptest

Thank you for your interest in contributing to mcptest!

---

## Developer Certificate of Origin (DCO)

By contributing to this project, you agree to the [Developer Certificate of Origin v1.1](https://developercertificate.org/). Every commit must include a `Signed-off-by` trailer.

### How to sign off your commits

Add `-s` (or `--signoff`) to your `git commit` command:

```bash
git commit -s -m "feat(core): add schema validation for tool inputSchema"
```

This appends the following line to your commit message automatically:

```
Signed-off-by: Your Name <your.email@example.com>
```

Git reads your name and email from your global config. To verify your config:

```bash
git config --global user.name
git config --global user.email
```

Commits without a valid `Signed-off-by` will not be merged.

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/<org>/mcptest.git
cd mcptest

# Install dependencies (requires pnpm >= 9 and Node.js >= 20)
pnpm install

# Build
pnpm build

# Run all tests
pnpm test
```

---

## Testing

mcptest uses [Vitest](https://vitest.dev/) as the test runner.

```bash
pnpm test:unit        # Unit tests (tests/unit/)
pnpm test:integration # Integration tests against fixture MCP servers (tests/integration/)
pnpm test:e2e         # End-to-end CLI tests (tests/e2e/)
pnpm test:coverage    # All tests with coverage report
```

Run the full quality gate before opening a PR:

```bash
pnpm lint       # Biome lint + format check
pnpm typecheck  # TypeScript type check
pnpm test:unit
pnpm test:integration
pnpm build
```

---

## PR Flow

```
feat/* branch → develop → main
```

1. Branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/my-feature
   ```

2. Make your changes following [TDD practices](.claude/rules/tdd-practices.md) — write tests first.

3. Pass the full quality gate (see above).

4. Push and open a PR targeting `develop`:
   ```bash
   git push -u origin feat/my-feature
   gh pr create --base develop --title "feat: ..." --body "..."
   ```

5. After all checks pass, the PR will be merged into `develop`.

6. Releases are cut from `develop` → `main` by maintainers.

---

## Code Style

- **Formatter/Linter**: [Biome](https://biomejs.dev/) — run `pnpm lint:fix` to auto-fix
- **TypeScript**: ESM only (`import`/`export`). No `require()`.
- **No `any`**: Use precise types. `any` triggers a warning from Biome.
- Follow the function and naming conventions in `.claude/rules/coding-style.md`.

---

## Reporting Issues

Please open a GitHub issue with:

1. mcptest version (`mcptest --version`)
2. Node.js version (`node --version`)
3. MCP server command and transport type
4. Full error output

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
