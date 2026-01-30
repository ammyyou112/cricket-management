# Database Migration Instructions
## Enhanced Scoring System Migration

**Date:** 2026-01-21  
**Migration Name:** `add_enhanced_scoring_system`

---

## ⚠️ Important Notes

1. **Backup Database First!** Always backup your database before running migrations
2. **Review Migration SQL** before applying
3. **Test in Development** before production
4. **Backward Compatible** - Existing data will be preserved

---

## Migration Steps

### Option 1: Interactive Migration (Recommended for Development)

```bash
cd backend
npx prisma migrate dev --name add_enhanced_scoring_system
```

This will:
- Create migration SQL file
- Apply migration to development database
- Regenerate Prisma client

### Option 2: Create Migration Only (Review First)

```bash
cd backend
npx prisma migrate dev --create-only --name add_enhanced_scoring_system
```

Then review the generated SQL in `prisma/migrations/YYYYMMDDHHMMSS_add_enhanced_scoring_system/migration.sql`

Apply manually:
```bash
npx prisma migrate deploy
```

### Option 3: Production Deployment

```bash
cd backend
npx prisma migrate deploy
```

---

## What This Migration Does

### 1. Updates MatchStatus Enum
- Adds: `SCORING_PENDING`, `FIRST_INNINGS`, `SECOND_INNINGS_PENDING`, `SECOND_INNINGS`, `FINAL_PENDING`, `DISPUTED`
- Keeps: `SCHEDULED`, `LIVE`, `COMPLETED`, `CANCELLED` (for backward compatibility)

### 2. Adds New Columns to `matches` Table
- `first_innings_complete` (Boolean, default: false)
- `second_innings_complete` (Boolean, default: false)
- `scoring_start_approved_by` (String, nullable)
- `scoring_start_approved_at` (DateTime, nullable)
- `second_innings_approved_by` (String, nullable)
- `second_innings_approved_at` (DateTime, nullable)
- `final_score_approved_by` (JSON, nullable)
- `final_score_approved_at` (DateTime, nullable)

### 3. Creates New Tables

#### `balls` Table
- Ball-by-ball scoring records
- Foreign keys to `matches` and `users`
- Indexes for performance

#### `approval_requests` Table
- Unified approval system
- Supports 3 approval types
- Auto-approval tracking

#### `captain_settings` Table
- Captain timeout preferences
- One-to-one with users

#### `audit_logs` Table
- Comprehensive audit trail
- JSON state tracking
- Indexed for performance

### 4. Updates User Relations
- New relations for ball tracking
- New approval relations
- Settings relation

---

## Data Migration Notes

### Existing Data Handling:
- ✅ Existing matches preserved
- ✅ Existing `MatchStartApproval` records preserved
- ✅ Existing `MatchScoreVerification` records preserved
- ✅ Existing `PlayerStat` records preserved

### Status Migration:
- Existing `LIVE` matches → Can be manually updated to `FIRST_INNINGS` or `SECOND_INNINGS`
- Existing `COMPLETED` matches → Stay as `COMPLETED`
- New matches → Use new status flow

---

## Rollback Plan

If migration needs to be rolled back:

1. **Backup current data**
2. **Revert schema.prisma** to previous version
3. **Create rollback migration:**
   ```bash
   npx prisma migrate dev --name rollback_enhanced_scoring
   ```
4. **Or manually drop new tables/columns**

---

## Post-Migration Steps

1. **Verify Migration:**
   ```bash
   npx prisma studio
   ```
   Check that all tables exist and have correct structure

2. **Test Endpoints:**
   - Test ball entry
   - Test approval requests
   - Test stats calculation

3. **Monitor:**
   - Check application logs
   - Monitor database performance
   - Verify auto-approval job running

---

## SQL Preview (What Will Be Generated)

The migration will include SQL similar to:

```sql
-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'SCORING_PENDING';
ALTER TYPE "MatchStatus" ADD VALUE 'FIRST_INNINGS';
-- ... (other new statuses)

-- AlterTable
ALTER TABLE "matches" ADD COLUMN "first_innings_complete" BOOLEAN DEFAULT false;
-- ... (other new columns)

-- CreateTable
CREATE TABLE "balls" (
  "id" TEXT NOT NULL,
  "match_id" TEXT NOT NULL,
  -- ... (all ball fields)
);

-- CreateTable
CREATE TABLE "approval_requests" (
  "id" TEXT NOT NULL,
  -- ... (all approval fields)
);

-- ... (other tables)
```

---

## Troubleshooting

### Error: "enum value already exists"
- Some statuses might already exist
- Migration will skip existing enum values

### Error: "column already exists"
- Some columns might have been added manually
- Review and adjust migration SQL

### Error: "foreign key constraint"
- Ensure all referenced tables exist
- Check foreign key relationships

---

## Support

If migration fails:
1. Check error message
2. Review generated SQL
3. Verify database connection
4. Check Prisma schema syntax

---

**END OF MIGRATION INSTRUCTIONS**

