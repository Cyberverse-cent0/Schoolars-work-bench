import { useState, useEffect } from "react";
import { Search, Users, UserCheck, Shield, GraduationCap, Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institution?: string | null;
  researchInterests?: string | null;
  bio?: string | null;
  image?: string | null;
  isOnline: boolean;
  createdAt: string;
  projectCount: number;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    role: string;
  }>;
}

interface UserManagementResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = new URLSearchParams({
    search,
    role: roleFilter,
    sortBy,
    sortOrder,
    page: currentPage.toString(),
    limit: "10",
  });

  const { data, loading, refetch } = useQuery<UserManagementResponse>(
    `/api/users/management?${queryParams.toString()}`,
    [search, roleFilter, sortBy, sortOrder, currentPage]
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      refetch(); // Refresh the user list
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "USER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PLANNING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "COMPLETED": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-20">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required to view user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">User Management</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage users, roles, and view activity</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.users?.length ? (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {data.users.map((user) => (
              <Card key={user.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        {user.isOnline && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      
                      {user.institution && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <GraduationCap className="w-3 h-3" />
                          {user.institution}
                        </div>
                      )}

                      {user.researchInterests && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Research:</strong> {user.researchInterests}
                        </p>
                      )}

                      {/* Projects */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-foreground">
                            Projects ({user.projectCount})
                          </span>
                        </div>
                        {user.projects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.projects.slice(0, 3).map((project) => (
                              <Badge
                                key={project.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {project.title} ({project.role})
                              </Badge>
                            ))}
                            {user.projects.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.projects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No projects yet</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      
                      {user.id !== user?.id && (
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === data.pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
