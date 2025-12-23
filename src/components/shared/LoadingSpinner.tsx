import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
    "animate-spin text-primary",
    {
        variants: {
            size: {
                sm: "h-4 w-4",
                md: "h-8 w-8",
                lg: "h-16 w-16",
                xl: "h-24 w-24"
            },
        },
        defaultVariants: {
            size: "md",
        },
    }
);

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
    className?: string;
    text?: string;
    fullPage?: boolean;
}

const LoadingSpinner = ({ size, className, text, fullPage = false }: LoadingSpinnerProps) => {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <Loader2 className={spinnerVariants({ size })} />
            {text && <p className="text-muted-foreground animate-pulse text-sm font-medium">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
