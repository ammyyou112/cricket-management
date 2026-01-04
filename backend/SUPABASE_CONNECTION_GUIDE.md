# 🔧 Supabase Database Connection Guide

## Connection String Formats

Supabase provides different connection modes. For Prisma, use **Session Mode**.

### ✅ CORRECT: Session Mode (Recommended for Prisma)

**Option 1: Using Pooler Hostname (Recommended)**
```env
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Option 2: Using Direct Hostname**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres"
```

### ❌ WRONG: Transaction Pooler (Not for Prisma)

```env
# DON'T USE THIS - Causes "Tenant or user not found" error
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## How to Get Correct Connection String

1. Go to: https://app.supabase.com/project/ywufxezickfiaejbvgwl/settings/database
2. Scroll to **Connection String** section
3. Select **Session mode** (NOT Transaction mode)
4. Copy the URI string
5. Replace `[YOUR-PASSWORD]` with your actual password

## Current Configuration

Your `.env` should have:
```env
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:wR8C8hhmRfYje2Aa@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:wR8C8hhmRfYje2Aa@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

## Troubleshooting

### Error: "Can't reach database server"
- ✅ Check if Supabase project is **ACTIVE** (not paused)
- ✅ Verify password is correct
- ✅ Check firewall/network connectivity
- ✅ Try using direct hostname: `db.ywufxezickfiaejbvgwl.supabase.co:5432`

### Error: "Tenant or user not found"
- ✅ Use Session Mode (port 5432), NOT Transaction Mode (port 6543)
- ✅ Username format: `postgres.ywufxezickfiaejbvgwl` (with project ref) for pooler
- ✅ Username format: `postgres` (without project ref) for direct

### Test Connection

```bash
cd backend
node test-connection.js
```

Expected output:
```
✅ Connected successfully!
✅ Query successful!
✅ All good! Database connection is working perfectly.
```

## Port Reference

- **5432**: Session Mode (for Prisma, migrations, Prisma Studio)
- **6543**: Transaction Pooler (NOT recommended for Prisma)

## Username Format

- **Pooler hostname**: `postgres.ywufxezickfiaejbvgwl` (with project ref)
- **Direct hostname**: `postgres` (without project ref)

