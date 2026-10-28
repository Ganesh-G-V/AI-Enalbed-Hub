# Run Guide — AI Enablement Hub

## Prerequisites
- Node.js 20+
- PostgreSQL running on port 5433, database `ai_hub`, trust auth (user `ganeshgv`)
- `.env` configured in `gana/`

## First-time setup
```bash
cd gana
npm install
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
```

## Run the app
```bash
cd gana
npm run dev
```
App at http://localhost:3000

## After system restart
1. Start PostgreSQL (port 5433):
   - If using Homebrew: `brew services start postgresql@15` (or postgresql@18)
   - Or manually: `/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /opt/homebrew/var/postgresql@15 -l /tmp/pg.log -o "-p 5433" start`
   - Verify: `psql -p 5433 -U ganeshgv -d ai_hub -c "select 1"`
2. `cd gana && npm run dev`
No other services required. Prisma client is already generated; re-run `npx prisma generate` only after schema changes.

## Optional
- Set `OPENAI_API_KEY` in `.env` to enable live model sync.
- Tests: `npm test`, build: `npm run build`.
