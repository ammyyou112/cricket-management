import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
                    <Card className="max-w-md w-full border-destructive/50 shadow-lg">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle className="text-xl text-destructive">Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-2">
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                            {this.state.error && (
                                <div className="bg-muted p-2 rounded text-xs text-left overflow-auto max-h-32 text-muted-foreground font-mono mt-4">
                                    {this.state.error.message}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-center pt-2">
                            <Button onClick={this.handleReload} variant="default">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reload Page
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
