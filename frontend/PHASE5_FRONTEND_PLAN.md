# Phase 5: Frontend Implementation Plan

## Components to Create

### 1. BallByBallScoring Component
**Location:** `frontend/src/pages/shared/BallByBallScoring.tsx`
**Purpose:** Ball-by-ball scoring interface
**Features:**
- Match details display
- Current over/ball tracking
- Player selection (batsman on strike, non-strike, bowler)
- Run input (0-6, plus extras buttons)
- Wicket tracking with type selection
- Over completion (6 legal balls)
- Ball history display
- Undo last ball
- Real-time score updates

### 2. ApprovalCenter Component
**Location:** `frontend/src/pages/captain/ApprovalCenter.tsx`
**Purpose:** Unified approval management
**Features:**
- List all pending approvals (3 types)
- Request approval for match
- Respond to approval requests
- Auto-approval countdown timer
- Approval history

### 3. Settings Page (Captain)
**Location:** `frontend/src/pages/captain/CaptainSettings.tsx`
**Purpose:** Captain timeout preferences
**Features:**
- Auto-approval toggle
- Timeout minutes (1-60)
- Notification preferences
- Save settings

### 4. MatchAuditLog Component
**Location:** `frontend/src/pages/shared/MatchAuditLog.tsx`
**Purpose:** Audit trail viewer
**Features:**
- List all audit logs for match
- Filter by action type
- Show before/after states
- Timeline view
- Export functionality

## Services Created ✅
- `ballByBall.service.ts` ✅
- `approval.service.ts` (enhanced) ✅
- `settings.service.ts` ✅
- `audit.service.ts` ✅

## Routing Updates Needed
- Add routes for new components
- Update navigation menus
- Add links from existing pages

## Implementation Order
1. ✅ Services (DONE)
2. BallByBallScoring component
3. ApprovalCenter component
4. Settings page
5. MatchAuditLog component
6. Routing updates

