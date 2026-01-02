# How to Get Your Supabase Database Password

You need to get your database password from Supabase dashboard to complete the connection setup.

## Steps:

1. Go to: https://app.supabase.com/project/ywufxezickfiaejbvgwl/settings/database

2. Scroll down to **Connection String** section

3. Click on **URI** tab

4. You'll see a connection string like:
   ```
   postgresql://postgres.ywufxezickfiaejbvgwl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

5. Copy the password from the connection string (the part between `:` and `@`)

6. If you don't see the password or forgot it:
   - Scroll to **Database Password** section
   - Click **Reset Database Password** (if needed)
   - Copy the new password

7. Update `backend/.env` file:
   - Replace `[YOUR-DB-PASSWORD]` in the `DIRECT_URL` with your actual password
   - Example:
     ```
     DIRECT_URL="postgresql://postgres.ywufxezickfiaejbvgwl:your-actual-password-here@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
     ```

## Important Notes:

- **DATABASE_URL**: Uses port `6543` with connection pooling (pgbouncer) - for application queries
- **DIRECT_URL**: Uses port `5432` without pooling - for migrations and Prisma Studio
- Keep your password secure and never commit it to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits

## Verification:

After updating the password, test the connection:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

If successful, you should see:
- ✅ Prisma Client generated
- ✅ Migration created/applied successfully

