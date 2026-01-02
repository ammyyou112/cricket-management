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
    Mail,
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
                    { name: 'Available Teams', path: '/player/teams', icon: Users },
                    { name: 'My Teams', path: '/player/my-teams', icon: Users },
                    { name: 'Invitations', path: '/player/invitations', icon: Mail },
                    { name: 'Matches', path: '/player/matches', icon: Calendar },
                    { name: 'Tournaments', path: '/player/tournaments', icon: Trophy },
                    { name: 'Stats', path: '/player/stats', icon: BarChart2 },
                ];
            case 'captain':
                return [
                    { name: 'Dashboard', path: '/captain/dashboard', icon: LayoutDashboard },
                    { name: 'Team Management', path: '/captain/team-management', icon: Shield },
                    { name: 'Requests', path: '/captain/requests', icon: ClipboardList },
                    { name: 'Invite Players', path: '/captain/invite', icon: Users },
                    { name: 'Team Matches', path: '/captain/matches', icon: Calendar },
                    { name: 'Match Control', path: '/captain/match-control', icon: Activity },
                    { name: 'Stats', path: '/captain/stats', icon: BarChart2 },
                ];
            case 'admin':
                return [
                    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
                    { name: 'Tournaments', path: '/admin/manage-tournaments', icon: Trophy },
                    { name: 'Schedule Match', path: '/admin/schedule-match', icon: Calendar },
                    { name: 'Match Monitoring', path: '/admin/match-monitoring', icon: Activity },
                    { name: 'Users', path: '/admin/users', icon: Users },
                    { name: 'Teams', path: '/admin/teams', icon: Users },
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
