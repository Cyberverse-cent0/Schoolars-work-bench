import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  image: text("image"),
  institution: text("institution"),
  researchInterests: text("research_interests"),
  bio: text("bio"),
  role: roleEnum("role").notNull().default("USER"),
  isOnline: boolean("is_online").notNull().default(false),
  lastActive: timestamp("last_active", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // OAuth fields
  googleId: text("google_id").unique(),
  oauthProvider: text("oauth_provider"), // 'google', 'github', etc.
  
  // Enhanced user profile fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: text("gender"), // 'male', 'female', 'other', 'prefer_not_to_say'
  nationality: text("nationality"),
  location: text("location"), // City, Country
  timezone: text("timezone"),
  language: text("language").default("en"),
  
  // Academic and professional information
  academicTitle: text("academic_title"), // Dr., Prof., Mr., Mrs., etc.
  department: text("department"),
  faculty: text("faculty"),
  degree: text("degree"), // PhD, Masters, Bachelors, etc.
  specialization: text("specialization"),
  yearsOfExperience: text("years_of_experience"),
  linkedinProfile: text("linkedin_profile"),
  personalWebsite: text("personal_website"),
  orcidId: text("orcid_id"), // Academic identifier
  
  // Research and collaboration preferences
  collaborationInterests: text("collaboration_interests"),
  availableForCollaboration: boolean("available_for_collaboration").default(true),
  mentorshipAvailable: boolean("mentorship_available").default(false),
  skills: text("skills"), // JSON array of skills
  publications: text("publications"), // JSON array of publications
  
  // Communication preferences
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(true),
  projectInvites: boolean("project_invites").default(true),
  
  // Privacy and security
  profileVisibility: text("profile_visibility").default("public"), // 'public', 'private', 'connections_only'
  showEmail: boolean("show_email").default(false),
  showPhone: boolean("show_phone").default(false),
  
  // Activity tracking
  loginCount: text("login_count").default("0"),
  lastLoginIP: text("last_login_ip"),
  lastLoginDevice: text("last_login_device"),
  accountStatus: text("account_status").default("active"), // 'active', 'suspended', 'deleted'
  emailVerified: boolean("email_verified").default(false),
  profileCompleted: boolean("profile_completed").default(false),
  
  // Additional metadata
  preferences: text("preferences"), // JSON object for user preferences
  metadata: text("metadata"), // JSON object for additional metadata
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
