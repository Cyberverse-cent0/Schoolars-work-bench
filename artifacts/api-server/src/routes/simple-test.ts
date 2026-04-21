import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/simple-test", async (_req, res): Promise<void> => {
  try {
    console.log("[SIMPLE] Test endpoint reached");
    res.json({
      success: true,
      message: "Simple test works",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[SIMPLE] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
