import { Router, type IRouter } from "express";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Add logger for debugging
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[AUTH-SIMPLE] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[AUTH-SIMPLE] ${message}`, ...args)
};

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET || "scholarforge-secret-key";

// Add a test endpoint to verify the route is working
router.get("/auth/test", (req, res) => {
  logger.info("Auth test endpoint reached");
  res.json({ message: "Auth route is working", timestamp: new Date().toISOString() });
});

// Add a simple database test endpoint
router.get("/auth/db-test", async (req, res) => {
  try {
    logger.info("Database test endpoint reached");
    
    // Create direct database connection with correct port
    const dbUrl = "postgresql://postgres:password@localhost:5433/scholarforge"; // Hardcode for testing
    console.log("[AUTH-SIMPLE] Connecting to database with URL:", dbUrl);
    
    const pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    const result = await pool.query("SELECT NOW() as now");
    await pool.end();
    
    logger.info("Database test successful:", result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("[AUTH-SIMPLE] Database test error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add a test user creation endpoint
router.post("/auth/create-test-user", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required" });
      return;
    }

    // Create direct database connection with correct port
    const dbUrl = "postgresql://postgres:password@localhost:5433/scholarforge";
    
    const pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    // Check if user already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      await pool.end();
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 10);

    // Generate UUID for user
    const { v4: uuidv4 } = require('uuid');
    const userId = uuidv4();

    // Create user
    const result = await pool.query(
      "INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, email, role, created_at",
      [userId, name, email, passwordHash, 'USER']
    );
    
    await pool.end();
    
    logger.info("Test user created successfully:", result.rows[0]);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("[AUTH-SIMPLE] Create test user error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post("/auth/signin", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Create direct database connection with correct port
    const dbUrl = "postgresql://postgres:password@localhost:5433/scholarforge"; // Hardcode for testing
    console.log("[AUTH-SIMPLE] Connecting to database with URL:", dbUrl);
    
    const pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    logger.info("Looking up user:", email);
    
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, institution, research_interests, bio, image, created_at, updated_at FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    
    await pool.end();

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = result.rows[0];
    
    if (!user.password_hash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      researchInterests: user.research_interests,
      bio: user.bio,
      image: user.image,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
    
    logger.info("Login successful for:", email);
    res.json({ token, user: formattedUser });
  } catch (error) {
    console.error("[AUTH-SIMPLE] Login error:", error);
    console.error("[AUTH-SIMPLE] Error type:", typeof error);
    console.error("[AUTH-SIMPLE] Error message:", error instanceof Error ? error.message : "Not an Error object");
    console.error("[AUTH-SIMPLE] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
