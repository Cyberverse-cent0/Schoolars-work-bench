import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/hooks/useApi";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Extract token and email from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlEmail = params.get("email");

    if (!urlToken || !urlEmail) {
      setError("Invalid password reset link. Please request a new one.");
      return;
    }

    setToken(urlToken);
    setEmail(urlEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md">
          <Card className="border-border shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Reset Link</h2>
                <p className="text-muted-foreground mb-4">
                  This password reset link is invalid or has expired.
                </p>
                <Link to="/forgot-password">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Create a new password for your account
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Password reset successful!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      You can now sign in with your new password
                    </p>
                  </div>
                </div>

                <Link to="/signin">
                  <Button className="w-full">Sign In with New Password</Button>
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/signin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
