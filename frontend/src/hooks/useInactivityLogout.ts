import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useToast } from '../components/ui/use-toast';

interface UseInactivityLogoutOptions {
  warningTime?: number; // ms before showing warning
  logoutTime?: number;  // ms before auto logout
  enabled?: boolean;   // can disable on certain pages
}

export const useInactivityLogout = (options: UseInactivityLogoutOptions = {}) => {
  const {
    warningTime = 28 * 60 * 1000,  // 28 minutes (default)
    logoutTime = 30 * 60 * 1000,   // 30 minutes (default)
    enabled = true
  } = options;

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  
  const warningTimerRef = useRef<NodeJS.Timeout>();
  const logoutTimerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast({
        title: 'Session Expired',
        description: 'You were logged out due to inactivity.',
        variant: 'default',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  }, [logout, navigate, toast]);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = undefined;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = undefined;
    }

    // Set new timers
    warningTimerRef.current = setTimeout(() => {
      const remainingSeconds = Math.floor((logoutTime - warningTime) / 1000);
      setSecondsRemaining(remainingSeconds);
      setShowWarning(true);
    }, warningTime);

    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, logoutTime);
  }, [warningTime, logoutTime, handleLogout]);

  const handleStayLoggedIn = useCallback(() => {
    resetTimers();
    toast({
      title: 'Session Extended',
      description: 'Your session has been extended.',
    });
  }, [resetTimers, toast]);

  useEffect(() => {
    if (!enabled) {
      // Clear timers if disabled
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      return;
    }

    const events = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetTimers();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [enabled, resetTimers]);

  // Countdown effect
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  return { 
    showWarning, 
    secondsRemaining,
    resetTimers: handleStayLoggedIn,
    handleLogout
  };
};

