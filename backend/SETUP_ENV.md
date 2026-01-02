# Environment Setup Instructions

## Quick Setup

1. **Create `.env` file** in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env  # If .env.example exists
   # OR create .env manually
   ```

2. **Copy the following content** into `backend/.env`:

```env
# =====================================================
# CRICKET 360 BACKEND - ENVIRONMENT VARIABLES
# =====================================================

# =====================================================
# SERVER CONFIGURATION
# =====================================================
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=/api/v1

# =====================================================
# DATABASE CONFIGURATION (Supabase PostgreSQL)
# =====================================================
# Direct connection (for migrations and Prisma Studio)
DATABASE_URL="postgresql://postgres.ywufxezickfiaejbvgwl:124578@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection URL (without connection pooling - for migrations)
# IMPORTANT: Replace [YOUR-DB-PASSWORD] with your actual database password
# See GET_DB_PASSWORD.md for instructions
DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-DB-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# =====================================================
# JWT CONFIGURATION (for backend authentication)
# =====================================================
# Generate secure random strings for these
JWT_SECRET=cricket360-super-secret-jwt-key-min-32-characters-change-this
JWT_REFRESH_SECRET=cricket360-refresh-token-secret-min-32-chars-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# =====================================================
# SUPABASE CONFIGURATION (for file storage - will use later)
# =====================================================
SUPABASE_URL=https://ywufxezickfiaejbvgwl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dWZ4ZXppY2tmaWFlamJ2Z3dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxNDExNywiZXhwIjoyMDgxOTkwMTE3fQ.siNNuX17Pi_4cv-TSorSpsZK4R0dGwW-aLXHzGTjDrw
SUPABASE_STORAGE_BUCKET=cricket360-uploads

# =====================================================
# CORS CONFIGURATION
# =====================================================
# Frontend URL (primary frontend origin)
FRONTEND_URL=http://localhost:8080
# Additional allowed origins (comma-separated)
# Default includes: http://localhost:5173, http://localhost:8080, http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000

# =====================================================
# FILE UPLOAD CONFIGURATION
# =====================================================
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# =====================================================
# EMAIL CONFIGURATION (Optional - for later)
# =====================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# =====================================================
# RATE LIMITING
# =====================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =====================================================
# LOGGING
# =====================================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

3. **Get your database password** - Follow instructions in `GET_DB_PASSWORD.md`

4. **Update DIRECT_URL** in `.env` with your actual password

5. **Test the connection**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Important Notes

- The `.env` file is in `.gitignore` and will not be committed to version control
- Never share your `.env` file or commit it to Git
- `DATABASE_URL` uses connection pooling (port 6543) for application queries
- `DIRECT_URL` uses direct connection (port 5432) for migrations and Prisma Studio

