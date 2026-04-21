import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import authRouter from "./routes/auth";
import simpleTestRouter from "./routes/simple-test";
// import testDbRouter from "./routes/test-db";
import { logger } from "./lib/logger";
import { requestLogger, cleanupHangingRequests, getActiveRequests } from "./middleware/requestLogger";
// import { inactivityMiddleware, cleanupInactiveUsers } from "./middleware/inactivityMiddleware";
// import { debugMiddleware, createAuthDebugMiddleware, createDbDebugMiddleware, debugLogger } from "./middleware/debugMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// app.use(debugMiddleware);
// app.use(createAuthDebugMiddleware());
// app.use(createDbDebugMiddleware());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add comprehensive request logging
// app.use(requestLogger);

// Serve static files from public directory
app.use("/uploads", express.static("public/uploads"));

// Debug middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
  });
  const origSend = res.send;
  res.send = function (data: any) {
    console.log(`[DEBUG] Response to ${req.method} ${req.path}`, {
      status: res.statusCode,
      data,
    });
    return origSend.call(this, data);
  };
  next();
});

// Apply inactivity middleware
// app.use(inactivityMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint for monitoring
// app.get("/debug/stats", (req, res) => {
//   // const stats = debugLogger.getStats();
//   // const activeRequests = getActiveRequests();
//   const activeRequests: any[] = [];
//   
//   res.json({
//     // ...stats,
//     activeRequests: {
//       count: activeRequests.length,
//       requests: activeRequests
//     },
//     systemInfo: {
//       nodeVersion: process.version,
//       platform: process.platform,
//       memory: process.memoryUsage(),
//       uptime: process.uptime(),
//       pid: process.pid
//     },
//     logging: {
//       logsDir: "./logs",
//       logFiles: ["app.log", "error.log", "auth.log"]
//     }
//   });
// });

// Clear debug logs endpoint
// app.post("/debug/clear", (req, res) => {
//   debugLogger.clear();
//   res.json({ message: "Debug logs cleared" });
// });

// Health check endpoint for debugging
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "API server is running",
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.use("/api", authRouter);
app.use("/api", simpleTestRouter);

// Start cleanup interval for inactive users
// setInterval(cleanupInactiveUsers, 60 * 60 * 1000); // Run every hour

// Start cleanup interval for hanging requests
setInterval(cleanupHangingRequests, 30 * 1000); // Run every 30 seconds

// 404 handler
app.use((req: Request, res: Response) => {
  console.error(`[ERROR] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: "Not Found",
    message: `No route found for ${req.method} ${req.path}`,
    path: req.path,
    method: req.method,
    availableEndpoints: [
      "GET /api/health",
      "POST /api/auth/signup",
      "POST /api/auth/signin",
      "POST /api/auth/signout",
      "GET /api/auth/me",
    ]
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[ERROR] Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

export default app;
