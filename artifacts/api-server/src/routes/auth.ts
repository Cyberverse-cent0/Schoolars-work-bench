import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { nanoid } from "../lib/nanoid";
import { hashPassword, verifyPassword, generateToken, requireAuth, getCurrentUser } from "../lib/auth";
import { OAuth2Client } from "google-auth-library";
import { performanceMonitor } from "../middleware/debugMiddleware";
import { authLogger, dbLogger, logError, logRequest } from "../lib/logger";

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
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  try {
    const { name, email, password, institution, researchInterests } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }

    // Check if user exists and get user count in a single query
    const [existing, userCountResult] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1),
      db.select({ userCount: count() }).from(usersTable)
    ]);
    
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    // First user becomes ADMIN
    const role = userCountResult[0].userCount === 0 ? "ADMIN" : "USER";

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
    
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    console.log(`[PERF] Signup completed in ${duration}ms for user: ${email}`);
    console.log(`[PERF] Memory delta: ${JSON.stringify({
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal
    })}`);
    
    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] Signup failed after ${duration}ms:`, error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/auth/signin", async (req, res): Promise<void> => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  const { email, password } = req.body;
  
  // Log signin attempt
  authLogger.info({
    action: "signin_attempt",
    email: email ? email.replace(/(.{2}).*(@.*)/, "$1***$2") : undefined,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    timestamp: new Date().toISOString()
  }, `Signin attempt for: ${email ? email.replace(/(.{2}).*(@.*)/, "$1***$2") : "unknown"}`);
  
  try {
    if (!email || !password) {
      authLogger.warn({
        action: "signin_validation_failed",
        missingFields: { email: !email, password: !password },
        timestamp: new Date().toISOString()
      }, "Signin validation failed: missing required fields");
      
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Log database query start
    const dbQueryStart = Date.now();
    dbLogger.debug({
      action: "user_lookup_start",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      timestamp: new Date().toISOString()
    }, "Starting user lookup");

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    const dbQueryDuration = Date.now() - dbQueryStart;
    dbLogger.info({
      action: "user_lookup_complete",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      userFound: !!user,
      hasPasswordHash: !!(user?.passwordHash),
      duration: dbQueryDuration,
      timestamp: new Date().toISOString()
    }, `User lookup completed in ${dbQueryDuration}ms`);
    
    if (!user || !user.passwordHash) {
      authLogger.warn({
        action: "signin_failed_user_not_found",
        email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
        userExists: !!user,
        hasPasswordHash: !!(user?.passwordHash),
        timestamp: new Date().toISOString()
      }, "Signin failed: user not found or no password");
      
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Log password verification start
    const passwordVerifyStart = Date.now();
    authLogger.debug({
      action: "password_verification_start",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      timestamp: new Date().toISOString()
    }, "Starting password verification");

    const passwordValid = verifyPassword(password, user.passwordHash);
    const passwordVerifyDuration = Date.now() - passwordVerifyStart;
    
    authLogger.info({
      action: "password_verification_complete",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      valid: passwordValid,
      duration: passwordVerifyDuration,
      timestamp: new Date().toISOString()
    }, `Password verification completed in ${passwordVerifyDuration}ms`);

    if (!passwordValid) {
      authLogger.warn({
        action: "signin_failed_invalid_password",
        email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
        timestamp: new Date().toISOString()
      }, "Signin failed: invalid password");
      
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Generate token
    const tokenGenerateStart = Date.now();
    const token = generateToken(user.id);
    const tokenGenerateDuration = Date.now() - tokenGenerateStart;
    
    authLogger.info({
      action: "token_generated",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      userId: user.id,
      duration: tokenGenerateDuration,
      timestamp: new Date().toISOString()
    }, `Token generated in ${tokenGenerateDuration}ms`);
    
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    authLogger.info({
      action: "signin_success",
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      userId: user.id,
      userRole: user.role,
      duration,
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal
      },
      timestamp: new Date().toISOString()
    }, `Signin successful for ${email.replace(/(.{2}).*(@.*)/, "$1***$2")} in ${duration}ms`);
    
    res.json({ token, user: formatUser(user) });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(error as Error, {
      action: "signin_error",
      email: email ? email.replace(/(.{2}).*(@.*)/, "$1***$2") : undefined,
      duration,
      timestamp: new Date().toISOString()
    });
    
    authLogger.error({
      action: "signin_failed_error",
      email: email ? email.replace(/(.{2}).*(@.*)/, "$1***$2") : undefined,
      error: (error as Error).message,
      duration,
      timestamp: new Date().toISOString()
    }, `Signin failed with error after ${duration}ms`);
    
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
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
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ error: "Invalid Google token payload" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email || "";
    const name = payload.name || "Google User";
    const image = payload.picture || "";

    // Check if user exists and get user count in parallel
    const [existingUser, existingEmail, userCountResult] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).limit(1),
      db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1),
      db.select({ userCount: count() }).from(usersTable)
    ]);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      const authToken = generateToken(user.id);
      res.json({ token: authToken, user: formatUser(user) });
      return;
    }

    if (existingEmail.length > 0) {
      res.status(409).json({ 
        error: "Email already in use",
        message: "This email is already registered. Try signing in with your password instead.",
      });
      return;
    }

    // First user becomes ADMIN
    const role = userCountResult[0].userCount === 0 ? "ADMIN" : "USER";

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
      res.status(500).json({ error: "Failed to create user account" });
      return;
    }

    const authToken = generateToken(newUser.id);
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
