# ScholarForge

## Overview

ScholarForge is a research collaboration platform where scholars create and manage research projects. Built as a pnpm monorepo with React + Express + PostgreSQL.

## Architecture

- **Frontend**: `artifacts/scholar-forge` — React + Vite + Tailwind CSS + wouter routing
- **Backend**: `artifacts/api-server` — Express 5 + JWT auth + Drizzle ORM + Socket.io
- **Database**: `lib/db` — PostgreSQL with Drizzle schema
- **Object Storage**: Replit App Storage (GCS-backed) for image uploads
- **Shared**: `lib/api-client-react` — shared fetch utilities

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, recharts, wouter, Framer Motion, socket.io-client, canvas-confetti
- **Backend**: Express 5, JWT, Drizzle ORM, Socket.io
- **Database**: PostgreSQL via Drizzle ORM
- **Build**: esbuild (API server)

## Key Features

- Auth: JWT in localStorage (`scholarforge_token`), first user auto-ADMIN
- **30-minute inactivity logout** — tracks mousemove/keydown/click/scroll events
- Projects: create/manage with visibility, status, keywords, abstract
- Team members: roles (LEAD/CO_LEAD/CONTRIBUTOR/VIEWER), invitations
- Tasks: Kanban board (TODO/IN_PROGRESS/DONE), priority, assignees
- Milestones: due dates, completion tracking
- Files: upload/download per project
- **Real-time Chat**: Socket.io with typing indicators, online status
- **Message Reactions**: emoji reactions on messages (6 quick emojis)
- **Image uploads in chat**: file picker → GCS presigned URL → stored in messages
- Activity logs: per-project timeline
- Admin panel: user management, analytics, project oversight
- Analytics: dashboard stats, charts with recharts
- **Scholar Directory**: `/scholars` — browse all users with online status indicators
- **Notification Bell**: in-app bell icon with unread count, mark-read, mark-all-read
- **Framer Motion**: page transitions, card animations, message entry animations
- **Confetti**: fires when a project status is changed to COMPLETED
- **Dark/Light Mode**: ThemeProvider toggle in header

## Socket.io Events

- `join-project` / `leave-project` — room management
- `typing-start` / `typing-stop` — typing indicators
- `send-message` — real-time message delivery with optional imageUrl
- `add-reaction` — toggle emoji reaction on a message
- `user-online` / `user-offline` — presence broadcasting
- `new-message` — broadcast new message to project room
- `reaction-updated` — broadcast reaction changes
- `notification:{userId}` — per-user notification delivery

## API Endpoints

- Auth: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/me`
- Projects: `/api/projects` (CRUD), `/api/projects/:id`
- Members: `/api/projects/:id/members`, invitations
- Tasks: `/api/projects/:id/tasks`
- Milestones: `/api/projects/:id/milestones`
- Files: `/api/projects/:id/files`
- Messages: `/api/projects/:id/messages`
- Activity: `/api/projects/:id/activity`
- Analytics: `/api/analytics/overview`, `/api/analytics/dashboard`
- Admin: `/api/admin/users`, `/api/admin/projects`
- **Notifications**: `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/:id/read`, `/api/notifications/read-all`
- **Storage**: `/api/storage/uploads/request-url`, `/api/storage/objects/*`
- **Directory**: `/api/users/directory`

## Database Schema

### New fields (added via migration):
- `users.is_online` (boolean) — real-time presence
- `users.last_active` (timestamp) — last activity time
- `projects.cover_image` (text) — optional cover image URL
- `chat_messages.image_url` (text) — optional image attachment
- `chat_messages.reactions` (text/JSON) — emoji reactions map `{emoji: [userId, ...]}`
- New table: `notifications` (id, userId, type, title, body, link, read, createdAt)

## Demo Credentials

- Admin: `admin@scholarforge.io` / `password123`
- Researcher: `marcus@scholarforge.io` / `password123`
- Researcher: `aisha@scholarforge.io` / `password123`

## Project Status Enum Values

- `DRAFT`, `ONGOING`, `COMPLETED`, `SEEKING_COLLABORATORS`

## Visibility Enum Values

- `PUBLIC`, `PRIVATE`, `INVITE_ONLY`

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/scholar-forge run dev` — run frontend
- `pnpm --filter @workspace/db run push` — push DB schema changes

## Source

Imported from: https://github.com/Cyberverse-cent0/Schoolars-work-bench.git
