import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    User,
    Users,
    Trophy,
    Calendar,
    BarChart2,
    Settings,
    Shield,
    ClipboardList,
    Activity,
} from 'lucide-react';

interface SidebarProps {
    className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
    const { role } = useAuth();
    const location = useLocation();

    const getLinks = () => {
        switch (role) {
            case 'player':
                return [
                    { name: 'Dashboard', path: '/player/dashboard', icon: LayoutDashboard },
                    { name: 'My Profile', path: '/player/profile', icon: User },
                    { name: 'My Teams', path: '/player/teams', icon: Users },
                    { name: 'Matches', path: '/player/matches', icon: Calendar },
                    { name: 'Stats', path: '/player/stats', icon: BarChart2 },
                ];
            case 'captain':
                return [
                    { name: 'Dashboard', path: '/captain/dashboard', icon: LayoutDashboard },
                    { name: 'My Team', path: '/captain/team', icon: Shield },
                    { name: 'Requests', path: '/captain/requests', icon: ClipboardList },
                    { name: 'Match Control', path: '/captain/match-control', icon: Activity },
                    { name: 'Stats', path: '/captain/stats', icon: BarChart2 },
                ];
            case 'admin':
                return [
                    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
                    { name: 'Tournaments', path: '/admin/tournaments', icon: Trophy },
                    { name: 'Matches', path: '/admin/matches', icon: Calendar },
                    { name: 'Users', path: '/admin/users', icon: Users },
                    { name: 'Monitor', path: '/admin/monitor', icon: Activity },
                ];
            default:
                return [
                    { name: 'Home', path: '/', icon: LayoutDashboard },
                ];
        }
    };

    const links = getLinks();

    return (
        <div className={cn('pb-12 min-h-screen border-r bg-background pt-8', className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Menu
                    </h2>
                    <div className="space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname.startsWith(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                                        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Settings
                    </h2>
                    <div className="space-y-1">
                        <Link
                            to="/settings"
                            className={cn(
                                'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                                location.pathname === '/settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
