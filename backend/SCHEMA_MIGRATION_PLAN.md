# Database Schema Migration Plan
## Phase 3: Schema Changes for Enhanced Scoring System

**Date:** 2026-01-21  
**Status:** Schema Updated, Migration Pending

---

## Changes Summary

### 1. MatchStatus Enum - UPDATED
**Added:**
- `SCORING_PENDING` - Match start requested, awaiting opponent approval
- `FIRST_INNINGS` - First innings in progress
- `SECOND_INNINGS_PENDING` - First innings ended, awaiting approval for second
- `SECOND_INNINGS` - Second innings in progress
- `FINAL_PENDING` - Match ended, final score awaiting verification
- `DISPUTED` - Match score is disputed

**Kept for backward compatibility:**
- `SCHEDULED` - Match created, not started
- `LIVE` - Match in progress (deprecated, use FIRST_INNINGS or SECOND_INNINGS)
- `COMPLETED` - Match finished and verified
- `CANCELLED` - Match cancelled

---

### 2. Match Model - ENHANCED

**New Fields Added:**
```prisma
// Innings tracking
firstInningsComplete    Boolean  @default(false)
secondInningsComplete  Boolean  @default(false)

// Approval tracking
scoringStartApprovedBy  String?
scoringStartApprovedAt  DateTime?
secondInningsApprovedBy String?
secondInningsApprovedAt DateTime?
finalScoreApprovedBy    Json?    // Array of captain IDs
finalScoreApprovedAt    DateTime?
```

**New Relations:**
- `balls` → Ball[]
- `approvalRequests` → ApprovalRequest[]
- `auditLogs` → AuditLog[]

---

### 3. New Models Created

#### 3.1 Ball Model
**Purpose:** Ball-by-ball scoring records

**Key Fields:**
- `matchId`, `innings`, `overNumber`, `ballNumber`
- `batsmanOnStrike`, `batsmanNonStrike`, `bowler`
- `runs`, `isWicket`, `wicketType`, `dismissedPlayer`, `fielder`
- `isWide`, `isNoBall`, `isBye`, `isLegBye`
- `timestamp`, `enteredBy`

**Indexes:**
- `[matchId, innings, overNumber]` - For efficient over queries
- `[matchId]` - For match ball history
- `[batsmanOnStrike]`, `[bowler]` - For player stats calculation

---

#### 3.2 ApprovalRequest Model
**Purpose:** Unified approval system for all 3 approval points

**Key Fields:**
- `matchId`, `type` (START_SCORING, START_SECOND_INNINGS, FINAL_SCORE)
- `requestedBy`, `approvedBy`
- `status` (PENDING, APPROVED, REJECTED, AUTO_APPROVED, EXPIRED, CANCELLED)
- `autoApproveAt`, `autoApproveEnabled`, `wasAutoApproved`

**Indexes:**
- `[matchId]`, `[requestedBy]`, `[status]`
- `[autoApproveAt]` - For cron job queries
- `[type, status]` - For filtering by approval type

---

#### 3.3 CaptainSettings Model
**Purpose:** Store captain timeout preferences

**Key Fields:**
- `userId` (unique)
- `autoApproveEnabled` (default: true)
- `timeoutMinutes` (default: 5)
- `notifyOnAutoApprove` (default: true)

---

#### 3.4 AuditLog Model
**Purpose:** Comprehensive audit trail

**Key Fields:**
- `matchId`, `action`, `performedBy`, `performedAt`
- `previousState`, `newState` (JSON)
- `approvalType`, `wasAutoApproved`
- `ballNumber`, `overNumber`
- `ipAddress`, `userAgent`

**Indexes:**
- `[matchId, performedAt]` - Match timeline
- `[action, performedAt]` - Action history
- `[performedBy]` - User activity

---

### 4. User Model - ENHANCED

**New Relations Added:**
- `ballsEntered` → Ball[] (as scorer)
- `batsmanOnStrike` → Ball[] (as striker)
- `batsmanNonStrike` → Ball[] (as non-striker)
- `bowled` → Ball[] (as bowler)
- `newApprovalRequests` → ApprovalRequest[] (as requester)
- `newApprovalsGiven` → ApprovalRequest[] (as approver)
- `captainSettings` → CaptainSettings?
- `auditLogs` → AuditLog[]

---

### 5. Enums Added

#### ApprovalType
- `START_SCORING`
- `START_SECOND_INNINGS`
- `FINAL_SCORE`

#### ApprovalStatus
- `PENDING`
- `APPROVED`
- `REJECTED`
- `AUTO_APPROVED`
- `EXPIRED`
- `CANCELLED`

#### WicketType
- `BOWLED`
- `CAUGHT`
- `LBW`
- `RUN_OUT`
- `STUMPED`
- `HIT_WICKET`
- `RETIRED_HURT`

#### AuditAction
- `MATCH_CREATED`
- `STATUS_CHANGED`
- `APPROVAL_REQUESTED`
- `APPROVAL_GRANTED`
- `APPROVAL_REJECTED`
- `APPROVAL_AUTO_APPROVED`
- `BALL_ENTERED`
- `BALL_DELETED`
- `BALL_MODIFIED`
- `INNINGS_ENDED`
- `STATS_CALCULATED`
- `STATS_UPDATED`
- `TIMEOUT_ENABLED`
- `TIMEOUT_DISABLED`

---

### 6. NotificationType Enum - ENHANCED

**Added:**
- `APPROVAL_REQUESTED`
- `APPROVAL_GRANTED`
- `APPROVAL_AUTO_APPROVED`
- `MATCH_STATUS_CHANGED`

---

## Migration Strategy

### Step 1: Create Migration
```bash
cd backend
npx prisma migrate dev --name add_enhanced_scoring_system
```

### Step 2: Data Migration (if needed)
- Existing `LIVE` matches → Convert to `FIRST_INNINGS` or `SECOND_INNINGS` based on `currentInning`
- Existing `MatchStartApproval` records → Keep for backward compatibility
- Existing `MatchScoreVerification` records → Keep as-is

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Update Application Code
- Update controllers to use new models
- Update services to use new status flow
- Update frontend to use new statuses

---

## Backward Compatibility

### Preserved Models
- ✅ `MatchStartApproval` - Kept for existing data
- ✅ `MatchScoreVerification` - Kept for existing data
- ✅ `MatchStatus.LIVE` - Kept for existing matches

### Migration Path
1. New matches use new status flow
2. Existing matches can be migrated gradually
3. Old approval system continues to work
4. New approval system runs in parallel

---

## Next Steps

1. ✅ Schema updated
2. ⏭️ Create migration
3. ⏭️ Generate Prisma client
4. ⏭️ Update backend controllers
5. ⏭️ Update frontend components

---

**END OF MIGRATION PLAN**

