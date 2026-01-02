import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export const BottomSheet = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className 
}: BottomSheetProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50",
        "transform transition-transform duration-300 md:hidden",
        "max-h-[85vh] overflow-y-auto shadow-2xl",
        isOpen ? 'translate-y-0' : 'translate-y-full',
        className
      )}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-10 w-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
};

