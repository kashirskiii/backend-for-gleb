# analysis-api

NestJS + Prisma + PostgreSQL + pgAdmin, fully containerised with Docker.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| DB Admin | pgAdmin 4 |
| Runtime | Node 20 Alpine |

## Quick start

```bash
# 1. Copy env and adjust if needed
cp .env.example .env

# 2. Build and start all services
docker compose up -d --build

# 3. Check that everything is running
docker compose ps
```

## Services

| Service | URL / port |
|---------|-----------|
| NestJS API | http://localhost:3000/api |
| Health check | http://localhost:3000/api/health |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | localhost:5432 |

### pgAdmin login
- **Email:** admin@admin.com  
- **Password:** admin  
- The `analysis-postgres` server is pre-registered — no manual setup needed.

## Prisma commands

Run against the **running** container:

```bash
# Generate Prisma Client after schema changes
docker compose exec app npx prisma generate

# Create and apply a new migration (dev)
docker compose exec app npx prisma migrate dev --name <migration-name>

# Apply pending migrations (production / CI)
docker compose exec app npx prisma migrate deploy

# Open Prisma Studio (browser-based data explorer)
docker compose exec app npx prisma studio --browser none
# then open http://localhost:5555

# Reset DB and re-run all migrations (dev only)
docker compose exec app npx prisma migrate reset
```

Or use the Makefile shortcuts:

```bash
make up-build          # build + start
make prisma-generate   # generate client
make prisma-migrate    # create dev migration
make prisma-studio     # open studio
make logs              # tail app logs
make down              # stop containers
make down-volumes      # stop + delete volumes
```

## Local development (without Docker)

Requires a local PostgreSQL instance. Update `DATABASE_URL` in `.env` to point at `localhost`.

```bash
npm install
npm run start:dev
```

## Project structure

```
.
├── src/
│   ├── main.ts                  # bootstrap
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── prisma/
│       ├── prisma.module.ts     # global Prisma module
│       └── prisma.service.ts    # PrismaClient wrapper
├── prisma/
│   └── schema.prisma            # data model
├── pgadmin/
│   └── servers.json             # auto-registered pgAdmin server
├── Dockerfile                   # multi-stage build
├── docker-compose.yml
├── .env.example
└── Makefile
```
# backend-for-gleb
