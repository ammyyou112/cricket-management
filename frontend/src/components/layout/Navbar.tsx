import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Menu, X, Trophy } from 'lucide-react';

export const Navbar = () => {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Tournaments', path: '/tournaments' },
        ...(role === 'admin' 
            ? [{ name: 'Manage Teams', path: '/admin/teams' }]
            : role === 'captain'
            ? [{ name: 'My Teams', path: '/captain/team-management' }]
            : role === 'player'
            ? [{ name: 'Available Teams', path: '/player/teams' }]
            : [{ name: 'Teams', path: '/teams' }]
        ),
        ...(role ? [{ name: 'Matches', path: '/matches' }] : []),
        ...(role === 'player' ? [{ name: 'My Teams', path: '/player/my-teams' }] : []),
        ...(role === 'captain'
            ? [
                { name: 'Requests', path: '/captain/requests' },
            ]
            : []),
        ...(role === 'admin' ? [{ name: 'Dashboard', path: '/admin/dashboard' }] : []),
    ];

    return (
        <nav className="bg-background border-b sticky top-0 z-40 w-full backdrop-blur-sm bg-opacity-80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl tracking-tight">Cricket 360</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {/* <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div> */}

                    {/* User Menu (Desktop) */}
                    <div className="hidden md:block">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profile_picture || undefined} alt={user.full_name} />
                                            <AvatarFallback>{user.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.full_name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>Profile</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="space-x-2">
                                <Button variant="ghost" asChild>
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link to="/register">Sign Up</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-background border-t">
                    {/* <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="hover:bg-accent hover:text-accent-foreground block px-3 py-2 rounded-md text-base font-medium"
                            >
                                {link.name}
                            </Link>
                        ))}
                        {!user && (
                            <div className="mt-4 flex flex-col space-y-2 px-3">
                                <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}>
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button asChild onClick={() => setIsMobileMenuOpen(false)}>
                                    <Link to="/register">Sign Up</Link>
                                </Button>
                            </div>
                        )}
                    </div> */}
                    {user && (
                        <div className="pt-4 pb-4 border-t border-border">
                            <div className="flex items-center px-5">
                                <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.profile_picture || undefined} alt={user.full_name} />
                                        <AvatarFallback>{user.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium leading-none">{user.full_name}</div>
                                    <div className="text-sm font-medium leading-none text-muted-foreground mt-1">{user.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        navigate(`/${role}/profile`);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    Profile
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                                    Log out
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};
