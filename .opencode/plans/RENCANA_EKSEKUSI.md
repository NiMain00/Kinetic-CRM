# RENCANA EKSEKUSI — Kinetic CRM Restrukturisasi

> **Backend:** TypeScript + Node.js + Prisma
> **Frontend:** React + Vite (existing)
> **Database:** MySQL 8.0
> **AI:** Gemini via `@google/genai` (server-to-server)

---

## DAFTAR ISI

- [Phase 1: Root Setup](#phase-1-root-setup)
- [Phase 2: Frontend Restrukturisasi](#phase-2-frontend-restrukturisasi)
- [Phase 3: Backend Skeleton](#phase-3-backend-skeleton)
- [Phase 4: Prisma Schema](#phase-4-prisma-schema)
- [Phase 5: Docker Setup](#phase-5-docker-setup)
- [Phase 6: AI Service Layer](#phase-6-ai-service-layer)
- [Phase 7: Integration & Test](#phase-7-integration--test)

---

## Phase 1: Root Setup

### 1.1 Buat root package.json (workspace)

```json
{
  "name": "kinetic-crm",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "npm run dev --workspace=backend & npm run dev --workspace=frontend",
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend",
    "db:migrate": "npm run db:migrate --workspace=backend",
    "db:seed": "npm run db:seed --workspace=backend"
  }
}
```

### 1.2 Update .gitignore

```
node_modules/
dist/
.env
*.local
frontend/dist/
backend/dist/
backend/prisma/migrations/
uploads/
mysql-data/
```

---

## Phase 2: Frontend Restrukturisasi

### 2.1 Struktur Folder

Buat folder berikut di `frontend/src/`:

```
frontend/src/
├── components/
│   ├── ui/                    # Base components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx          # TanStack Table wrapper
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── Tabs.tsx
│   │   ├── Card.tsx
│   │   ├── DatePicker.tsx
│   │   ├── Drawer.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx        # Upgrade dgn role filtering
│   │   ├── Topbar.tsx         # Sudah ada
│   │   ├── Breadcrumb.tsx
│   │   ├── PageLoader.tsx
│   │   └── PageSkeleton.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── FilterPanel.tsx
│       ├── StatusBadge.tsx
│       ├── Pagination.tsx
│       ├── GlobalSearch.tsx
│       └── FormWrapper.tsx
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   └── widgets/
│   ├── prospects/
│   │   ├── ProspectListPage.tsx
│   │   ├── ProspectFormPage.tsx
│   │   └── ProspectDetailPage.tsx
│   ├── projects/
│   │   ├── ProjectListPage.tsx
│   │   ├── ProjectFormPage.tsx
│   │   └── ProjectDetailPage.tsx
│   │   └── tabs/
│   │       ├── OverviewTab.tsx
│   │       ├── RksTab.tsx
│   │       ├── LphsSiosTab.tsx
│   │       ├── HargaTab.tsx
│   │       ├── PemenangTab.tsx
│   │       ├── DeliveryTab.tsx
│   │       ├── TimelineTab.tsx
│   │       └── DokumenTab.tsx
│   ├── approvals/
│   │   ├── ApprovalInboxPage.tsx
│   │   └── ApprovalReviewDrawer.tsx
│   ├── kpi/
│   │   ├── KPIDashboardPage.tsx
│   │   ├── KPITargetsPage.tsx
│   │   └── KPIProgressPage.tsx
│   ├── reports/
│   │   ├── ReportsIndexPage.tsx
│   │   ├── WinLossReportPage.tsx
│   │   ├── PipelineReportPage.tsx
│   │   └── KPIReportPage.tsx
│   ├── config/
│   │   ├── ConfigLayout.tsx
│   │   ├── ConfigOrgPage.tsx
│   │   ├── ConfigWorkflowPage.tsx
│   │   ├── ConfigStatusPage.tsx
│   │   ├── ConfigRolesPage.tsx
│   │   ├── ConfigSlaPage.tsx
│   │   ├── ConfigTargetsPage.tsx
│   │   ├── ConfigDashboardPage.tsx
│   │   ├── ConfigNotifTemplatePage.tsx
│   │   ├── ConfigPeriodPage.tsx
│   │   ├── ConfigQuestionTypesPage.tsx
│   │   ├── ConfigUploadPage.tsx
│   │   └── ConfigIntegrationPage.tsx
│   ├── master-data/
│   │   ├── MasterDataLayout.tsx
│   │   ├── MasterCustomerPage.tsx
│   │   ├── MasterCategoryPage.tsx
│   │   ├── MasterCompetitorPage.tsx
│   │   ├── MasterDocTypePage.tsx
│   │   ├── MasterLossReasonPage.tsx
│   │   ├── MasterQuestionPage.tsx
│   │   ├── MasterPeriodPage.tsx
│   │   └── MasterHolidayPage.tsx
│   ├── users/
│   │   ├── UserListPage.tsx
│   │   ├── UserFormPage.tsx
│   │   └── UserDetailPage.tsx
│   ├── notifications/
│   │   └── NotificationsPage.tsx
│   ├── audit/
│   │   └── AuditLogPage.tsx
│   └── profile/
│       └── ProfilePage.tsx
├── hooks/
│   ├── queries/
│   │   ├── useProspects.ts
│   │   ├── useProjects.ts
│   │   ├── useApprovals.ts
│   │   ├── useUsers.ts
│   │   ├── useConfig.ts
│   │   ├── useDashboard.ts
│   │   └── useNotifications.ts
│   └── mutations/
│       ├── useProspectMutations.ts
│       ├── useProjectMutations.ts
│       ├── useApprovalMutations.ts
│       └── useAuthMutations.ts
├── services/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── prospects.ts
│   ├── projects.ts
│   ├── rks.ts
│   ├── lphs-sios.ts
│   ├── approvals.ts
│   ├── config.ts
│   ├── master-data.ts
│   ├── users.ts
│   ├── dashboard.ts
│   ├── reports.ts
│   ├── notifications.ts
│   └── ai.ts
├── stores/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── notificationStore.ts
├── types/
│   ├── domain/
│   │   ├── prospect.ts
│   │   ├── project.ts
│   │   ├── user.ts
│   │   ├── approval.ts
│   │   └── ...
│   ├── api/
│   │   ├── request.ts
│   │   └── response.ts
│   └── common/
│       └── enums.ts
├── routes/
│   ├── router.tsx
│   ├── guards.tsx
│   └── nav-items.ts
├── utils/
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators.ts
├── App.tsx
├── main.tsx
└── index.css
```

### 2.2 Migrasi Komponen Existing

| Existing | Tujuan Baru |
|----------|------------|
| `src/App.tsx` | `frontend/src/App.tsx` (simplified, jadi thin wrapper) |
| `src/main.tsx` | `frontend/src/main.tsx` |
| `src/index.css` | `frontend/src/index.css` |
| `src/data.ts` | Hapus (ganti Zustand + React Query) |
| `src/components/Sidebar.tsx` | `frontend/src/components/layout/Sidebar.tsx` |
| `src/components/Topbar.tsx` | `frontend/src/components/layout/Topbar.tsx` |
| `src/components/DashboardView.tsx` | `frontend/src/features/dashboard/DashboardPage.tsx` |
| `src/components/ProspectsView.tsx` | `frontend/src/features/prospects/ProspectListPage.tsx` |
| `src/components/ProjectDetailView.tsx` | `frontend/src/features/projects/ProjectDetailPage.tsx` |
| `src/components/ApprovalInboxView.tsx` | `frontend/src/features/approvals/ApprovalInboxPage.tsx` |
| `src/components/ConfigOrgView.tsx` | `frontend/src/features/config/ConfigOrgPage.tsx` |
| `src/components/ConfigStatusView.tsx` | `frontend/src/features/config/ConfigStatusPage.tsx` |
| `src/components/ConfigNotificationsView.tsx` | `frontend/src/features/config/ConfigNotifTemplatePage.tsx` |
| `src/components/MasterDataView.tsx` | `frontend/src/features/master-data/MasterDataLayout.tsx` |
| `src/components/ReportsView.tsx` | `frontend/src/features/reports/ReportsIndexPage.tsx` |
| `src/components/NotificationsView.tsx` | `frontend/src/features/notifications/NotificationsPage.tsx` |
| `src/components/ProfileView.tsx` | `frontend/src/features/profile/ProfilePage.tsx` |
| `index.html` | `frontend/public/index.html` |

### 2.3 Update frontend/package.json

```json
{
  "name": "kinetic-crm-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-router-dom": "^7.18.0",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "axios": "^1.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "lucide-react": "^0.546.0",
    "date-fns": "^3.x",
    "react-hot-toast": "^2.x"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.14",
    "@tailwindcss/vite": "^4.1.14",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x"
  }
}
```

### 2.4 Update frontend/vite.config.ts

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Phase 3: Backend Skeleton

### 3.1 Inisialisasi backend/

```bash
mkdir backend
cd backend
npm init -y
npm install express cors helmet morgan compression
npm install @prisma/client zod jsonwebtoken bcryptjs uuid dotenv winston
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs tsx prisma nodemon
npx tsc --init
npx prisma init
```

### 3.2 backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.3 Struktur Folder backend/

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── api/v1/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── prospects.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── rks.routes.ts
│   │   ├── lphs-sios.routes.ts
│   │   ├── harga-kompetitor.routes.ts
│   │   ├── pemenang-delivery.routes.ts
│   │   ├── approvals.routes.ts
│   │   ├── config.routes.ts
│   │   ├── master-data.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── notifications.routes.ts
│   │   ├── documents.routes.ts
│   │   ├── audit.routes.ts
│   │   ├── ai.routes.ts
│   │   └── health.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── scope.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── prospect.service.ts
│   │   ├── project.service.ts
│   │   ├── approval.service.ts
│   │   ├── notification.service.ts
│   │   └── ai/
│   │       ├── ai-service.interface.ts
│   │       ├── ai-service.impl.ts
│   │       ├── provider.interface.ts
│   │       ├── gemini.adapter.ts
│   │       ├── openai.adapter.ts
│   │       └── prompt-manager.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── prospect.repository.ts
│   │   └── ...
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── prospect.schema.ts
│   │   └── ...
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   └── utils/
│       ├── response.ts
│       ├── pagination.ts
│       ├── errors.ts
│       └── audit-logger.ts
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

### 3.4 Entry Point (backend/src/index.ts)

```typescript
import 'dotenv/config';
import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

async function main() {
  await prisma.$connect();
  console.log('Database connected');
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

main().catch((err) => { console.error('Failed to start:', err); process.exit(1); });
```

### 3.5 Express App (backend/src/app.ts)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './api/v1/auth.routes';
import prospectRoutes from './api/v1/prospects.routes';
import projectRoutes from './api/v1/projects.routes';
import healthRoutes from './api/v1/health.routes';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/prospects', prospectRoutes);
app.use('/api/v1/projects', projectRoutes);
// ... register all routes

app.use(errorHandler);
export default app;
```

### 3.6 Auth Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string; role: string; permissions: string[];
  branchId?: string; departmentId?: string;
}

declare global { namespace Express { interface Request { user?: AuthPayload } } }

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_MISSING', message: 'Token tidak ditemukan.' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Token tidak valid.' } });
  }
}
```

### 3.7 RBAC Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Autentikasi diperlukan.' } });
    const has = permissions.some(p => req.user!.permissions.includes(p));
    if (!has) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_INSUFFICIENT_PERMISSION', message: 'Izin tidak mencukupi.' } });
    next();
  };
}
```

### 3.8 Response Helper (Doc 057 §4)

```typescript
interface PaginationMeta { page: number; perPage: number; totalItems: number; totalPages: number; }

export function success<T>(data: T, pagination?: PaginationMeta) {
  return { success: true, data, meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString(), ...(pagination ? { pagination } : {}) } };
}

export function error(code: string, message: string, status: number, details?: unknown) {
  const err = new Error(message) as Error & { statusCode: number; errorCode: string; details?: unknown };
  err.statusCode = status; err.errorCode = code; err.details = details;
  return err;
}
```

---

## Phase 4: Prisma Schema

### 4.1 Model Utama (backend/prisma/schema.prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql" url = env("DATABASE_URL") }

// ── Organization & Access ──
model Company { id String @id @default(cuid()) name String divisions Division[] createdAt DateTime @default(now()) }
model Division { id String @id @default(cuid()) name String companyId String company Company @relation(fields: [companyId], references: [id]) departments Department[] createdAt DateTime @default(now()) }
model Department { id String @id @default(cuid()) name String code String @unique divisionId String division Division @relation(fields: [divisionId], references: [id]) positions Position[] users User[] createdAt DateTime @default(now()) }
model Branch { id String @id @default(cuid()) name String code String @unique address String? users User[] prospects Prospect[] projects Project[] createdAt DateTime @default(now()) }
model Position { id String @id @default(cuid()) name String departmentId String department Department @relation(fields: [departmentId], references: [id]) users User[] createdAt DateTime @default(now()) }

// ── Auth & Users ──
model Role { id String @id @default(cuid()) code String @unique name String description String? isSystem Boolean @default(false) users User[] permissions RolePermission[] }
model Permission { id String @id @default(cuid()) code String @unique resource String action String label String roles RolePermission[] }
model RolePermission { roleId String role Role @relation(fields: [roleId], references: [id]) permissionId String permission Permission @relation(fields: [permissionId], references: [id]) @@id([roleId, permissionId]) }

model User {
  id String @id @default(cuid())
  username String @unique email String @unique password String name String
  roleId String role Role @relation(fields: [roleId], references: [id])
  positionId String? position Position? @relation(fields: [positionId], references: [id])
  branchId String? branch Branch? @relation(fields: [branchId], references: [id])
  departmentId String? department Department? @relation(fields: [departmentId], references: [id])
  isActive Boolean @default(true) isLocked Boolean @default(false)
  failedLoginAttempts Int @default(0) lastLoginAt DateTime?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt deletedAt DateTime?
  sessions ActiveSession[] notifications Notification[]
}
model ActiveSession { id String @id @default(cuid()) userId String user User @relation(fields: [userId], references: [id]) token String @unique expiresAt DateTime revokedAt DateTime? createdAt DateTime @default(now()) }

// ── Master Data ──
model Customer { id String @id @default(cuid()) name String industry String? address String? prospects Prospect[] projects Project[] createdAt DateTime @default(now()) }
model Category { id String @id @default(cuid()) name String code String @unique description String? prospects Prospect[] projects Project[] }
model Competitor { id String @id @default(cuid()) name String code String? projectCompetitors ProjectCompetitor[] }
model QuestionType { id String @id @default(cuid()) name String code String @unique target String config Json? questions Question[] }
model Question { id String @id @default(cuid()) text String questionTypeId String questionType QuestionType @relation(fields: [questionTypeId], references: [id]) isRequired Boolean @default(false) order Int @default(0) isActive Boolean @default(true) prospectAnswers ProspectAnswer[] }
model Period { id String @id @default(cuid()) name String year Int month Int startDate DateTime endDate DateTime isActive Boolean @default(false) }
model Holiday { id String @id @default(cuid()) name String date DateTime isRecurring Boolean @default(false) }
model LossReason { id String @id @default(cuid()) name String code String @unique isActive Boolean @default(true) }

// ── Core Modules ──
enum ProspectStatus { prospecting waiting_pm_approval revision approved }
model Prospect {
  id String @id @default(cuid()) name String
  customerId String customer Customer @relation(fields: [customerId], references: [id])
  description String? estimatedValue Decimal? @db.Decimal(18,2) estimatedDate DateTime?
  categoryId String category Category @relation(fields: [categoryId], references: [id])
  status ProspectStatus @default(prospecting)
  branchId String branch Branch @relation(fields: [branchId], references: [id])
  createdById String createdBy User @relation(fields: [createdById], references: [id])
  answers ProspectAnswer[] project Project?
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
}
model ProspectAnswer { id String @id @default(cuid()) prospectId String prospect Prospect @relation(fields: [prospectId], references: [id]) questionId String question Question @relation(fields: [questionId], references: [id]) answerValue String @@unique([prospectId, questionId]) }

enum ProjectType { tender prospecting }
enum ProjectStatus { created rks_draft review_department lphs_sios harga_kompetitor pemenang_ditentukan target_delivery selesai cancelled kalah }
model Project {
  id String @id @default(cuid()) name String projectType ProjectType status ProjectStatus @default(created)
  customerId String customer Customer @relation(fields: [customerId], references: [id])
  categoryId String category Category @relation(fields: [categoryId], references: [id])
  branchId String branch Branch @relation(fields: [branchId], references: [id])
  prospectId String? @unique prospect Prospect? @relation(fields: [prospectId], references: [id])
  deadlineTender DateTime? description String?
  cancelledAt DateTime? cancellationReason String?
  rks Rks[] lphsSios LphsSios? projectCompetitors ProjectCompetitor[] projectResult ProjectResult? projectDeliveries ProjectDelivery[] projectTimeline ProjectTimeline[] documents Document[]
  createdAt DateTime @default(now()) updatedAt DateTime @updatedAt
}
model Rks { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) content String status String @default("draft") revisionNumber Int @default(1) submittedAt DateTime? approvedAt DateTime? }
model LphsSios { id String @id @default(cuid()) projectId String @unique project Project @relation(fields: [projectId], references: [id]) status String @default("draft") pmApprovalStatus String @default("pending") revisionNumber Int @default(1) departmentApprovals DepartmentApproval[] }
model DepartmentApproval { id String @id @default(cuid()) lphsSiosId String lphsSios LphsSios @relation(fields: [lphsSiosId], references: [id]) departmentId String status String @default("pending") decidedById String? comment String? decidedAt DateTime? }
model ProjectCompetitor { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) competitorId String? competitor Competitor? @relation(fields: [competitorId], references: [id]) competitorName String? competitorPrice Decimal @db.Decimal(18,2) ourPrice Decimal? @db.Decimal(18,2) }
model ProjectResult { id String @id @default(cuid()) projectId String @unique project Project @relation(fields: [projectId], references: [id]) result String lossReasonId String? lossReason LossReason? @relation(fields: [lossReasonId], references: [id]) lossReasonNote String? finalPrice Decimal? @db.Decimal(18,2) decidedAt DateTime @default(now()) }
model ProjectDelivery { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) startDate DateTime? endDate DateTime? progress Int @default(0) description String? completedAt DateTime? }
model ProjectTimeline { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) event String actorId String actor User @relation(fields: [actorId], references: [id]) metadata Json? createdAt DateTime @default(now()) }
model Document { id String @id @default(cuid()) projectId String project Project @relation(fields: [projectId], references: [id]) fileName String filePath String mimeType String fileSize Int version Int @default(1) uploadedById String uploadedBy User @relation(fields: [uploadedById], references: [id]) createdAt DateTime @default(now()) }

// ── Notification ──
model Notification { id String @id @default(cuid()) userId String user User @relation(fields: [userId], references: [id]) title String message String type String deepLink String? isRead Boolean @default(false) createdAt DateTime @default(now()) }

// ── Audit ──
model AuditLog { id String @id @default(cuid()) userId String? action String resource String resourceId String? payloadBefore Json? payloadAfter Json? ipAddress String? userAgent String? createdAt DateTime @default(now()) }
```

### 4.2 Run Migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 5: Docker Setup

### 5.1 backend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### 5.2 frontend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.3 docker/nginx/nginx.conf

```nginx
upstream backend { server backend:4000; }

server {
    listen 80;
    server_name localhost;
    client_max_body_size 20M;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /uploads/ { internal; alias /var/www/uploads/; }
}
```

### 5.4 docker/docker-compose.yml

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - frontend-build:/usr/share/nginx/html
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on: [backend]
    networks: [kinetic-net]
    restart: unless-stopped

  frontend-builder:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ../frontend:/app
      - frontend-build:/build
    command: sh -c "npm ci && npm run build && cp -r dist/* /build/"
    profiles: [build]

  backend:
    build: ../backend
    ports: ["4000:4000"]
    env_file: ../backend/.env
    volumes:
      - upload-data:/app/uploads
    depends_on:
      mysql: { condition: service_healthy }
    networks: [kinetic-net]
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    volumes:
      - mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpass}
      MYSQL_DATABASE: kinetic_crm
      MYSQL_USER: kinetic
      MYSQL_PASSWORD: ${DB_PASSWORD:-secret}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s; timeout: 5s; retries: 5
    networks: [kinetic-net]
    restart: unless-stopped

volumes:
  frontend-build:
  mysql-data:
  upload-data:

networks:
  kinetic-net: { driver: bridge }
```

### 5.5 backend/.env.example

```bash
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="mysql://kinetic:secret@mysql:3306/kinetic_crm"
JWT_SECRET=change-this-to-random-64-char-string
JWT_EXPIRY=28800

# AI Service Layer — prepare, not active yet
AI_PROVIDER=gemini
GEMINI_API_KEY=
AI_MODEL=gemini-2.5-pro
AI_EMBEDDING_MODEL=text-embedding-004
AI_TIMEOUT=60
AI_MAX_RETRIES=3
AI_RATE_LIMIT_REQUESTS=100
AI_RATE_LIMIT_WINDOW=3600
# OPENAI_API_KEY=
# CLAUDE_API_KEY=
```

### 5.6 frontend/.env.example

```bash
VITE_API_BASE_URL=http://localhost:4000
```

---

## Phase 6: AI Service Layer

### 6.1 Interface (backend/src/services/ai/ai-service.interface.ts)

```typescript
export interface AiService {
  summarize(content: string, context: 'rks' | 'lphs' | 'prospect' | 'general'): Promise<string>;
  analyze(projectId: string): Promise<AnalysisResult>;
  generateEmbedding(text: string): Promise<number[]>;
  extractInsight(data: unknown, type: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}
```

### 6.2 Provider Interface (backend/src/services/ai/provider.interface.ts)

```typescript
export interface AiProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateEmbedding(text: string): Promise<number[]>;
  healthCheck(): Promise<boolean>;
}
interface GenerateOptions { model?: string; maxTokens?: number; temperature?: number; }
interface GenerateResult { text: string; status: 'success' | 'error'; }
```

### 6.3 Gemini Adapter (backend/src/services/ai/gemini.adapter.ts)

```typescript
import { GoogleGenAI } from '@google/genai';
import { AiProvider, GenerateOptions, GenerateResult } from './provider.interface';

export class GeminiAdapter implements AiProvider {
  private client: GoogleGenAI;
  private model: string;
  constructor(apiKey: string, model = 'gemini-2.5-pro') {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }
  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const response = await this.client.models.generateContent({
      model: options?.model || this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { maxOutputTokens: options?.maxTokens, temperature: options?.temperature ?? 0.2 },
    });
    return { text: response.text || '', status: 'success' };
  }
  async healthCheck(): Promise<boolean> {
    try { await this.generateText('ok'); return true; } catch { return false; }
  }
}
```

### 6.4 Prompt Manager (backend/src/services/ai/prompt-manager.ts)

```typescript
export const PROMPTS = {
  rks_summary: (c: string) => `Ringkas dokumen RKS berikut dalam 3-5 kalimat Bahasa Indonesia:\n${c}`,
  prospect_analysis: (d: string) => `Analisis prospek berikut dan rekomendasi:\n${d}`,
  competitor_analysis: (d: string) => `Analisis perbandingan kompetitor:\n${d}`,
};
```

---

## Phase 7: Execution

### 7.1 Build & Run (Docker)

```bash
docker compose --profile build up    # Build frontend
docker compose up -d                 # Start all services
docker compose exec backend npx prisma migrate dev   # Run migration
docker compose exec backend npm run seed   # Seed data
curl http://localhost/api/v1/health  # Check
```

### 7.2 Development (no Docker)

```bash
# Terminal 1: Database
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=kinetic_crm mysql:8.0

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

### 7.3 Urutan Pekerjaan

| # | Step | Est. |
|---|------|------|
| 1 | Root package.json + .gitignore | 5m |
| 2 | Buat struktur folder frontend/ | 15m |
| 3 | Migrasi komponen existing ke feature-first | 30m |
| 4 | Setup routes + guards | 15m |
| 5 | Inisialisasi backend/ + Express skeleton | 15m |
| 6 | Setup Prisma schema | 25m |
| 7 | Prisma migrate + generate | 5m |
| 8 | Middleware (auth + RBAC + error) | 20m |
| 9 | Contoh 2 endpoint (auth + prospects) | 20m |
| 10 | AI Service Layer skeleton | 15m |
| 11 | Dockerfile FE + BE | 15m |
| 12 | nginx.conf + docker-compose.yml | 15m |
| 13 | Test build + run | 15m |
| **Total** | | **~3.5 jam** |

---

## Referensi Dokumen

| Dok | Nama | Untuk |
|-----|------|-------|
| 005 | System Architecture Overview | Layer architecture, Docker, AI container |
| 006 | Tech Stack Specification | Stack versions, browser support |
| 007 | Data Architecture Principles | Anti-JSON-blob, normalisasi |
| 008 | Security Architecture | JWT, bcrypt, CSRF, OWASP |
| 009 | Integration Architecture | AI Service Layer wajib sebagai proxy |
| 010 | AI Integration Architecture | Provider abstraction, Gemini adapter |
| 012 | Information Architecture & Navigation | Route tree, guards, sidebar, breadcrumb |
| 014 | UI Screen Catalog | 33 screens, komponen per screen |
| 020 | Authorization Enforcement | RBAC middleware, scope, permission |
| 053 | Full ERD | Relasi entitas untuk Prisma schema |
| 054 | Full Database Schema DDL | Definisi tabel untuk Prisma schema |
| 057 | Full API Endpoint Spec | Kontrak request/response, pagination, error |
| 058 | Frontend Architecture | Feature-first, component layers |
