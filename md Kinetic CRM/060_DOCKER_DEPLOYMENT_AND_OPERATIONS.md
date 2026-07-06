# 060 — DOCKER, DEPLOYMENT & OPERATIONS
## KINETIC CRM — Infrastruktur Kontainer, CI/CD, Secret Management, Backup & DR

---

## DOCUMENT INFORMATION

| Atribut | Nilai |
|---|---|
| **Nomor Dokumen** | 060 |
| **Nama Dokumen** | Docker, Deployment & Operations |
| **Versi** | 1.0 |
| **Tanggal** | Juni 2025 |
| **Sumber Utama** | BA Review STMS v1.0 — Section B.8, PRD Section 11 |
| **Gap Resolution** | GAP-15 (health check), CFG-14 (AI env vars) |
| **Status** | Final |

---

## 1. ARSITEKTUR KONTAINER

### 1.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Host / VM                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  nginx   │  │ frontend │  │ backend  │  │  scheduler     │  │
│  │ (proxy)  │  │ (React)  │  │ (API)    │  │  (cron jobs)   │  │
│  │ :80/:443 │  │ :3000    │  │ :8000    │  │  (same image   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │   as backend)  │  │
│       │              │              │         └────────────────┘  │
│       └──────────────┴──────────────┘                            │
│                              │                                   │
│  ┌──────────┐  ┌─────────────┴──────┐  ┌───────────────────┐   │
│  │  mysql   │  │      redis         │  │  storage volume   │   │
│  │ :3306    │  │  (cache/queue)     │  │  (documents)      │   │
│  │          │  │  :6379             │  │                   │   │
│  └──────────┘  └────────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Layanan (Services)

| Service | Image | Port Internal | Deskripsi |
|---|---|---|---|
| `nginx` | nginx:1.25-alpine | 80, 443 | Reverse proxy + SSL termination |
| `frontend` | custom (node:20-alpine) | 3000 | React SPA (served via nginx di prod) |
| `backend` | custom (php:8.3-fpm atau node:20) | 8000 | REST API |
| `scheduler` | custom (same as backend) | — | Cron jobs: SLA check, snapshot, deadline |
| `mysql` | mysql:8.0 | 3306 | Primary database |
| `redis` | redis:7-alpine | 6379 | Cache, queue, session, token blacklist |
| `storage` | volume | — | File storage (documents, avatars) |

---

## 2. DOCKER COMPOSE — PRODUCTION

```yaml
# docker-compose.prod.yml
version: '3.9'

services:

  nginx:
    image: nginx:1.25-alpine
    container_name: kinetic_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - storage_volume:/var/www/storage:ro  # serve avatars/logos via nginx (public-safe only)
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - kinetic_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL}
        - VITE_APP_VERSION=${APP_VERSION}
    container_name: kinetic_frontend
    expose:
      - "3000"
    restart: unless-stopped
    networks:
      - kinetic_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: kinetic_backend
    expose:
      - "8000"
    environment:
      # App
      APP_ENV: production
      APP_KEY: ${APP_KEY}
      APP_URL: ${APP_URL}
      APP_VERSION: ${APP_VERSION}
      # Database
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: ${DB_DATABASE}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      # Redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      # JWT
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRY_HOURS: ${JWT_EXPIRY_HOURS:-8}
      # Session
      VITE_SESSION_WARN_MINUTES: ${SESSION_WARN_MINUTES:-25}
      # Storage
      STORAGE_ROOT: /var/www/storage
      STORAGE_MAX_UPLOAD_MB: ${STORAGE_MAX_UPLOAD_MB:-25}
      # AI Provider
      AI_PROVIDER: ${AI_PROVIDER:-gemini}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      AI_MODEL: ${AI_MODEL:-gemini-1.5-flash}
      AI_MAX_TOKENS: ${AI_MAX_TOKENS:-2048}
      AI_TEMPERATURE: ${AI_TEMPERATURE:-0.3}
      AI_TIMEOUT_SECONDS: ${AI_TIMEOUT_SECONDS:-30}
      AI_MAX_RETRIES: ${AI_MAX_RETRIES:-3}
      AI_RATE_LIMIT_RPM: ${AI_RATE_LIMIT_RPM:-60}
      AI_COST_LIMIT_USD_PER_DAY: ${AI_COST_LIMIT_USD_PER_DAY:-10.0}
      # Email (Fase 2)
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      SMTP_FROM_NAME: ${SMTP_FROM_NAME:-KINETIC CRM}
      SMTP_ENCRYPTION: ${SMTP_ENCRYPTION:-tls}
      # Logging
      LOG_LEVEL: ${LOG_LEVEL:-error}
      LOG_CHANNEL: ${LOG_CHANNEL:-stderr}
    volumes:
      - storage_volume:/var/www/storage
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - kinetic_net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: kinetic_scheduler
    command: ["php", "artisan", "schedule:work"]   # atau node scheduler.js
    environment:
      APP_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: ${DB_DATABASE}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      AI_PROVIDER: ${AI_PROVIDER:-gemini}
    volumes:
      - storage_volume:/var/www/storage
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - kinetic_net

  mysql:
    image: mysql:8.0
    container_name: kinetic_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
      - ./docker/mysql/init:/docker-entrypoint-initdb.d:ro
    expose:
      - "3306"
    restart: unless-stopped
    networks:
      - kinetic_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u${DB_USERNAME}", "-p${DB_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: kinetic_redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    expose:
      - "6379"
    restart: unless-stopped
    networks:
      - kinetic_net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
  storage_volume:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/kinetic-crm/storage   # path di host; backup target

networks:
  kinetic_net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

---

## 3. DOCKERFILE SPECIFICATIONS

### 3.1 Frontend Dockerfile (Multi-stage Build)

```dockerfile
# frontend/Dockerfile.prod
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_APP_VERSION
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

