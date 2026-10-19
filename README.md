# Kaizen-Kanban

A personal Kanban web application for organizing tasks and developing shared-workspace workflows. It is under development toward production readiness; implemented features have not all been verified for production security or reliability.

## Features

- Four columns: To Do, In Progress, In Review, and Done.
- Task creation, editing, deletion, drag-and-drop ordering, priorities, due dates, assignees, search/filter controls, and summary statistics.
- In-memory demo when Supabase is not configured.
- Supabase persistence, anonymous guest accounts, Google sign-in, email magic links, and guest-to-account upgrades when configured.
- Personal/shared workspaces, email-addressed invitation links, member removal/leaving, and owner-controlled shared-workspace deletion.
- Task comments and workspace activity history, with layouts adapted for mobile screens.

## Origin and licensing

Akshit-Ahiwalay generated the initial basic design using Lovable, then developed the project locally. The commit identities `IcannotCode69` and `Akshit-Ahiwalay` belong to the same personal project owner. Original Git history is retained.

Original contributions by Akshit-Ahiwalay are available under the [MIT license](LICENSE). This does not claim ownership of third-party code or relicense it. Third-party libraries, shadcn/ui-derived components, and assets retain their applicable licenses. See [third-party notices and provenance](THIRD_PARTY_NOTICES.md), including review limitations.

## Stack and prerequisites

React 18, TypeScript, Vite, Tailwind CSS, Radix/shadcn UI components, dnd-kit, Framer Motion, and Supabase. Tests use Vitest, jsdom, and Testing Library.

- Git, Node.js, and npm. Preparation checks use Node 24.18.1 and npm 11.4.1; no repository-wide runtime version is pinned yet. The installed Supabase SDK requires Node >=20.
- These instructions use `package-lock.json`. Legacy `bun.lock` and `bun.lockb` also exist; package-manager consolidation is proposed.
- A separate development Supabase environment is needed only for persisted/authenticated workflows. Local Supabase also requires its CLI and Docker; a complete local bootstrap is not yet provided.

## Install and run the demo

```sh
git clone https://github.com/Akshit-Ahiwalay/Kaizen-Kanban.git
cd Kaizen-Kanban
npm ci
npm run dev
```

Open the URL printed by Vite (configured port: 8080). Commands use your checked-out branch. Workspace/comment features described here are on `Patch-for-mobile`; at the October 19, 2026 remote check, `main` is 11 commits behind it. No default-branch change has been made.

With both Supabase values absent or empty, the app uses an in-memory demo and changes are lost on reload. Existing local environment files can enable persistence; inspect your own configuration before launching. Google Fonts and external avatars may make network requests when running the browser.

## Environment configuration

[.env.example](.env.example) contains empty placeholders only. In a fresh checkout, copy it to `.env.local` without overwriting existing local configuration. Set these values only when intentionally using a development backend:

| Variable | Meaning |
| --- | --- |
| `VITE_SUPABASE_URL` | Local or isolated development Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Browser-safe publishable/anon client key for that project. |

Leave both empty for the demo. `VITE_*` values enter browser code: never use a service-role key, database password, or OAuth client secret. Environment files are ignored except the placeholder example. Restart Vite after configuration changes.

## Supabase setup and missing bootstrap

**A fresh database cannot currently be reproduced from this repository alone.** The first migration, `20260406_add_task_sort_order.sql`, alters an existing `public.tasks` table. No tracked migration creates its base table, constraints, types, or baseline policies. There is no tracked `supabase/config.toml`. Generated TypeScript types are not a substitute for database DDL.

Before enabling persistence in a clean development environment:

1. Reconstruct and review a schema-only baseline for `public.tasks` and its dependencies. Do not export rows, auth users, secrets, or production data into the repository. Compare the baseline with application types and later migrations; do not guess missing constraints.
2. Establish local Supabase configuration and synthetic seeds. Apply the reviewed baseline, then existing migrations in filename order to an isolated development database. Confirm extensions, including `pgcrypto` functions referenced through the `extensions` schema. Migration filenames do not prove deployed migration state.
3. Verify row-level security and RPC grants for profiles, tasks, team members, workspaces, invitations, comments, and activity. Review the invitation reuse/removal issue in [ROADMAP.md](ROADMAP.md).
4. Enable anonymous sign-in for guest persistence. Configure email authentication and development mail delivery for magic links. Configure the Google provider/callback for Google sign-in; guest Google upgrades also need manual identity linking. Keep provider secrets in backend settings.
5. Set the development Site URL and allowed redirects to the local app origin/path (normally `http://localhost:8080/`). The app derives redirects from the browser origin/path. Test callbacks, errors, expiry, and guest upgrades with synthetic identities.
6. Set the two client environment values and restart Vite. Validate against the isolated backend before production rollout.

These are setup requirements, not a claim that a fresh-database install or live authentication has passed. Preparation did not inspect or modify cloud data.

## Local checks

```sh
npm run build
npx --no-install tsc --noEmit -p tsconfig.app.json
npx --no-install tsc --noEmit -p tsconfig.node.json
npm run lint
npm run test
```

Vite build does not typecheck TypeScript. The explicit typechecks cover application code and the Vite config, not every root tooling file. Standard Vite/Vitest commands can load local environment files. For backend-free verification, disable environment-file loading and override both Supabase values to empty strings; do not run tests against production credentials.

Existing tests cover board helpers, UI interactions, account controls, and auth helpers. They do not establish database isolation, real OAuth delivery, or end-to-end invitation safety. The Playwright config/fixture imports the undeclared `lovable-agent-playwright-config` package; browser-test setup needs repair.

### Preparation check results (October 19, 2026)

Checks used existing installed dependencies; no fresh install was performed. Build and tests used the Vite/Vitest Node APIs with `envDir: false` and both Supabase values overridden to empty strings in the process and Vite defines. Tests also received empty values through the Vitest `env` option. This disables the Supabase client without reading private environment files. The build used `build.write: false`, so it generated the bundle in memory without overwriting existing build output.

| Check | Result |
| --- | --- |
| Production Vite bundle generation | Passed; Browserslist reported outdated browser data. No output files were written. |
| Application typecheck | Passed after correcting the client schema contract, component types, and absent-column test fixture. |
| Vite-config typecheck | Passed. |
| ESLint | Passed with 0 errors and 7 existing Fast Refresh warnings. |
| Existing Vitest suite | Passed: all 35 tests across 7 files. The statistics test fixes the clock and restores real timers, preserving its expected counts. |

The follow-up corrected type/lint failures and made the statistics test deterministic without changing task or authorization behavior. No database tests, live OAuth, production calls, cloud-data changes, or browser/mobile checks were performed.

## Data handling and next steps

Owner-confirmed usage: "I checked the backend and am the only person who has logged in." The owner also states: "Invitations and stored content contain only my own information or fictional data." Both are owner statements, not independently audited facts; no backend inspection was performed during this preparation.

Configured mode can store user IDs, emails, display names, avatar URLs, invitation addresses, team names, task content, comments, and user-linked activity. Workspace members can view fellow members' profile information through the member-list RPC. Guests can receive anonymous backend accounts. Auth sessions persist in the browser; pending upgrade/invitation state uses session storage and the active workspace uses local storage.

Production readiness needs retention/deletion decisions, access-control regressions, and database reproducibility. The [roadmap](ROADMAP.md) records the owner's confirmed intention to complete the selected 22 estimated hours. This is an owner statement, not independently audited hours or submission eligibility.

See [submission preparation](SUBMISSION_PREPARATION.md) for draft form answers, the owner-confirmed task selection, remaining decisions, and publishing instructions that have not been executed.
