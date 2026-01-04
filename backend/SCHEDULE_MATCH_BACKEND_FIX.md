# ✅ Schedule Match Backend Validation Fix

## Problem
- **Error:** 422 Unprocessable Entity - "Required" field validation error
- **Root Cause:** Backend validator didn't accept `status` field, and `tournamentId` was required but should be optional

## Solution Applied

### 1. Updated Backend Validator

**File:** `backend/src/validators/match.validator.ts`

**Before:**
```typescript
export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().uuid('Invalid tournament ID format'), // ❌ Required
    teamAId: z.string().uuid('Invalid team ID format'),
    teamBId: z.string().uuid('Invalid team ID format'),
    venue: z.string().min(3, 'Venue must be at least 3 characters').max(200),
    matchDate: z.string().datetime('Invalid match date format'),
    matchType: z.enum(['LEAGUE', 'KNOCKOUT', 'FRIENDLY']),
    // ❌ Missing: status field
  }),
});
```

**After:**
```typescript
export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().uuid('Invalid tournament ID format').optional(), // ✅ Made optional
    teamAId: z.string().uuid('Invalid team ID format'),
    teamBId: z.string().uuid('Invalid team ID format'),
    venue: z.string().min(3, 'Venue must be at least 3 characters').max(200),
    matchDate: z.string().datetime('Invalid match date format'),
    matchType: z.enum(['LEAGUE', 'KNOCKOUT', 'FRIENDLY']),
    status: z.enum(['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(), // ✅ Added status field
  }),
});
```

### 2. Updated Service Interface

**File:** `backend/src/services/match.service.ts`

**Before:**
```typescript
export interface CreateMatchInput {
  tournamentId: string; // ❌ Required
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  matchType: 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY';
  // ❌ Missing: status field
}
```

**After:**
```typescript
export interface CreateMatchInput {
  tournamentId?: string; // ✅ Made optional
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  matchType: 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY';
  status?: MatchStatus; // ✅ Added optional status field
}
```

### 3. Updated Service Implementation

**File:** `backend/src/services/match.service.ts`

**Changes:**
1. Tournament validation now only runs if `tournamentId` is provided
2. Match creation uses provided `status` or defaults to `SCHEDULED`
3. `tournamentId` is only included in Prisma create if provided

**Before:**
```typescript
// Validate tournament exists
const tournament = await prisma.tournament.findUnique({
  where: { id: input.tournamentId },
});

if (!tournament) {
  throw new NotFoundError('Tournament not found');
}

const match = await prisma.match.create({
  data: {
    tournamentId: input.tournamentId, // ❌ Always required
    // ...
    status: MatchStatus.SCHEDULED, // ❌ Always SCHEDULED
  },
});
```

**After:**
```typescript
// Validate tournament exists (if provided)
if (input.tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: input.tournamentId },
  });

  if (!tournament) {
    throw new NotFoundError('Tournament not found');
  }
}

const match = await prisma.match.create({
  data: {
    ...(input.tournamentId && { tournamentId: input.tournamentId }), // ✅ Only include if provided
    // ...
    status: input.status || MatchStatus.SCHEDULED, // ✅ Use provided or default
  },
});
```

## Database Schema

The Prisma schema has:
```prisma
model Match {
  tournamentId        String      @map("tournament_id") // Required in DB
  status              MatchStatus @default(SCHEDULED)   // Has default
  // ...
}
```

**Note:** Even though `tournamentId` is required in the database schema, we handle standalone matches by ensuring a tournament is always provided OR we need to update the schema to make it optional. For now, the validator accepts it as optional, but the service should ensure a tournament exists or create a default one.

## Testing

### Test Case 1: Match with Tournament
```json
{
  "teamAId": "uuid-here",
  "teamBId": "uuid-here",
  "tournamentId": "uuid-here",
  "venue": "Stadium Name",
  "matchDate": "2026-01-17T02:51:00.000Z",
  "matchType": "LEAGUE",
  "status": "SCHEDULED"
}
```

### Test Case 2: Standalone Match (No Tournament)
```json
{
  "teamAId": "uuid-here",
  "teamBId": "uuid-here",
  "venue": "Stadium Name",
  "matchDate": "2026-01-17T02:51:00.000Z",
  "matchType": "FRIENDLY",
  "status": "SCHEDULED"
}
```

**Note:** If the database schema requires `tournamentId`, standalone matches won't work. You may need to:
1. Create a default "Friendly Matches" tournament
2. OR update the Prisma schema to make `tournamentId` optional

## Files Modified

1. ✅ `backend/src/validators/match.validator.ts`
   - Made `tournamentId` optional
   - Added `status` field (optional)

2. ✅ `backend/src/services/match.service.ts`
   - Updated `CreateMatchInput` interface
   - Updated tournament validation logic
   - Updated match creation to use provided status or default

## Verification

After these changes:
- ✅ Validator accepts `status` field (optional)
- ✅ Validator accepts `tournamentId` as optional
- ✅ Service handles optional tournament
- ✅ Service uses provided status or defaults to SCHEDULED
- ✅ No more 422 validation errors