FROM nginx:1.25-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Backend Dockerfile (PHP/Node)

```dockerfile
# backend/Dockerfile.prod
FROM php:8.3-fpm-alpine AS base
RUN apk add --no-cache \
    git curl libpng-dev libjpeg-turbo-dev freetype-dev \
    libzip-dev oniguruma-dev icu-dev
RUN docker-php-ext-install pdo_mysql zip bcmath intl opcache

FROM base AS production
WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
RUN composer install --no-dev --optimize-autoloader
RUN php artisan config:cache && php artisan route:cache && php artisan view:cache
EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

---

## 4. ENVIRONMENT SEPARATION

### 4.1 Environment Matrix

| Parameter | Local | Dev | Staging | Production |
|---|---|---|---|---|
| `APP_ENV` | local | development | staging | production |
| `LOG_LEVEL` | debug | debug | info | error |
| `DB_HOST` | localhost | mysql | mysql-staging | mysql-prod |
| `GEMINI_API_KEY` | dev key (quota rendah) | dev key | staging key | production key |
| `AI_COST_LIMIT_USD_PER_DAY` | $1 | $2 | $5 | $10 |
| `STORAGE_ROOT` | ./storage | /var/www/storage | /var/storage | /opt/kinetic/storage |
| SSL | tidak | tidak | self-signed | CA-signed |
| Redis maxmemory | 64mb | 128mb | 256mb | 512mb |

### 4.2 File Konfigurasi Per Environment

```
project/
├── .env.example          ← template; wajib ada di repo
├── .env.local            ← local dev; di .gitignore
├── .env.development      ← dev server; di .gitignore
├── .env.staging          ← staging; di .gitignore atau secrets manager
└── .env.production       ← production; TIDAK di repo; hanya di server / secrets manager
```

### 4.3 `.env.example` (Template Wajib)

```env
# ===== APPLICATION =====
APP_ENV=local
APP_KEY=
APP_URL=http://localhost
APP_VERSION=1.0.0

# ===== DATABASE =====
DB_ROOT_PASSWORD=
DB_DATABASE=kinetic_crm
DB_USERNAME=kinetic_user
DB_PASSWORD=

# ===== REDIS =====
REDIS_PASSWORD=

# ===== JWT =====
JWT_SECRET=                    # min 64 karakter random; generate: openssl rand -base64 48
JWT_EXPIRY_HOURS=8

# ===== SESSION =====
SESSION_WARN_MINUTES=25

# ===== STORAGE =====
STORAGE_MAX_UPLOAD_MB=25

