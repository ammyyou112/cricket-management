# Scoring System Discovery Report
## Phase 1: Current Implementation Analysis

**Date:** 2026-01-21  
**Purpose:** Document existing scoring system before implementing new requirements

---

## 1. DATABASE SCHEMA REVIEW

### 1.1 Match Model (`matches` table)

**Current Status Enum:**
```prisma
enum MatchStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELLED
}
```

**Current Match Fields:**
- `status` (MatchStatus) - Default: SCHEDULED
- `scoringStatus` (String?) - Default: "NOT_STARTED" - Values: "NOT_STARTED", "IN_PROGRESS", "COMPLETED"
- `currentInning` (Int?) - Default: 1
- `teamAScore`, `teamAWickets`, `teamAOvers` (Int/Decimal)
- `teamBScore`, `teamBWickets`, `teamBOvers` (Int/Decimal)
- `scoringStartedAt`, `scoringCompletedAt`, `scoringStartedBy`
- `scoringCaptainId` - Captain who is scoring
- `approvedByCaptainId` - Captain who approved start
- `winnerTeamId`

**Relations:**
- `scores` → MatchScore[] (one-to-many)
- `scoreVerifications` → MatchScoreVerification[] (one-to-many)
- `startApprovals` → MatchStartApproval[] (one-to-many)
- `playerStats` → PlayerStat[] (one-to-many)
- `scoreUpdates` → ScoreUpdate[] (one-to-many)

**GAPS IDENTIFIED:**
- ❌ No `SCORING_PENDING` status
- ❌ No `FIRST_INNINGS` status
- ❌ No `SECOND_INNINGS_PENDING` status
- ❌ No `SECOND_INNINGS` status
- ❌ No `FINAL_PENDING` status
- ❌ No tracking of first/second innings completion flags
- ❌ No separate approval tracking fields for each approval point

---

### 1.2 MatchScore Model (`match_scores` table)

**Current Structure:**
- `matchId`, `battingTeamId`
- `totalRuns`, `totalWickets`, `totalOvers`
- `extrasWide`, `extrasNoball`, `extrasBye`, `extrasLegbye`
- `inningsNumber` (Int) - Default: 1
- `isCompleted` (Boolean)

**GAPS IDENTIFIED:**
- ❌ No ball-by-ball tracking
- ❌ No individual ball records
- ❌ No batsman/bowler tracking per ball
- ❌ No wicket type tracking
- ❌ No fielder tracking

---

### 1.3 MatchScoreVerification Model (`match_score_verifications` table)

**Current Structure:**
- `matchId`, `submittedBy`, `verifiedBy`
- `status` (String) - Values: "PENDING", "VERIFIED", "DISPUTED", "FINAL", "CANCELLED"
- `teamAScore`, `teamBScore`, `teamAWickets`, `teamBWickets`
- `disputeReason`
- `submittedAt`, `verifiedAt`

**CURRENT WORKFLOW:**
1. Captain submits final score → Creates verification with status "PENDING"
2. Opponent captain verifies → Status becomes "VERIFIED" or "DISPUTED"
3. If disputed, admin resolves → Status becomes "FINAL"

**GAPS IDENTIFIED:**
- ❌ Only handles final score verification (one approval point)
- ❌ Missing approval for start scoring
- ❌ Missing approval for second innings start
- ❌ No auto-approval timeout mechanism
- ❌ No timeout settings tracking

---

### 1.4 MatchStartApproval Model (`match_start_approvals` table)

**Current Structure:**
- `matchId`, `requestedBy`, `approvedBy`
- `status` (String) - Values: "PENDING", "APPROVED", "REJECTED", "CANCELLED"
- `requestedAt`, `respondedAt`

**CURRENT WORKFLOW:**
1. Captain requests match start → Creates approval with status "PENDING"
2. Opponent captain approves/rejects → Status becomes "APPROVED" or "REJECTED"
3. If approved, match status changes to "LIVE"

**GAPS IDENTIFIED:**
- ❌ Only handles start approval (one approval point)
- ❌ Missing approval for second innings
- ❌ Missing approval for final score
- ❌ No auto-approval timeout mechanism
- ❌ No timeout settings tracking
- ❌ No `autoApproveAt` field
- ❌ No `autoApproveEnabled` field
- ❌ No `wasAutoApproved` flag

---

### 1.5 PlayerStat Model (`player_stats` table)

**Current Structure:**
- `playerId`, `matchId`, `teamId`
- `runsScored`, `ballsFaced`, `fours`, `sixes`
- `wicketsTaken`, `oversBowled`, `runsConceded`
- `catches`, `stumpings`, `runOuts`

**GAPS IDENTIFIED:**
- ❌ No automatic calculation from ball-by-ball data
- ❌ Currently manual entry (no ball-by-ball source)
- ❌ No career stats aggregation table

