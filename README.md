# Kinetic CRM

Fullstack CRM built with NestJS (backend) + React (frontend) + MySQL 8.

## Prerequisites

- Node.js >= 18
- MySQL 8
- Docker (optional, for MySQL container)
- npm

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> kinetic-crm
cd kinetic-crm

# Install frontend deps
npm install

# Install backend deps
cd backend && npm install && cd ..
```

### 2. Setup Database

**Option A — Docker (recommended):**

```bash
docker compose up -d mysql
```

**Option B — Manual:** Create a MySQL database named `kinetic_crm`.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and adjust at minimum:

| Variable        | Description            | Default            |
| --------------- | ---------------------- | ------------------ |
| `DB_DATABASE`   | Database name          | `kinetic_crm`      |
| `DB_USERNAME`   | Database user          | `kinetic_user`     |
| `DB_PASSWORD`   | Database password      | `secret`           |
| `JWT_SECRET`    | JWT signing secret     | (change this!)     |
| `DATABASE_URL`  | Prisma connection URL  | *(see below)*      |

Add `DATABASE_URL` to `.env` for Prisma:

```
DATABASE_URL="mysql://kinetic_user:secret@localhost:3306/kinetic_crm"
```

### 4. Run Migrations & Seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers

**Backend** (terminal 1 — http://localhost:4000):

```bash
cd backend && npm run start:dev
```

**Frontend** (terminal 2 — http://localhost:3000):

```bash
npm run dev
```

### 6. Login

Default credentials after seeding:

| Username    | Password | Role         |
| ----------- | -------- | ------------ |
| superadmin  | admin123 | Super Admin  |
| admin       | admin123 | Admin        |

## Available Scripts

### Root (`package.json`)

| Script     | Description                        |
| ---------- | ---------------------------------- |
| `npm run dev` | Start Vite frontend on port 3000 |
| `npm run build` | Type-check + build frontend    |
| `npm run lint`  | TypeScript type-checking       |

### Backend (`backend/package.json`)

| Script               | Description                |
| -------------------- | -------------------------- |
| `npm run start:dev`  | Watch mode on port 4000    |
| `npm run build`      | Build NestJS backend       |
| `npm run start:prod` | Run built backend          |

### Prisma

| Command                    | Description            |
| -------------------------- | ---------------------- |
| `npx prisma migrate dev`   | Run pending migrations |
| `npx prisma db seed`       | Seed database          |
| `npx prisma studio`        | Open DB browser        |

## E2E Tests

```bash
npx playwright test
```

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Zustand, React Router 7, Zod
- **Backend:** NestJS 10, Prisma 5, MySQL 8, JWT, Passport
- **Test:** Playwright
