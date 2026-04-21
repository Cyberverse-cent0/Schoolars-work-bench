import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ActivityEvent {
  id: string;
  userId: string;
  type: 'page_view' | 'click' | 'scroll' | 'typing' | 'message_send' | 'login' | 'logout';
  timestamp: Date;
  details?: Record<string, any>;
}

interface ActivityState {
  lastActivity: Date | null;
  isActive: boolean;
  events: ActivityEvent[];
  inactivityTimeout: number; // in minutes
}

interface ActivityContextType {
  state: ActivityState;
  trackActivity: (type: ActivityEvent['type'], details?: Record<string, any>) => void;
  setInactivityTimeout: (minutes: number) => void;
  resetActivity: () => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActivityState>({
    lastActivity: null,
    isActive: false,
    events: [],
    inactivityTimeout: 15 // Default 15 minutes
  });

  const trackActivity = (type: ActivityEvent['type'], details?: Record<string, any>) => {
    const event: ActivityEvent = {
      id: Math.random().toString(36).substring(2, 15),
      userId: 'current-user', // This would be set from auth context
      type,
      timestamp: new Date(),
      details
    };

    setState(prev => ({
      ...prev,
      lastActivity: new Date(),
      isActive: true,
      events: [...prev.events, event].slice(-100) // Keep last 100 events
    }));
  };

  const setInactivityTimeout = (minutes: number) => {
    setState(prev => ({ ...prev, inactivityTimeout: minutes }));
  };

  const resetActivity = () => {
    setState(prev => ({
      ...prev,
      lastActivity: new Date(),
      isActive: true,
      events: []
    }));
  };

  // Check for inactivity every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.lastActivity) {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - state.lastActivity.getTime();
        const inactiveMinutes = timeSinceLastActivity / (1000 * 60);

        if (inactiveMinutes >= state.inactivityTimeout && state.isActive) {
          setState(prev => ({ ...prev, isActive: false }));
          
          // Trigger automatic logout
          console.log(`User inactive for ${inactiveMinutes} minutes, logging out...`);
          // TODO: Call logout function here
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.lastActivity, state.inactivityTimeout, state.isActive]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        trackActivity('page_view', { visible: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const value: ActivityContextType = {
    state,
    trackActivity,
    setInactivityTimeout,
    resetActivity
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export default ActivityContext;
