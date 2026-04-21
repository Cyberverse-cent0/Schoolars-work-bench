import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { nanoid } from "../lib/nanoid";
import { hashPassword, verifyPassword, generateToken, requireAuth, getCurrentUser } from "../lib/auth";
import { OAuth2Client } from "google-auth-library";

const router: IRouter = Router();

const formatUser = (user: typeof usersTable.$inferSelect) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution,
  researchInterests: user.researchInterests,
  bio: user.bio,
  image: user.image,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  try {
    console.log("[Auth] POST /auth/signup - Request body:", {
      name: req.body.name,
      email: req.body.email,
      institution: req.body.institution,
      hasPassword: !!req.body.password,
    });

    const { name, email, password, institution, researchInterests } = req.body;

    if (!name || !email || !password) {
      console.warn("[Auth] Missing required fields:", { name: !!name, email: !!email, password: !!password });
      res.status(400).json({ 
        error: "Name, email and password are required",
        received: { name: !!name, email: !!email, password: !!password }
      });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      console.warn("[Auth] Email already in use:", email);
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    // First user becomes ADMIN
    const [{ userCount }] = await db.select({ userCount: count() }).from(usersTable);
    const role = userCount === 0 ? "ADMIN" : "USER";
    console.log("[Auth] User count:", userCount, "=> role:", role);

    const passwordHash = hashPassword(password);
    const id = nanoid();

    const [user] = await db.insert(usersTable).values({
      id,
      name,
      email,
      passwordHash,
      institution: institution || null,
      researchInterests: researchInterests || null,
      role,
    }).returning();

    if (!user) {
      console.error("[Auth] Failed to create user - no user returned from DB");
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const token = generateToken(user.id);
    console.log("[Auth] User created successfully:", { id: user.id, email: user.email, role });
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    console.error("[Auth] Signup error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
});

router.post("/auth/signin", async (req, res): Promise<void> => {
  try {
    console.log("[Auth] POST /auth/signin - Request:", {
      email: req.body.email,
      hasPassword: !!req.body.password,
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.warn("[Auth] Missing required fields:", { email: !!email, password: !!password });
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      console.warn("[Auth] User not found:", email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      console.warn("[Auth] Invalid password for user:", email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id);
    console.log("[Auth] User signed in successfully:", { id: user.id, email: user.email });
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    console.error("[Auth] Signin error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
});

router.post("/auth/signout", async (_req, res): Promise<void> => {
  try {
    console.log("[Auth] User signed out");
    res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("[Auth] Signout error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = getCurrentUser(req);
    res.json(formatUser(user));
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Google OAuth endpoint
router.post("/auth/google", async (req, res): Promise<void> => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      res.status(400).json({ error: "Google token is required" });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("[Auth] GOOGLE_CLIENT_ID not configured");
      res.status(500).json({ error: "Google OAuth not configured on server" });
      return;
    }

    const client = new OAuth2Client(googleClientId);
    
    // Verify the Google token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: googleClientId,
      });
    } catch (error) {
      console.error("[Auth] Invalid Google token:", error);
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload) {
      console.error("[Auth] No payload in Google token");
      res.status(401).json({ error: "Invalid Google token payload" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email || "";
    const name = payload.name || "Google User";
    const image = payload.picture || "";

    console.log("[Auth] Google OAuth verification successful:", { googleId, email, name });

    // Check if user already exists
    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));

    if (user) {
      // User exists, log them in
      console.log("[Auth] Existing Google user logging in:", { id: user.id, email: user.email });
      const authToken = generateToken(user.id);
      res.json({ token: authToken, user: formatUser(user) });
      return;
    }

    // Check if email is already used by another account
    const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingEmail) {
      console.warn("[Auth] Email already in use with different provider:", email);
      res.status(409).json({ 
        error: "Email already in use",
        message: "This email is already registered. Try signing in with your password instead.",
      });
      return;
    }

    // First user becomes ADMIN
    const [{ userCount }] = await db.select({ userCount: count() }).from(usersTable);
    const role = userCount === 0 ? "ADMIN" : "USER";

    // Create new user with Google OAuth
    const userId = nanoid();
    const [newUser] = await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      image: image || null,
      googleId,
      oauthProvider: "google",
      role,
    }).returning();

    if (!newUser) {
      console.error("[Auth] Failed to create new Google user");
      res.status(500).json({ error: "Failed to create user account" });
      return;
    }

    const authToken = generateToken(newUser.id);
    console.log("[Auth] New Google user created:", { id: newUser.id, email: newUser.email, role });
    res.status(201).json({ token: authToken, user: formatUser(newUser) });
  } catch (error) {
    console.error("[Auth] Google OAuth error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { formatUser };
// Temporary endpoint to update user role
router.post("/auth/make-admin", async (req, res): Promise<void> => {
  const { email, role } = req.body;
  
  if (!email || !role) {
    res.status(400).json({ error: "Email and role are required" });
    return;
  }

  try {
    const [updatedUser] = await db.update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.email, email))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ 
      message: `User role updated to ${role}`,
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;
