import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

const registerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
    role: z.enum(['player', 'captain']),
    player_type: z.enum(['batsman', 'bowler', 'all-rounder', 'wicket-keeper']).optional(),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
}).refine((data) => {
    if ((data.role === 'player' || data.role === 'captain') && !data.player_type) {
        return false;
    }
    return true;
}, {
    message: "Player type is required for players and captains",
    path: ["player_type"],
});

type RegisterValues = z.infer<typeof registerSchema>;

const Register = () => {
    const { register: registerUser, user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [authError, setAuthError] = useState<string | null>(null);
    
    // ✅ Debug: Log error state changes
    useEffect(() => {
        if (authError) {
            console.log('🔴 Error state updated:', authError);
        }
    }, [authError]);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            confirm_password: '',
            role: 'player',
            player_type: undefined,
        },
    });

    const selectedRole = form.watch('role');

    const onSubmit = async (data: RegisterValues) => {
        setAuthError(null);
        try {
            // Transform player_type format for backend
            const playerTypeMap: Record<string, string> = {
                'batsman': 'BATSMAN',
                'bowler': 'BOWLER',
                'all-rounder': 'ALL_ROUNDER',
                'wicket-keeper': 'WICKET_KEEPER',
            };

            const backendPlayerType = data.player_type ? playerTypeMap[data.player_type] : undefined;

            const user = await registerUser(
                data.email,
                data.password,
                data.full_name,
                data.role,
                backendPlayerType as any
            );
            
            // Only log in development mode, and sanitize sensitive data
            if (import.meta.env.DEV) {
                const sanitizedUser = user ? {
                    email: user.email,
                    role: user.role,
                    full_name: user.full_name,
                    // ID and other sensitive fields excluded
                } : null;
                console.log('✅ Registration successful:', sanitizedUser);
            }
            
            // Navigate to user's dashboard based on role
            if (user) {
                // Map roles to dashboard routes
                const roleRoutes: Record<string, string> = {
                    'admin': '/admin/dashboard',
                    'captain': '/captain/dashboard',
                    'player': '/player/dashboard',
                };
                
                const dashboardRoute = roleRoutes[user.role] || '/dashboard';
                navigate(dashboardRoute, { replace: true });
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            // Handle validation errors from backend
            let errorMessage = 'Failed to create account. Please try again.';
            
            // ✅ Prioritize backend error message (includes test email validation)
            // Check multiple possible error formats
            if (err?.message) {
                errorMessage = err.message;
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err?.error) {
                errorMessage = err.error;
            } else if (err?.response?.data?.errors) {
                // Handle field-specific errors
                const fieldErrors = Object.values(err.response.data.errors).flat();
                errorMessage = fieldErrors.join(', ') || errorMessage;
            }
            
            // ✅ Debug logging - Always log to help diagnose
            console.error('❌ Registration Error Details:', {
                errorMessage,
                err,
                errMessage: err?.message,
                errResponse: err?.response,
                errError: err?.error,
                errString: String(err),
            });
            
            // ✅ Clear any previous errors and set the new one
            // Ensure we always set an error message, even if extraction failed
            const finalErrorMessage = errorMessage || String(err) || 'An unexpected error occurred';
            setAuthError(finalErrorMessage);
            
            // ✅ Also log the state update
            console.log('🔴 Setting authError state to:', finalErrorMessage);
            
            // ✅ Force re-render and scroll to error message
            setTimeout(() => {
                const errorElement = document.querySelector('[role="alert"]') || 
                                    document.querySelector('.alert-destructive') ||
                                    document.querySelector('[data-error="true"]');
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 200);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* ✅ SIMPLE ERROR MESSAGE - Always visible at top */}
                            {authError && (
                                <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-md">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-red-800 font-bold text-sm mb-1">
                                                Registration Failed
                                            </h4>
                                            <p className="text-red-700 text-sm font-medium">
                                                {authError}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {isAuthenticated && user && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Already Logged In</AlertTitle>
                                    <AlertDescription>
                                        You are currently logged in as {user.full_name}. 
                                        You can create a new account or{' '}
                                        <Link to={`/${user.role}/dashboard`} className="font-semibold text-primary hover:underline">
                                            go to your dashboard
                                        </Link>.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="m@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* No password strength indicator explicitly requested other than validation, but we can assume nice UI */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Must be at least 8 characters with uppercase, lowercase, and a number
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                            </div>

                            <FormField
                                control={form.control}
                                name="confirm_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>I am a...</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="player" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Player (Participate in matches)
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="captain" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Captain (Manage team and matches)
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(selectedRole === 'player' || selectedRole === 'captain') && (
                                <FormField
                                    control={form.control}
                                    name="player_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Player Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select your play style" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="batsman">Batsman</SelectItem>
                                                    <SelectItem value="bowler">Bowler</SelectItem>
                                                    <SelectItem value="all-rounder">All-Rounder</SelectItem>
                                                    <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                This helps captains find you for their team.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-gray-500">
                    <div>
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
