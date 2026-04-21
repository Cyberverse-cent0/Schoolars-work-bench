import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/hooks/useApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [recoveryMethod, setRecoveryMethod] = useState("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [institution, setInstitution] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResetLink("");
    setLoading(true);

    try {
      const recoveryData = {
        email,
        recoveryMethod,
        additionalInfo: {
          phoneNumber: phoneNumber.trim(),
          securityQuestion: selectedQuestion,
          securityAnswer: securityAnswer.trim(),
          dateOfBirth,
          institution: institution.trim()
        }
      };

      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(recoveryData),
      });

      setSuccess(true);
      if (response.resetLink) {
        setResetLink(response.resetLink);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Password Recovery</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Reset Password</CardTitle>
            <CardDescription>
              We'll send a password reset link to your email
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
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Recovery Method Selection */}
                <div className="space-y-2">
                  <Label>Recovery Method</Label>
                  <Select value={recoveryMethod} onValueChange={setRecoveryMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recovery method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Recovery</SelectItem>
                      <SelectItem value="phone">Phone Verification</SelectItem>
                      <SelectItem value="security">Security Questions</SelectItem>
                      <SelectItem value="enhanced">Enhanced Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional fields based on recovery method */}
                {(recoveryMethod === "phone" || recoveryMethod === "enhanced") && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      disabled={loading}
                    />
                  </div>
                )}

                {(recoveryMethod === "security" || recoveryMethod === "enhanced") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="question">Security Question</Label>
                      <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pet">What was the name of your first pet?</SelectItem>
                          <SelectItem value="school">What elementary school did you attend?</SelectItem>
                          <SelectItem value="city">In what city were you born?</SelectItem>
                          <SelectItem value="friend">What is the name of your best childhood friend?</SelectItem>
                          <SelectItem value="mother">What is your mother's maiden name?</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="answer">Security Answer</Label>
                      <Input
                        id="answer"
                        type="text"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        placeholder="Enter your answer"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {recoveryMethod === "enhanced" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution/Organization</Label>
                      <Input
                        id="institution"
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Your university or organization"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Reset link sent!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Check your email inbox for the password reset link
                    </p>
                  </div>
                </div>

                {resetLink && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Demo Reset Link:
                    </p>
                    <a 
                      href={resetLink}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {resetLink}
                    </a>
                  </div>
                )}
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

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
