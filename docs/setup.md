# Setup

## Development

Install dependencies:

```bash
bun install
```

Run app + Convex locally:

```bash
bun run dev
```

This starts a local Convex backend on `http://127.0.0.1:3210` and points the web app at it automatically.

Run only the web app:

```bash
bun run dev:web
```

Run against a hosted Convex deployment instead:

```bash
bun run dev:hosted
```

## Build / Run

```bash
bun run build
bun run start
```

## Quality checks

```bash
bun run typecheck
bun run lint
```

## Environment variables

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `AUTUMN_SECRET_KEY`
- `AUTUMN_URL` (optional)
- Convex deployment vars as needed (`CONVEX_DEPLOYMENT`, etc.)

For local development, `bun run dev` uses the Convex Vite plugin to start a local backend and inject `VITE_CONVEX_URL=http://127.0.0.1:3210`. You do not need to hardcode the local Convex URL in your env file.

For Clerk auth, set either `CLERK_JWT_ISSUER_DOMAIN` directly or `VITE_CLERK_PUBLISHABLE_KEY` so the issuer domain can be derived automatically.

Billing plans are configured in `autumn.config.ts`.

The app syncs billing state back into Convex via billing actions on page entry and after checkout/portal returns. No billing webhook endpoint is required.
