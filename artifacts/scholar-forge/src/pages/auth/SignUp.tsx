import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

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

export default function SignUp() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
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
      console.log("[SignUp] Google token received, sending to backend");

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("[SignUp] JSON parse error:", parseErr);
        data = { error: "Invalid response from server" };
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || "Google sign up failed");
      }

      console.log("[SignUp] Google auth success:", data.user);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Google sign up failed";
      console.error("[SignUp] Google error:", errorMsg);
      setError(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("[SignUp] Google sign up failed");
    setError("Google sign up failed. Please try again or use email/password.");
  };

  const handleYahooSignUp = async () => {
    setYahooLoading(true);
    setError("");
    try {
      // For demo purposes, we'll simulate a Yahoo sign-up
      // In production, this would use Yahoo OAuth library
      console.log("[SignUp] Custom Yahoo sign-up initiated");
      
      // Simulate a mock Yahoo token
      const mockYahooToken = "mock-yahoo-token-" + Date.now();
      
      // Send token to our backend
      const res = await fetch("/api/auth/yahoo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockYahooToken }),
      });

      console.log("[SignUp] Yahoo auth response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Yahoo sign up failed" }));
        const errorMsg = errorData.error || "Yahoo sign up failed";
        console.error("[SignUp] Yahoo sign-up failed:", errorMsg);
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log("[SignUp] Yahoo auth response data:", data);
      
      if (!data.token || !data.user) {
        const errorMsg = "Invalid response from server";
        console.error("[SignUp] Invalid Yahoo response:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("[SignUp] Custom Yahoo auth success:", data.user);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to sign up with Yahoo";
      setError(errorMsg);
      console.error("[SignUp] Yahoo sign-up error:", err);
    } finally {
      setYahooLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (window.google && window.google.accounts) {
      console.log("[SignUp] Clicking Google Sign-In button");
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-button")!,
        {
          type: "standard",
          size: "large",
          text: "signup_with",
          theme: "outline",
          locale: "en",
        },
      );
    } else {
      console.log("[SignUp] Google not available");
    }
  };

  useEffect(() => {
    // Check if Google Sign-In is available
    const setupGoogle = () => {
      if (window.google && window.google.accounts && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-button")!,
          {
            type: "standard",
            size: "large",
            text: "signup_with",
            theme: "outline",
            locale: "en",
          },
        );
        setGoogleAvailable(true);
        console.log("[SignUp] Google Sign-In initialized successfully");
      } else {
        console.log("[SignUp] Google Sign-In not available");
        setGoogleAvailable(false);
      }
    };

    // Always show Google button (even if not available, for demo)
    console.log("[SignUp] Google button visibility set to visible");

    // Use script tag's onload event with timeout
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      if (script.hasAttribute("data-loaded")) {
        setupGoogle();
      } else {
        const timeoutId = setTimeout(() => {
          console.log("[SignUp] Google script timeout - using fallback");
          setGoogleAvailable(false);
        }, 3000);
        
        script.addEventListener("load", () => {
          clearTimeout(timeoutId);
          setupGoogle();
        });
        script.setAttribute("data-loaded", "true");
      }
      
      return () => {
        clearTimeout(timeoutId);
        script.removeEventListener("load", setupGoogle);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const payload = { name, email, password, institution };

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Registration failed" }));
        throw new Error(errorData.error || `Sign up failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred during signup";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-xl">Join ScholarForge</CardTitle>
            <CardDescription>Create your research workspace account</CardDescription>
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
                id="google-signup-button"
                className="flex justify-center"
                style={{ display: googleAvailable ? "block" : "none" }}
              ></div>
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing up with Google...
                </div>
              )}
            </div>

            {/* Yahoo Sign In Button */}
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-11 border-purple-300 hover:bg-purple-50"
                onClick={handleYahooSignUp}
                disabled={yahooLoading}
              >
                {yahooLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing up with Yahoo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#720E9E" d="M11.99 12.34c-1.1 0-2 .04-.76-2.04-1.71 0-3.38.34-5.1.34s-4.28 1.92-5.1.34z"/>
                      <path fill="#720E9E" d="M12 24c6.62 0 12-5.38-12-12-5.38S0 1.38 0 12s5.38 12 12 5.38 12 12z"/>
                    </svg>
                    Continue with Yahoo (Demo)
                  </>
                )}
              </Button>
              
              {yahooLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing up with Yahoo...
                </div>
              )}
            </div>

            {googleAvailable && <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with email</span></div></div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Dr. Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">Institution <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="institution" placeholder="MIT" value={institution} onChange={(e) => setInstitution(e.target.value)} data-testid="input-institution" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || googleLoading} data-testid="button-signup">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/signin" className="text-primary hover:underline font-medium">Sign in</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
