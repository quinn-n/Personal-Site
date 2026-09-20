---
paths:
  - ".github/**"
  - "package.json"
  - "biome.json"
  - "eslint.config.mjs"
  - "tsconfig.json"
  - "next.config.mjs"
  - ".pre-commit-config.yaml"
---

# Tooling rules

- **One concern per PR**, and **never bundled with feature or content work**. Tooling changes go through the upgrade flow, in the roadmap's order.
- **One owner per lint rule**: Biome owns formatting, import organizing, and general lint; ESLint owns the Next, `react-hooks`, `react`, `jsx-a11y`, and `typescript-eslint` rules. No orphan `biome-ignore`/`eslint-disable` — each suppression names its owner and a reason.
- **Stay on ESLint 9** (`eslint-plugin-react` crashes on ESLint 10). **Do not move to TypeScript 7** (the framework and `typescript-eslint` both block it). Check `npm view <pkg> version peerDependencies` before any bump.
- **Never add a TypeScript option deprecated in 6.0** (`baseUrl`, `moduleResolution: node`, `target: es5`, `outFile`, `esModuleInterop: false`, …) — they become errors in 7.0.
- **GitHub Actions are pinned by commit SHA** with the version in a trailing comment, workflows declare `permissions: contents: read`, and checkout runs **before** setup-node.
- **Never `nice` in CI**, and never inside `package.json` scripts or a test config — the low-priority wrapper is invocation-level and local-only.
- **Response headers live in `next.config.mjs` `headers()`** and are never duplicated in a hosting-platform config file.
- Biome 2 replaced `--apply`/`--apply-unsafe` with `--write`/`--fix`/`--unsafe`; after `biome migrate --write`, grep the result for `"preset": "none"`.
- Never hand-edit `package-lock.json` or `next-env.d.ts`; regenerate them with the tool that owns them.

Depth: `code-quality`, `typescript`, `modernization-roadmap`, `web-security`.
