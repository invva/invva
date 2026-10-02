<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Invva

Open-source inventory management app (Next.js App Router, React 19, TypeScript, MUI 9). See
[README.md](README.md) for setup. `master` is the only long-lived branch; open PRs against it.

## Commands

- `npm run dev` / `npm run build` (both use Turbopack), `npm run lint`, `npm test` (Node's built-in test runner).
- Before opening a PR: `npx tsc --noEmit && npx eslint && npm test && npm run build`. ESLint currently reports known
  `react-hooks` warnings; do not add new ones.
- If `tsc` complains about missing `.next/types/...` files after deleting or moving a route, delete `.next/types` and rerun.

## Layout

- `src/app/<route>/page.tsx`: one folder per page (dashboard, products, movements, warehouses, suppliers, reports,
  audit-logs, login).
- `src/components/`: shared UI. `src/utils/`: pure helpers with `*.util.ts` names and tests next to them (`*.test.ts`).
- `src/lib/`: data-access and other non-UI code. Keep database access out of components where practical.
- Import with the `@/` alias (maps to `src/`).

## Conventions

- Prettier style: no semicolons, double quotes, 120 columns, no trailing commas.
- Use MUI components and `sx` for styling; avoid adding new inline `style` props or another styling system.
- Add a small test for non-trivial logic (parsers, formatting, calculations). Utilities are tested with `node:test`.
- Pin or bump dependencies deliberately: `typescript` 6, `eslint` 9 and `@types/node` 22 are held back until the
  tooling around them supports newer majors.

## Data and security

- Enforce access control on the data layer, never only in the UI. Never commit credentials or admin/service keys.
- Never commit `.env*` files (only `.env.example`) or print their values.
- Stock levels and audit logs are derived by the data layer; don't write to them directly from UI code.
- Escape user-provided data in exports (see `src/utils/csv.util.ts`) and validate input at trust boundaries.
