# Database Backup & Disaster Recovery Procedure
**Career Guidance Academy (C.G.A)**

---

## 1. Overview
Career Guidance Academy operates on a managed PostgreSQL database instance hosted via Supabase. All critical student profiles, mock test attempts, financial ledgers, and authentication identities must have automated daily backups and verified point-in-time recovery (PITR) procedures.

---

## 2. Supabase Automated Backups
1. **Daily Snapshots (Free / Pro Tier):**
   - Supabase automatically takes scheduled physical backups of Postgres databases once daily.
   - Retention: 7 days on Pro Tier (or 30 days with Point-In-Time-Recovery).
2. **Point-In-Time Recovery (PITR):**
   - For real-time production launch, PITR should be activated in the Supabase Dashboard:
     `Dashboard -> Database -> Backups -> Point-In-Time-Recovery`.
   - Allows restoring the database to any millisecond within the retention window.

---

## 3. Manual On-Demand Logical Backup (CLI / pg_dump)
Administrators or DevOps engineers can create an encrypted off-site logical snapshot before major schema migrations or semester resets:

```bash
# 1. Export entire database schema and data using pg_dump via connection pooling string:
pg_dump "postgres://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --file "cga_backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Compress the SQL dump:
gzip "cga_backup_$(date +%Y%m%d_%H%M%S).sql"

# 3. Verify backup checksum:
sha256sum "cga_backup_$(date +%Y%m%d_%H%M%S).sql.gz" > "cga_backup_checksum.txt"
```

---

## 4. Disaster Recovery & Restoration Procedure
In the event of accidental data corruption or disaster recovery testing:

### Option A: Restore via Supabase Dashboard
1. Open `Dashboard -> Database -> Backups`.
2. Locate the backup snapshot prior to the incident.
3. Select **Restore to new project** (Recommended to prevent accidental overwrites during investigation) or **Restore to current project**.

### Option B: Restore via pg_restore / psql
```bash
# 1. Test restore against a clean staging database instance first:
createdb cga_recovery_test

# 2. Apply the dump:
psql "postgres://postgres.[NEW_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  -f "cga_backup_20261017.sql"

# 3. Run live verification test suite to ensure RLS, triggers, and indices restored cleanly:
node tests/security_idor_suite.mjs
```

---

## 5. Free Plan Boundaries & Storage Advisories
- **Connection Limits:** Free tier offers 60 direct client connections and 200 pooled connections via Supavisor. Always use pooler port `6543` for serverless route handlers.
- **Database Storage:** Capped at 500 MB on the Free tier. Payment screenshots must reside exclusively in Supabase Storage buckets, NEVER in database bytea columns.
- **Egress Limits:** 2 GB egress / month on Free tier. PDF study materials and student photos should leverage edge CDN caching.
