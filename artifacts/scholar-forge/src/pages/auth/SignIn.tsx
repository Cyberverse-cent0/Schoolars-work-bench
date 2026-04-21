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
  const [yahooLoading, setYahooLoading] = useState(false);

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

      let responseData;
      try {
        responseData = await res.json();
      } catch (jsonError) {
        console.error("[SignIn] Failed to parse Google auth response:", jsonError);
        throw new Error("Invalid response from server");
      }

      console.log("[SignIn] Google auth response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Google sign in failed" }));
        throw new Error(errorData.error || "Google sign in failed");
      }

      const data = responseData;
      console.log("[SignIn] Google auth response data:", data);
      
      if (!data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to sign in with Google";
      setError(errorMsg);
      console.error("[SignIn] Google sign-in error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleYahooSignIn = async () => {
    setYahooLoading(true);
    setError("");
    try {
      // For demo purposes, we'll simulate a Yahoo sign-in
      // In production, this would use Yahoo OAuth library
      console.log("[SignIn] Custom Yahoo sign-in initiated");
      
      // Simulate a mock Yahoo token
      const mockYahooToken = "mock-yahoo-token-" + Date.now();
      
      const res = await fetch("/api/auth/yahoo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockYahooToken }),
      });

      console.log("[SignIn] Yahoo auth response status:", res.status);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Yahoo sign in failed" }));
        throw new Error(data.error || "Yahoo sign in failed");
      }

      const data = await res.json();
      console.log("[SignIn] Yahoo auth response data:", data);
      
      if (!data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to sign in with Yahoo";
      setError(errorMsg);
      console.error("[SignIn] Yahoo sign-in error:", err);
    } finally {
      setYahooLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("[SignIn] Google sign in failed");
    setError("Google sign in failed. Please try again or use email/password.");
  };

  const handleCustomGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      console.log("[SignIn] Custom Google sign-in initiated");
      
      // Simulate a mock Google token
      const mockGoogleToken = "mock-google-token-" + Date.now();
      
      // Send the token to our backend
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockGoogleToken }),
      });

      console.log("[SignIn] Google auth response status:", res.status);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Google sign in failed" }));
        throw new Error(data.error || "Google sign in failed");
      }

      const data = await res.json();
      console.log("[SignIn] Google auth response data:", data);
      
      if (!data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      console.log("[SignIn] Custom Google auth success:", data.user);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Google sign in failed";
      console.error("[SignIn] Custom Google error:", errorMsg);
      setError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    // Immediately set up custom button as fallback
    console.log("[SignIn] Setting up Google authentication");
    setGoogleAvailable(false); // Start with custom button only
    
    // Check if Google Sign-In is available
    const setupGoogle = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log("[SignIn] Google Client ID:", clientId ? clientId.substring(0, 10) + "..." : "not found");

      if (window.google && window.google.accounts && window.google.accounts.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
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
        console.log("[SignIn] Google Sign-In initialized successfully");
      }
    };

    // Load Google script if needed
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      if (script.hasAttribute("data-loaded")) {
        setupGoogle();
      } else {
        script.addEventListener("load", () => {
          setupGoogle();
        });
        script.setAttribute("data-loaded", "true");
      }
    }
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
              {/* Official Google Sign-In Button */}
              <div
                id="google-signin-button"
                className="flex justify-center"
                style={{ display: googleAvailable ? "block" : "none" }}
              ></div>
              
              {/* Custom Google Sign-In Button (Fallback) */}
              <div style={{ display: googleAvailable ? "none" : "block" }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 h-11 border-gray-300 hover:bg-gray-50"
                  onClick={handleCustomGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google (Demo)
                    </>
                  )}
                </Button>
              </div>
              
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in with Google...
                </div>
              )}
            </div>

            {/* Yahoo Sign In Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-purple-300 hover:bg-purple-50"
                onClick={handleYahooSignIn}
                disabled={yahooLoading}
              >
                {yahooLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#720E9E" d="M11.99 12.34c-1.1 0-2 .04-.76-2.04-1.71 0-3.38.34-5.1.34-5.1.34s-4.28 1.92-5.1 4.28c-1.1.84-1.92 1.1-3.38.34-5.1.34zm0 7.34c1.67 0 3.02.83 4.44 3.02.83 4.44 0 2.98-.83 4.44-3.02.83zm0-5.1c-1.1 0-2.04.76-2.04 1.71 0 3.38-.34 5.1.34 5.1.34s4.28-1.92 5.1-4.28c1.1.84 1.92 1.1 3.38.34 5.1.34z"/>
                      <path fill="#720E9E" d="M12 24c6.62 0 12-5.38-12-12-5.38S0 1.38 0 12s5.38 12 12 12 12 5.38 12 12zm0-18c-4.97 0-9 4.03-9 9-4.03S0 6 6 6 6 9 4.03 9 9zm0 14c-4.97 0-9-4.03-9-9-4.03S0 20 6 6 6s9 4.03 9 9z"/>
                    </svg>
                    Continue with Yahoo (Demo)
                  </>
                )}
              </Button>
              
              {yahooLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-md mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in with Yahoo...
                </div>
              )}
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

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
                    placeholder="Enter your password"
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <a href="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot your password?
              </a>
            </div>
            <div className="mt-2 text-center text-sm text-muted-foreground">
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
