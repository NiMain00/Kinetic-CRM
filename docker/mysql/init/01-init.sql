-- Kinetic CRM Database Initialization
-- This script runs on first container startup (when the database is empty)
-- The database itself is created automatically via MYSQL_DATABASE env var

-- Ensure UTF-8 charset for all tables
ALTER DATABASE `kinetic_crm` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant necessary privileges (already done via MYSQL_USER/MYSQL_PASSWORD env vars)
-- Prisma migrations will handle all table creation at runtime via `npx prisma migrate deploy`