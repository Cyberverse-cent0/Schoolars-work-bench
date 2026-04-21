interface DebugEvent {
  timestamp: string;
  type: 'auth' | 'api' | 'performance' | 'error';
  action: string;
  duration?: number;
  details: Record<string, any>;
  userId?: string;
  sessionId: string;
}

class FrontendDebugger {
  private events: DebugEvent[] = [];
  private maxEvents: number = 500;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializeSessionTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSessionTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.log('performance', 'visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.log('performance', 'page_unload', {
        sessionDuration: Date.now() - this.startTime
      });
    });

    // Track network connectivity
    window.addEventListener('online', () => {
      this.log('performance', 'network_online', { timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
      this.log('performance', 'network_offline', { timestamp: Date.now() });
    });
  }

  log(type: DebugEvent['type'], action: string, details: Record<string, any> = {}, duration?: number) {
    const event: DebugEvent = {
      timestamp: new Date().toISOString(),
      type,
      action,
      duration,
      details,
      sessionId: this.sessionId
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${type.toUpperCase()}: ${action}`, {
        duration,
        ...details
      });
    }
  }

  // Authentication specific logging
  logAuthAttempt(action: string, email?: string, duration?: number, error?: string) {
    this.log('auth', action, {
      email: email ? this.maskEmail(email) : undefined,
      error,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }, duration);
  }

  // API request logging
  logApiRequest(method: string, url: string, duration: number, status: number, error?: string) {
    this.log('api', `${method} ${url}`, {
      status,
      error,
      url: this.sanitizeUrl(url)
    }, duration);
  }

  // Performance logging
  logPerformance(action: string, duration: number, details: Record<string, any> = {}) {
    this.log('performance', action, {
      ...details,
      memory: this.getMemoryInfo()
    }, duration);
  }

  // Error logging
  logError(action: string, error: Error | string, details: Record<string, any> = {}) {
    this.log('error', action, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...details
    });
  }

  // Get debug information
  getDebugInfo() {
    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      totalEvents: this.events.length,
      eventsByType: this.getEventsByType(),
      recentEvents: this.events.slice(-20),
      events: this.events,
      performanceStats: this.getPerformanceStats(),
      authEvents: this.events.filter(e => e.type === 'auth'),
      apiEvents: this.events.filter(e => e.type === 'api'),
      errorEvents: this.events.filter(e => e.type === 'error')
    };
  }

  // Clear debug events
  clear() {
    this.events = [];
  }

  // Export debug data
  export() {
    const data = {
      ...this.getDebugInfo(),
      allEvents: this.events,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Private helper methods
  private getEventsByType() {
    const counts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return counts;
  }

  private getPerformanceStats() {
    const perfEvents = this.events.filter(e => e.type === 'performance' && e.duration);
    
    if (perfEvents.length === 0) {
      return { averageDuration: 0, slowestEvent: null, fastestEvent: null };
    }

    const durations = perfEvents.map(e => e.duration!);
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    return {
      averageDuration: Math.round(average),
      slowestEvent: perfEvents.reduce((slowest, current) => 
        (current.duration! > (slowest.duration || 0)) ? current : slowest
      ),
      fastestEvent: perfEvents.reduce((fastest, current) => 
        (current.duration! < (fastest.duration || Infinity)) ? current : fastest
      )
    };
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}*@${domain}`;
    }
    return `${username.slice(0, 2)}***@${domain}`;
  }

  private sanitizeUrl(url: string): string {
    // Remove sensitive parameters
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.delete('token');
    urlObj.searchParams.delete('password');
    return urlObj.toString();
  }

  private getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }
}

// Create singleton instance
export const frontendDebugger = new FrontendDebugger();

// Performance measurement utility
export function measurePerformance<T>(
  action: string,
  fn: () => Promise<T> | T,
  details: Record<string, any> = {}
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - startTime);
      
      frontendDebugger.logPerformance(action, duration, details);
      resolve(result);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      frontendDebugger.logError(action, error as Error, { ...details, duration });
      reject(error);
    }
  });
}

// API request wrapper with debugging
export function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = performance.now();
  const method = options.method || 'GET';
  
  return fetch(url, options)
    .then(response => {
      const duration = Math.round(performance.now() - startTime);
      frontendDebugger.logApiRequest(method, url, duration, response.status);
      return response;
    })
    .catch(error => {
      const duration = Math.round(performance.now() - startTime);
      frontendDebugger.logApiRequest(method, url, duration, 0, error.message);
      throw error;
    });
}

// React hook for debugging
export function useDebug() {
  return {
    logAuth: frontendDebugger.logAuthAttempt.bind(frontendDebugger),
    logApi: frontendDebugger.logApiRequest.bind(frontendDebugger),
    logPerf: frontendDebugger.logPerformance.bind(frontendDebugger),
    logError: frontendDebugger.logError.bind(frontendDebugger),
    getDebugInfo: frontendDebugger.getDebugInfo.bind(frontendDebugger),
    clear: frontendDebugger.clear.bind(frontendDebugger),
    export: frontendDebugger.export.bind(frontendDebugger)
  };
}
