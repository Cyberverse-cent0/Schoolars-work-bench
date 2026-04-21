import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, projectsTable, projectMembersTable } from "@workspace/db";
import { eq, count, and, or, desc, asc, ilike } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";

const router: IRouter = Router();

// Get all users with project participation (admin only)
router.get("/users/management", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  
  // Check if user is admin
  if (user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    const { search, role, status, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "10" } = req.query;
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Build base query
    let query = db.select().from(usersTable).$dynamic();
    
    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.institution, `%${search}%`)
        )
      );
    }
    
    if (role && role !== "all") {
      conditions.push(eq(usersTable.role, role as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderField = usersTable[sortBy as keyof typeof usersTable] || usersTable.createdAt;
    const orderDirection = sortOrder === "asc" ? asc : desc;
    query = query.orderBy(orderDirection);

    // Apply pagination
    query = query.limit(limitNum).offset(offset);

    const users = await query;

    // Get project participation for each user
    const usersWithProjects = await Promise.all(
      users.map(async (user) => {
        const [projectCount] = await db
          .select({ count: count() })
          .from(projectMembersTable)
          .where(eq(projectMembersTable.userId, user.id));

        // Get user's projects
        const userProjects = await db
          .select({
            id: projectsTable.id,
            title: projectsTable.title,
            status: projectsTable.status,
            role: projectMembersTable.role,
          })
          .from(projectMembersTable)
          .leftJoin(projectsTable, eq(projectMembersTable.projectId, projectsTable.id))
          .where(eq(projectMembersTable.userId, user.id));

        return {
          ...user,
          projectCount: Number(projectCount.count),
          projects: userProjects,
        };
      })
    );

    // Get total count for pagination
    const totalCountQuery = db.select({ count: count() }).from(usersTable).$dynamic();
    if (conditions.length > 0) {
      totalCountQuery.where(and(...conditions));
    }
    const [totalCount] = await totalCountQuery;

    res.json({
      users: usersWithProjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(totalCount.count),
        totalPages: Math.ceil(Number(totalCount.count) / limitNum),
      },
    });
  } catch (error) {
    console.error("User management error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user role (admin only)
router.patch("/users/:userId/role", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  
  // Check if user is admin
  if (user.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const { userId } = req.params;
  const { role } = req.body;

  if (!["USER", "ADMIN"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  try {
    const [updatedUser] = await db
      .update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// Get user public profile with project participation
router.get("/users/:userId/public", async (req, res): Promise<void> => {
  const { userId } = req.params;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get user's projects with details
    const userProjects = await db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        description: projectsTable.description,
        status: projectsTable.status,
        visibility: projectsTable.visibility,
        role: projectMembersTable.role,
        createdAt: projectsTable.createdAt,
      })
      .from(projectMembersTable)
      .leftJoin(projectsTable, eq(projectMembersTable.projectId, projectsTable.id))
      .where(
        and(
          eq(projectMembersTable.userId, userId),
          eq(projectsTable.visibility, "PUBLIC") // Only show public projects
        )
      )
      .orderBy(desc(projectsTable.updatedAt));

    // Format user data for public view
    const publicProfile = {
      id: user.id,
      name: user.name,
      image: user.image,
      institution: user.institution,
      researchInterests: user.researchInterests,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      projects: userProjects,
      projectCount: userProjects.length,
    };

    res.json(publicProfile);
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
});

export default router;
