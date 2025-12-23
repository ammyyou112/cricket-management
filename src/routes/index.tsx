import { Suspense, lazy } from 'react';
import { useRoutes, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Skeleton } from '../components/ui/skeleton';

// -- Public Pages (Lazy Loaded) --
const Home = lazy(() => import('../pages/public/Home'));
const Login = lazy(() => import('../pages/public/Login'));
const Register = lazy(() => import('../pages/public/Register'));
const NotFound = lazy(() => import('../pages/public/NotFound'));

// -- Shared / Public View Pages --
const TournamentView = lazy(() => import('../pages/shared/TournamentView'));
const PlayerProfileView = lazy(() => import('../pages/shared/PlayerProfileView'));
const LiveScoring = lazy(() => import('../pages/shared/LiveScoring'));

// -- Player Routes --
const PlayerDashboard = lazy(() => import('../pages/player/PlayerDashboard'));
const PlayerProfile = lazy(() => import('../pages/player/PlayerProfile'));
const AvailableTeams = lazy(() => import('../pages/player/AvailableTeams'));
const MyTeams = lazy(() => import('../pages/player/MyTeams'));
const MatchHistory = lazy(() => import('../pages/player/MatchHistory'));
const PerformanceStats = lazy(() => import('../pages/player/PerformanceStats'));

// -- Captain Routes --
const CaptainDashboard = lazy(() => import('../pages/captain/CaptainDashboard'));
const TeamManagement = lazy(() => import('../pages/captain/TeamManagement'));
const PlayerRequests = lazy(() => import('../pages/captain/PlayerRequests'));
const InvitePlayers = lazy(() => import('../pages/captain/InvitePlayers'));
const MatchControl = lazy(() => import('../pages/captain/MatchControl'));
const TeamStatistics = lazy(() => import('../pages/captain/TeamStatistics'));

// -- Admin Routes --
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ManageTournaments = lazy(() => import('../pages/admin/ManageTournaments'));
const CreateTournament = lazy(() => import('../pages/admin/CreateTournament'));
const ScheduleMatch = lazy(() => import('../pages/admin/ScheduleMatch'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const MatchMonitoring = lazy(() => import('../pages/admin/MatchMonitoring'));

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
            // Redirect to dashboard if already logged in (optional UX preference)
            element: user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />,
        },
        {
            path: '/register',
            element: user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />,
        },

        // --- Shared View Routes (Can be public or protected, accessible generally) ---
        {
            path: '/tournaments/:tournamentId',
            element: <DashboardLayout><TournamentView /></DashboardLayout>
        },
        {
            path: '/players/:playerId', // Public profile view
            element: <DashboardLayout><PlayerProfileView /></DashboardLayout>
        },
        // Match details might be shared view
        // { path: '/matches/:matchId', element: ... }

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
                { path: 'my-teams', element: <MyTeams /> },
                { path: 'matches', element: <MatchHistory /> },
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
                { path: 'team-management', element: <TeamManagement /> },
                { path: 'requests', element: <PlayerRequests /> },
                { path: 'invite', element: <InvitePlayers /> },
                { path: 'matches', element: <MatchControl /> }, // "Day of Match" control
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
                { path: 'tournaments', element: <ManageTournaments /> },
                { path: 'tournaments/create', element: <CreateTournament /> },
                // { path: 'tournaments/:id/edit', element: <EditTournament /> },
                { path: 'matches/schedule', element: <ScheduleMatch /> },
                { path: 'matches', element: <MatchMonitoring /> }, // Monitor Active/All matches
                { path: 'users', element: <ManageUsers /> },
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

        // Fallback
        {
            path: '*',
            // Create a simple NotFound page or redirect
            element: <div className="p-10 text-center">404 - Page Not Found</div>
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
