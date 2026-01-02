/**
 * Development Component: Role Switcher
 * Allows switching between different user roles for frontend testing
 * Only visible in development mode
 */

import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/database.types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { User } from 'lucide-react';

export const RoleSwitcher = () => {
  const { user, role, setMockUserRole } = useAuth();

  if (import.meta.env.PROD || !setMockUserRole) {
    return null; // Don't show in production or if not in mock mode
  }

  const switchRole = (newRole: UserRole) => {
    setMockUserRole(newRole);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            {role || 'No Role'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => switchRole('player')}>
            Switch to Player
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchRole('captain')}>
            Switch to Captain
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchRole('admin')}>
            Switch to Admin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

