import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import { nanoid } from "./nanoid";
import { logger } from "./logger";

const JWT_SECRET = process.env.SESSION_SECRET || "scholarforge-secret-key";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Simple in-memory cache for user data (clears every 5 minutes)
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  // Check cache first
  const cached = userCache.get(payload.userId);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    (req as any).user = cached.user;
    next();
    return;
  }

  // Fetch from database if not in cache or cache expired
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Update cache
  userCache.set(payload.userId, { user, timestamp: now });
  
  // Clean up old cache entries periodically
  if (userCache.size > 100) {
    for (const [key, value] of userCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        userCache.delete(key);
      }
    }
  }

  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export function getCurrentUser(req: Request) {
  return (req as any).user;
}

export function generateResetToken(): string {
  // Generate a cryptographically secure random token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Clean up any existing tokens for this user
  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, userId));
  
  // Create new token that expires in 1 hour
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  await db.insert(passwordResetTokensTable).values({
    id: nanoid(),
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

export async function validatePasswordResetToken(token: string): Promise<string | null> {
  // Clean up expired tokens first
  await db.delete(passwordResetTokensTable).where(
    lt(passwordResetTokensTable.expiresAt, new Date())
  );
  
  // Find valid token
  const [resetToken] = await db.select().from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token))
    .limit(1);
  
  if (!resetToken || resetToken.usedAt) {
    return null;
  }
  
  return resetToken.userId;
}

export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  await db.update(passwordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokensTable.token, token));
}

export { logger };
