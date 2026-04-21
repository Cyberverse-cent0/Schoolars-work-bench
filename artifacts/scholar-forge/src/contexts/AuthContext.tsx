import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "scholarforge_token";
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institution?: string | null;
  researchInterests?: string | null;
  bio?: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(doLogout, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      // Validate token with timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error('Token invalid');
          return r.json();
        })
        .then((u) => {
          if (u) setUser(u);
          else { localStorage.removeItem(TOKEN_KEY); setToken(null); }
        })
        .catch(() => { 
          localStorage.removeItem(TOKEN_KEY); 
          setToken(null); 
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handle server-initiated logout (inactivity timeout)
  useEffect(() => {
    const checkForAutoLogout = () => {
      // Check if user was logged out due to inactivity
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (!currentToken && token) {
        console.log("Server logged out user due to inactivity");
        doLogout();
      }
    };

    // Check every 30 seconds for automatic logout
    const interval = setInterval(checkForAutoLogout, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = doLogout;

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
