# 🔧 Prisma Schema Update: Make tournamentId Optional

## Current Status

✅ **TypeScript Fix Applied:**
- Conditional spread for `tournamentId` in match creation
- Conditional `emitMatchCreated` call
- TypeScript compilation errors resolved

⚠️ **Database Schema:**
- `tournamentId` is currently **REQUIRED** in Prisma schema
- This means matches **MUST** have a tournament
- Standalone matches (without tournament) will fail at runtime

## Option 1: Update Schema to Make tournamentId Optional (Recommended)

### Step 1: Update Prisma Schema

**File:** `backend/prisma/schema.prisma`

Find the `Match` model (around line 244) and update:

**BEFORE:**
```prisma
model Match {
  id            String       @id @default(uuid())
  teamAId       String       @map("team_a_id")
  teamBId       String       @map("team_b_id")
  tournamentId  String       @map("tournament_id") // ❌ Required
  venue         String
  matchDate     DateTime     @map("match_date")
  matchType     MatchType    @map("match_type")
  status        MatchStatus  @default(SCHEDULED)
  
  teamA         Team         @relation("MatchTeamA", fields: [teamAId], references: [id])
  teamB         Team         @relation("MatchTeamB", fields: [teamBId], references: [id])
  tournament    Tournament   @relation(fields: [tournamentId], references: [id], onDelete: Cascade) // ❌ Required
  
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  @@map("matches")
}
```

**AFTER:**
```prisma
model Match {
  id            String        @id @default(uuid())
  teamAId       String        @map("team_a_id")
  teamBId       String        @map("team_b_id")
  tournamentId  String?       @map("tournament_id") // ✅ Made optional
  venue         String
  matchDate     DateTime      @map("match_date")
  matchType     MatchType?    @map("match_type")
  status        MatchStatus   @default(SCHEDULED)
  
  teamA         Team          @relation("MatchTeamA", fields: [teamAId], references: [id])
  teamB         Team          @relation("MatchTeamB", fields: [teamBId], references: [id])
  tournament    Tournament?   @relation(fields: [tournamentId], references: [id], onDelete: SetNull) // ✅ Made optional, SetNull on delete
  
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  @@map("matches")
}
```

**Key Changes:**
1. `tournamentId String` → `tournamentId String?` (add `?` to make optional)
2. `tournament Tournament` → `tournament Tournament?` (add `?` to make relation optional)
3. `onDelete: Cascade` → `onDelete: SetNull` (when tournament is deleted, set match.tournamentId to NULL)

### Step 2: Create Migration

```bash
cd backend

# Create migration
npx prisma migrate dev --name make-tournament-optional

# Regenerate Prisma Client
npx prisma generate
```

### Step 3: Verify Migration

The migration will:
1. ✅ Alter `tournament_id` column to allow NULL
2. ✅ Update foreign key constraint
3. ✅ Regenerate Prisma types

### Step 4: Test

```bash
# Start backend
npm run dev

# Should see:
# ✅ Database connected successfully
# 🚀 Server running on http://localhost:3000
```

## Option 2: Create Default Tournament (Quick Fix)

If you don't want to change the schema, create a default tournament for standalone matches:

### Step 1: Create Default Tournament

**Using Prisma Studio:**
```bash
cd backend
npx prisma studio
```

Or **using SQL:**
```sql
INSERT INTO tournaments (id, name, description, status, start_date, end_date, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Standalone Matches',
  'Default tournament for matches not part of any specific tournament',
  'ONGOING',
  NOW(),
  '2099-12-31',
  NOW(),
  NOW()
);
```

### Step 2: Update Service

**File:** `backend/src/services/match.service.ts`

Add constant at top:
```typescript
const DEFAULT_TOURNAMENT_ID = '00000000-0000-0000-0000-000000000000';
```

Update createMatch:
```typescript
const match = await prisma.match.create({
  data: {
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    tournamentId: input.tournamentId || DEFAULT_TOURNAMENT_ID, // ✅ Always has value
    venue: input.venue,
    matchDate: new Date(input.matchDate),
    matchType: input.matchType as MatchType,
    status: input.status || MatchStatus.SCHEDULED,
  },
  // ...
});
```

## Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Option 1: Make Optional** | ✅ True standalone matches<br>✅ Cleaner data model<br>✅ No dummy records | ⚠️ Requires migration<br>⚠️ Need to handle NULL in queries |
| **Option 2: Default Tournament** | ✅ No schema change<br>✅ Quick to implement | ❌ Creates dummy records<br>❌ Less clean data model<br>❌ Need to filter out default tournament |

## Recommendation

**Use Option 1** (Make tournamentId optional) if:
- You want to support true standalone matches
- You want a cleaner data model
- You're okay with running a migration

**Use Option 2** (Default Tournament) if:
- You can't run migrations right now
- You need a quick fix
- You don't mind having a default tournament record

## Current Status After TypeScript Fix

✅ **TypeScript compilation:** No errors
✅ **Code logic:** Handles optional tournamentId correctly
⚠️ **Database:** Still requires tournamentId (will fail at runtime if not provided)

**To fully support standalone matches, choose one of the options above.**