# ===== AI PROVIDER =====
AI_PROVIDER=gemini
GEMINI_API_KEY=                # Dari Google AI Studio; JANGAN commit ke repo
AI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3
AI_TIMEOUT_SECONDS=30
AI_MAX_RETRIES=3
AI_RATE_LIMIT_RPM=60
AI_COST_LIMIT_USD_PER_DAY=10.0

# ===== EMAIL (FASE 2) =====
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=KINETIC CRM
SMTP_ENCRYPTION=tls

# ===== VITE (FRONTEND) =====
VITE_API_BASE_URL=http://localhost:8000
VITE_SESSION_WARN_MINUTES=25

# ===== LOGGING =====
LOG_LEVEL=debug
LOG_CHANNEL=stderr
```

---

## 5. SECRET MANAGEMENT

### 5.1 Prinsip Secret Management

> **Rule Absolut:** Secrets (API keys, passwords, JWT secret) **TIDAK PERNAH** di-commit ke repository Git. Penangkapan secrets di repo adalah insiden keamanan serius.

### 5.2 Hierarki Secret Storage

| Tier | Environment | Metode Penyimpanan |
|---|---|---|
| Local Dev | Developer machine | `.env.local` (di .gitignore) |
| Dev Server | CI/CD | GitHub Actions / GitLab CI Secrets |
| Staging | Staging server | `.env.staging` di server; akses terbatas |
| Production | Production | Docker Secrets atau HashiCorp Vault atau cloud secrets manager |

### 5.3 Docker Secrets (Production)

```yaml
# docker-compose.prod.yml dengan Docker Secrets
secrets:
  db_password:
    file: /run/secrets/db_password
  jwt_secret:
    file: /run/secrets/jwt_secret
  gemini_api_key:
    file: /run/secrets/gemini_api_key
  redis_password:
    file: /run/secrets/redis_password

services:
  backend:
    secrets:
      - db_password
      - jwt_secret
      - gemini_api_key
      - redis_password
    environment:
      # Baca dari file secret (bukan env var langsung)
      DB_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      GEMINI_API_KEY_FILE: /run/secrets/gemini_api_key
```

Backend membaca secrets dari file:
```php
$dbPassword = file_get_contents(env('DB_PASSWORD_FILE')) ?? env('DB_PASSWORD');
```

### 5.4 Secret Rotation Policy

| Secret | Rotasi | Prosedur |
|---|---|---|
| `JWT_SECRET` | Setiap 90 hari atau setelah insiden | Update env; semua user harus re-login |
| `DB_PASSWORD` | Setiap 180 hari | Update di DB dan env secara atomik |
| `GEMINI_API_KEY` | Setiap 90 hari atau jika terekspos | Buat key baru di Google AI Studio dulu; update env; hapus key lama |
| `REDIS_PASSWORD` | Setiap 180 hari | Update; restart redis dan semua service |

---

## 6. HEALTH CHECK (GAP-15)

### 6.1 Health Check Endpoint

```
GET /health
Authorization: tidak diperlukan (public endpoint)

Response 200 (healthy):
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-06-10T08:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok",
    "ai_service": "ok"
  }
}

Response 503 (unhealthy):
{
  "status": "degraded",
  "checks": {
    "database": "ok",
    "redis": "error: connection refused",
    "storage": "ok",
    "ai_service": "degraded: rate limited"
  }
}
```

### 6.2 Implementasi Health Check

```typescript
// GET /health
async function healthCheck(req, res) {
  const checks: Record<string, string> = {};
  let overallStatus = 'ok';

  // Database check
  try {
    await db.query('SELECT 1');
    checks.database = 'ok';
  } catch (e) {
    checks.database = `error: ${e.message}`;
    overallStatus = 'degraded';
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    checks.redis = `error: ${e.message}`;
    overallStatus = 'degraded';
  }

  // Storage check
  try {
    await fs.access(process.env.STORAGE_ROOT);
    checks.storage = 'ok';
  } catch (e) {
    checks.storage = 'error: storage directory not accessible';
    overallStatus = 'degraded';
  }

  // AI Service check (non-blocking — hanya cek konfigurasi, tidak call API)
  checks.ai_service = process.env.GEMINI_API_KEY ? 'configured' : 'not_configured';

  const httpStatus = overallStatus === 'ok' ? 200 : 503;
  return res.status(httpStatus).json({
    status: overallStatus,
    version: process.env.APP_VERSION,
    timestamp: new Date().toISOString(),
    checks
  });
}
```

---

## 7. CONTAINER SECURITY

### 7.1 Security Hardening

```dockerfile
# Jalankan sebagai non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Read-only filesystem (kecuali storage)
# Dikonfigurasi via docker-compose:
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
  - /var/cache
