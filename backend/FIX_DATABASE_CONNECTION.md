# Fix Database Connection Issue

## Problem
The database connection is failing because it's trying to use the **connection pooler** (port 6543) which may not be accessible from your network.

```
Error: Can't reach database server at `aws-1-ap-south-1.pooler.supabase.com:6543`
```

## Solution: Use Direct Connection

### Step 1: Get Your Direct Connection String

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Select **URI** tab (not Transaction Pooler)
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres
   ```

### Step 2: Update Your .env File

Open `backend/.env` and update `DATABASE_URL`:

**❌ WRONG (Connection Pooler - Port 6543):**
```env
DATABASE_URL=postgresql://postgres.ywufxezickfiaejbvgwl:****@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**✅ CORRECT (Direct Connection - Port 5432):**
```env
DATABASE_URL=postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres
```

**Important Notes:**
- Use port **5432** (not 6543)
- Use `db.[PROJECT-REF].supabase.co` (not `aws-1-ap-south-1.pooler.supabase.com`)
- Remove `?pgbouncer=true` parameter
- Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Optional - Set DIRECT_URL

If you want to use both pooler and direct connection, you can set:

```env
DATABASE_URL=postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres
```

Prisma will use `DIRECT_URL` for migrations and `DATABASE_URL` for queries.

### Step 4: Test the Connection

After updating `.env`, test the connection:

```bash
cd backend
node test-connection.js
```

You should see:
```
✅ Connected successfully!
✅ Query successful!
✅ All good! Database connection is working perfectly.
```

### Step 5: Restart the Server

```bash
npm run dev
```

## Alternative: Check Supabase Project Status

If the direct connection also fails:

1. Go to https://app.supabase.com
2. Check if your project shows as **"Active"** (not "Paused")
3. If paused, click **"Restore"** to reactivate it
4. Wait 1-2 minutes for the project to start

## Network/Firewall Issues

If you're behind a corporate firewall or VPN:

1. **Try direct connection first** (port 5432)
2. If that doesn't work, check if your network blocks PostgreSQL ports
3. You may need to whitelist:
   - `db.ywufxezickfiaejbvgwl.supabase.co:5432`
   - Or use Supabase REST API instead (requires code changes)

## Quick Fix Summary

1. Get direct connection string from Supabase Dashboard (Settings → Database → URI)
2. Update `DATABASE_URL` in `backend/.env` to use port 5432
3. Remove `?pgbouncer=true` parameter
4. Test with `node test-connection.js`
5. Restart server


