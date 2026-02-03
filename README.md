# TESBINN_LMS
TESBINN LMS
An end-to-end Learning Management System (LMS) for TESBINN built with a Node.js/Express/MongoDB backend and a React + Vite + TailwindCSS frontend. It supports three roles: Student, Teacher, and Admin, with JWT-based authentication and role-based access control.

Features
Authentication
Register, Login, JWT auth, password reset flow
Role-based access: student, teacher, admin
Teacher accounts require admin approval
Students
Browse approved/published courses
View course details and modules/lessons
Enroll and track progress in the Student Dashboard
Teachers
Create and manage own courses (draft/pending/published)
Build modules and lessons within courses
Track enrollments and ratings (UI)
Admins
Approve teacher accounts
Approve/publish submitted courses
View recent users and pending items in the Admin Dashboard
Tech Stack
Backend: Node.js, Express.js, MongoDB, Mongoose, JWT
Frontend: React, Vite, TypeScript, TailwindCSS
UI: shadcn/ui components, lucide-react icons
Tooling: Axios, React Router v6, React Query (installed)
Project Structure
tesbinn-lms/
├─ backend/                 # Express API (CommonJS)
│  ├─ controllers/          # Route handlers
│  ├─ middleware/           # Auth, error handling, async wrapper
│  ├─ models/               # Mongoose schemas (User, Course, Enrollment)
│  ├─ routes/               # API routes (auth, users, courses, modules, lessons, enrollments)
│  ├─ utils/                # Helpers (email, errors)
│  ├─ server.js             # App entry
│  └─ .env                  # Backend environment variables (local)
└─ frontend/                # React app (Vite)
   ├─ src/
   │  ├─ lib/               # api client, types, auth storage
   │  ├─ pages/             # route pages (student/teacher/admin)
   │  ├─ components/        # UI and layout components
   │  └─ App.tsx            # routes
   └─ .env                  # Frontend env (optional)
Getting Started
Prerequisites:

Node.js 18+
MongoDB instance (local or remote)
1) Backend setup
Create backend/.env:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tesbinn_lms
JWT_SECRET=supersecretjwt
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
ADMIN_EMAIL=admin@tesbinn.com
Install and run:
cd backend
npm install
npm start
API base: http://localhost:5000/api/v1

2) Frontend setup
By default, the Vite dev proxy forwards “/api” to the backend to avoid CORS.

Install and run:
cd frontend
npm install
npm run dev
Optional frontend/.env:
# If not using the Vite dev proxy, set API directly
VITE_API_URL=http://localhost:5000/api/v1
App: http://localhost:5173

Authentication & Roles
JWT is returned on login/registration. The frontend stores:
tesbinn_token (JWT)
tesbinn_role (admin | teacher | student)
Backend guards routes with protect and authorize(...).
Teachers start as status: pending until admin approves.
Creating an Admin User (for development)
Option A: Register as admin (if allowed), then log in.
Option B: Promote a user in MongoDB:
Set role: "admin" and status: "active" in users collection.
Example (mongo shell):
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "admin", status: "active" } }
)
Key API Endpoints
Auth

POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/me (auth)
Users (admin)

GET /api/v1/users?role=teacher&status=pending
GET /api/v1/users
PUT /api/v1/users/:id/approve-teacher
Courses

GET /api/v1/courses (public: approved+published)
GET /api/v1/courses/:id (public if approved+published; otherwise owner/admin)
POST /api/v1/courses (teacher/admin)
GET /api/v1/courses/me (teacher/admin – own courses incl. drafts/pending)
GET /api/v1/courses/pending (admin – unapproved)
PUT /api/v1/courses/:id/approve (admin)
Enrollments (student)

POST /api/v1/enrollments/:courseId
GET /api/v1/enrollments/me
PUT /api/v1/enrollments/:courseId/progress
Modules & Lessons (teacher/admin)

Manage modules via /api/v1/modules
Manage lessons via /api/v1/lessons
Development Scripts
Backend

npm start — start server
Frontend

npm run dev — start Vite dev server
npm run build — production build
npm run preview — preview build locally
Troubleshooting
401 errors: ensure your user status is active and token is valid.
Teachers can’t create courses until approved by an admin.
If API calls fail in the frontend during dev, confirm Vite proxy or set VITE_API_URL.
Notes
In production, do not allow self-registration of admins.
Use a strong JWT_SECRET in production.
File uploads for course materials are planned.# TESBINN-LMS
# TESBINN-LMS
# TESBINN-LMS-S3
# TESBINN-LMS-S3
# TESBINN-LMS-S3
# TESBINN-LMS-TeleBirr
