#!/bin/bash

###############################################################################
# Database Backup Script for Eduflow
# Run this script to create a backup of the SQLite database
###############################################################################

BACKUP_DIR="/var/www/eduflow-app/api/backup"
DB_PATH="/var/www/eduflow-app/api/eduflow.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eduflow_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
    
    # Keep only last 30 days of backups
    find "$BACKUP_DIR" -name "eduflow_*.db.gz" -mtime +30 -delete
    echo "✅ Old backups cleaned (kept last 30 days)"
    
    # Show backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
else
    echo "❌ Database file not found: $DB_PATH"
    exit 1
fi
