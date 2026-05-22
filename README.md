# 🚀 Real-Time Full-Stack Task Management Web Application

A premium, secure, and real-time Task Management application featuring a high-end **dark glassmorphic design system**. The application is built with a Node.js/Express backend, MongoDB, Socket.IO for instant state synchronization, and a Vite-powered React frontend styled with Tailwind CSS v4 and dynamic micro-animations.

---

## ⚡ Tech Stack & Highlights

*   **Backend Core**: Node.js, Express, RESTful APIs, JWT Authorization.
*   **Database**: MongoDB + Mongoose Schemas (with robust format validation and auto-encryption hooks).
*   **Real-time Layer**: Socket.IO WebSockets for instantaneous multi-client synchronizations and visual Toast alerts.
*   **Frontend Framework**: React 19 + Vite 8.
*   **Styling & Micro-animations**: Tailwind CSS v4, Lucide React icons, and tailored glassmorphic styling tokens (blur panels, interactive hover cards, glowing badges, and smooth state transitions).
*   **SEO Compliance**: Programmed descriptive heading tags, custom page titles, descriptive meta headers, and optimized typography using Google Fonts (`Inter`).

---

## 📂 Project Structure

```text
Task/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose connection config
│   ├── middleware/
│   │   └── auth.js          # JWT protection & role auth middleware
│   ├── models/
│   │   ├── User.js          # User schema (bcrypt pre-save hook, match method)
│   │   └── Task.js          # Task schema (createdBy & assignedTo relationships)
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints (Register, Login, Profile checks, User lists)
│   │   └── tasks.js         # Secure CRUD task endpoints with Socket.IO event triggers
│   ├── .env                 # Environment variables config
│   ├── package.json         # Backend node packages
│   └── server.js            # Application entry script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx   # Route wrapper securing active sessions
│   │   │   ├── Navbar.jsx         # Header rendering name, roles, and logout exits
│   │   │   ├── TaskCard.jsx       # Custom card handling overdue alerts and permission checks
│   │   │   └── TaskFormModal.jsx  # Double-duty task creator/editor form modal
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Secure login form with full status indicators
│   │   │   ├── Register.jsx       # Elegant signup form with candidate role selection
│   │   │   └── Dashboard.jsx      # Multi-column grid panel with real-time socket Toast handlers
│   │   ├── App.jsx                # Router configuration & redirects
│   │   ├── index.css              # Glassmorphic custom theme setups
│   │   └── main.jsx               # Entry bootstrap hook
│   ├── index.html                 # Index file with Inter font and metadata configuration
│   ├── package.json               # Frontend dependencies list
│   └── vite.config.js             # Vite configuration with Tailwind CSS v4 support
└── README.md
```

---

## 🛠️ Quick Start Guide

Both servers have been pre-started and verified by the development agent. If you need to start them manually at a later stage, follow these instructions:

### 1. Requirements
*   Ensure **Node.js** (v18+) is installed.
*   Ensure **MongoDB** service is active locally or specify a connection URL (such as MongoDB Atlas) in your `backend/.env` file.

### 2. Run the Backend
```bash
cd backend
npm install        # If dependencies aren't yet installed
npm run dev        # Runs nodemon server on port 5000
```
Configure your backend environment variables in `backend/.env` with the following keys:
```env
PORT=<your_port>
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
NODE_ENV=<environment>
```

### 3. Run the Frontend
```bash
cd frontend
npm install        # If dependencies aren't yet installed
npm run dev        # Fires Vite dev server on http://localhost:5173/
```


