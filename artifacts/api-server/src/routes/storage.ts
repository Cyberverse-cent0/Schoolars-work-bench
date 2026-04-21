import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body;
  if (!name || !size || !contentType) {
    res.status(400).json({ error: "Missing required fields: name, size, contentType" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    const objectURL = `/api/storage/objects${objectPath.replace(/^\/objects/, "")}`;

    res.json({ uploadURL, objectPath, objectURL, metadata: { name, size, contentType } });
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

// Profile picture upload endpoint
router.post("/storage/profile-picture", requireAuth, async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body;
  const user = getCurrentUser(req);

  // Validate file type (only images)
  if (!contentType || !contentType.startsWith("image/")) {
    res.status(400).json({ error: "Only image files are allowed" });
    return;
  }

  // Validate file size (max 5MB)
  if (!size || size > 5 * 1024 * 1024) {
    res.status(400).json({ error: "File size must be less than 5MB" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    const objectURL = `/api/storage/objects${objectPath.replace(/^\/objects/, "")}`;

    // Update user's profile picture URL in database
    await db.update(usersTable)
      .set({ image: objectURL, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));

    res.json({ 
      uploadURL, 
      objectPath, 
      objectURL, 
      metadata: { name, size, contentType },
      profilePictureUrl: objectURL
    });
  } catch (error) {
    req.log.error({ err: error }, "Error generating profile picture upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

export default router;
