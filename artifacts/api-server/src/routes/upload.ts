import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth, getCurrentUser } from "../lib/auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { nanoid } from "../lib/nanoid";
import multer from "multer";

const router: IRouter = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Profile picture upload endpoint with local storage
router.post("/upload/profile-picture", requireAuth, (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err) => {
    const user = getCurrentUser(req);

    if (err) {
      console.error("Multer error:", err);
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File size must be less than 5MB" });
          return;
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          res.status(400).json({ error: "No file uploaded" });
          return;
        }
      }
      if (err.message === "Only image files are allowed") {
        res.status(400).json({ error: "Only image files are allowed" });
        return;
      }
      res.status(500).json({ error: "Failed to upload profile picture" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      // Generate unique filename
      const filename = `${user.id}-${nanoid()}.jpg`;
      const uploadsDir = join(process.cwd(), "public", "uploads", "profiles");
      
      // Ensure uploads directory exists
      await mkdir(uploadsDir, { recursive: true });
      
      // Write file to disk
      const filePath = join(uploadsDir, filename);
      await writeFile(filePath, req.file.buffer);
      
      // Generate public URL (full URL)
      const profilePictureUrl = `http://localhost:8080/uploads/profiles/${filename}`;
      
      // Update user's profile picture URL in database
      await db.update(usersTable)
        .set({ image: profilePictureUrl, updatedAt: new Date() })
        .where(eq(usersTable.id, user.id));

      res.json({ 
        success: true,
        profilePictureUrl
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });
});

// Serve uploaded files
router.get("/uploads/profiles/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = join(process.cwd(), "public", "uploads", "profiles", filename);
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Set appropriate headers
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    
    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error serving profile picture:", error);
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
