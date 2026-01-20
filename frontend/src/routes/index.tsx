import { Suspense, lazy } from 'react';
import { useRoutes, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Skeleton } from '../components/ui/skeleton';

// -- Public Pages (Lazy Loaded) --
const Home = lazy(() => import('../pages/public/Home'));
const Login = lazy(() => import('../pages/public/Login'));
const Register = lazy(() => import('../pages/public/Register'));
const ForgotPassword = lazy(() => import('../pages/public/ForgotPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// -- Shared / Public View Pages --
const TournamentView = lazy(() => import('../pages/shared/TournamentView'));
const MatchDetails = lazy(() => import('../pages/shared/MatchDetails'));
const TournamentsList = lazy(() => import('../pages/Tournaments'));
const Teams = lazy(() => import('../pages/Teams'));
const TeamDetails = lazy(() => import('../pages/TeamDetails'));
const PlayerProfileView = lazy(() => import('../pages/shared/PlayerProfileView'));
const LiveScoring = lazy(() => import('../pages/shared/LiveScoring'));

// -- Player Routes --
const PlayerDashboard = lazy(() => import('../pages/player/PlayerDashboard'));
const PlayerProfile = lazy(() => import('../pages/player/PlayerProfile'));
const AvailableTeams = lazy(() => import('../pages/player/AvailableTeams'));
const MyTeams = lazy(() => import('../pages/player/MyTeams'));
const MyInvitations = lazy(() => import('../pages/player/MyInvitations'));
const PlayerMatches = lazy(() => import('../pages/player/PlayerMatches'));
const PlayerTournaments = lazy(() => import('../pages/player/PlayerTournaments'));
const MatchHistory = lazy(() => import('../pages/player/MatchHistory'));
const PerformanceStats = lazy(() => import('../pages/player/PerformanceStats'));

// -- Captain Routes --
const CaptainDashboard = lazy(() => import('../pages/captain/CaptainDashboard'));
const CaptainProfile = lazy(() => import('../pages/captain/CaptainProfile'));
const TeamManagement = lazy(() => import('../pages/captain/TeamManagement'));
const CreateTeam = lazy(() => import('../pages/captain/CreateTeam'));
const PlayerRequests = lazy(() => import('../pages/captain/PlayerRequests'));
const InvitePlayers = lazy(() => import('../pages/captain/InvitePlayers'));
const TeamMatches = lazy(() => import('../pages/captain/TeamMatches'));
const CaptainScheduleMatch = lazy(() => import('../pages/captain/ScheduleMatch'));
const MatchControl = lazy(() => import('../pages/captain/MatchControl'));
const UpdateMatchResult = lazy(() => import('../pages/captain/UpdateMatchResult'));
const TeamStatistics = lazy(() => import('../pages/captain/TeamStatistics'));
const ScoreVerification = lazy(() => import('../pages/captain/ScoreVerification'));
const ApprovalRequests = lazy(() => import('../pages/captain/ApprovalRequests'));

// -- Admin Routes --
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ManageTournaments = lazy(() => import('../pages/admin/ManageTournaments'));
const CreateTournament = lazy(() => import('../pages/admin/CreateTournament'));
const EditTournament = lazy(() => import('../pages/admin/EditTournament'));
const GenerateTournamentMatches = lazy(() => import('../pages/admin/GenerateTournamentMatches'));
const ScheduleMatch = lazy(() => import('../pages/admin/ScheduleMatch'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const ManageTeams = lazy(() => import('../pages/admin/ManageTeams'));
const MatchMonitoring = lazy(() => import('../pages/admin/MatchMonitoring'));

// -- Settings --
const Settings = lazy(() => import('../pages/Settings'));

// Loading Fallback
const Loading = () => (
    <div className="h-screen w-full flex items-center justify-center">
        <div className="space-y-4 w-[300px]">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
    </div>
);

const AppRoutes = () => {
    const { user, isLoading } = useAuth();

    const routes = useRoutes([
        // --- Public Routes ---
        {
            path: '/',
            element: <Home />,
        },
        {
            path: '/login',
            // Allow access to login page even when logged in (user might want to switch accounts)
            element: <Login />,
        },
        {
            path: '/register',
            // Allow access to register page even when logged in (user might want to create another account)
            element: <Register />,
        },
        {
            path: '/forgot-password',
            element: <ForgotPassword />,
        },
        {
            path: '/reset-password',
            element: <ForgotPassword />,
        },
        {
            path: '/my-teams',
            element: user ? <Navigate to="/player/my-teams" replace /> : <Navigate to="/login" replace />,
        },

        // --- Shared View Routes (Can be public or protected, accessible generally) ---
        {
            path: '/tournaments',
            element: <DashboardLayout><TournamentsList /></DashboardLayout>
        },
        {
            path: '/teams',
            element: <DashboardLayout><Teams /></DashboardLayout>
        },
        {
            path: '/teams/:id',
            element: <DashboardLayout><TeamDetails /></DashboardLayout>
        },
        {
            path: '/tournaments/:id',
            element: <DashboardLayout><TournamentView /></DashboardLayout>
        },
        {
            path: '/tournaments/:tournamentId',
            element: <DashboardLayout><TournamentView /></DashboardLayout>
        },
        {
            path: '/players/:playerId', // Public profile view
            element: <DashboardLayout><PlayerProfileView /></DashboardLayout>
        },
        {
            path: '/matches',
            element: (
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                    <DashboardLayout><MatchHistory /></DashboardLayout>
                </ProtectedRoute>
            )
        },
        {
            path: '/matches/:id',
            element: (
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                    <DashboardLayout><MatchDetails /></DashboardLayout>
                </ProtectedRoute>
            )
        },
        {
            path: '/matches/:matchId',
            element: (
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                    <DashboardLayout><MatchDetails /></DashboardLayout>
                </ProtectedRoute>
            )
        },

        // --- Role Protected Routes ---

        // PLAYER Layout & Routes
        {
            path: '/player',
            element: (
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                    <DashboardLayout />
                </ProtectedRoute>
            ),
            children: [
                { path: 'dashboard', element: <PlayerDashboard /> },
                { path: 'profile', element: <PlayerProfile /> },
                { path: 'teams', element: <AvailableTeams /> },
                { path: 'teams/find', element: <AvailableTeams /> },
                { path: 'teams/:teamId', element: <AvailableTeams /> }, // Team details view
                { path: 'my-teams', element: <MyTeams /> },
                { path: 'invitations', element: <MyInvitations /> },
                { path: 'matches', element: <PlayerMatches /> },
                { path: 'tournaments', element: <PlayerTournaments /> },
                { path: 'match-history', element: <MatchHistory /> },
                { path: 'stats', element: <PerformanceStats /> },
                { path: '', element: <Navigate to="dashboard" replace /> }
            ]
        },

        // CAPTAIN Layout & Routes
        {
            path: '/captain',
            element: (
                <ProtectedRoute allowedRoles={['captain', 'admin']}>
                    <DashboardLayout />
                </ProtectedRoute>
            ),
            children: [
                { path: 'dashboard', element: <CaptainDashboard /> },
                { path: 'profile', element: <CaptainProfile /> },
                { path: 'team', element: <TeamManagement /> },
                { path: 'team/create', element: <CreateTeam /> },
                { path: 'team-management', element: <TeamManagement /> },
                { path: 'requests', element: <PlayerRequests /> },
                { path: 'invite', element: <InvitePlayers /> },
                { path: 'schedule-match', element: <CaptainScheduleMatch /> },
                { path: 'matches', element: <TeamMatches /> }, // View team matches
                { path: 'match/:id/update-result', element: <UpdateMatchResult /> },
                { path: 'match-control', element: <MatchControl /> }, // "Day of Match" control
                { path: 'score-verification', element: <ScoreVerification /> },
                { path: 'approval-requests', element: <ApprovalRequests /> },
                { path: 'stats', element: <TeamStatistics /> },
                { path: '', element: <Navigate to="dashboard" replace /> }
            ]
        },

        // ADMIN Layout & Routes
        {
            path: '/admin',
            element: (
                <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout />
                </ProtectedRoute>
            ),
            children: [
                { path: 'dashboard', element: <AdminDashboard /> },
                { path: 'manage-tournaments', element: <ManageTournaments /> },
                { path: 'tournaments', element: <ManageTournaments /> },
                { path: 'tournaments/create', element: <CreateTournament /> },
                { path: 'tournaments/:id/edit', element: <EditTournament /> },
                { path: 'tournaments/:id/generate-matches', element: <GenerateTournamentMatches /> },
                { path: 'tournaments/:tournamentId', element: <TournamentView /> },
                { path: 'schedule-match', element: <ScheduleMatch /> },
                { path: 'matches/schedule', element: <ScheduleMatch /> },
                { path: 'match-monitoring', element: <MatchMonitoring /> },
                { path: 'matches', element: <MatchMonitoring /> }, // Monitor Active/All matches
                { path: 'users', element: <ManageUsers /> },
                { path: 'teams', element: <ManageTeams /> },
                { path: '', element: <Navigate to="dashboard" replace /> }
            ]
        },

        // --- Special Match Routes ---
        // Scoring Page - Strictly protected logic inside the component itself or via route
        {
            path: '/match/:matchId/scorer',
            element: (
                <ProtectedRoute allowedRoles={['captain', 'admin']}>
                    <DashboardLayout>
                        <LiveScoring />
                    </DashboardLayout>
                </ProtectedRoute>
            )
        },
        
        // --- Profile & Settings Routes ---
        {
            path: '/profile',
            element: user ? <Navigate to={`/${user.role}/profile`} replace /> : <Navigate to="/login" replace />,
        },
        {
            path: '/settings',
            element: (
                <ProtectedRoute allowedRoles={['player', 'captain', 'admin']}>
                    <DashboardLayout>
                        <Settings />
                    </DashboardLayout>
                </ProtectedRoute>
            )
        },

        // Fallback
        {
            path: '*',
            element: <NotFound />
        }
    ]);

    if (isLoading) return <Loading />;

    return (
        <Suspense fallback={<Loading />}>
            {routes}
        </Suspense>
    );
};

export default AppRoutes;
