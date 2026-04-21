import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  User, GraduationCap, BookOpen, Calendar, Users, 
  ExternalLink, Mail, Globe, MapPin, Briefcase,
  ArrowLeft, UserCheck, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/contexts/SocketContext";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { MessageModal } from "@/components/MessageModal";
import { useAuth } from "@/contexts/AuthContext";

interface PublicProfile {
  id: string;
  name: string;
  image?: string | null;
  institution?: string | null;
  researchInterests?: string | null;
  bio?: string | null;
  role: string;
  createdAt: string;
  projects: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    visibility: string;
    role: string;
    createdAt: string;
  }>;
  projectCount: number;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showMessageModal, setShowMessageModal] = useState(false);

  const { data: profile, loading, error } = useQuery<PublicProfile>(
    `/api/users/${userId}/public`,
    [userId]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PLANNING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ON_HOLD": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPLETED": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "USER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Shield className="w-3 h-3" />;
      case "USER": return <UserCheck className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-20">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Profile Not Found</h2>
          <p className="text-muted-foreground">The user profile you're looking for doesn't exist or isn't public.</p>
          <Button className="mt-4" onClick={() => setLocation("/scholars")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scholars on going research
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/scholars")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-serif font-semibold text-foreground">
                  {profile.name}
                </h1>
                <Badge className={getRoleColor(profile.role)}>
                  <div className="flex items-center gap-1">
                    {getRoleIcon(profile.role)}
                    {profile.role}
                  </div>
                </Badge>
              </div>

              {profile.institution && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <GraduationCap className="w-4 h-4" />
                  <span>{profile.institution}</span>
                </div>
              )}

              {profile.bio && (
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {profile.projectCount} {profile.projectCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Research Interests */}
          {profile.researchInterests && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Research Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.researchInterests}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Projects ({profile.projects.length})
              </CardTitle>
              <CardDescription>
                Public projects {profile.name} is participating in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.projects.length > 0 ? (
                <div className="space-y-4">
                  {profile.projects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Link href={`/projects/${project.id}`}>
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                              {project.title}
                            </h3>
                          </Link>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {project.role}
                          </Badge>
                          <Badge className={`${getStatusColor(project.status)} text-xs`}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Started {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No public projects yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Projects</span>
                  <span className="font-semibold">{profile.projectCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge className={getRoleColor(profile.role)} variant="outline">
                    {profile.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info (placeholder) */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user && user.id !== profile?.id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowMessageModal(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Modal */}
      {profile && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          recipientName={profile.name}
          recipientId={profile.id}
        />
      )}
    </div>
  );
}
