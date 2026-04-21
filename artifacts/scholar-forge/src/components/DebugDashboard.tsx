import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Trash2, Activity, Clock, AlertTriangle, Database, User } from "lucide-react";
import { frontendDebugger } from "@/utils/debugUtils";

interface DebugStats {
  sessionId: string;
  sessionDuration: number;
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: any[];
  events: any[];
  performanceStats: {
    averageDuration: number;
    slowestEvent: any;
    fastestEvent: any;
  };
  authEvents: any[];
  apiEvents: any[];
  errorEvents: any[];
}

export default function DebugDashboard() {
  const [debugInfo, setDebugInfo] = useState<DebugStats | null>(null);
  const [backendStats, setBackendStats] = useState<any>(null);

  useEffect(() => {
    // Update debug info every second
    const interval = setInterval(() => {
      setDebugInfo(frontendDebugger.getDebugInfo());
    }, 1000);

    // Fetch backend stats
    fetchBackendStats();

    return () => clearInterval(interval);
  }, []);

  const fetchBackendStats = async () => {
    try {
      const response = await fetch("/debug/stats");
      if (response.ok) {
        const stats = await response.json();
        setBackendStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch backend stats:", error);
    }
  };

  const clearLogs = async () => {
    frontendDebugger.clear();
    try {
      await fetch("/debug/clear", { method: "POST" });
      fetchBackendStats();
    } catch (error) {
      console.error("Failed to clear backend logs:", error);
    }
  };

  const exportLogs = () => {
    frontendDebugger.export();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  if (!debugInfo) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
          <Button onClick={fetchBackendStats} variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="api">API Calls</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="backend">Backend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(debugInfo.sessionDuration)}</div>
                <p className="text-xs text-muted-foreground">ID: {debugInfo.sessionId.slice(-8)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debugInfo.totalEvents}</div>
                <div className="flex gap-1 mt-1">
                  {Object.entries(debugInfo.eventsByType).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debugInfo.performanceStats.averageDuration}ms</div>
                <p className="text-xs text-muted-foreground">Performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{debugInfo.errorEvents.length}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {debugInfo.recentEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={event.type === 'error' ? 'destructive' : 'secondary'}>
                        {event.type}
                      </Badge>
                      <span>{event.action}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {event.duration && <span>{event.duration}ms</span>}
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Authentication Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debugInfo.authEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{event.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.details.email}
                      </div>
                      {event.duration && (
                        <div className="text-xs text-muted-foreground">
                          Duration: {event.duration}ms
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      {event.details.error && (
                        <div className="text-xs text-destructive mt-1">
                          {event.details.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {debugInfo.authEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No authentication events recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debugInfo.apiEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{event.action}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {event.details.status}
                      </div>
                      {event.duration && (
                        <div className="text-xs text-muted-foreground">
                          Duration: {event.duration}ms
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      {event.details.error && (
                        <div className="text-xs text-destructive mt-1">
                          {event.details.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {debugInfo.apiEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No API calls recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average Duration:</span>
                    <span className="font-medium">{debugInfo.performanceStats.averageDuration}ms</span>
                  </div>
                  {debugInfo.performanceStats.slowestEvent && (
                    <div className="flex justify-between">
                      <span>Slowest Event:</span>
                      <span className="font-medium">
                        {debugInfo.performanceStats.slowestEvent.action} ({debugInfo.performanceStats.slowestEvent.duration}ms)
                      </span>
                    </div>
                  )}
                  {debugInfo.performanceStats.fastestEvent && (
                    <div className="flex justify-between">
                      <span>Fastest Event:</span>
                      <span className="font-medium">
                        {debugInfo.performanceStats.fastestEvent.action} ({debugInfo.performanceStats.fastestEvent.duration}ms)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {debugInfo.events
                    .filter((e: any) => e.type === 'performance' && e.duration)
                    .map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{event.action}</span>
                        <span>{event.duration}ms</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debugInfo.errorEvents.map((event, index) => (
                  <div key={index} className="p-3 border border-destructive/20 rounded bg-destructive/5">
                    <div className="font-medium text-destructive">{event.action}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.details.error}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {debugInfo.errorEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backend" className="space-y-4">
          {backendStats ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Backend System Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">System</h4>
                      <div className="space-y-1 text-sm">
                        <div>Node Version: {backendStats.systemInfo.nodeVersion}</div>
                        <div>Platform: {backendStats.systemInfo.platform}</div>
                        <div>PID: {backendStats.systemInfo.pid}</div>
                        <div>Uptime: {formatDuration(backendStats.systemInfo.uptime * 1000)}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Memory</h4>
                      <div className="space-y-1 text-sm">
                        <div>RSS: {formatMemory(backendStats.systemInfo.memory.rss)}</div>
                        <div>Heap Used: {formatMemory(backendStats.systemInfo.memory.heapUsed)}</div>
                        <div>Heap Total: {formatMemory(backendStats.systemInfo.memory.heapTotal)}</div>
                        <div>External: {formatMemory(backendStats.systemInfo.memory.external)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Backend Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backendStats.totalRequests}</div>
                      <div className="text-sm text-muted-foreground">Total Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backendStats.cacheHits}</div>
                      <div className="text-sm text-muted-foreground">Cache Hits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backendStats.dbQueries}</div>
                      <div className="text-sm text-muted-foreground">DB Queries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backendStats.averageResponseTime}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Backend Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {backendStats.recentLogs?.map((log: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.method}</Badge>
                          <span>{log.url}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{log.duration}ms</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          {log.statusCode >= 400 && (
                            <Badge variant="destructive">{log.statusCode}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Backend stats not available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
