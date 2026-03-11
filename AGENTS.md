## Agent info

Generally speaking, you should browse the codebase to figure out what is going on.

We have a few "philosophies" I want to make sure we honor throughout development:

### 1. Performance above all else

When in doubt, do the thing that makes the app feel the fastest to use.

This includes things like

- Optimistic updates
- Using the custom data loader patterns and custom link components with prewarm on hover
- Avoiding waterfalls in anything from js to file fetching

### 2. Good defaults

Users should expect things to behave well by default. Less config is best.

### 3. Convenience

We should not compromise on simplicity and good ux. We want to be pleasant to use with as little friction as possible. This means things like:

- All links are "share" links by default
- Getting from homepage to latest video should always be fewer than 4 clicks
- Minimize blocking states to let users get into app asap

### 4. Security

We want to make things convenient, but we don't want to be insecure. Be thoughtful about how things are implemented. Check team status and user status before committing changes. Be VERY thoughtful about endpoints exposed "publicly". Use auth and auth checks where they make sense to.

## Cursor Cloud specific instructions

### Stack overview
- **Runtime/package manager**: Bun (v1.3.6, lockfile: `bun.lock`). Always use `bun` instead of npm/pnpm/yarn.
- **Frontend**: React 19 + TanStack Router + TanStack Start (SPA mode) + Vite 7 + Tailwind CSS 4
- **Backend**: Convex (serverless — database, functions, real-time). The `convex/` directory holds all backend code.
- **Auth**: Clerk (via `@clerk/tanstack-react-start`)
- **Video**: Mux (upload, transcode, playback) + Railway S3-compatible object storage
- **Billing**: Autumn (`autumn-js` / `atmn`)

### Running locally
- `bun run dev` starts Vite on port 5296 **and** a local Convex backend on port 3210 (via `convex-vite-plugin`). This is the primary dev command.
- `bun run dev:web` starts only the Vite frontend (no local Convex).
- `bun run dev:hosted` points the frontend at a hosted Convex deployment.
- The `USE_LOCAL_CONVEX=true` env var (set automatically by the `dev` script) triggers the local Convex backend. The vite config will throw if `AUTUMN_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY` (or `CLERK_JWT_ISSUER_DOMAIN`) are missing when this mode is active.

### Quality checks
- Lint: `bun run lint` (ESLint)
- Typecheck: `bun run typecheck` (TypeScript) and `bun run typecheck:convex` (Convex-specific)
- Full check: `bun run check` runs lint + both typechecks

### Environment variables
All required secrets (Clerk, Mux, Railway, Autumn, Convex) must be present as environment variables. See `.env.example` for the full list. In Cloud Agent environments, these are injected automatically via Cursor Secrets.

### Gotchas
- The local Convex backend binary is downloaded on first run and cached at `~/.convex-local-backend/`. If it fails to start, check that port 3210 is free.
- `bun run build` (production build) does NOT start a local Convex backend — it expects `VITE_CONVEX_URL` to point at a hosted Convex deployment.
- Clerk auth requires OAuth (GitHub/Google) — there are no email/password forms in development mode. Testing authenticated flows requires a real Clerk account login via the Desktop pane.
