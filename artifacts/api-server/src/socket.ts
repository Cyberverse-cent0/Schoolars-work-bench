import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, chatMessagesTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "./lib/nanoid";

const JWT_SECRET = process.env["SESSION_SECRET"] || "scholarforge-secret-key";

const onlineUsers = new Map<string, Set<string>>();

function addOnlineUser(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
}

function removeOnlineUser(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
}

function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

export let io: SocketIOServer;

export function setupSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId as string;
    addOnlineUser(userId, socket.id);

    await db.update(usersTable)
      .set({ isOnline: true, lastActive: new Date() })
      .where(eq(usersTable.id, userId));

    io.emit("user-online", { userId });

    socket.on("join-project", (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("leave-project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("typing-start", ({ projectId }: { projectId: string }) => {
      socket.to(`project:${projectId}`).emit("typing-start", { userId, projectId });
    });

    socket.on("typing-stop", ({ projectId }: { projectId: string }) => {
      socket.to(`project:${projectId}`).emit("typing-stop", { userId, projectId });
    });

    socket.on("send-message", async ({ projectId, message, imageUrl }: { projectId: string; message: string; imageUrl?: string }) => {
      try {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        if (!user) return;

        const [msg] = await db.insert(chatMessagesTable).values({
          id: nanoid(),
          projectId,
          userId,
          message: message || "",
          imageUrl: imageUrl || null,
          reactions: "{}",
        }).returning();

        const fullMsg = {
          ...msg,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            institution: user.institution,
            role: user.role,
          },
        };

        io.to(`project:${projectId}`).emit("new-message", fullMsg);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("add-reaction", async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      try {
        const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, messageId));
        if (!msg) return;

        const reactions = JSON.parse(msg.reactions || "{}") as Record<string, string[]>;
        if (!reactions[emoji]) reactions[emoji] = [];

        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex >= 0) {
          reactions[emoji].splice(userIndex, 1);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji].push(userId);
        }

        await db.update(chatMessagesTable)
          .set({ reactions: JSON.stringify(reactions) })
          .where(eq(chatMessagesTable.id, messageId));

        io.to(`project:${msg.projectId}`).emit("reaction-updated", { messageId, reactions });
      } catch (err) {
        socket.emit("error", { message: "Failed to update reaction" });
      }
    });

    socket.on("disconnect", async () => {
      removeOnlineUser(userId, socket.id);
      if (!isUserOnline(userId)) {
        await db.update(usersTable)
          .set({ isOnline: false, lastActive: new Date() })
          .where(eq(usersTable.id, userId));
        io.emit("user-offline", { userId });
      }
    });
  });
}

export function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  return db.insert(notificationsTable).values({
    id: nanoid(),
    ...data,
  }).returning().then(([n]) => {
    if (io) {
      io.emit(`notification:${data.userId}`, n);
    }
    return n;
  });
}
