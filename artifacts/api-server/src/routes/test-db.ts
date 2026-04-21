import { Router, type IRouter } from "express";
import { Pool } from "pg";

const router: IRouter = Router();

router.get("/test-db", async (_req, res): Promise<void> => {
  try {
    console.log("[TEST] Starting database query...");
    
    // Create a direct connection to avoid ES module issues
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
    
    const result = await pool.query("SELECT NOW() as now, COUNT(*) as user_count FROM users");
    console.log("[TEST] Database query completed:", result.rows[0]);
    
    await pool.end();
    
    res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[TEST] Database error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
