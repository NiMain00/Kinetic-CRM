#!/bin/bash
# /opt/kinetic-crm/scripts/backup-db.sh
# Database backup script for Kinetic CRM

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
</write_to_file>

<write_to_file>
<path>scripts/backup-storage.sh</path>
<content>#!/bin/bash
# /opt/kinetic-crm/scripts/backup-storage.sh
# Storage backup script for Kinetic CRM

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
</write_to_file>

<task_progress>
- [x] Phase 1: Create .env file
- [x] Phase 1: Create MySQL init SQL
- [x] Phase 1: Implement GET /health endpoint
- [x] Phase 2: Create backup scripts
- [ ] Phase 2: Create CI/CD pipeline
- [ ] Phase 3: Verify docker-compose up
</task_progress>
</write_to_file>