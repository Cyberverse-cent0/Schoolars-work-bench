import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { inactivityMiddleware, cleanupInactiveUsers } from "./middleware/inactivityMiddleware";

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use(inactivityMiddleware);

// Health check endpoint for debugging
app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "API server is running" 
  });
});

app.use("/api", router);

// Start cleanup interval for inactive users
setInterval(cleanupInactiveUsers, 60 * 60 * 1000); // Run every hour

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