volumes:
  - storage_volume:/var/www/storage  # writable storage
```

### 7.2 Network Policy

```yaml
# Hanya nginx yang expose port ke host
# Semua service lain hanya communicate via internal network
services:
  mysql:
    expose:
      - "3306"     # hanya internal; tidak publish ke host
  redis:
    expose:
      - "6379"     # hanya internal
  backend:
    expose:
      - "8000"     # hanya internal; nginx yang forward
```

### 7.3 Image Security

- Gunakan image official dengan tag spesifik (bukan `latest`)
- Scan image dengan `docker scout` atau `trivy` sebelum deploy
- Update base image secara berkala (schedule: setiap bulan)
- Tidak install tools debugging di production image

---

## 8. BACKUP STRATEGY

### 8.1 Backup Components

| Komponen | Frekuensi | Retensi | Metode |
|---|---|---|---|
| MySQL Database | Setiap hari (02:00 WIB) | 30 hari daily, 12 bulan monthly | `mysqldump` + gzip + encrypt |
| Redis Data | Setiap hari (02:30 WIB) | 7 hari | RDB snapshot + copy |
| Storage (files) | Setiap hari (03:00 WIB) | 30 hari | `rsync` ke backup server |
| Config files | Setiap kali ada perubahan | 90 hari | Git tag + backup server |

### 8.2 Database Backup Script

```bash
#!/bin/bash
# /opt/kinetic-crm/scripts/backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/kinetic-backups/mysql
BACKUP_FILE="${BACKUP_DIR}/kinetic_crm_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

mkdir -p "$BACKUP_DIR"

# Dump
docker exec kinetic_mysql mysqldump \
  -u"${DB_USERNAME}" -p"${DB_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DB_DATABASE}" | gzip > "$BACKUP_FILE"

# Enkripsi dengan AES-256
openssl enc -aes-256-cbc -salt \
  -in "$BACKUP_FILE" \
  -out "$ENCRYPTED_FILE" \
  -pass pass:"${BACKUP_ENCRYPTION_KEY}"

# Hapus file tidak terenkripsi
rm "$BACKUP_FILE"

# Upload ke offsite storage (S3/MinIO/GCS)
aws s3 cp "$ENCRYPTED_FILE" "s3://${BACKUP_BUCKET}/mysql/" \
  --storage-class STANDARD_IA

# Hapus backup lokal > 7 hari (offsite retention = 30 hari)
find "$BACKUP_DIR" -name "*.enc" -mtime +7 -delete

echo "Backup berhasil: $ENCRYPTED_FILE"
```

### 8.3 Storage Backup Script

```bash
#!/bin/bash
# /opt/kinetic-crm/scripts/backup-storage.sh

TIMESTAMP=$(date +%Y%m%d)
SOURCE=/opt/kinetic-crm/storage
BACKUP_DIR=/opt/kinetic-backups/storage

# Rsync ke backup directory lokal
rsync -avz --delete "$SOURCE/" "${BACKUP_DIR}/"

# Tar + gzip + enkripsi harian
ARCHIVE="${BACKUP_DIR}_${TIMESTAMP}.tar.gz.enc"
tar -czf - "$SOURCE" | \
  openssl enc -aes-256-cbc -salt -pass pass:"${BACKUP_ENCRYPTION_KEY}" \
  > "$ARCHIVE"

# Upload ke offsite
aws s3 cp "$ARCHIVE" "s3://${BACKUP_BUCKET}/storage/"

echo "Storage backup selesai: $ARCHIVE"
```

### 8.4 Backup Testing

- **Setiap minggu:** Test restore database ke environment staging
- **Setiap bulan:** Full restore drill ke environment isolasi
- Catat waktu RTO aktual hasil restore drill

---

## 9. DISASTER RECOVERY

### 9.1 Recovery Time & Point Objectives

| Skenario | RTO Target | RPO Target |
|---|---|---|
| Service crash (restart) | < 2 menit | 0 (tidak ada data loss) |
| Database corruption | < 2 jam | < 24 jam (backup harian) |
| Server failure (hardware) | < 4 jam | < 24 jam |
| Full DC outage | < 8 jam | < 24 jam |
| Data breach / ransomware | < 24 jam | < 24 jam (dari offsite backup) |

### 9.2 Recovery Runbook

**Skenario: Database crash/corrupt**

```
1. Stop semua service (backend, scheduler):
   docker-compose stop backend scheduler

