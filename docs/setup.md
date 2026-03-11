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

Run only local Convex:

```bash
bun run dev:convex
```

If `VITE_CLERK_PUBLISHABLE_KEY` is set, the local Convex prep step will derive
`CLERK_JWT_ISSUER_DOMAIN` into `.env.local` automatically for Clerk auth.

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
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- Convex deployment vars as needed (`CONVEX_DEPLOYMENT`, etc.)

For local development, `bun run dev` injects `VITE_CONVEX_URL=http://127.0.0.1:3210`, so you do not need to hardcode the local Convex URL in your env file.

Stripe webhook endpoint (for the Convex Stripe component):

- `https://<your-deployment>.convex.site/stripe/webhook`
