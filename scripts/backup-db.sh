#!/bin/bash
# /opt/kinetic-crm/scripts/backup-db.sh
# Database backup script for Kinetic CRM

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/kinetic-backups/mysql
BACKUP_FILE="${BACKUP_DIR}/kinetic_crm_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

mkdir -p "$BACKUP_DIR"

docker exec kinetic_mysql mysqldump \
  -u"${DB_USERNAME}" -p"${DB_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DB_DATABASE}" | gzip > "$BACKUP_FILE"

openssl enc -aes-256-cbc -salt \
  -in "$BACKUP_FILE" \
  -out "$ENCRYPTED_FILE" \
  -pass pass:"${BACKUP_ENCRYPTION_KEY}"

rm "$BACKUP_FILE"

aws s3 cp "$ENCRYPTED_FILE" "s3://${BACKUP_BUCKET}/mysql/" \
  --storage-class STANDARD_IA

find "$BACKUP_DIR" -name "*.enc" -mtime +7 -delete

echo "Backup berhasil: $ENCRYPTED_FILE"
