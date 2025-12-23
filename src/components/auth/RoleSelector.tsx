import { UserRole } from '../../types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { Shield, Trophy, User } from 'lucide-react';

interface RoleSelectorProps {
    value: UserRole;
    onChange: (role: UserRole) => void;
}

export const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
    const roles: {
        id: UserRole;
        title: string;
        description: string;
        icon: typeof User;
    }[] = [
            {
                id: 'player',
                title: 'Player',
                description: 'Join teams, participate in matches, and track your individual stats.',
                icon: User,
            },
            {
                id: 'captain',
                title: 'Captain',
                description: 'Create and manage your own team, invite players, and coordinate matches.',
                icon: Shield,
            },
            {
                id: 'admin',
                title: 'Organizer', // Display as Organizer mostly, technically Admin
                description: 'Create tournaments, schedule matches, and manage the entire league.',
                icon: Trophy,
            },
        ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = value === role.id;

                return (
                    <div
                        key={role.id}
                        onClick={() => onChange(role.id)}
                        className={cn(
                            "cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.02]",
                            isSelected ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
                        )}
                    >
                        <Card className={cn("h-full", isSelected && "bg-accent/50 border-primary")}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                    {role.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {role.description}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
};
