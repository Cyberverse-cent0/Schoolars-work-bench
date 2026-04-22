import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Shield, FileText, Users, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityPolicy {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

const securityPolicies: SecurityPolicy[] = [
  {
    id: "data-privacy",
    title: "Data Privacy & Security",
    description: "We protect your academic data with industry-standard encryption and never share your research without consent.",
    required: true
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use Policy",
    description: "Use ScholarForge for academic collaboration, research sharing, and educational purposes only.",
    required: true
  },
  {
    id: "academic-integrity",
    title: "Academic Integrity",
    description: "Maintain honesty in research, proper citations, and respect intellectual property rights.",
    required: true
  },
  {
    id: "community-guidelines",
    title: "Community Guidelines",
    description: "Be respectful in collaborative features, provide constructive feedback, and help maintain a positive academic environment.",
    required: true
  }
];

export default function SecurityPolicyAcceptance() {
  const { user } = useAuth();
  const [acceptedPolicies, setAcceptedPolicies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptPolicy = async (policyId: string) => {
    setIsLoading(true);
    
    try {
      // Here you would typically save to backend
      console.log(`[SecurityPolicy] User ${user?.id} accepted policy: ${policyId}`);
      
      setAcceptedPolicies(prev => [...prev, policyId]);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("[SecurityPolicy] Error accepting policy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setIsLoading(true);
    
    try {
      const allPolicyIds = securityPolicies.map(policy => policy.id);
      console.log(`[SecurityPolicy] User ${user?.id} accepted all policies`);
      
      setAcceptedPolicies(allPolicyIds);
      
      // Mark user as having completed onboarding
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error("[SecurityPolicy] Error accepting all policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const allAccepted = acceptedPolicies.length === securityPolicies.length;
  const requiredAccepted = securityPolicies
    .filter(policy => policy.required)
    .every(policy => acceptedPolicies.includes(policy.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-border shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Security Policy Acceptance
              </CardTitle>
              <CardDescription>
                {allAccepted ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    All policies accepted
                  </span>
                ) : (
                  <span className="text-orange-600">
                    Please review and accept our security policies to continue
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {user ? (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">Welcome, {user.name}!</h3>
                        <p className="text-muted-foreground">
                          To get started with ScholarForge, please review and accept our security policies.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="mb-6">
                    <AlertTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Quick Start Available
                    </AlertTitle>
                    <AlertDescription>
                      If you're ready to accept all policies now, you can get started immediately. Otherwise, you can review each policy individually below.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleAcceptAll}
                      disabled={isLoading || allAccepted}
                      className="w-full"
                    >
                      {isLoading ? "Accepting..." : "Accept All Policies"}
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-4">Review Individual Policies</h4>
                    
                    {securityPolicies.map((policy) => {
                      const isAccepted = acceptedPolicies.includes(policy.id);
                      const isRequired = policy.required;
                      
                      return (
                        <Card key={policy.id} className={`mb-4 ${isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isAccepted ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">1</span>
                                  </div>
                                )}
                                <span className="text-lg">{policy.title}</span>
                                {isRequired && (
                                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">Required</span>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
                            
                            <div className="flex items-center gap-3">
                              <Button 
                                onClick={() => handleAcceptPolicy(policy.id)}
                                disabled={isLoading || isAccepted}
                                variant={isAccepted ? "outline" : "default"}
                                size="sm"
                              >
                                {isAccepted ? "Accepted" : "Accept Policy"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-serif text-foreground mb-4">Security Policies</h2>
                  <p className="text-muted-foreground mb-8">
                    Please sign in to review and accept our security policies.
                  </p>
                  
                  <Alert className="mb-6">
                    <AlertTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      About Our Policies
                    </AlertTitle>
                    <AlertDescription>
                      ScholarForge is committed to maintaining a secure, collaborative academic environment. 
                      Please review our policies carefully before proceeding.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {securityPolicies.map((policy) => (
                      <Card key={policy.id} className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg">{policy.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
