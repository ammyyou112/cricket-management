import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface InactivityWarningProps {
  open: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
}

export const InactivityWarning = ({ 
  open, 
  secondsRemaining, 
  onStayLoggedIn 
}: InactivityWarningProps) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            You've been inactive for a while. You'll be automatically logged out in:
            
            <div className="text-4xl font-bold text-center my-6 text-orange-600 dark:text-orange-400">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            
            Click "Stay Logged In" to continue your session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayLoggedIn} className="w-full sm:w-auto">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

