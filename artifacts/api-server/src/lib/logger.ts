import pino from "pino";
import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// File-based logging configuration
const fileTransport = {
  target: "pino/file",
  options: {
    destination: path.join(logsDir, "app.log"),
    mkdir: true
  }
};

// Error-specific log file
const errorTransport = {
  target: "pino/file", 
  options: {
    destination: path.join(logsDir, "error.log"),
    mkdir: true
  }
};

// Authentication-specific log file
const authTransport = {
  target: "pino/file",
  options: {
    destination: path.join(logsDir, "auth.log"),
    mkdir: true
  }
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {
        // Production: simple file logging
        transport: fileTransport
      }
    : {
        // Development: simple console logging only
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        }
      }),
});

// Specialized loggers
export const authLogger = logger.child({ component: "auth" });
export const dbLogger = logger.child({ component: "database" });
export const apiLogger = logger.child({ component: "api" });

// Request logging helper
export const logRequest = (req: any, action: string, details?: any) => {
  const logData = {
    action,
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  apiLogger.info(logData, `API ${action}`);
};

// Error logging helper
export const logError = (error: Error, context?: any) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  
  logger.error(errorData, "Application Error");
};
