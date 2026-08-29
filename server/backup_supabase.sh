#!/bin/bash
# ClinicOS Nightly Supabase Backup Script
# Runs via cron on Oracle VM — dumps Supabase PostgreSQL to local file
# Keeps last 7 daily backups

BACKUP_DIR="/home/opc/axiogen-clinicos/backups"
DB_URL="postgresql://postgres.rykurrsenvqernwnofpa:Adi.patil%231@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="${BACKUP_DIR}/clinicos_backup_${DATE}.sql.gz"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "$(date) - Starting Supabase backup..."

# Dump database (use pg_dump if available, otherwise use node script)
if command -v pg_dump &> /dev/null; then
  PGPASSWORD=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p' | python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))") \
  pg_dump -h aws-0-ap-south-1.pooler.supabase.com -p 6543 -U postgres.rykurrsenvqernwnofpa -d postgres --no-owner --no-privileges --clean --if-exists 2>/dev/null | gzip > "$BACKUP_FILE"
else
  # Fallback: use node to dump critical tables as JSON
  cd /home/opc/axiogen-clinicos
  node -e "
    const { sequelize, User, Patient, Queue, CasePaper, Template, Clinic, OPDRegister, AuditLog, Medicine } = require('./server/models');
    const fs = require('fs');
    (async () => {
      const data = {};
      try { data.users = await User.findAll({ raw: true }); } catch(e) {}
      try { data.patients = await Patient.findAll({ raw: true }); } catch(e) {}
      try { data.queues = await Queue.findAll({ raw: true }); } catch(e) {}
      try { data.casePapers = await CasePaper.findAll({ raw: true }); } catch(e) {}
      try { data.templates = await Template.findAll({ raw: true }); } catch(e) {}
      try { data.clinics = await Clinic.findAll({ raw: true }); } catch(e) {}
      try { data.opdRegisters = await OPDRegister.findAll({ raw: true }); } catch(e) {}
      try { data.auditLogs = await AuditLog.findAll({ order: [['id', 'DESC']], limit: 500, raw: true }); } catch(e) {}
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync('${BACKUP_DIR}/clinicos_backup_${DATE}.json', json);
      console.log('Backup complete: ' + Object.keys(data).map(k => k + '=' + (data[k]||[]).length).join(', '));
      process.exit(0);
    })();
  " 2>/dev/null
  # Compress the JSON backup
  if [ -f "${BACKUP_DIR}/clinicos_backup_${DATE}.json" ]; then
    gzip "${BACKUP_DIR}/clinicos_backup_${DATE}.json"
    BACKUP_FILE="${BACKUP_DIR}/clinicos_backup_${DATE}.json.gz"
  fi
fi

# Check if backup was created
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "$(date) - Backup SUCCESS: $BACKUP_FILE ($SIZE)"
else
  echo "$(date) - Backup FAILED: no output file created"
  exit 1
fi

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "clinicos_backup_*" -mtime +${KEEP_DAYS} -delete 2>/dev/null
echo "$(date) - Cleaned backups older than ${KEEP_DAYS} days"

REMAINING=$(ls -1 "$BACKUP_DIR"/clinicos_backup_* 2>/dev/null | wc -l)
echo "$(date) - Total backups on disk: $REMAINING"
