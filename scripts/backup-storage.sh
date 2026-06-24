#!/bin/bash
# /opt/kinetic-crm/scripts/backup-storage.sh
# Storage backup script for Kinetic CRM

TIMESTAMP=$(date +%Y%m%d)
SOURCE=/opt/kinetic-crm/storage
BACKUP_DIR=/opt/kinetic-backups/storage

rsync -avz --delete "$SOURCE/" "${BACKUP_DIR}/"

ARCHIVE="${BACKUP_DIR}_${TIMESTAMP}.tar.gz.enc"
tar -czf - "$SOURCE" | \
  openssl enc -aes-256-cbc -salt -pass pass:"${BACKUP_ENCRYPTION_KEY}" \
  > "$ARCHIVE"

aws s3 cp "$ARCHIVE" "s3://${BACKUP_BUCKET}/storage/"

echo "Storage backup selesai: $ARCHIVE"