---

### 1.6 ScoreUpdate Model (`score_updates` table)

**Current Structure:**
- `matchId`, `updatedBy`, `battingTeamId`
- `updateType`, `runsAdded`, `isWicket`, `extraType`
- `currentOver`
- `synced` (Boolean) - For offline sync

**PURPOSE:** Tracks score changes for offline sync and history

**GAPS IDENTIFIED:**
- ❌ Not comprehensive audit log
- ❌ No before/after state tracking
- ❌ No approval action tracking
- ❌ No match status change tracking

---

### 1.7 Missing Models

**REQUIRED BUT NOT EXISTING:**
- ❌ `Ball` model - For ball-by-ball scoring
- ❌ `ApprovalRequest` model - Unified approval system (replaces MatchStartApproval)
- ❌ `CaptainSettings` model - Timeout preferences
- ❌ `AuditLog` model - Comprehensive audit trail

---

## 2. BACKEND CONTROLLERS REVIEW

### 2.1 ScoringController (`scoring.controller.ts`)

**Current Endpoints:**
- `POST /api/v1/scoring/:matchId/start` - Start scoring
- `PATCH /api/v1/scoring/:matchId/update` - Update score
- `POST /api/v1/scoring/:matchId/end` - End scoring
- `GET /api/v1/scoring/:matchId/live` - Get live score

**Current Logic:**
1. **Start Scoring:**
   - Checks if captain of participating team
   - Sets `scoringStatus = 'IN_PROGRESS'`
   - Sets `status = 'LIVE'`
   - Sets `scoringStartedAt`, `scoringStartedBy`

2. **Update Score:**
   - Updates `teamAScore`, `teamAWickets`, `teamAOvers`, etc.
   - No ball-by-ball tracking
   - Direct score update (no validation)

3. **End Scoring:**
   - Sets `scoringStatus = 'COMPLETED'`
   - Sets `status = 'COMPLETED'`
   - Sets `winnerTeamId`

**GAPS IDENTIFIED:**
- ❌ No approval required to start scoring
- ❌ No ball-by-ball entry
- ❌ No innings management
- ❌ No validation of score transitions
- ❌ No audit logging

---

### 2.2 VerificationController (`verification.controller.ts`)

**Current Endpoints:**
- `POST /api/v1/verification/:matchId/submit` - Submit score for verification
- `POST /api/v1/verification/:verificationId/verify` - Verify/dispute score
- `GET /api/v1/verification/pending` - Get pending verifications
- `GET /api/v1/verification/disputed` - Get disputed verifications (Admin)
- `POST /api/v1/verification/:verificationId/resolve` - Resolve dispute (Admin)

**Current Logic:**
1. **Submit Score:**
   - Only captains can submit
   - Cancels old pending verifications
   - Creates new verification with status "PENDING"
   - Updates match scores

2. **Verify Score:**
   - Only opponent captain can verify
   - If agree: Status → "VERIFIED", Match → "COMPLETED"
   - If dispute: Status → "DISPUTED", requires reason

3. **Resolve Dispute:**
   - Admin only
   - Sets final scores
   - Match → "COMPLETED"

**GAPS IDENTIFIED:**
- ❌ Only handles final score verification
- ❌ No approval for start scoring
- ❌ No approval for second innings
- ❌ No auto-approval timeout
- ❌ No notification system

---

### 2.3 ApprovalController (`approval.controller.ts`)

**Current Endpoints:**
- `POST /api/v1/approval/:matchId/request` - Request match start approval
- `POST /api/v1/approval/:approvalId/respond` - Approve/reject request
- `GET /api/v1/approval/pending` - Get pending approvals

**Current Logic:**
1. **Request Approval:**
   - Only captains can request
   - Match must be "SCHEDULED"
   - Cancels old pending requests
   - Creates new approval with status "PENDING"

2. **Respond to Approval:**
   - Only opponent captain can respond
   - If approve: Match → "LIVE"
   - If reject: Status → "REJECTED"

**GAPS IDENTIFIED:**
- ❌ Only handles start approval
- ❌ No approval for second innings
- ❌ No approval for final score
- ❌ No auto-approval timeout
- ❌ No timeout settings
- ❌ No unified approval system

---

### 2.4 Missing Controllers

**REQUIRED BUT NOT EXISTING:**
- ❌ `BallByBallController` - Ball entry, undo, over management
- ❌ `SettingsController` - Captain timeout preferences
- ❌ `AuditController` - Audit log retrieval

---

### 2.5 Missing Background Jobs

**REQUIRED BUT NOT EXISTING:**
- ❌ Auto-approval cron job
- ❌ Stats calculation job
- ❌ Notification service

---

## 3. FRONTEND COMPONENTS REVIEW

