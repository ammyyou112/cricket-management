import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    };
    className?: string;
    iconClassName?: string;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    className,
    iconClassName,
}: EmptyStateProps) => {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-in fade-in-50",
            className
        )}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60 mb-6 group-hover:bg-muted/80 transition-colors">
                <Icon className={cn("h-10 w-10 text-muted-foreground/80", iconClassName)} />
            </div>
            <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 text-balance">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} variant={action.variant || "default"}>
                    {action.label}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
