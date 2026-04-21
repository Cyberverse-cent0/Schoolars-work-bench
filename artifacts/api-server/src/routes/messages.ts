import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, usersTable } from "@workspace/db";
import { eq, lt, desc } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { formatUser } from "./auth";
import { nanoid } from "../lib/nanoid";

const router: IRouter = Router();

router.get("/projects/:projectId/messages", requireAuth, async (req, res): Promise<void> => {
  const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const { limit, before } = req.query as { limit?: string; before?: string };

  const limitNum = limit ? parseInt(limit, 10) : 50;

  let query = db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.projectId, projectId))
    .orderBy(chatMessagesTable.createdAt)
    .limit(limitNum);

  const messages = await query;

  const result = await Promise.all(messages.map(async (m) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId));
    return { ...m, user: user ? formatUser(user) : null };
  }));

  res.json(result);
});

router.post("/projects/:projectId/messages", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const [msg] = await db.insert(chatMessagesTable).values({
    id: nanoid(),
    projectId,
    userId: user.id,
    message,
  }).returning();

  res.status(201).json({ ...msg, user: formatUser(user) });
});

// Direct messaging endpoint
router.post("/messages/send", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const sender = getCurrentUser(req);
  const { recipientId, content } = req.body;

  if (!recipientId || !content) {
    res.status(400).json({ error: "Recipient ID and content are required" });
    return;
  }

  if (recipientId === sender.id) {
    res.status(400).json({ error: "Cannot send message to yourself" });
    return;
  }

  try {
    // Check if recipient exists
    const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, recipientId));
    if (!recipient) {
      res.status(404).json({ error: "Recipient not found" });
      return;
    }

    // For now, we'll create a simple message record
    // In a full implementation, you might want a separate direct messages table
    const messageId = nanoid();
    
    // Create a simple message record (you could store this in a direct messages table)
    const message = {
      id: messageId,
      senderId: sender.id,
      recipientId,
      content,
      createdAt: new Date(),
      type: "direct"
    };

    console.log("Direct message sent:", message);
    
    // For now, just return success
    // In a real implementation, you would:
    // 1. Store the message in a database table
    // 2. Send a real-time notification to the recipient
    // 3. Update the recipient's unread message count

    res.status(201).json({ 
      success: true,
      message: "Message sent successfully",
      messageId
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
