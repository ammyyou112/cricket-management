# Cricket 360 - Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or bun package manager
- Supabase account (free tier works)

## Step 1: Get Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or use existing)
3. Wait for project to be ready (~2 minutes)
4. Go to **Settings** → **API**
5. Copy:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon public** key (long string starting with eyJ...)

## Step 2: Configure Environment

1. Copy `.env.example` to `.env.local`:
```bash
   cp .env.example .env.local
```

2. Open `.env.local` and paste your credentials:
```env
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

3. Save the file

## Step 3: Install Dependencies
```bash
npm install @supabase/supabase-js
npm install -D supabase
```

## Step 4: Initialize Supabase
```bash
npx supabase init
```

This creates the supabase/ directory structure.

## Step 5: Link to Your Project (Optional for Local Dev)
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

Get your project-ref from the Supabase dashboard URL.

## Step 6: Start Local Development (Optional)
```bash
npx supabase start
```

This starts a local Supabase instance for development.

## Verification

Run this command to check if everything is configured:
```bash
node -e "console.log('Supabase URL:', process.env.VITE_SUPABASE_URL)"
```

Should output your Supabase URL.

## Next Steps

Follow the prompts in order:
1. ✅ Directory Structure (this step)
2. Database Schema
3. Authentication Setup
4. Service Layer Implementation
5. Testing & Deployment

## Troubleshooting

**Issue:** "Missing environment variables"
- **Solution:** Make sure `.env.local` exists and has correct values

**Issue:** "Cannot connect to Supabase"
- **Solution:** Verify URL and key are correct, check if project is paused

**Issue:** "Supabase CLI not found"
- **Solution:** Run `npm install -D supabase`

