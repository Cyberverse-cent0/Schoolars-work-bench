import { Request, Response, NextFunction } from "express";

interface DebugInfo {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cacheHits?: number;
  dbQueries?: number;
}

class DebugLogger {
  private logs: DebugInfo[] = [];
  private maxLogs: number = 1000;
  private cacheHitCount: number = 0;
  private dbQueryCount: number = 0;

  log(info: DebugInfo) {
    this.logs.push(info);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console with structured format
    console.log(`[DEBUG] ${JSON.stringify({
      timestamp: info.timestamp,
      method: info.method,
      url: info.url,
      duration: info.duration,
      status: info.statusCode,
      userId: info.userId,
      memory: info.memoryUsage,
      error: info.error
    })}`);
  }

  incrementCacheHits() {
    this.cacheHitCount++;
  }

  incrementDbQueries() {
    this.dbQueryCount++;
  }

  getStats() {
    return {
      totalRequests: this.logs.length,
      cacheHits: this.cacheHitCount,
      dbQueries: this.dbQueryCount,
      recentLogs: this.logs.slice(-50),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate()
    };
  }

  private calculateAverageResponseTime(): number {
    const completedRequests = this.logs.filter(log => log.duration !== undefined);
    if (completedRequests.length === 0) return 0;
    
    const total = completedRequests.reduce((sum, log) => sum + (log.duration || 0), 0);
    return Math.round(total / completedRequests.length);
  }

  private calculateErrorRate(): number {
    const errorRequests = this.logs.filter(log => log.error || (log.statusCode && log.statusCode >= 400));
    return Math.round((errorRequests.length / this.logs.length) * 100);
  }

  clear() {
    this.logs = [];
    this.cacheHitCount = 0;
    this.dbQueryCount = 0;
  }
}

export const debugLogger = new DebugLogger();

export function debugMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Get memory usage at start
  const startMemory = process.memoryUsage();

  // Store original res.end to intercept response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    const debugInfo: DebugInfo = {
      timestamp,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      duration,
      statusCode: res.statusCode,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      }
    };

    // Add user info if available
    if ((req as any).user) {
      debugInfo.userId = (req as any).user.id;
    }

    // Add error info if response indicates error
    if (res.statusCode >= 400) {
      debugInfo.error = `HTTP ${res.statusCode}`;
    }

    debugLogger.log(debugInfo);
    
    // Call original end
    originalEnd.apply(res, args);
  };

  next();
}

export function performanceMonitor(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await method.apply(this, args);
      
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage();
      
      console.log(`[PERF] ${target.constructor.name}.${propertyName} completed in ${duration}ms`);
      console.log(`[PERF] Memory delta: ${JSON.stringify({
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal
      })}`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[PERF] ${target.constructor.name}.${propertyName} failed after ${duration}ms:`, error);
      throw error;
    }
  };

  return descriptor;
}

export function createAuthDebugMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log authentication attempts
      if (req.url.includes('/auth/')) {
        const authType = req.url.split('/auth/')[1];
        console.log(`[AUTH] ${req.method} /auth/${authType} attempt from ${req.ip}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[AUTH] Success: ${authType} completed`);
        } else if (res.statusCode >= 400) {
          console.log(`[AUTH] Failed: ${authType} returned ${res.statusCode}`);
        }
      }
      
      originalSend.call(res, data);
    };
    
    next();
  };
}

// Database query debugging
export function createDbDebugMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Increment DB query counter for this request
    const originalEnd = res.end;
    let queryCount = 0;
    
    // Hook into database queries (simplified version)
    const originalQuery = req.app?.locals?.db?.query;
    if (originalQuery) {
      req.app.locals.db.query = function(...args: any[]) {
        queryCount++;
        debugLogger.incrementDbQueries();
        return originalQuery.apply(this, args);
      };
    }
    
    res.end = function(...args: any[]) {
      if (queryCount > 0) {
        console.log(`[DB] Request to ${req.url} executed ${queryCount} database queries`);
      }
      originalEnd.apply(res, args);
    };
    
    next();
  };
}
