import { pgTable, text, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemMetricsTable = pgTable("system_metrics", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  
  // CPU metrics
  cpuUsagePercent: decimal("cpu_usage_percent", { precision: 5, scale: 2 }).notNull(),
  cpuCount: integer("cpu_count").notNull(),
  
  // Memory metrics (in MB)
  memoryUsageMB: integer("memory_usage_mb").notNull(),
  memoryTotalMB: integer("memory_total_mb").notNull(),
  memoryUsagePercent: decimal("memory_usage_percent", { precision: 5, scale: 2 }).notNull(),
  
  // Process-specific metrics
  processMemoryMB: integer("process_memory_mb").notNull(),
  processHeapUsedMB: integer("process_heap_used_mb").notNull(),
  processHeapTotalMB: integer("process_heap_total_mb").notNull(),
  
  // Uptime (in seconds)
  uptime: integer("uptime").notNull(),
  
  // Node.js version
  nodeVersion: text("node_version").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SystemMetrics = typeof systemMetricsTable.$inferSelect;
export type InsertSystemMetrics = typeof systemMetricsTable.$inferInsert;

export const insertSystemMetricsSchema = createInsertSchema(systemMetricsTable);
export const selectSystemMetricsSchema = createInsertSchema(systemMetricsTable);
