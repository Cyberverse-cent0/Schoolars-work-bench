import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatMessagesTable = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  message: text("message").notNull(),
  imageUrl: text("image_url"),
  reactions: text("reactions").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const directMessagesTable = pgTable("direct_messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  content: text("content").notNull(),
  isRead: text("is_read").default("false").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ createdAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessagesTable).omit({ createdAt: true, updatedAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type DirectMessage = typeof directMessagesTable.$inferSelect;
