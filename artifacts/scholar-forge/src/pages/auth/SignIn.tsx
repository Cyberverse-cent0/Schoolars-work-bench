import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { frontendDebugger, measurePerformance } from "@/utils/debugUtils";

// Google Sign-In types
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: any) => void }) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function SignIn() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  const handleGoogleSuccess = async (response: any) => {
    setGoogleLoading(true);
    setError("");
    try {
      const googleToken = response.credential;
      console.log("[SignIn] Google token received, sending to backend");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("[SignIn] JSON parse error:", parseErr);
        data = { error: "Invalid response from server" };
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Google sign in failed");
      }

      console.log("[SignIn] Google auth success:", data.user);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Google sign in failed";
      console.error("[SignIn] Google error:", errorMsg);
      setError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("[SignIn] Google sign in failed");
    setError("Google sign in failed. Please try again or use email/password.");
  };

  useEffect(() => {
    // Check if Google Sign-In is available
    const setupGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button")!,
          {
            type: "standard",
            size: "large",
            text: "signin_with",
            theme: "outline",
          },
        );
        setGoogleAvailable(true);
      }
    };

    // Use script tag's onload event with timeout
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      if (script.hasAttribute("data-loaded")) {
        setupGoogle();
      } else {
        const timeoutId = setTimeout(() => {
          // If Google doesn't load within 3 seconds, continue without it
          setGoogleAvailable(false);
        }, 3000);
        
        script.addEventListener("load", () => {
          clearTimeout(timeoutId);
          setupGoogle();
        });
        
        return () => {
          clearTimeout(timeoutId);
          script.removeEventListener("load", setupGoogle);
        };
      }
    }
    return undefined;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    await measurePerformance('signin_submission', async () => {
      try {
        frontendDebugger.logAuthAttempt('signin_start', email);
        
        const payload = { email, password };

        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Authentication failed" }));
          const error = new Error(errorData.error || `Sign in failed (${res.status})`);
          frontendDebugger.logAuthAttempt('signin_failed', email, undefined, error.message);
          throw error;
        }

        const data = await res.json();

        if (!data.token || !data.user) {
          const error = new Error("Invalid response from server");
          frontendDebugger.logAuthAttempt('signin_invalid_response', email, undefined, error.message);
          throw error;
        }

        login(data.token, data.user);
        frontendDebugger.logAuthAttempt('signin_success', email);
        navigate("/dashboard");
      } catch (err: any) {
        const errorMsg = err.message || "An error occurred during sign in";
        setError(errorMsg);
        frontendDebugger.logError('signin_error', err, { email });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <script src="https://accounts.google.com/gsi/client" async defer></script>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">ScholarForge</h1>
        </div>
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your research workspace</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="mb-6">
              <div
                id="google-signin-button"
                className="flex justify-center"
                style={{ display: googleAvailable ? "block" : "none" }}
              ></div>
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in with Google...
                </div>
              )}
            </div>

            {googleAvailable && <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with email</span></div></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || googleLoading} data-testid="button-signin">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
