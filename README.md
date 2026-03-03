# Unified Data Dashboard

A real-time systems intelligence dashboard built with Next.js that monitors and displays server metrics — CPU, memory, disk usage, and database connectivity — collected automatically every 30 seconds and persisted in PostgreSQL.

## Features

- **Live system metrics** — CPU usage, memory usage, free memory, disk usage, free disk space, DB connection status
- **Auto-collection** — background collector runs every 30 seconds via `src/lib/collector.ts`
- **Persistent storage** — metrics are upserted into PostgreSQL, keeping one record per source/metric pair
- **Status indicators** — color-coded thresholds (up / warning / critical) with animated dot indicators
- **Manual refresh** — sync button to pull the latest data on demand
- **Responsive layout** — 1-column on mobile, 3-column grid on desktop
- **Dark/light mode** — adapts to system preference via CSS variables

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Data fetching | TanStack React Query v5 |
| ORM | Prisma v6 |
| Database | PostgreSQL |
| Language | TypeScript 5 |
| Compiler | React Compiler (auto-memoization) |

## Prerequisites

- Node.js 18+
- PostgreSQL database
- `systeminformation` package (see below)

## Setup

**1. Install dependencies**

```bash
npm install
npm install systeminformation
```

> `systeminformation` is required by the collector but not yet listed in `package.json` — install it manually.

**2. Configure environment**

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
```

**3. Run database migrations**

```bash
npx prisma migrate dev
```

**4. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/stats/route.ts   # GET /api/stats — fetches all metrics from DB
│   ├── layout.tsx           # Root layout, metadata, fonts
│   ├── page.tsx             # Main dashboard UI
│   └── globals.css          # Tailwind base + CSS theme variables
├── components/
│   └── Providers.tsx        # React Query provider
└── lib/
    ├── collector.ts         # System metrics collector (runs on import)
    └── prisma.ts            # Prisma client singleton

prisma/
└── schema.prisma            # Metric model definition
```

## Database Schema

```prisma
model Metric {
  id           Int      @id @default(autoincrement())
  source_name  String   @db.VarChar(50)
  metric_label String   @db.VarChar(100)
  metric_value Decimal  @db.Decimal
  status       String   @db.VarChar(20)
  updated_at   DateTime @default(now()) @db.Timestamp(6)

  @@unique([source_name, metric_label])
  @@map("metrics")
}
```

Each metric is identified by a `(source_name, metric_label)` pair and upserted on every collection cycle.

## Metric Thresholds

| Metric | Warning | Critical |
|---|---|---|
| CPU Usage | > 60% | > 80% |
| Memory Usage | > 70% | > 85% |
| Free Memory | — | < 512 MB |
| Disk Usage | > 75% | > 90% |
| Free Disk | — | < 5 GB |
| DB Connection | — | — (always up) |

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```
