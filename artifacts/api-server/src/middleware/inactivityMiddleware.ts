import { Request, Response, NextFunction } from "express";
import { getCurrentUser } from "../lib/auth";

interface InactivityStore {
  [userId: string]: {
    lastActivity: Date;
    isActive: boolean;
  };
}

// Simple in-memory store for user activity
// In production, this should be replaced with Redis or database
const userActivity: InactivityStore = {};

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function inactivityMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getCurrentUser(req);
    
    if (!user) {
      return next();
    }

    // Update last activity for active user
    if (userActivity[user.id]) {
      userActivity[user.id].lastActivity = new Date();
      userActivity[user.id].isActive = true;
    } else {
      userActivity[user.id] = {
        lastActivity: new Date(),
        isActive: true
      };
    }

    // Check for inactivity
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - userActivity[user.id].lastActivity.getTime();
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT && userActivity[user.id].isActive) {
      console.log(`User ${user.id} inactive for ${timeSinceLastActivity / (1000 * 60)} minutes, logging out...`);
      
      // Mark user as inactive
      userActivity[user.id].isActive = false;
      
      // Clear authentication
      res.clearCookie('authjs.token');
      res.clearCookie('authjs.csrf-token');
      
      // Return JSON response for automatic logout
      return res.status(401).json({
        error: "Session expired due to inactivity",
        code: "INACTIVE_LOGOUT",
        message: "You have been automatically logged out due to inactivity"
      });
    }

    next();
  };
}

// Cleanup function to remove inactive users from memory
export function cleanupInactiveUsers() {
  const now = new Date();
  const oneHourAgo = now.getTime() - (60 * 60 * 1000);
  
  Object.keys(userActivity).forEach(userId => {
    if (userActivity[userId].lastActivity.getTime() < oneHourAgo) {
      delete userActivity[userId];
    }
  });
}

// Run cleanup every hour
setInterval(cleanupInactiveUsers, 60 * 60 * 1000);
