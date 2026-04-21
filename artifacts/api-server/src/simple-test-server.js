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
    fileSize: 20 * 1024 * 1024, // 20MB limit
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

// Admin analytics endpoint
app.get("/api/analytics/admin", (req, res) => {
  console.log("[SIMPLE] Admin analytics request");
  
  const allUsers = [
    { id: "admin-user-id", role: "ADMIN", createdAt: "2024-01-01" },
    { id: "test-user-id", role: "USER", createdAt: "2024-02-15" },
    { id: "user-1776802124429", role: "USER", createdAt: "2026-04-21" }
  ];
  
  const allProjects = [
    { id: "project-1", status: "ONGOING", createdAt: "2024-01-15" },
    { id: "project-2", status: "DRAFT", createdAt: "2024-02-01" },
    { id: "project-3", status: "COMPLETED", createdAt: "2023-09-01" },
    { id: "project-4", status: "ONGOING", createdAt: "2024-03-01" }
  ];
  
  const analytics = {
    totalUsers: allUsers.length,
    totalProjects: allProjects.length,
    totalTasks: 35,
    activeProjects: allProjects.filter(p => p.status === "ONGOING").length,
    projectsByStatus: [
      { status: "ONGOING", count: allProjects.filter(p => p.status === "ONGOING").length },
      { status: "DRAFT", count: allProjects.filter(p => p.status === "DRAFT").length },
      { status: "COMPLETED", count: allProjects.filter(p => p.status === "COMPLETED").length }
    ],
    projectsByMonth: [
      { month: "2023-09", count: 1 },
      { month: "2024-01", count: 1 },
      { month: "2024-02", count: 1 },
      { month: "2024-03", count: 1 },
      { month: "2024-04", count: 0 }
    ],
    usersByInstitution: [
      { institution: "ScholarForge", count: 1 },
      { institution: "Test University", count: 1 },
      { institution: "Other", count: 1 }
    ]
  };

  res.json(analytics);
});

// Admin users endpoint
app.get("/api/admin/users", (req, res) => {
  console.log("[SIMPLE] Admin users request");
  
  const mockUsers = [
    {
      id: "admin-user-id",
      name: "Admin User",
      email: "admin@scholarforge.io",
      role: "ADMIN",
      institution: "ScholarForge",
      createdAt: "2024-01-01T00:00:00Z",
      projectCount: 3
    },
    {
      id: "test-user-id",
      name: "Test User",
      email: "fubates@gmail.com",
      role: "USER",
      institution: "Test University",
      createdAt: "2024-02-15T10:00:00Z",
      projectCount: 2
    },
    {
      id: "user-1776802124429",
      name: "New User",
      email: "newuser@test.com",
      role: "USER",
      institution: null,
      createdAt: "2026-04-21T20:08:44.429Z",
      projectCount: 0
    }
  ];

  res.json({ users: mockUsers });
});

// Admin projects endpoint
app.get("/api/admin/projects", (req, res) => {
  console.log("[SIMPLE] Admin projects request");
  
  const mockProjects = [
    {
      id: "project-1",
      title: "Machine Learning Research",
      status: "ONGOING",
      visibility: "PUBLIC",
      memberCount: 5,
      createdAt: "2024-01-15T10:00:00Z",
      owner: { name: "Admin User" }
    },
    {
      id: "project-2",
      title: "Web Development Platform",
      status: "DRAFT",
      visibility: "PRIVATE",
      memberCount: 3,
      createdAt: "2024-02-01T09:00:00Z",
      owner: { name: "Test User" }
    },
    {
      id: "project-3",
      title: "Data Analysis Tool",
      status: "COMPLETED",
      visibility: "PUBLIC",
      memberCount: 4,
      createdAt: "2023-09-01T11:00:00Z",
      owner: { name: "Test User" }
    },
    {
      id: "project-4",
      title: "Private Research Project",
      status: "ONGOING",
      visibility: "PRIVATE",
      memberCount: 2,
      createdAt: "2024-03-01T08:00:00Z",
      owner: { name: "Test User" }
    }
  ];

  res.json({ projects: mockProjects });
});

// Admin user role update endpoint
app.patch("/api/users/:userId/role", (req, res) => {
  console.log("[SIMPLE] Admin user role update:", req.params.userId, req.body);
  
  const { userId } = req.params;
  const { role } = req.body;
  
  // In a real application, you would update the user's role in the database
  console.log(`[SIMPLE] User ${userId} role updated to ${role}`);
  
  res.json({ message: "User role updated successfully" });
});

