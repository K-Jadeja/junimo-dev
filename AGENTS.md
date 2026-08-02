# Agent instructions

## Laptop-safe validation

This is a personal portfolio, not a production application. Do not run heavy or memory-intensive builds on the developer's laptop. In particular, do not run `next build`, parallelized build/typecheck/lint commands, or other full production compilation workflows unless the user explicitly asks for one and confirms the machine can handle it.

Prefer lightweight validation:

- run the direct local TypeScript check with `node_modules\\.bin\\tsc.cmd --noEmit --pretty false`;
- run the direct ESLint binary with `node_modules\\.bin\\eslint.cmd .`;
- use focused Playwright browser checks and screenshots against the local dev server;
- report any skipped heavy validation clearly instead of trying it speculatively.

Keep local server and browser work scoped to this repository, and avoid launching duplicate servers or parallel Node workers when the machine is under memory pressure.