### 3.1 LiveScoring.tsx

**Current Features:**
- Simple run buttons (0, 1, 2, 3, 4, 6)
- Extras buttons (WD, NB, Bye)
- Wicket button
- Undo functionality (local history)
- Offline support
- Real-time updates (via hook)

**Current Workflow:**
1. User clicks run button
2. Updates local state immediately
3. Calls `updateScore` API
4. Updates `MatchScore` record

**GAPS IDENTIFIED:**
- ❌ No ball-by-ball entry
- ❌ No batsman selection
- ❌ No bowler selection
- ❌ No over management
- ❌ No innings management
- ❌ No ball history display
- ❌ Simple score aggregation (not ball-by-ball)

---

### 3.2 ScoreVerification.tsx

**Current Features:**
- Lists pending verifications
- Shows submitted scores
- Approve/Dispute buttons
- Basic UI with cards

**GAPS IDENTIFIED:**
- ❌ Only handles final score verification
- ❌ No approval for start scoring
- ❌ No approval for second innings
- ❌ No timeout countdown
- ❌ No auto-approval indicator

---

### 3.3 ApprovalRequests.tsx

**Current Features:**
- Lists pending start approvals
- Approve/Reject buttons
- Basic UI with cards

**GAPS IDENTIFIED:**
- ❌ Only handles start approval
- ❌ No unified approval center
- ❌ No timeout countdown
- ❌ No auto-approval indicator
- ❌ No settings integration

---

### 3.4 Missing Frontend Components

**REQUIRED BUT NOT EXISTING:**
- ❌ `BallByBallScoring.tsx` - New scoring interface
- ❌ `ApprovalCenter.tsx` - Unified approval management
- ❌ `CaptainSettings.tsx` - Timeout preferences
- ❌ `MatchAuditLog.tsx` - Audit trail viewer

---

## 4. COMPARISON MATRIX

| Feature | Required | Currently Exists | Needs Work | New Build |
|---------|----------|------------------|-------------|-----------|
| **6-stage status flow** | ✓ | ❌ | ❌ | ✓ |
| - SCHEDULED | ✓ | ✓ | - | - |
| - SCORING_PENDING | ✓ | ❌ | ❌ | ✓ |
| - FIRST_INNINGS | ✓ | ❌ | ❌ | ✓ |
| - SECOND_INNINGS_PENDING | ✓ | ❌ | ❌ | ✓ |
| - SECOND_INNINGS | ✓ | ❌ | ❌ | ✓ |
| - FINAL_PENDING | ✓ | ❌ | ❌ | ✓ |
| - COMPLETED | ✓ | ✓ | - | - |
| **Ball-by-ball scoring** | ✓ | ❌ | ❌ | ✓ |
| - Ball model | ✓ | ❌ | ❌ | ✓ |
| - Batsman tracking | ✓ | ❌ | ❌ | ✓ |
| - Bowler tracking | ✓ | ❌ | ❌ | ✓ |
| - Wicket types | ✓ | ❌ | ❌ | ✓ |
| - Over management | ✓ | ❌ | ❌ | ✓ |
| **3 approval points** | ✓ | ⚠️ | ✓ | ✓ |
| - Start scoring approval | ✓ | ⚠️ (partial) | ✓ | ✓ |
| - Second innings approval | ✓ | ❌ | ❌ | ✓ |
| - Final score verification | ✓ | ✓ | ⚠️ (needs enhancement) | - |
| **Auto-timeout (5min)** | ✓ | ❌ | ❌ | ✓ |
| - Timeout settings | ✓ | ❌ | ❌ | ✓ |
| - Background job | ✓ | ❌ | ❌ | ✓ |
| - Auto-approval logic | ✓ | ❌ | ❌ | ✓ |
| **Audit logging** | ✓ | ⚠️ (partial) | ✓ | ✓ |
| - Score change history | ✓ | ⚠️ (ScoreUpdate exists) | ✓ | ✓ |
| - Approval history | ✓ | ❌ | ❌ | ✓ |
| - Match state changes | ✓ | ❌ | ❌ | ✓ |
| - Comprehensive audit log | ✓ | ❌ | ❌ | ✓ |
| **Auto stats update** | ✓ | ❌ | ❌ | ✓ |
| - Calculate from balls | ✓ | ❌ | ❌ | ✓ |
| - Update player stats | ✓ | ⚠️ (manual entry exists) | ✓ | ✓ |
| - Update career stats | ✓ | ❌ | ❌ | ✓ |

**Legend:**
- ✓ = Exists/Complete
- ⚠️ = Partial/Needs Enhancement
- ❌ = Missing/New Build Required

---

## 5. CURRENT WORKFLOW ANALYSIS

### 5.1 Match Start Workflow (Current)

