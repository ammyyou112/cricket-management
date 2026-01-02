# Admin Routes Documentation

## Complete Admin Route Structure

All admin routes are protected and require `admin` role. Base path: `/admin`

### Main Routes

#### 1. Admin Dashboard
- **Path**: `/admin/dashboard`
- **Route**: `/admin` (redirects to `/admin/dashboard`)
- **Component**: `AdminDashboard`
- **Description**: Main admin dashboard with system statistics and quick actions
- **Features**:
  - Total users count
  - Total teams count
  - Active tournaments count
  - Live matches count
  - Recent tournaments list
  - Quick action buttons

#### 2. Manage Tournaments
- **Path**: `/admin/tournaments`
- **Component**: `ManageTournaments`
- **Description**: List and manage all tournaments
- **Features**:
  - View all tournaments
  - Search tournaments
  - Filter by status (all, upcoming, ongoing, completed)
  - View tournament details
  - Edit tournament
  - Delete tournament

#### 3. Create Tournament
- **Path**: `/admin/tournaments/create`
- **Component**: `CreateTournament`
- **Description**: Create a new tournament
- **Features**:
  - Tournament name
  - Start date
  - End date
  - Status selection
  - Format selection (League, Knockout, Groups)

#### 4. Tournament Details
- **Path**: `/admin/tournaments/:tournamentId`
- **Component**: `TournamentView`
- **Description**: View detailed tournament information
- **Features**:
  - Tournament overview
  - Fixture list
  - Standings/Points table
  - Player statistics

#### 5. Edit Tournament
- **Path**: `/admin/tournaments/:tournamentId/edit`
- **Component**: `CreateTournament` (reused with edit mode)
- **Description**: Edit existing tournament details

#### 6. Schedule Match
- **Path**: `/admin/matches/schedule`
- **Component**: `ScheduleMatch`
- **Description**: Schedule a new match
- **Features**:
  - Select tournament
  - Select teams (Team A and Team B)
  - Set match date and time
  - Set venue
  - Set initial status

#### 7. Match Monitoring
- **Path**: `/admin/matches`
- **Component**: `MatchMonitoring`
- **Description**: Monitor and manage all matches
- **Features**:
  - View live matches
  - View scheduled matches
  - View completed matches
  - Filter by tournament
  - Search matches
  - Update match status
  - View match details

#### 8. Manage Users
- **Path**: `/admin/users`
- **Component**: `ManageUsers`
- **Description**: Manage all system users
- **Features**:
  - View all users
  - Search users
  - Filter by role (player, captain, admin)
  - View user details
  - Delete users

## Route Protection

All admin routes are protected using `ProtectedRoute` component with `allowedRoles={['admin']}`.

## Navigation

### Sidebar Navigation (Admin Role)
- Dashboard → `/admin/dashboard`
- Tournaments → `/admin/tournaments`
- Schedule Match → `/admin/matches/schedule`
- Match Monitoring → `/admin/matches`
- Users → `/admin/users`

### Quick Actions from Dashboard
- New Tournament → `/admin/tournaments/create`
- Schedule Match → `/admin/matches/schedule`
- Manage Users → `/admin/users`
- Monitor Matches → `/admin/matches`

## Route Configuration

```typescript
{
    path: '/admin',
    element: (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
        </ProtectedRoute>
    ),
    children: [
        { path: 'dashboard', element: <AdminDashboard /> },
        { path: 'tournaments', element: <ManageTournaments /> },
        { path: 'tournaments/create', element: <CreateTournament /> },
        { path: 'tournaments/:tournamentId', element: <TournamentView /> },
        { path: 'tournaments/:tournamentId/edit', element: <CreateTournament /> },
        { path: 'matches/schedule', element: <ScheduleMatch /> },
        { path: 'matches', element: <MatchMonitoring /> },
        { path: 'users', element: <ManageUsers /> },
        { path: '', element: <Navigate to="dashboard" replace /> }
    ]
}
```

## Access Control

- Only users with `role: 'admin'` can access these routes
- Unauthorized users are redirected to login or their role-specific dashboard
- All routes are wrapped in `DashboardLayout` for consistent UI

## API Integration

All admin pages use React Query hooks for data fetching:
- `useTournaments()` - Fetch tournaments
- `useLiveMatches()` - Fetch live matches
- `useAvailableTeams()` - Fetch teams
- `getAllPlayers()` - Fetch all users
- `useCreateTournament()` - Create tournament
- `useDeleteTournament()` - Delete tournament
- `useCreateMatch()` - Schedule match
- `useUpdateMatchStatus()` - Update match status

## Error Handling

All admin pages include:
- Loading states with skeletons
- Error handling with toast notifications
- Form validation
- Confirmation dialogs for destructive actions