// Admin delete user endpoint
app.delete("/api/admin/users/:userId", (req, res) => {
  console.log("[SIMPLE] Admin delete user:", req.params.userId);
  
  const { userId } = req.params;
  
  // In a real application, you would delete the user from the database
  console.log(`[SIMPLE] User ${userId} deleted`);
  
  res.json({ message: "User deleted successfully" });
});

// Admin delete project endpoint
app.delete("/api/admin/projects/:projectId", (req, res) => {
  console.log("[SIMPLE] Admin delete project:", req.params.projectId);
  
  const { projectId } = req.params;
  
  // In a real application, you would delete the project from the database
  console.log(`[SIMPLE] Project ${projectId} deleted`);
  
  res.json({ message: "Project deleted successfully" });
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

// Project creation endpoint
app.post("/api/projects", (req, res) => {
  console.log("[SIMPLE] Project creation request:", req.body);
  
  const { title, description, status, visibility, keywords, abstract } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  // Generate a new project ID
  const projectId = `project-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  
  // Create the new project
  const newProject = {
    id: projectId,
    title,
    description,
    abstract: abstract || "",
    keywords: keywords || [],
    status: status || "PLANNING",
    visibility: visibility || "PUBLIC",
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    memberCount: 1,
    taskCount: 0,
    createdBy: "admin-user-id", // In a real app, this would come from authentication
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [
      { userId: "admin-user-id", role: "LEAD", joinedAt: new Date().toISOString() }
    ]
  };

  console.log(`[SIMPLE] Project created successfully: ${projectId}`);
  
  res.status(201).json({ id: projectId });
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

// Enhanced password recovery request endpoint
app.post("/api/auth/forgot-password", (req, res) => {
  console.log("[SIMPLE] Enhanced password recovery request:", req.body);
  
  const { email, recoveryMethod, additionalInfo } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Check if user exists in our mock data
  const mockUsers = [
    { 
      email: "admin@scholarforge.io", 
      id: "admin-user-id", 
      name: "Admin User",
      phoneNumber: "+1-555-0100",
      dateOfBirth: "1980-01-15",
      institution: "ScholarForge",
      securityQuestion: "pet",
      securityAnswer: "fluffy"
    },
    { 
      email: "fubates@gmail.com", 
      id: "test-user-id", 
      name: "Test User",
      phoneNumber: "+1-555-0200", 
      dateOfBirth: "1990-05-20",
      institution: "Test University",
      securityQuestion: "school",
      securityAnswer: "lincoln-elementary"
    },
    { 
      email: "newuser@test.com", 
      id: "user-1776802124429", 
      name: "New User",
      phoneNumber: null,
      dateOfBirth: null,
      institution: null,
      securityQuestion: null,
      securityAnswer: null
    }
  ];

  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    // For security, don't reveal if email exists or not
    console.log("[SIMPLE] Password recovery requested for non-existent email:", email);
    return res.json({ 
      message: "If an account with this email exists, a password reset link has been sent",
      success: true 
    });
  }

  // Enhanced verification based on recovery method
  let verificationPassed = true;
  let verificationMessage = "";

  if (recoveryMethod === "phone" && additionalInfo.phoneNumber) {
    verificationPassed = user.phoneNumber === additionalInfo.phoneNumber;
    verificationMessage = verificationPassed ? "Phone verified" : "Phone number does not match our records";
  } else if (recoveryMethod === "security" && additionalInfo.securityQuestion && additionalInfo.securityAnswer) {
    verificationPassed = user.securityQuestion === additionalInfo.securityQuestion && 
                          user.securityAnswer === additionalInfo.securityAnswer.toLowerCase();
    verificationMessage = verificationPassed ? "Security question verified" : "Security question answer does not match our records";
  } else if (recoveryMethod === "enhanced") {
    // Enhanced verification - check multiple factors
    const phoneMatch = !additionalInfo.phoneNumber || user.phoneNumber === additionalInfo.phoneNumber;
    const dobMatch = !additionalInfo.dateOfBirth || user.dateOfBirth === additionalInfo.dateOfBirth;
    const institutionMatch = !additionalInfo.institution || user.institution === additionalInfo.institution;
    const securityMatch = !additionalInfo.securityQuestion || !additionalInfo.securityAnswer || 
                         (user.securityQuestion === additionalInfo.securityQuestion && 
                          user.securityAnswer === additionalInfo.securityAnswer.toLowerCase());
    
    verificationPassed = phoneMatch && dobMatch && institutionMatch && securityMatch;
    verificationMessage = verificationPassed ? "Enhanced verification passed" : "Some verification details do not match our records";
  }

  if (!verificationPassed && recoveryMethod !== "email") {
    console.log(`[SIMPLE] Verification failed for ${email}: ${verificationMessage}`);
    return res.status(400).json({ 
      error: verificationMessage,
      success: false 
    });
  }

  // Generate a reset token (in real app, this would be stored in database with expiry)
  const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  console.log(`[SIMPLE] Password reset link for ${email} (${recoveryMethod}): ${resetLink}`);
  
  // In a real application, you would:
  // 1. Store the reset token in database with expiry (e.g., 1 hour)
  // 2. Send email/SMS with reset link based on recovery method
  // 3. Log the verification attempt for security
  
  const response = { 
    message: "If an account with this email exists, a password reset link has been sent",
    success: true,
    recoveryMethod: recoveryMethod
  };

  // For demo purposes only - include the reset link
  response.resetLink = resetLink;

  // Add additional info based on recovery method
  if (recoveryMethod === "phone") {
    response.deliveryMethod = "SMS with reset link sent to your phone";
  } else if (recoveryMethod === "security") {
    response.deliveryMethod = "Reset link sent to your email address";
  } else if (recoveryMethod === "enhanced") {
    response.deliveryMethod = "Multi-factor verification completed - reset link sent";
  }
  
  res.json(response);
});

// Password reset endpoint
app.post("/api/auth/reset-password", (req, res) => {
  console.log("[SIMPLE] Password reset request:", req.body);
  
  const { token, email, newPassword } = req.body;
  
  if (!token || !email || !newPassword) {
    return res.status(400).json({ error: "Token, email, and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  // In a real application, you would:
  // 1. Verify the reset token exists in database and is not expired
  // 2. Update the user's password in the database
  // 3. Delete the reset token
  
  console.log(`[SIMPLE] Password reset for ${email} with token ${token}`);
  
  res.json({ 
    message: "Password has been reset successfully",
    success: true 
  });
});

// Google authentication endpoint
app.post("/api/auth/google", (req, res) => {
  console.log("[SIMPLE] Google auth request");
  
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "Google token is required" });
  }

  // In a real application, you would:
  // 1. Verify the Google ID token using Google's verification library
  // 2. Extract user information from the token
  // 3. Check if user exists in database
  // 4. Create or update user account
  // 5. Generate JWT token for the user

  // For demo purposes, we'll mock the Google user data
  const mockGoogleUsers = [
    {
      email: "admin@scholarforge.io",
      id: "admin-user-id",
      name: "Admin User",
      role: "ADMIN",
      institution: "ScholarForge",
      researchInterests: ["System Administration", "Research Management"],
      bio: "System administrator for ScholarForge platform",
      image: "https://lh3.googleusercontent.com/a/default-user"
    },
    {
      email: "fubates@gmail.com", 
      id: "test-user-id",
      name: "Test User",
      role: "USER",
      institution: "Test University",
      researchInterests: ["Test"],
      bio: "Test bio",
      image: "https://lh3.googleusercontent.com/a/default-user"
    }
  ];

  // Simulate token verification and user lookup
  let mockUser = null;
  if (token.startsWith("mock-google-token-")) {
    // Extract email from mock token for demo
    const email = token.includes("admin") ? "admin@scholarforge.io" : "fubates@gmail.com";
    mockUser = mockGoogleUsers.find(u => u.email === email);
  }

  if (!mockUser) {
    // Create a new user for unknown Google accounts
    mockUser = {
      id: `google-user-${Date.now()}`,
      name: "Google User",
      email: "google.user@gmail.com",
      role: "USER",
      institution: null,
      researchInterests: [],
      bio: null,
      image: "https://lh3.googleusercontent.com/a/default-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Generate JWT token
  const jwtToken = `google-jwt-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  console.log(`[SIMPLE] Google auth successful for ${mockUser.email}`);

  res.json({
    token: jwtToken,
    user: {
      ...mockUser,
      updatedAt: new Date().toISOString()
    }
  });
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
