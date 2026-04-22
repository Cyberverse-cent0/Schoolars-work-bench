import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MoreHorizontal, Shield, Users, UserCheck, Ban, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  institution?: string;
  researchInterests?: string;
  bio?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  emailVerified?: boolean;
  profileCompleted?: boolean;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "BANNED">("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const mockUsers: User[] = [
        {
          id: "1",
          name: "Dr. Sarah Chen",
          email: "sarah.chen@university.edu",
          role: "ADMIN",
          institution: "Stanford University",
          researchInterests: "Machine Learning, AI Ethics",
          bio: "Professor of Computer Science specializing in ML research.",
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-04-20T14:25:00Z",
          lastActive: "2024-04-22T09:15:00Z",
          emailVerified: true,
          profileCompleted: true
        },
        {
          id: "2",
          name: "Prof. Michael Johnson",
          email: "michael.johnson@tech.edu",
          role: "USER",
          institution: "MIT",
          researchInterests: "Distributed Systems, Blockchain",
          bio: "Research professor focused on distributed systems and cryptocurrency.",
          createdAt: "2024-02-10T16:45:00Z",
          updatedAt: "2024-03-15T11:20:00Z",
          lastActive: "2024-04-21T16:30:00Z",
          emailVerified: true,
          profileCompleted: false
        },
        {
          id: "3",
          name: "Emily Rodriguez",
          email: "emily.rodriguez@college.edu",
          role: "USER",
          institution: "UC Berkeley",
          researchInterests: "Environmental Science, Climate Change",
          bio: "Graduate student in Environmental Science program.",
          createdAt: "2024-03-05T13:20:00Z",
          updatedAt: "2024-03-18T10:45:00Z",
          lastActive: "2024-04-20T08:45:00Z",
          emailVerified: false,
          profileCompleted: false
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error("[UserManagement] Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && user.lastActive) ||
      (statusFilter === "INACTIVE" && !user.lastActive) ||
      (statusFilter === "BANNED" && user.role === "BANNED");
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    try {
      // Mock API call
      console.log(`[UserManagement] Changing role for user ${userId} to ${newRole}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error("[UserManagement] Error changing role:", error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "INACTIVE" | "BANNED") => {
    try {
      // Mock API call
      console.log(`[UserManagement] Changing status for user ${userId} to ${newStatus}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, lastActive: newStatus === "ACTIVE" ? new Date().toISOString() : undefined } : user
      ));
    } catch (error) {
      console.error("[UserManagement] Error changing status:", error);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      // Mock API call
      console.log(`[UserManagement] Banning user ${userId}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: "BANNED" } : user
      ));
    } catch (error) {
      console.error("[UserManagement] Error banning user:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Mock API call
      console.log(`[UserManagement] Deleting user ${userId}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error("[UserManagement] Error deleting user:", error);
    }
  };

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground mb-6">Manage users, roles, and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Users ({filteredUsers.length})
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border-b rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {user.image && (
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                              <img
                                src={user.image}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">{user.name}</h3>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm text-muted-foreground">{user.email}</h4>
                              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </div>
                            {user.institution && (
                              <p className="text-sm text-muted-foreground">{user.institution}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right space-x-2">
                          <div className="text-xs text-muted-foreground mb-2">
                            {user.lastActive && (
                              <span>Last active: {new Date(user.lastActive).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.emailVerified ? "default" : "destructive"} className="mb-2">
                              {user.emailVerified ? "Verified" : "Not Verified"}
                            </Badge>
                            <Badge variant={user.profileCompleted ? "default" : "secondary"} className="mb-2">
                              {user.profileCompleted ? "Complete" : "Incomplete"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Details Modal */}
          {selectedUser && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  User Details
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  {selectedUser.image && (
                    <div className="h-20 w-20 rounded-full overflow-hidden">
                      <img
                        src={selectedUser.image}
                        alt={selectedUser.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{selectedUser.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={selectedUser.role === "ADMIN" ? "default" : "secondary"}>
                        {selectedUser.role}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    {selectedUser.institution && (
                      <p className="text-sm text-muted-foreground mb-2">{selectedUser.institution}</p>
                    )}
                    {selectedUser.researchInterests && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Research Interests:</strong> {selectedUser.researchInterests}
                      </p>
                    )}
                    {selectedUser.bio && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Bio:</strong> {selectedUser.bio}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Account Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Email Verified</span>
                          <Badge variant={selectedUser.emailVerified ? "default" : "destructive"}>
                            {selectedUser.emailVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Profile Completed</span>
                          <Badge variant={selectedUser.profileCompleted ? "default" : "secondary"}>
                            {selectedUser.profileCompleted ? "Complete" : "Incomplete"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Active</span>
                          <span className="text-sm text-foreground">
                            {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleStatusChange(selectedUser.id, selectedUser.role === "ADMIN" ? "USER" : "ADMIN")}
                        >
                          {selectedUser.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleBanUser(selectedUser.id)}
                        >
                          {selectedUser.role === "BANNED" ? "Unban User" : "Ban User"}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleDeleteUser(selectedUser.id)}
                        >
                          Delete User
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
