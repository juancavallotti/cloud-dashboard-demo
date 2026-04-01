# Cloud Dashboards Demo

pnpm monorepo (Turborepo) with a Next.js dashboard, PostgreSQL persistence, a Pub/Sub consumer, and scheduled-style HTTP jobs. See [docs/architecture.md](docs/architecture.md) for the full picture.

## Prerequisites

- **Node.js** 20 or newer ([`.nvmrc`](.nvmrc))
- **pnpm** 9 (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`, or install pnpm globally)

Optional, depending on what you run:

- **PostgreSQL** and a `DATABASE_URL` when using migrations, jobs, or the Pub/Sub consumer’s DB path
- **Google Cloud** credentials (ADC) and a Pub/Sub subscription name for `pubsub-consumer`

## Install

From the repository root:

```bash
pnpm install
```

Build everything (optional sanity check):

```bash
pnpm build
```

## Run locally

### Dashboard (Next.js)

Most day-to-day UI work only needs the dashboard:

```bash
pnpm --filter dashboard dev
```

Open [http://localhost:3000](http://localhost:3000) (default Next.js port).

### All dev processes (Turborepo)

To start **every** package that defines a `dev` script (dashboard, Pub/Sub consumer, jobs, and package watchers where present):

```bash
pnpm dev
```

This runs multiple long-running processes in parallel. Prefer filtering (below) if you only need one app.

### Run a single app by name

| App | Command |
|-----|---------|
| Dashboard | `pnpm --filter dashboard dev` |
| Pub/Sub consumer | `pnpm --filter pubsub-consumer dev` |
| Retention job (HTTP) | `pnpm --filter job-retention dev` |
| Daily metrics job (HTTP) | `pnpm --filter job-daily-metrics dev` |

After `pnpm build`, you can also run production builds with `pnpm --filter <name> start` where the app defines `start`.

### Database migrations

With PostgreSQL available, set `DATABASE_URL` and apply SQL migrations:

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/yourdb"
pnpm db:migrate
```

### Environment variables (quick reference)

| Variable | When needed |
|----------|-------------|
| `DATABASE_URL` | Migrations; jobs; consumer when inserting rows |
| `PUBSUB_SUBSCRIPTION` | `pubsub-consumer` (full subscription resource name) |
| `JOB_SECRET` | Optional auth for `POST /run` on job apps |
| `RETENTION_DAYS` | `job-retention` (default: `90`) |
| `PORT` | Job servers (defaults differ per app; see [docs/architecture.md](docs/architecture.md)) |

## Other commands

```bash
pnpm lint      # ESLint via Turborepo
pnpm build     # Production build of all packages
```
