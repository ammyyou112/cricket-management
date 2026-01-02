# 🚀 Complete Setup Guide - Cricket 360

## Prerequisites Checklist

- [ ] Node.js (v18+) installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Supabase account created ([Sign up here](https://app.supabase.com))
- [ ] Code editor (VS Code recommended)

## Step-by-Step Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/ammyyou112/cricket-management.git
cd cricket-management
```

### 2️⃣ Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name:** Cricket 360 (or your preferred name)
   - **Database Password:** ⚠️ **Save this securely!** You'll need it for `.env`
   - **Region:** Choose closest to you
   - **Plan:** Free tier is fine for development
4. Wait for project creation (~2 minutes)

### 3️⃣ Get Database Credentials

1. In Supabase Dashboard, navigate to: **Project Settings** → **Database**
2. Find **Connection String** section
3. Copy both connection strings:
   - **Connection pooling** (port `:6543`) - for `DATABASE_URL`
   - **Direct connection** (port `:5432`) - for `DIRECT_URL`

**Example format:**
```
Connection pooling: postgresql://postgres:[YOUR-PASSWORD]@db.xyz123.supabase.co:6543/postgres?pgbouncer=true
Direct connection: postgresql://postgres:[YOUR-PASSWORD]@db.xyz123.supabase.co:5432/postgres
```

### 4️⃣ Get Supabase API Credentials

1. In Supabase Dashboard, go to: **Project Settings** → **API**
2. Copy:
   - **Project URL** → Use for `SUPABASE_URL`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ **Warning:** Service role key has admin privileges - keep it secret!

### 5️⃣ Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Open .env in your editor and update the values
```

**Edit `backend/.env` with your credentials:**

```env
# Database (paste from Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xyz123.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.xyz123.supabase.co:5432/postgres"

# Generate JWT secrets (run the command below)
JWT_SECRET=paste-generated-secret-here
JWT_REFRESH_SECRET=paste-another-generated-secret-here

# Supabase API
SUPABASE_URL=https://xyz123.supabase.co
SUPABASE_SERVICE_ROLE_KEY=paste-service-role-key-here

# CORS (usually no changes needed for local dev)
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Generate JWT Secrets:**

```bash
# Generate secure random strings (run twice for JWT_SECRET and JWT_REFRESH_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Install dependencies:**

```bash
npm install
```

**Setup database:**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all database tables)
npx prisma migrate dev

# Optional: Seed database with sample data (if seed script exists)
npx prisma db seed
```

**Start backend server:**

```bash
npm run dev
```

✅ **You should see:**
```
✅ Database connected successfully
🚀 Server running on http://localhost:3000
📍 API available at http://localhost:3000/api/v1
🔌 Socket.io server ready for real-time connections
🌍 Environment: development
```

### 6️⃣ Frontend Setup

```bash
# From project root
cd frontend

# Copy environment template
cp .env.example .env

# Usually no changes needed for local development
# The default VITE_API_BASE_URL=http://localhost:3000 should work
```

**Install dependencies:**

```bash
npm install
```

**Start frontend development server:**

```bash
npm run dev
```

✅ **You should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7️⃣ Verify Setup

1. **Backend Health Check:**
   - Open: http://localhost:3000/health
   - Should return: `{"status":"ok","timestamp":"...","uptime":...}`

2. **Frontend:**
   - Open: http://localhost:5173
   - Should see the Cricket 360 login page

3. **Test Registration:**
   - Register a new account
   - Check Supabase Dashboard → Authentication → Users
   - Your new user should appear

## 🔧 Common Issues & Solutions

### Issue: `Error: P1001: Can't reach database server`

**Possible causes:**
- Incorrect `DATABASE_URL` or `DIRECT_URL`
- Wrong database password
- Database hostname/port incorrect
- Network/firewall blocking connection

**Solutions:**
1. Double-check your connection strings from Supabase
2. Verify password is correct (no extra spaces)
3. Ensure you're using the correct port (6543 for DATABASE_URL, 5432 for DIRECT_URL)
4. Check Supabase project is active (not paused)

### Issue: `JWT secret is too short` or `JWT_SECRET is not configured`

**Solution:**
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are at least 32 characters
- Generate new secrets using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Issue: `CORS error` in browser console

**Solution:**
- Verify `CORS_ORIGIN` in `backend/.env` matches your frontend URL
- Default frontend URL: `http://localhost:5173`
- If using different port, update `CORS_ORIGIN` and `ALLOWED_ORIGINS`

### Issue: `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue: Database tables not created

**Solution:**
```bash
cd backend
npx prisma migrate dev
```

### Issue: `Port 3000 already in use`

**Solution:**
- Change `PORT` in `backend/.env` to a different port (e.g., `3001`)
- Update `VITE_API_BASE_URL` in `frontend/.env` to match

## 📝 Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma connection string (with pgbouncer) | `postgresql://postgres:pass@db.xyz.co:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct database connection (for migrations) | `postgresql://postgres:pass@db.xyz.co:5432/postgres` |
| `JWT_SECRET` | Secret for access tokens (32+ chars) | `abc123...` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) | `xyz789...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyz123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |

### Backend Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `HOST` | `localhost` | Server host |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `MAX_FILE_SIZE` | `5242880` | Max upload size (5MB) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Logging level |

### Frontend Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API base URL |
| `VITE_APP_NAME` | `Cricket 360` | App name |
| `VITE_NODE_ENV` | `development` | Environment mode |

## 🚀 Next Steps

After setup is complete:

1. **Create your first admin account:**
   - Register through the frontend
   - Update user role to `ADMIN` in Supabase Dashboard → Authentication → Users

2. **Create teams and tournaments:**
   - Login as admin
   - Navigate to admin dashboard
   - Create tournaments and schedule matches

3. **Invite players:**
   - Login as captain
   - Create a team
   - Invite players to join

4. **Explore features:**
   - Player dashboard
   - Captain team management
   - Admin tournament management
   - Live match scoring

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/ammyyou112/cricket-management/issues)
2. Review backend logs in `backend/logs/`
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Happy coding! 🏏**

