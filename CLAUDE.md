@AGENTS.md

# Profyle

Portfolio builder: structured sections, draft → push publishing, public pages at `{handle}.profyle.io`. Single Next.js 16 app (App Router), no separate backend.

## Commands

- `pnpm services:up` / `pnpm services:down`: Postgres (host port **5433**), RustFS S3 (:9000, console :9001), Mailpit (SMTP :1025, UI :8025)
- `pnpm db:generate` → commit the SQL in `drizzle/`; `pnpm db:migrate`; `pnpm db:seed` (demo user `demo@profyle.local`, handle `demo`)
- `pnpm auth:generate`: regenerate Better Auth tables from `better-auth.cli.ts` (keep its plugins in sync with `src/server/auth.ts`)
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (unit + integration), `pnpm test:e2e`

Never create or edit `.env`. Add new vars to `.env.example` and tell the user what to add.

## Layout and rules

- `src/server/**`: imports `"server-only"`. Business logic lives only in `src/server/services`. Every service takes the session user ID and scopes every query to that user's profile.
- `src/actions/*.ts`: `"use server"`, thin: Zod parse → `requireUser()` → service → `updateTag("site:" + handle)`.
- Route Handlers only for auth, the handle check, and presigned uploads.
- `src/lib/schemas`: Zod schemas shared by forms and actions. The draft is always valid.
- `src/themes`: pure components (no hooks, no `"use client"`), shared by the editor preview and the public page.
- Public pages read only `profile_version.snapshot` via `live_version_id`, and only when `is_live`.
- User content is plain text, never HTML or markdown. URLs are http(s) only (`mailto:` for email links).
- TypeScript strict, no `any`.

## Design (spec §3)

Inter; type scale 12/14/16/20/24/32 → `text-xs/sm/base/xl/2xl/3xl` only. Neutral grays plus one accent: `primary` (primary action) and `link` (links) only. `destructive` = red, `success` = green. Never color alone. Dark mode follows the system (`dark:` is a media query). Motion: 150ms color/opacity transitions only (`transition-colors`/`transition-opacity`); nothing under reduced motion.

## Tests

- Unit: `src/**/*.test.ts`. Integration: `tests/integration/**` against the `profyle_test` DB (truncated before each test). E2E: `tests/e2e/**`.
- Decisions on anything the spec leaves open go in `docs/DECISIONS.md`.
