import { User, UserRole } from './database.types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: UserRole;
}

export interface AuthUser extends User {
    // Add any auth-specific fields if needed, or just alias User
}

export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
