# Kinetic CRM

Fullstack CRM built with **NestJS** (backend) + **React 19** (frontend) + **MySQL 8**.

## Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (required for MySQL, Redis, and the app containers)
- Node.js >= 18 (only needed to run Prisma migrations/seeds from host)

## Project Structure

```
├── backend/          # NestJS API (port 4000)
├── docker/           # Docker Compose files & config
│   ├── docker-compose.yml
│   ├── docker-compose.override.yml  # Development overrides
│   ├── nginx/        # Nginx config (SSL, reverse proxy)
│   └── mysql/        # MySQL config & init scripts
├── frontend/         # React + Vite (port 3000)
├── prisma/           # Prisma schema, migrations & seed
├── e2e/              # Playwright E2E tests
├── .env              # Environment variables
└── package.json      # Frontend (Vite + React) + Prisma scripts
```

## Quick Start (Docker)

### 1. Start all containers

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker/.env up -d --build
```

This starts:
| Service     | Container name     | Port            |
| ----------- | ------------------ | --------------- |
| Frontend    | `kinetic_frontend` | `:3000`         |
| Backend     | `kinetic_backend`  | `:4000`         |
| MySQL       | `kinetic_mysql`    | `:3306`         |
| Redis       | `kinetic_redis`    | `:6379`         |
| Nginx       | `kinetic_nginx`    | `:80`, `:443`   |

> The `.env` file must exist in the `docker/` directory. Copy it from the root:
> ```bash
> copy .env docker\.env
> ```

### 2. Run database migration & seed

```bash
$env:DATABASE_URL="mysql://kinetic_user:secret@localhost:3306/kinetic_crm"
npx prisma migrate deploy
npx prisma db seed
```

> If the user `kinetic_user` doesn't exist (first run), create it:
> ```bash
> docker exec kinetic_mysql mysql -uroot -prootpass -e "CREATE USER IF NOT EXISTS 'kinetic_user'@'%' IDENTIFIED BY 'secret'; GRANT ALL PRIVILEGES ON *.* TO 'kinetic_user'@'%'; FLUSH PRIVILEGES;"
> ```

### 3. Restart backend (so it picks up the new schema)

```bash
docker restart kinetic_backend
```

Wait ~30 seconds for NestJS to compile.

### 4. Access & Login

Open **http://localhost:3000**

| Username    | Password  | Role           |
| ----------- | --------- | -------------- |
| superadmin  | admin123  | Super Admin    |
| bambang     | admin123  | PM             |
| rina        | admin123  | Branch Manager |
| deni        | staff123  | Staff (Finance) |
| siti        | staff123  | Staff (Procurement) |
| ahmad       | staff123  | Staff (PM)     |

## Useful Commands

```bash
# View container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View backend logs
docker logs kinetic_backend --tail 20

# Restart a service (e.g. after code changes)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env restart backend

# Rebuild and restart a service
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env up -d --build backend

# Stop all containers
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down

# Stop all and remove volumes (wipes database)
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml --env-file docker\.env down -v

# Access MySQL inside container
docker exec -it kinetic_mysql mysql -ukinetic_user -psecret kinetic_crm

# Connect via DBeaver
# Host: localhost | Port: 3306 | Database: kinetic_crm | User: kinetic_user | Password: secret
```

## Environment Variables

Key variables in `.env`:

| Variable          | Description         | Default        |
| ----------------- | ------------------- | -------------- |
| `DB_DATABASE`     | Database name       | `kinetic_crm`  |
| `DB_USERNAME`     | Database user       | `kinetic_user` |
| `DB_PASSWORD`     | Database password   | `secret`       |
| `REDIS_PASSWORD`  | Redis password      | `redispass`    |
| `JWT_SECRET`      | JWT signing secret  | *(change me)*  |
| `GEMINI_API_KEY`  | Google Gemini API   | *(optional)*   |

## Common Issues

### Backend keeps restarting / unhealthy
Wait ~30-60 seconds for NestJS to compile. Check logs with `docker logs kinetic_backend`.

### ERR_CONNECTION_REFUSED on login
Backend is still compiling. Wait and refresh.

### `Answers` column missing in RKS table
Run the SQL fix:
```bash
docker exec kinetic_mysql mysql -uroot -prootpass kinetic_crm -e "ALTER TABLE rks ADD COLUMN answers JSON NULL AFTER additional_notes;"
```

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Zustand, React Router 7, Zod, TanStack Query
- **Backend:** NestJS 10, Prisma 5, MySQL 8, JWT, Passport, class-validator
- **Infra:** Docker, Nginx (SSL reverse proxy)
- **Test:** Playwright
