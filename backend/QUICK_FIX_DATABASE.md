# ⚡ QUICK FIX: Database Connection Error

## The Problem
Your backend is trying to connect using the **connection pooler** (port 6543) which is blocked:
```
Can't reach database server at `aws-1-ap-south-1.pooler.supabase.com:6543`
```

## The Solution (2 minutes)

### Step 1: Get Direct Connection String

1. Go to: https://app.supabase.com
2. Select your project
3. Click **Settings** → **Database**
4. Scroll to **Connection string**
5. Click the **URI** tab (NOT "Transaction Pooler")
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres.ywufxezickfiaejbvgwl:[PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres
   ```

### Step 2: Update backend/.env

Open `backend/.env` and find this line:
```env
DATABASE_URL=postgresql://postgres.ywufxezickfiaejbvgwl:****@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Replace it with** the direct connection string from Step 1:
```env
DATABASE_URL=postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@db.ywufxezickfiaejbvgwl.supabase.co:5432/postgres
```

**Key changes:**
- ✅ Port **5432** (not 6543)
- ✅ Host: `db.ywufxezickfiaejbvgwl.supabase.co` (not `aws-1-ap-south-1.pooler.supabase.com`)
- ✅ Remove `?pgbouncer=true`

### Step 3: Restart Backend Server

Stop the server (Ctrl+C) and restart:
```bash
cd backend
npm run dev
```

## Verify It Works

You should see:
```
✅ Database connected successfully
🚀 Server running on http://localhost:3000
```

Instead of:
```
❌ Database connection failed
```

## Still Not Working?

1. **Check Supabase project status** - Make sure it's "Active" (not paused)
2. **Verify password** - Make sure the password in the connection string is correct
3. **Check firewall** - Some networks block port 5432, try a different network

## Need Help?

See `backend/FIX_DATABASE_CONNECTION.md` for detailed troubleshooting.

