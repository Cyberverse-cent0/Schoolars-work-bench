import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { 
  chatMessagesTable, 
  usersTable, 
  directMessagesTable 
} from "@workspace/db";
import { eq, lt, desc, or, and } from "drizzle-orm";
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

    // Store the message in the database
    const [newMessage] = await db.insert(directMessagesTable).values({
      id: nanoid(),
      senderId: sender.id,
      recipientId,
      content,
      isRead: "false",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log("Direct message stored:", newMessage);
    
    // TODO: In a full implementation, you would:
    // 1. Send a real-time notification to the recipient via WebSocket
    // 2. Update the recipient's unread message count
    // 3. Log the activity

    res.status(201).json({ 
      success: true,
      message: "Message sent successfully",
      messageId: newMessage.id
    });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get conversation history between current user and another user
router.get("/messages/conversation/:otherUserId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const currentUser = getCurrentUser(req);
  const otherUserId = Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId;

  if (!otherUserId) {
    res.status(400).json({ error: "Other user ID is required" });
    return;
  }

  try {
    // Fetch conversation history between current user and other user (both directions)
    const messages = await db.select()
      .from(directMessagesTable)
      .where(
        or(
          and(
            eq(directMessagesTable.senderId, currentUser.id),
            eq(directMessagesTable.recipientId, otherUserId)
          ),
          and(
            eq(directMessagesTable.senderId, otherUserId),
            eq(directMessagesTable.recipientId, currentUser.id)
          )
        )
      )
      .orderBy(directMessagesTable.createdAt);

    // Get user information for sender/recipient
    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, msg.senderId));
        const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, msg.recipientId));
        
        return {
          id: msg.id,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: sender ? {
            id: sender.id,
            name: sender.name,
            email: sender.email,
            image: sender.image
          } : null,
          recipient: recipient ? {
            id: recipient.id,
            name: recipient.name,
            email: recipient.email,
            image: recipient.image
          } : null,
          isRead: msg.isRead === "true"
        };
      })
    );
    
    res.json(messagesWithUsers);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Get all conversations for current user
router.get("/messages/conversations", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const currentUser = getCurrentUser(req);

  try {
    // Get all unique conversation partners
    const sentMessages = await db.select({
      userId: directMessagesTable.recipientId,
      lastMessageAt: directMessagesTable.createdAt,
      content: directMessagesTable.content,
      isRead: directMessagesTable.isRead
    })
      .from(directMessagesTable)
      .where(eq(directMessagesTable.senderId, currentUser.id));

    const receivedMessages = await db.select({
      userId: directMessagesTable.senderId,
      lastMessageAt: directMessagesTable.createdAt,
      content: directMessagesTable.content,
      isRead: directMessagesTable.isRead
    })
      .from(directMessagesTable)
      .where(eq(directMessagesTable.recipientId, currentUser.id));

    // Combine and get unique conversation partners
    const allConversations = [...sentMessages, ...receivedMessages];
    const uniqueUsers = new Map();

    for (const conv of allConversations) {
      const existing = uniqueUsers.get(conv.userId);
      if (!existing || new Date(conv.lastMessageAt) > new Date(existing.lastMessageAt)) {
        uniqueUsers.set(conv.userId, conv);
      }
    }

    // Get user details for each conversation partner
    const conversations = await Promise.all(
      Array.from(uniqueUsers.entries()).map(async ([userId, lastMsg]) => {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
        
        if (!user) return null;

        // Check access control: scholars can only see conversations with admins
        if (currentUser.role === "SCHOLAR" && user.role !== "ADMIN") {
          return null;
        }

        // Count unread messages
        const unreadCount = await db.select({ count: directMessagesTable.id })
          .from(directMessagesTable)
          .where(
            and(
              eq(directMessagesTable.senderId, userId),
              eq(directMessagesTable.recipientId, currentUser.id),
              eq(directMessagesTable.isRead, "false")
            )
          );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          lastMessage: lastMsg.content,
          lastMessageAt: lastMsg.lastMessageAt,
          unreadCount: unreadCount.length,
          isFromMe: sentMessages.some(m => m.userId === userId && m.lastMessageAt === lastMsg.lastMessageAt)
        };
      })
    );

    // Filter out null results and sort by last message time
    const validConversations = conversations
      .filter(conv => conv !== null)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    res.json(validConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get list of admins for scholars to contact
router.get("/messages/admins", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const currentUser = getCurrentUser(req);

  // Only scholars can access this endpoint
  if (currentUser.role !== "SCHOLAR") {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    const admins = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      image: usersTable.image,
      role: usersTable.role
    })
      .from(usersTable)
      .where(eq(usersTable.role, "ADMIN"));

    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

export default router;
