# My Diaryy

A real-time study and collaboration app with chat, calls, task management, file sharing, and room-based collaboration.

## Deployment

- Frontend: `https://my-diaryyy.vercel.app`
- Backend: `https://my-diaryy.onrender.com`

> The frontend is configured to connect to the backend at `https://my-diaryy.onrender.com` by default in `frontend/src/socket.ts`.

## Features

- Real-time chat rooms powered by Socket.IO
- WebRTC-based audio/video calls
- Room-scoped task creation, editing, removal, and notifications
- Scheduled reminders using a cron job
- File upload and sharing via `/upload`
- MongoDB-backed task persistence
- CORS support for local development and deployed frontend host

## Tech Stack

- Frontend: Vite + React + TypeScript
- UI: Tailwind CSS, Radix UI, Sonner, Framer Motion
- Backend: Express, Socket.IO, MongoDB, multer, node-cron

## Repository Structure

- `backend/` - Express server, Socket.IO handlers, upload and task routes
- `frontend/` - React application, routing, UI components, socket client

## Local Setup

### Backend

1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with at least:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/dreamline
   PORT=3001
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```

### Frontend

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. The client will use the backend URL from `frontend/src/socket.ts` by default, or you can set:
   ```bash
   VITE_SOCKET_URL=https://my-diaryy.onrender.com
   ```

## Backend Config

### Environment Variables

- `MONGO_URI` - MongoDB connection string
- `PORT` - Backend server port

### CORS

Configured in `backend/config/cors.js` for:

- `http://localhost:8080`
- `http://localhost:5173`
- `https://my-diaryyy.vercel.app`

### Uploads

Uploads are stored in `backend/uploads/` and served at `/uploads`.
Allowed file types include images, PDFs, and common document formats.

## API Endpoints

- `GET /tasks/:userId` - Fetch tasks for a given user
- `POST /upload` - Upload a file; emits `file-shared` to the target room

## Socket Events

### Client to Server

- `register-user` - Register a socket with a user ID
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `chat-message` - Broadcast a chat message
- `offer`, `answer`, `ice-candidate` - WebRTC signaling
- `create-task`, `update-task`, `delete-task` - Manage tasks
- `leave-room` - Leave a room

### Server to Client

- `room-created` - New room ID returned
- `all-users` - Current room members
- `user-joined` - Notify that a new user joined
- `user-left` - Notify that a user left
- `chat-message` - Broadcast chat updates
- `new-task`, `task-updated`, `task-deleted` - Task changes
- `file-shared` - Shared file metadata

## Useful Scripts

### Backend

- `npm run dev` - Start the backend with `nodemon`
- `npm start` - Run the backend normally

### Frontend

- `npm run dev` - Start Vite dev server
- `npm run build` - Build production assets
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest

## Notes

- Default frontend backend URL is configured in `frontend/src/socket.ts`.
- If you deploy a new backend host, update that URL or use `VITE_SOCKET_URL`.
- The frontend uses React Router routes: `/`, `/login`, `/tasks`, `/chat`, `/call`.
