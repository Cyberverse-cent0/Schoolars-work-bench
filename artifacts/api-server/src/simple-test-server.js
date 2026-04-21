import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const port = 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
const profilePicturesDir = path.join(uploadsDir, "profile-pictures");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicturesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.headers['x-user-id'] || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get("/api/health", (req, res) => {
  console.log("[SIMPLE] Health check requested");
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Simple test server is running"
  });
});

// Profile picture upload endpoint
app.post("/api/upload/profile-picture", upload.single("file"), (req, res) => {
  console.log("[SIMPLE] Profile picture upload request");
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.headers['x-user-id'] || 'unknown';
    const fileName = req.file.filename;
    
    // Create the URL for the uploaded file
    const profilePictureUrl = `/uploads/profile-pictures/${fileName}`;
    
    console.log(`[SIMPLE] Profile picture uploaded for user ${userId}: ${fileName}`);
    
    // In a real application, you would update the user's profile in the database
    // For now, we'll just return the URL
    res.json({ 
      profilePictureUrl,
      message: "Profile picture uploaded successfully",
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
  } catch (error) {
    console.error("[SIMPLE] Profile picture upload error:", error);
    res.status(500).json({ 
      error: "Failed to upload profile picture",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test endpoint
app.get("/api/test", (req, res) => {
  console.log("[SIMPLE] Test endpoint requested");
  res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() });
});

// Mock signup for testing
app.post("/api/auth/signup", (req, res) => {
  console.log("[SIMPLE] Mock signup request:", req.body);
  const { name, email, password, institution, researchInterests } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  // Mock successful registration
  const mockUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: "USER",
    institution: institution || null,
    researchInterests: researchInterests || [],
    bio: null,
    image: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("[SIMPLE] User registered successfully:", email);
  
  res.status(201).json({ 
    token: "mock-jwt-token-for-new-user", 
    user: mockUser 
  });
});

// Enhanced user management endpoints
app.get("/api/users", (req, res) => {
  console.log("[SIMPLE] Users management request");
  
  const mockUsers = [
    {
      id: "admin-user-id",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
      email: "admin@scholarforge.io",
      role: "ADMIN",
      institution: "ScholarForge",
      department: "System Administration",
      faculty: "Computer Science",
      degree: "PhD",
      specialization: "System Architecture",
      yearsOfExperience: "10",
      academicTitle: "Dr.",
      phoneNumber: "+1-555-0100",
      location: "San Francisco, CA",
      timezone: "America/Los_Angeles",
      language: "en",
      nationality: "American",
      gender: "prefer_not_to_say",
      linkedinProfile: "https://linkedin.com/in/adminuser",
      personalWebsite: "https://adminuser.com",
      orcidId: "0000-0000-0000-0001",
      collaborationInterests: ["System Design", "Research Management", "Mentorship"],
      availableForCollaboration: true,
      mentorshipAvailable: true,
      skills: ["Leadership", "System Architecture", "Research Management", "Mentoring"],
      publications: ["System Design Patterns", "Research Collaboration Framework"],
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      loginCount: "245",
      lastLoginIP: "192.168.1.100",
      lastLoginDevice: "Chrome on Windows",
      accountStatus: "active",
      emailVerified: true,
      profileCompleted: true,
      isOnline: true,
      lastActive: new Date().toISOString(),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      bio: "System administrator for ScholarForge platform with expertise in research management and system architecture.",
      researchInterests: ["System Administration", "Research Management"],
      image: null,
      preferences: JSON.stringify({
        theme: "light",
        language: "en",
        timezone: "America/Los_Angeles"
      })
    },
    {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      name: "Test User",
      email: "fubates@gmail.com",
      role: "USER",
      institution: "Test University",
      department: "Computer Science",
      faculty: "Engineering",
      degree: "Masters",
      specialization: "Machine Learning",
      yearsOfExperience: "3",
      academicTitle: "Mr.",
      phoneNumber: "+1-555-0200",
      location: "New York, NY",
      timezone: "America/New_York",
      language: "en",
      nationality: "American",
      gender: "male",
      linkedinProfile: "https://linkedin.com/in/testuser",
      personalWebsite: "https://testuser.com",
      orcidId: "0000-0000-0000-0002",
      collaborationInterests: ["Machine Learning", "Data Science", "AI Research"],
      availableForCollaboration: true,
      mentorshipAvailable: false,
      skills: ["Python", "Machine Learning", "Data Analysis", "Research"],
      publications: ["ML Applications in Healthcare"],
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: true,
      showPhone: false,
      loginCount: "89",
      lastLoginIP: "192.168.1.101",
      lastLoginDevice: "Safari on Mac",
      accountStatus: "active",
      emailVerified: true,
      profileCompleted: false,
      isOnline: false,
      lastActive: "2026-04-21T18:30:00Z",
      createdAt: "2024-02-15T10:00:00Z",
      updatedAt: "2026-04-21T18:30:00Z",
      bio: "Researcher focused on machine learning applications in healthcare.",
      researchInterests: ["Machine Learning", "Healthcare", "Data Science"],
      image: null,
      preferences: JSON.stringify({
        theme: "dark",
        language: "en",
        timezone: "America/New_York"
      })
    },
    {
      id: "user-1776802124429",
      firstName: "New",
      lastName: "User",
      name: "New User",
      email: "newuser@test.com",
      role: "USER",
      institution: null,
      department: null,
      faculty: null,
      degree: null,
      specialization: null,
      yearsOfExperience: null,
      academicTitle: null,
      phoneNumber: null,
      location: null,
      timezone: "UTC",
      language: "en",
      nationality: null,
      gender: null,
      linkedinProfile: null,
      personalWebsite: null,
      orcidId: null,
      collaborationInterests: [],
      availableForCollaboration: true,
      mentorshipAvailable: false,
      skills: [],
      publications: [],
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      loginCount: "1",
      lastLoginIP: "192.168.1.102",
      lastLoginDevice: "Firefox on Linux",
      accountStatus: "active",
      emailVerified: false,
      profileCompleted: false,
      isOnline: false,
      lastActive: "2026-04-21T20:08:44Z",
      createdAt: "2026-04-21T20:08:44Z",
      updatedAt: "2026-04-21T20:08:44Z",
      bio: null,
      researchInterests: [],
      image: null,
      preferences: JSON.stringify({
        theme: "light",
        language: "en",
        timezone: "UTC"
      })
    }
  ];

  // Apply filtering and sorting
  let filteredUsers = [...mockUsers];
  const { search, role, status, sortBy, order = 'asc' } = req.query;

  // Search filter
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.institution?.toLowerCase().includes(searchTerm) ||
      user.department?.toLowerCase().includes(searchTerm)
    );
  }

  // Role filter
  if (role) {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }

  // Status filter
  if (status) {
    filteredUsers = filteredUsers.filter(user => user.accountStatus === status);
  }

  // Sorting
  if (sortBy) {
    filteredUsers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  }

  console.log(`[SIMPLE] Returning ${filteredUsers.length} users`);
  
  res.json({
    users: filteredUsers,
    total: filteredUsers.length,
    stats: {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.accountStatus === 'active').length,
      onlineUsers: mockUsers.filter(u => u.isOnline).length,
      adminUsers: mockUsers.filter(u => u.role === 'ADMIN').length,
      profileCompletedUsers: mockUsers.filter(u => u.profileCompleted).length
    }
  });
});

// User profile update endpoint
app.patch("/api/users/:userId", (req, res) => {
  console.log("[SIMPLE] User profile update request:", req.params.userId, req.body);
  
  const { userId } = req.params;
  const updates = req.body;
  
  // Find the user in our mock data
  const mockUsers = [
    {
      id: "admin-user-id",
      firstName: "Admin",
      lastName: "User",
      name: "Admin User",
      email: "admin@scholarforge.io",
      role: "ADMIN",
      institution: "ScholarForge",
      department: "System Administration",
      faculty: "Computer Science",
      degree: "PhD",
      specialization: "System Architecture",
      yearsOfExperience: "10",
      academicTitle: "Dr.",
      phoneNumber: "+1-555-0100",
      location: "San Francisco, CA",
      timezone: "America/Los_Angeles",
      language: "en",
      nationality: "American",
      gender: "prefer_not_to_say",
      linkedinProfile: "https://linkedin.com/in/adminuser",
      personalWebsite: "https://adminuser.com",
      orcidId: "0000-0000-0000-0001",
      collaborationInterests: ["System Design", "Research Management", "Mentorship"],
      availableForCollaboration: true,
      mentorshipAvailable: true,
      skills: ["Leadership", "System Architecture", "Research Management", "Mentoring"],
      publications: ["System Design Patterns", "Research Collaboration Framework"],
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      loginCount: "245",
      lastLoginIP: "192.168.1.100",
      lastLoginDevice: "Chrome on Windows",
      accountStatus: "active",
      emailVerified: true,
      profileCompleted: true,
      isOnline: true,
      lastActive: new Date().toISOString(),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      bio: "System administrator for ScholarForge platform with expertise in research management and system architecture.",
      researchInterests: ["System Administration", "Research Management"],
      image: null,
      preferences: JSON.stringify({
        theme: "light",
        language: "en",
        timezone: "America/Los_Angeles"
      })
    },
    {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
      name: "Test User",
      email: "fubates@gmail.com",
      role: "USER",
      institution: "Test University",
      department: "Computer Science",
      faculty: "Engineering",
      degree: "Masters",
      specialization: "Machine Learning",
      yearsOfExperience: "3",
      academicTitle: "Mr.",
      phoneNumber: "+1-555-0200",
      location: "New York, NY",
      timezone: "America/New_York",
      language: "en",
      nationality: "American",
      gender: "male",
      linkedinProfile: "https://linkedin.com/in/testuser",
      personalWebsite: "https://testuser.com",
      orcidId: "0000-0000-0000-0002",
      collaborationInterests: ["Machine Learning", "Data Science", "AI Research"],
      availableForCollaboration: true,
      mentorshipAvailable: false,
      skills: ["Python", "Machine Learning", "Data Analysis", "Research"],
      publications: ["ML Applications in Healthcare"],
      emailNotifications: true,
      pushNotifications: false,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: true,
      showPhone: false,
      loginCount: "89",
      lastLoginIP: "192.168.1.101",
      lastLoginDevice: "Safari on Mac",
      accountStatus: "active",
      emailVerified: true,
      profileCompleted: false,
      isOnline: false,
      lastActive: "2026-04-21T18:30:00Z",
      createdAt: "2024-02-15T10:00:00Z",
      updatedAt: "2026-04-21T18:30:00Z",
      bio: "Researcher focused on machine learning applications in healthcare.",
      researchInterests: ["Machine Learning", "Healthcare", "Data Science"],
      image: null,
      preferences: JSON.stringify({
        theme: "dark",
        language: "en",
        timezone: "America/New_York"
      })
    },
    {
      id: "user-1776802124429",
      firstName: "New",
      lastName: "User",
      name: "New User",
      email: "newuser@test.com",
      role: "USER",
      institution: null,
      department: null,
      faculty: null,
      degree: null,
      specialization: null,
      yearsOfExperience: null,
      academicTitle: null,
      phoneNumber: null,
      location: null,
      timezone: "UTC",
      language: "en",
      nationality: null,
      gender: null,
      linkedinProfile: null,
      personalWebsite: null,
      orcidId: null,
      collaborationInterests: [],
      availableForCollaboration: true,
      mentorshipAvailable: false,
      skills: [],
      publications: [],
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      projectInvites: true,
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      loginCount: "1",
      lastLoginIP: "192.168.1.102",
      lastLoginDevice: "Firefox on Linux",
      accountStatus: "active",
      emailVerified: false,
      profileCompleted: false,
      isOnline: false,
      lastActive: "2026-04-21T20:08:44Z",
      createdAt: "2026-04-21T20:08:44Z",
      updatedAt: "2026-04-21T20:08:44Z",
      bio: null,
      researchInterests: [],
      image: null,
      preferences: JSON.stringify({
        theme: "light",
        language: "en",
        timezone: "UTC"
      })
    }
  ];

  const userIndex = mockUsers.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    console.log("[SIMPLE] User not found:", userId);
    return res.status(404).json({ error: "User not found" });
  }

  // Update the user with the provided fields
  const updatedUser = {
    ...mockUsers[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  console.log("[SIMPLE] User profile updated successfully:", userId);
  
  res.json(updatedUser);
});

// User analytics endpoint
app.get("/api/users/analytics", (req, res) => {
  console.log("[SIMPLE] User analytics request");
  
  const analytics = {
    userGrowth: [
      { month: '2024-01', count: 1 },
      { month: '2024-02', count: 1 },
      { month: '2024-03', count: 0 },
      { month: '2024-04', count: 1 }
    ],
    roleDistribution: {
      ADMIN: 1,
      USER: 2
    },
    accountStatusDistribution: {
      active: 3,
      suspended: 0,
      deleted: 0
    },
    profileCompletion: {
      completed: 1,
      incomplete: 2
    },
    activityMetrics: {
      totalLogins: 334,
      averageLoginsPerUser: 111,
      mostActiveDay: 'Monday',
      peakActivityHour: '14:00'
    },
    geographicDistribution: [
      { country: 'United States', count: 3 },
      { country: 'United Kingdom', count: 0 },
      { country: 'Canada', count: 0 }
    ],
    departmentDistribution: {
      'Computer Science': 2,
      'System Administration': 1,
      'Other': 0
    }
  };

  res.json(analytics);
});

// Enhanced projects endpoint with admin bypass
app.get("/api/projects", (req, res) => {
  console.log("[SIMPLE] Projects request with query:", req.query);
  
  // Extract user role from headers (in real app, this would come from JWT token)
  const userRole = req.headers['x-user-role'] || 'USER';
  const userId = req.headers['x-user-id'] || 'anonymous';
  
  console.log(`[SIMPLE] Projects request by user: ${userId} (${userRole})`);
  
  const allProjects = [
    {
      id: "project-1",
      title: "Machine Learning Research",
      description: "Advanced ML algorithms study",
      abstract: "Research in cutting-edge machine learning",
      keywords: ["ML", "AI", "Research"],
      status: "ONGOING",
      visibility: "PUBLIC",
      startDate: "2024-01-15",
      endDate: "2024-12-31",
      memberCount: 5,
      taskCount: 12,
      createdBy: "admin-user-id",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-04-21T15:30:00Z",
      members: [
        { userId: "admin-user-id", role: "LEAD", joinedAt: "2024-01-15T10:00:00Z" },
        { userId: "test-user-id", role: "CONTRIBUTOR", joinedAt: "2024-01-20T14:30:00Z" },
        { userId: "user-1776802124429", role: "VIEWER", joinedAt: "2024-02-01T09:15:00Z" }
      ]
    },
    {
      id: "project-2", 
      title: "Web Development Platform",
      description: "Modern web application framework",
      abstract: "Building scalable web applications",
      keywords: ["Web", "React", "Node.js"],
      status: "DRAFT",
      visibility: "PRIVATE",
      startDate: "2024-02-01",
      endDate: "2024-08-31",
      memberCount: 3,
      taskCount: 8,
      createdBy: "test-user-id",
      createdAt: "2024-02-01T09:00:00Z",
      updatedAt: "2024-04-20T14:20:00Z",
      members: [
        { userId: "test-user-id", role: "LEAD", joinedAt: "2024-02-01T09:00:00Z" },
        { userId: "admin-user-id", role: "VIEWER", joinedAt: "2024-02-05T11:20:00Z" },
        { userId: "user-1776802124429", role: "CONTRIBUTOR", joinedAt: "2024-02-10T16:45:00Z" }
      ]
    },
    {
      id: "project-3",
      title: "Data Analysis Tool",
      description: "Big data analytics platform",
      abstract: "Analytics for large datasets",
      keywords: ["Data", "Analytics", "Python"],
      status: "COMPLETED",
      visibility: "PUBLIC",
      startDate: "2023-09-01",
      endDate: "2024-01-31",
      memberCount: 4,
      taskCount: 15,
      createdBy: "test-user-id",
      createdAt: "2023-09-01T11:00:00Z",
      updatedAt: "2024-01-31T16:45:00Z",
      members: [
        { userId: "test-user-id", role: "LEAD", joinedAt: "2023-09-01T11:00:00Z" },
        { userId: "admin-user-id", role: "CONTRIBUTOR", joinedAt: "2023-09-05T13:15:00Z" },
        { userId: "user-1776802124429", role: "VIEWER", joinedAt: "2023-09-10T10:30:00Z" }
      ]
    },
    {
      id: "project-4",
      title: "Private Research Project",
      description: "Confidential research data analysis",
      abstract: "Private project with restricted access",
      keywords: ["Research", "Private", "Confidential"],
      status: "ONGOING",
      visibility: "PRIVATE",
      startDate: "2024-03-01",
      endDate: "2024-12-31",
      memberCount: 2,
      taskCount: 6,
      createdBy: "test-user-id",
      createdAt: "2024-03-01T08:00:00Z",
      updatedAt: "2024-04-21T12:00:00Z",
      members: [
        { userId: "test-user-id", role: "LEAD", joinedAt: "2024-03-01T08:00:00Z" },
        { userId: "user-1776802124429", role: "CONTRIBUTOR", joinedAt: "2024-03-05T14:20:00Z" }
      ]
    }
  ];

  let accessibleProjects = [];

  // Admin bypass: Admins can see all projects
  if (userRole === 'ADMIN') {
    console.log("[SIMPLE] Admin access granted - returning all projects");
    accessibleProjects = allProjects.map(project => ({
      ...project,
      currentUserRole: "ADMIN", // Admins have admin access to all projects
      accessLevel: "full"
    }));
  } else {
    // Regular user access control
    console.log("[SIMPLE] Regular user access - filtering projects");
    accessibleProjects = allProjects.filter(project => {
      // User can see project if:
      // 1. Project is PUBLIC
      // 2. User is a member of the project
      const isPublic = project.visibility === 'PUBLIC';
      const isMember = project.members.some(member => member.userId === userId);
      
      return isPublic || isMember;
    }).map(project => {
      // Determine user's role in this project
      const userMembership = project.members.find(member => member.userId === userId);
      const currentUserRole = userMembership ? userMembership.role : (project.visibility === 'PUBLIC' ? 'VIEWER' : null);
      
      return {
        ...project,
        currentUserRole,
        accessLevel: currentUserRole ? 'granted' : 'public_only'
      };
    });
  }

  // Apply filtering and sorting
  let filteredProjects = [...accessibleProjects];
  const { search, status, visibility, sortBy, order = 'asc' } = req.query;

  // Search filter
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProjects = filteredProjects.filter(project => 
      project.title.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }

  // Status filter
  if (status) {
    filteredProjects = filteredProjects.filter(project => project.status === status);
  }

  // Visibility filter (only for admins)
  if (visibility && userRole === 'ADMIN') {
    filteredProjects = filteredProjects.filter(project => project.visibility === visibility);
  }

  // Sorting
  if (sortBy) {
    filteredProjects.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  }

  const response = {
    projects: filteredProjects,
    total: filteredProjects.length,
    userRole,
    accessType: userRole === 'ADMIN' ? 'admin_full_access' : 'filtered_access',
    stats: {
      totalProjects: allProjects.length,
      accessibleProjects: accessibleProjects.length,
      filteredProjects: filteredProjects.length,
      publicProjects: allProjects.filter(p => p.visibility === 'PUBLIC').length,
      privateProjects: allProjects.filter(p => p.visibility === 'PRIVATE').length
    }
  };

  console.log(`[SIMPLE] Returning ${filteredProjects.length} projects for ${userRole} (access: ${response.accessType})`);
  
  res.json(response);
});

// Mock token validation endpoint
app.get("/api/auth/me", (req, res) => {
  console.log("[SIMPLE] Token validation request");
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  // Mock token validation - in real app, you'd verify JWT signature
  let mockUser = null;
  
  if (token === "mock-jwt-token-for-admin") {
    mockUser = {
      id: "admin-user-id",
      name: "Admin User",
      email: "admin@scholarforge.io",
      role: "ADMIN",
      institution: "ScholarForge",
      researchInterests: ["System Administration", "Research Management"],
      bio: "System administrator for ScholarForge platform",
      image: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    };
  } else if (token === "mock-jwt-token-for-user") {
    mockUser = {
      id: "test-user-id",
      name: "Test User",
      email: "fubates@gmail.com",
      role: "USER",
      institution: "Test University",
      researchInterests: ["Test"],
      bio: "Test bio",
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else if (token === "mock-jwt-token-for-new-user") {
    mockUser = {
      id: "user-1776802124429",
      name: "New User",
      email: "newuser@test.com",
      role: "USER",
      institution: null,
      researchInterests: [],
      bio: null,
      image: null,
      createdAt: "2026-04-21T20:08:44.429Z",
      updatedAt: "2026-04-21T20:08:44.429Z",
    };
  }

  if (mockUser) {
    console.log(`[SIMPLE] Token valid for ${mockUser.email} (${mockUser.role})`);
    res.json(mockUser);
  } else {
    console.log("[SIMPLE] Invalid token");
    res.status(401).json({ error: "Invalid token" });
  }
});

// Mock signout endpoint
app.post("/api/auth/signout", (req, res) => {
  console.log("[SIMPLE] Signout request");
  res.json({ message: "Signed out successfully" });
});

// Mock signin for testing
app.post("/api/auth/signin", (req, res) => {
  console.log("[SIMPLE] Mock signin request:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Mock successful login for testing
  if ((email === "fubates@gmail.com" && password === "test") ||
      (email === "admin@scholarforge.io" && password === "password123")) {
    
    let mockUser;
    if (email === "admin@scholarforge.io") {
      // Admin user
      mockUser = {
        id: "admin-user-id",
        name: "Admin User",
        email: "admin@scholarforge.io",
        role: "ADMIN",
        institution: "ScholarForge",
        researchInterests: ["System Administration", "Research Management"],
        bio: "System administrator for ScholarForge platform",
        image: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Regular user
      mockUser = {
        id: "test-user-id",
        name: "Test User",
        email: "fubates@gmail.com",
        role: "USER",
        institution: "Test University",
        researchInterests: ["Test"],
        bio: "Test bio",
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    console.log(`[SIMPLE] Login successful for ${email} (${mockUser.role})`);
    
    res.json({ 
      token: `mock-jwt-token-for-${email === "admin@scholarforge.io" ? "admin" : "user"}`, 
      user: mockUser 
    });
  } else {
    console.log(`[SIMPLE] Login failed for ${email}`);
    res.status(401).json({ error: "Invalid email or password" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`[SIMPLE] Server running on port ${port}`);
  console.log(`[SIMPLE] Test: http://localhost:${port}/api/test`);
  console.log(`[SIMPLE] Health: http://localhost:${port}/api/health`);
  console.log(`[SIMPLE] Mock signin available for: fubates@gmail.com / test`);
});
