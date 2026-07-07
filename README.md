# Kinetic CRM

Fullstack CRM built with **NestJS** (backend) + **React** (frontend) + **MySQL 8**.

## Prerequisites

- Node.js >= 18
- npm
- Docker (recommended for MySQL + Redis)
- MySQL 8 (manual setup)

## Project Structure

```
├── backend/          # NestJS API (port 4000)
├── docker/           # Docker Compose files
├── frontend/         # Frontend container build (Dockerfile)
├── prisma/           # Prisma schema & migrations (root)
├── e2e/              # Playwright E2E tests
├── .env.example      # Environment template
└── package.json      # Frontend (Vite + React) + Prisma scripts
```

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> kinetic-crm
cd kinetic-crm

# Install frontend & Prisma deps (root)
npm install

# Install backend deps
cd backend && npm install && cd ..
```

### 2. Setup Database & Redis

**Option A — Docker (recommended):**

```bash
docker compose -f docker/docker-compose.yml up -d mysql redis
```

> Compose file is inside the `docker/` directory.

**Option B — Manual:**
- Create a MySQL database named `kinetic_crm`
- Ensure Redis is running on `localhost:6379`

### 3. Configure Environment

```bash
cp .env.example .env
```

Then edit `.env`. Key variables to adjust:

| Variable          | Description            | Default                              |
| ----------------- | ---------------------- | ------------------------------------ |
| `DB_DATABASE`     | Database name          | `kinetic_crm`                        |
| `DB_USERNAME`     | Database user          | `kinetic_user`                       |
| `DB_PASSWORD`     | Database password      | `secret`                             |
| `JWT_SECRET`      | JWT signing secret     | *(change this!)*                     |
| `REDIS_PASSWORD`  | Redis password         | `redispass`                          |
| `DATABASE_URL`    | Prisma connection URL  | *auto from DB_ vars in Docker only*  |

For local (non-Docker) development, add this line to `.env`:

```
DATABASE_URL="mysql://kinetic_user:secret@localhost:3306/kinetic_crm"
```

> For Docker-based local dev, you can use `.env.local` (auto-loaded by Compose):
> ```bash
> cp .env.local.example .env.local
> ```

### 4. Run Migrations & Seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers

**Backend** (terminal 1):

```bash
cd backend && npm run start:dev
```

Runs on **http://localhost:4000**.

**Frontend** (terminal 2):

```bash
npm run dev
```

Runs on **http://localhost:3000**.

### 6. Login

Default credentials after seeding:

| Username    | Password | Role         |
| ----------- | -------- | ------------ |
| superadmin  | admin123 | Super Admin  |
| admin       | admin123 | Admin        |

## Docker (Full Stack)

Run all services (Nginx, Frontend, Backend, MySQL, Redis, Scheduler):

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Available Scripts

### Root (`package.json`)

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite frontend on port 3000     |
| `npm run build`   | Type-check + build frontend          |
| `npm run lint`    | TypeScript type-checking             |
| `npm run preview` | Preview Vite production build        |
| `npm run clean`   | Remove dist directory                |

### Backend (`backend/package.json`)

| Script               | Description                    |
| -------------------- | ------------------------------ |
| `npm run start:dev`  | Watch mode on port 4000        |
| `npm run build`      | Build NestJS backend           |
| `npm run start:prod` | Run built backend              |
| `npm run lint`       | Backend TypeScript check       |
| `npm run format`     | Format code with Prettier      |

### Prisma

| Command                    | Description                     |
| -------------------------- | ------------------------------- |
| `npx prisma migrate dev`   | Run pending migrations          |
| `npx prisma db seed`       | Seed database                   |
| `npx prisma studio`        | Open Prisma Studio DB browser   |

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Zustand, React Router 7, Zod, TanStack Query
- **Backend:** NestJS 10, Prisma 5, MySQL 8, Redis, JWT, Passport, class-validator
- **Infra:** Docker, Nginx
- **Test:** Playwright
