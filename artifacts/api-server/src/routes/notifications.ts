import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  const notifications = await db.select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifications);
});

router.get("/notifications/unread-count", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  const unread = await db.select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)));
  res.json({ count: unread.length });
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  const { id } = req.params;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)));
  res.json({ success: true });
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const user = getCurrentUser(req);
  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, user.id));
  res.json({ success: true });
});

export default router;
