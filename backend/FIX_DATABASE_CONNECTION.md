# 🔧 Fix Database Connection Error (P1001)

## Problem
The error shows: `Can't reach database server at db.ywufxezickfiaejbvgwl.supabase.co:6543`

This means your `.env` file is using the **wrong hostname format**.

## Solution

### Step 1: Update DATABASE_URL and DIRECT_URL

Your `.env` file should use the **pooler hostname**, not the old format.

**❌ WRONG (Current):**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:6543/postgres?pgbouncer=true"
```

**✅ CORRECT (Should be):**
```env
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Step 2: Get Your Database Password

1. Go to: https://app.supabase.com/project/ywufxezickfiaejbvgwl/settings/database
2. Scroll to **Connection String** section
3. Click **URI** tab
4. Copy the password (between `:` and `@`)
5. If password is not visible, go to **Database Password** section and reset it

### Step 3: Update backend/.env

Replace the DATABASE_URL and DIRECT_URL lines with:

```env
# Connection pooling URL (for Prisma queries - uses pgbouncer)
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection URL (for Prisma migrations - no pgbouncer)
DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Important changes:**
- ✅ Use `postgres.ywufxezickfiaejbvgwl` (with dot) instead of `postgres`
- ✅ Use `aws-0-ap-southeast-1.pooler.supabase.com` instead of `db.ywufxezickfiaejbvgwl.supabase.co`
- ✅ Replace `[YOUR-PASSWORD]` with your actual database password

### Step 4: Test Connection

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on http://localhost:3000
```

## Quick Fix Script

If you know your password, you can run this PowerShell command (replace `YOUR_PASSWORD`):

```powershell
cd backend
$password = "YOUR_PASSWORD"
$content = Get-Content .env
$content = $content -replace 'DATABASE_URL="postgresql://postgres:[^@]+@db\.ywufxezickfiaejbvgwl\.supabase\.co:6543', "DATABASE_URL=`"postgresql://postgres.ywufxezickfiaejbvgwl:$password@aws-0-ap-southeast-1.pooler.supabase.com:6543"
$content = $content -replace 'DIRECT_URL="postgresql://postgres:[^@]+@db\.ywufxezickfiaejbvgwl\.supabase\.co:5432', "DIRECT_URL=`"postgresql://postgres.ywufxezickfiaejbvgwl:$password@aws-0-ap-southeast-1.pooler.supabase.com:5432"
$content | Set-Content .env
```

## Common Issues

1. **Wrong hostname format** - Use pooler hostname, not `db.xxx.supabase.co`
2. **Wrong username format** - Use `postgres.ywufxezickfiaejbvgwl` (with project ref)
3. **Incorrect password** - Get password from Supabase dashboard
4. **Project paused** - Check if Supabase project is active

