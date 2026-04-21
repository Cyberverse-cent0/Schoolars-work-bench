import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { nanoid } from "../lib/nanoid";
import { hashPassword, verifyPassword, generateToken, requireAuth, getCurrentUser, createPasswordResetToken, validatePasswordResetToken, markPasswordResetTokenAsUsed } from "../lib/auth";
import { OAuth2Client } from "google-auth-library";
import { authLogger, dbLogger, logError, logRequest } from "../lib/logger";
import { emailService } from "../lib/email";

const router: IRouter = Router();

const formatUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution || undefined,
  researchInterests: user.researchInterests || undefined,
  bio: user.bio || undefined,
  image: user.image || undefined,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Simple signup endpoint
router.post("/auth/signup", async (req, res): Promise<void> => {
  try {
    const { name, email, password, institution, researchInterests } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }

    // Check if user exists
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    if (existing && existing.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    // First user becomes ADMIN
    const [userCountResult] = await db.select({ userCount: count() }).from(usersTable);
    const role = userCountResult[0]?.userCount === 0 ? "ADMIN" : "USER";

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
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const token = generateToken(user.id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    console.error("[Auth] Signup error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Simple signin endpoint
router.post("/auth/signin", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    if (!user || !user?.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordValid = verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    console.error("[Auth] Signin error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Forgot password endpoint
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user || user.length === 0) {
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      return;
    }

    if (!user[0]?.passwordHash) {
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      return;
    }

    const resetToken = await createPasswordResetToken(user[0].id);
    const emailResult = await emailService.sendPasswordResetEmail(user[0].email, resetToken);

    const response: any = { message: "If an account with that email exists, a password reset link has been sent." };
    if (emailResult.resetLink) {
      response.resetLink = emailResult.resetLink;
    }
    res.json(response);
  } catch (error) {
    console.error("[Auth] Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// Reset password endpoint
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: "Reset token and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long" });
      return;
    }

    const userId = await validatePasswordResetToken(token);

    if (!userId) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = hashPassword(newPassword);

    const [updatedUser] = await db.update(usersTable)
      .set({ 
        passwordHash, 
        updatedAt: new Date() 
      })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await markPasswordResetTokenAsUsed(token);
    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("[Auth] Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Mock Google OAuth endpoint
router.post("/auth/google", async (req, res): Promise<void> => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      res.status(400).json({ error: "Google token is required" });
      return;
    }

    // Handle mock tokens for development
    if (googleToken.startsWith("mock-google-token")) {
      authLogger.info({
        action: "google_oauth_mock_signin",
        timestamp: new Date().toISOString()
      }, "Mock Google sign-in attempt");

      // Create or find a mock user for development
      const mockEmail = "demo@scholarforge.dev";
      const mockName = "Demo User";
      
      const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, mockEmail)).limit(1);
      
      if (existingUser) {
        const authToken = generateToken(existingUser[0].id);
        res.json({ token: authToken, user: formatUser(existingUser[0]) });
        return;
      }

      // Create new mock user
      const [userCountResult] = await db.select({ userCount: count() }).from(usersTable);
      const role = userCountResult[0].userCount === 0 ? "ADMIN" : "USER";
      
      const [newUser] = await db.insert(usersTable).values({
        id: nanoid(),
        name: mockName,
        email: mockEmail,
        image: "https://via.placeholder.com/150/3b82f6/ffffff?text=Demo",
        googleId: "mock-google-id",
        oauthProvider: "google",
        role,
      }).returning();

      if (!newUser) {
        res.status(500).json({ error: "Failed to create demo user" });
        return;
      }

      const authToken = generateToken(newUser[0].id);
      res.status(201).json({ token: authToken, user: formatUser(newUser[0]) });
      return;
    }

    res.status(401).json({ error: "Google OAuth not configured" });
  } catch (error) {
    console.error("[Auth] Google error:", error);
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

export { formatUser };
export default router;