2. Identifikasi backup terakhir yang valid:
   ls -lt /opt/kinetic-backups/mysql/ | head -5

3. Restore ke database baru (jangan overwrite langsung):
   docker exec -i kinetic_mysql_recovery mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}_recovery \
     < <(openssl dec -aes-256-cbc -pass pass:${BACKUP_KEY} -in backup.sql.gz.enc | gunzip)

4. Validasi data: jalankan integrity checks
   php artisan db:check-integrity

5. Swap database:
   Rename DB lama → _broken
   Rename _recovery → DB produksi

6. Restart semua service:
   docker-compose up -d

7. Verifikasi health check:
   curl http://localhost/health

8. Notifikasi tim dan catat incident
```

### 9.3 Monitoring & Alerting

| Metrik | Threshold Alert | Channel |
|---|---|---|
| CPU usage | > 85% selama 5 menit | Email + Slack |
| Memory usage | > 90% | Email + Slack |
| Disk usage | > 80% | Email |
| MySQL connection errors | > 10/menit | Email + Slack |
| Redis memory | > 90% maxmemory | Email |
| Health check fail | 2x berturut-turut | Email + Slack + PagerDuty |
| Backup gagal | 1x | Email + Slack |

---

## 10. NGINX CONFIGURATION

```nginx
# docker/nginx/conf.d/kinetic.conf
server {
    listen 80;
    server_name kinetic-crm.company.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kinetic-crm.company.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React SPA)
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 30M;   # lebih dari max upload size
        proxy_read_timeout 120s;
    }

    # Health check (bypass auth)
    location /health {
        proxy_pass http://backend:8000/health;
        access_log off;
    }

    # Storage — hanya path public (avatars, logos); dokumen proyek TIDAK di-serve langsung
    location /storage/public/ {
        alias /var/www/storage/public/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 11. CI/CD PIPELINE (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy KINETIC CRM

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: |
          cd backend
          composer install
          php artisan test
      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker images
        env:
          REGISTRY: ghcr.io
          IMAGE_NAME: ${{ github.repository }}
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u $ --password-stdin
          docker build -t $REGISTRY/$IMAGE_NAME/backend:${{ github.sha }} ./backend
          docker build -t $REGISTRY/$IMAGE_NAME/frontend:${{ github.sha }} ./frontend
          docker push $REGISTRY/$IMAGE_NAME/backend:${{ github.sha }}
          docker push $REGISTRY/$IMAGE_NAME/frontend:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/kinetic-crm
            export IMAGE_TAG=${{ github.sha }}
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-deps --build
            docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
            docker-compose -f docker-compose.prod.yml exec backend php artisan config:cache
            curl -f http://localhost/health || exit 1
```

---

## 12. QA TEST SCENARIOS — INFRASTRUCTURE

| ID | Skenario | Expected Result |
|---|---|---|
| TC-INFRA-01 | GET /health saat semua service normal | HTTP 200; status=ok; semua checks=ok |
| TC-INFRA-02 | GET /health saat MySQL down | HTTP 503; database=error; status=degraded |
| TC-INFRA-03 | Upload file 26MB (melebihi limit 25MB) | HTTP 413 dari nginx; pesan "file too large" |
| TC-INFRA-04 | Akses langsung file storage via URL | HTTP 404 atau 403 (file tidak serve langsung) |
| TC-INFRA-05 | Restart container backend | Service kembali dalam < 30 detik; health check pass |
| TC-INFRA-06 | Jalankan backup script | File .sql.gz.enc terbuat; upload ke S3 berhasil |
| TC-INFRA-07 | Restore backup ke staging | Data identik dengan production pada waktu backup |
| TC-INFRA-08 | GEMINI_API_KEY tidak di-set di .env | AI endpoint return 503 "AI service not configured" |

**Gap Resolution:** GAP-15 ✓ (Health Check) | CFG-14 ✓ (AI env vars lengkap)
