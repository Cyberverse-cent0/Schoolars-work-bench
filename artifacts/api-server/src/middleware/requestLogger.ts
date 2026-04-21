import { Request, Response, NextFunction } from "express";
import { logger, logRequest, logError } from "../lib/logger";

interface RequestLog {
  id: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  body?: any;
  headers?: any;
}

// Store active requests for tracking
const activeRequests = new Map<string, RequestLog>();

// Generate unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Store request information
  const requestLog: RequestLog = {
    id: requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
    ip: req.ip || req.connection.remoteAddress,
    startTime,
    body: req.method !== "GET" ? req.body : undefined,
    headers: {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
      "accept": req.headers["accept"],
    }
  };
  
  activeRequests.set(requestId, requestLog);
  
  // Log incoming request
  logger.info({
    requestId,
    action: "request_start",
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
    body: req.method !== "GET" ? req.body : undefined,
    timestamp: new Date().toISOString()
  }, `Incoming ${req.method} ${req.url}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const requestLog = activeRequests.get(requestId);
    
    // Log response
    logger.info({
      requestId,
      action: "request_complete",
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400,
      timestamp: new Date().toISOString()
    }, `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Clean up
    activeRequests.delete(requestId);
    
    // Call original end
    return originalEnd.apply(this, args);
  };
  
  // Handle request errors
  res.on("error", (error) => {
    const duration = Date.now() - startTime;
    logError(error, {
      requestId,
      method: req.method,
      url: req.url,
      duration,
      action: "request_error"
    });
    
    activeRequests.delete(requestId);
  });
  
  next();
};

// Get active requests for debugging
export const getActiveRequests = () => {
  return Array.from(activeRequests.values()).map(req => ({
    id: req.id,
    method: req.method,
    url: req.url,
    duration: Date.now() - req.startTime,
    userAgent: req.userAgent,
    ip: req.ip
  }));
};

// Cleanup hanging requests (older than 30 seconds)
export const cleanupHangingRequests = () => {
  const now = Date.now();
  const threshold = 30000; // 30 seconds
  
  for (const [id, request] of activeRequests.entries()) {
    if (now - request.startTime > threshold) {
      logger.warn({
        requestId: id,
        method: request.method,
        url: request.url,
        duration: now - request.startTime,
        action: "request_timeout"
      }, `Request timeout: ${request.method} ${request.url}`);
      
      activeRequests.delete(id);
    }
  }
};