```
1. Match Created → Status: SCHEDULED
2. Captain A requests start → Creates MatchStartApproval (PENDING)
3. Captain B approves → MatchStartApproval → APPROVED, Match → LIVE
4. Captain A starts scoring → scoringStatus → IN_PROGRESS
5. Scoring happens (simple updates)
6. Captain A ends match → scoringStatus → COMPLETED, Match → COMPLETED
7. Captain A submits final score → Creates MatchScoreVerification (PENDING)
8. Captain B verifies → MatchScoreVerification → VERIFIED, Match → COMPLETED
```

**ISSUES:**
- No approval required to start scoring (only to start match)
- No second innings management
- No ball-by-ball tracking
- No auto-approval
- No comprehensive audit trail

---

### 5.2 Required Workflow (New)

```
1. Match Created → Status: SCHEDULED
2. Captain A requests start → Status: SCORING_PENDING, Creates ApprovalRequest (START_SCORING, PENDING)
3. Captain B approves OR 5min timeout → ApprovalRequest → APPROVED/AUTO_APPROVED, Match → FIRST_INNINGS
4. Ball-by-ball scoring (each ball creates Ball record)
5. Captain A ends first innings → Status: SECOND_INNINGS_PENDING, Creates ApprovalRequest (START_SECOND_INNINGS, PENDING)
6. Captain B approves OR 5min timeout → ApprovalRequest → APPROVED/AUTO_APPROVED, Match → SECOND_INNINGS
7. Ball-by-ball scoring continues
8. Captain A ends match → Status: FINAL_PENDING, Creates ApprovalRequest (FINAL_SCORE, PENDING)
9. Captain B verifies OR 5min timeout → ApprovalRequest → APPROVED/AUTO_APPROVED, Match → COMPLETED
10. Stats automatically calculated from Ball records
11. Player stats and career stats updated
```

---

## 6. KEY FINDINGS

### 6.1 What Works Well
- ✅ Basic match status management
- ✅ Score verification system (for final score)
- ✅ Match start approval system (basic)
- ✅ Player stats structure exists
- ✅ Offline support in frontend

### 6.2 Major Gaps
- ❌ **No ball-by-ball scoring** - Current system uses simple score aggregation
- ❌ **No 6-stage status flow** - Only 4 statuses (SCHEDULED, LIVE, COMPLETED, CANCELLED)
- ❌ **No triple approval system** - Only 2 approval points (start + final)
- ❌ **No auto-approval timeout** - Manual approval required always
- ❌ **No comprehensive audit logging** - Limited tracking
- ❌ **No automatic stats calculation** - Manual entry only

### 6.3 Migration Challenges
- ⚠️ Existing matches in "LIVE" or "COMPLETED" status need migration strategy
- ⚠️ Existing MatchStartApproval records need to be migrated to new ApprovalRequest model
- ⚠️ Existing MatchScoreVerification records need to be preserved
- ⚠️ Existing ScoreUpdate records can be used as partial audit log
- ⚠️ Frontend LiveScoring component needs complete rewrite

---

## 7. RECOMMENDATIONS

### 7.1 Database Changes Priority
1. **HIGH:** Add new MatchStatus enum values
2. **HIGH:** Create Ball model
3. **HIGH:** Create unified ApprovalRequest model (or enhance MatchStartApproval)
4. **HIGH:** Create CaptainSettings model
5. **HIGH:** Create AuditLog model
6. **MEDIUM:** Add innings tracking fields to Match
7. **LOW:** Migrate existing data

### 7.2 Backend Changes Priority
1. **HIGH:** Implement ball-by-ball controller
2. **HIGH:** Enhance approval controller for 3 approval points
3. **HIGH:** Create auto-approval cron job
4. **HIGH:** Create stats calculation service
5. **MEDIUM:** Create settings controller
6. **MEDIUM:** Create audit logging middleware
7. **LOW:** Migrate existing endpoints

### 7.3 Frontend Changes Priority
1. **HIGH:** Create new BallByBallScoring component
2. **HIGH:** Create unified ApprovalCenter component
3. **HIGH:** Create CaptainSettings component
4. **MEDIUM:** Create MatchAuditLog component
5. **MEDIUM:** Update routing
6. **LOW:** Deprecate old LiveScoring component

---

## 8. NEXT STEPS

1. ✅ **Phase 1 Complete** - Discovery documented
2. ⏭️ **Phase 2** - Requirements specification (already provided)
3. ⏭️ **Phase 3** - Database schema changes
4. ⏭️ **Phase 4** - Backend implementation
5. ⏭️ **Phase 5** - Frontend implementation
6. ⏭️ **Phase 6** - Testing
7. ⏭️ **Phase 7** - Deployment

---

**END OF DISCOVERY REPORT**

