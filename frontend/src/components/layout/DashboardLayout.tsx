import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { InactivityWarning } from '../auth/InactivityWarning';

interface DashboardLayoutProps {
    children?: ReactNode; // Optional for nested routes
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    // Configure inactivity logout
    // For production: warningTime: 28 * 60 * 1000, logoutTime: 30 * 60 * 1000
    // For testing: warningTime: 2 * 60 * 1000, logoutTime: 2.5 * 60 * 1000
    const { showWarning, secondsRemaining, resetTimers } = useInactivityLogout({
        warningTime: 28 * 60 * 1000, // 28 minutes (warning shows at 28 min)
        logoutTime: 30 * 60 * 1000,   // 30 minutes (logout at 30 min)
        enabled: true
    });

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden md:block w-64 flex-shrink-0 border-r bg-background">
                    <Sidebar className="h-full" />
                </aside>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-3 sm:p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
            <InactivityWarning 
                open={showWarning}
                secondsRemaining={secondsRemaining}
                onStayLoggedIn={resetTimers}
            />
        </div>
    );
};

export default DashboardLayout;
