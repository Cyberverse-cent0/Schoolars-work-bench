import express from "express";
import cors from "cors";
import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "./lib/nanoid";
import { hashPassword, verifyPassword, generateToken } from "./lib/auth";

const app = express();
const port = 8080;

// Basic middleware
app.use(cors());
app.use(express.json());

// Basic routes
const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Minimal API server is running"
  });
});

// Simple signin without complex logging
router.post("/auth/signin", async (req, res) => {
  try {
    console.log("[MINIMAL] Signin request received:", { 
      email: req.body.email?.replace(/(.{2}).*(@.*)/, "$1***$2"),
      timestamp: new Date().toISOString()
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("[MINIMAL] Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("[MINIMAL] Looking up user:", email.replace(/(.{2}).*(@.*)/, "$1***$2"));
    
    // Simple database query with timeout
    const userPromise = db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database timeout")), 5000)
    );

    const [user] = await Promise.race([userPromise, timeoutPromise]) as any[];
    
    console.log("[MINIMAL] User lookup result:", { 
      found: !!user, 
      hasPassword: !!(user?.passwordHash) 
    });

    if (!user || !user.passwordHash) {
      console.log("[MINIMAL] User not found or no password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("[MINIMAL] Verifying password...");
    const passwordValid = verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      console.log("[MINIMAL] Invalid password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("[MINIMAL] Password valid, generating token...");
    const token = generateToken(user.id);

    const userData = {
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
    };

    console.log("[MINIMAL] Signin successful for:", email.replace(/(.{2}).*(@.*)/, "$1***$2"));
    
    res.json({ token, user: userData });
  } catch (error) {
    console.error("[MINIMAL] Signin error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: (error as Error).message,
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() });
});

app.use("/api", router);

// Start server
app.listen(port, () => {
  console.log(`[MINIMAL] Server running on port ${port}`);
  console.log(`[MINIMAL] Test: http://localhost:${port}/api/test`);
  console.log(`[MINIMAL] Health: http://localhost:${port}/api/health`);
});

export default app;
