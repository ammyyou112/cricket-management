import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as authApi from '../../lib/api/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '../../components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// Schema for forgot password (email only)
const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
});

// Schema for reset password
const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ForgotPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetToken, setResetToken] = useState<string | null>(token);

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    const forgotPasswordForm = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const resetPasswordForm = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    // Handle forgot password submission
    const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await authApi.forgotPassword(data.email);
            setEmailSent(true);
            // In development, token might be in response
            if (result.token) {
                setResetToken(result.token);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle reset password submission
    const onResetPasswordSubmit = async (data: ResetPasswordFormData) => {
        if (!resetToken) {
            setError('Reset token is missing. Please request a new password reset.');
            return;
        }

        setIsResetting(true);
        setError(null);
        try {
            await authApi.resetPassword(resetToken, data.newPassword);
            setResetSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsResetting(false);
        }
    };

    // If token is present in URL, show reset password form
    if (resetToken && !emailSent && !resetSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <CardTitle className="text-2xl">Reset Password</CardTitle>
                        </div>
                        <CardDescription>
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...resetPasswordForm}>
                            <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={resetPasswordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Must be at least 8 characters with uppercase, lowercase, and a number.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={resetPasswordForm.control}
                                    name="confirmPassword"
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

                                <Button type="submit" className="w-full" disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset Password
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-4 text-center text-sm">
                            <Link to="/login" className="text-primary hover:underline">
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If reset was successful
    if (resetSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <div>
                                <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
                                <p className="text-muted-foreground mt-2">
                                    Your password has been reset successfully. Redirecting to login...
                                </p>
                            </div>
                            <Button onClick={() => navigate('/login')} className="w-full">
                                Go to Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Default: Forgot password form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    </div>
                    <CardDescription>
                        {emailSent
                            ? 'Check your email for the reset link'
                            : 'Enter your email address and we\'ll send you a reset link'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {emailSent ? (
                        <div className="space-y-4">
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Email Sent!</AlertTitle>
                                <AlertDescription>
                                    {resetToken ? (
                                        <>
                                            <p className="mb-2">In development mode, you can use this reset token:</p>
                                            <code className="block p-2 bg-muted rounded text-sm break-all">
                                                {resetToken}
                                            </code>
                                            <p className="mt-2">
                                                Or click this link:{' '}
                                                <Link
                                                    to={`/forgot-password?token=${resetToken}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    Reset Password
                                                </Link>
                                            </p>
                                        </>
                                    ) : (
                                        'If an account with that email exists, a password reset link has been sent to your email address.'
                                    )}
                                </AlertDescription>
                            </Alert>
                            <Button onClick={() => navigate('/login')} className="w-full" variant="outline">
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Form {...forgotPasswordForm}>
                                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                                    <FormField
                                        control={forgotPasswordForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="m@example.com"
                                                        {...field}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Reset Link
                                    </Button>
                                </form>
                            </Form>

                            <div className="mt-4 text-center text-sm">
                                <Link to="/login" className="text-primary hover:underline">
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;

