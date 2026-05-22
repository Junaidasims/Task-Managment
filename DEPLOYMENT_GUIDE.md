# Render Deployment Guide

## Overview
This guide explains how to deploy your Task Manager application to Render with both backend and frontend services.

## Prerequisites
- Render account (https://render.com)
- GitHub repository with your code
- MongoDB Atlas database (already set up)
- Your environment variables ready

## Environment Variables Checklist

### Backend Requirements
The backend needs **all of these** environment variables:
- ✅ `PORT` - Server port (usually 5000)
- ✅ `MONGODB_URI` - MongoDB Atlas connection string
- ✅ `JWT_SECRET` - Strong random secret for JWT signing
- ✅ `NODE_ENV` - Should be `production`
- ✅ `ALLOWED_ORIGINS` - Your frontend URL (e.g., `https://your-frontend.onrender.com`)
- ✅ `CREATOR_SECRET` - Secret for registering creator accounts (optional but recommended)

### Frontend Requirements
The frontend needs **this** environment variable:
- ✅ `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.onrender.com`)

## Issue You Were Facing
**Problem**: Frontend was hardcoding `http://localhost:5000` instead of using the environment variable.

**Solution**: ✅ Fixed! All pages now use the configured API endpoint from `src/api/config.js`

## Step-by-Step Deployment

### Step 1: Deploy Backend to Render

1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `task-manager-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js` (or `npm start` if configured in backend/package.json)
   - **Root Directory**: `backend`
5. Add Environment Variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://jun_db_user:HXliMfy4R3HoLxZ1@cluster00.fyc5dz6.mongodb.net/?appName=Cluster00
   JWT_SECRET=sk_prod_7x9mK2pL8nQ5vR3wS6tU1bY4aZ9cD2eF5gH8jK1mN4oP7qR0sT3uV6xW9yZ2aB5cD8eF1gH4jK7mN0oP3qR6sT
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   CREATOR_SECRET=your-secure-creator-secret
   ```
6. Click **Create Web Service**
7. Wait for deployment to complete
8. Copy your backend URL (e.g., `https://task-manager-backend.onrender.com`)

### Step 2: Update ALLOWED_ORIGINS

After the backend is deployed, go back and update `ALLOWED_ORIGINS` with your actual frontend URL.

### Step 3: Deploy Frontend to Render

1. Go to https://render.com/dashboard
2. Click **New +** → **Static Site** (or Web Service if you prefer)
3. Connect your GitHub repository
4. Configure:
   - **Name**: `task-manager-frontend` (or any name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://task-manager-backend.onrender.com
   ```
   (Replace with your actual backend URL)
6. Click **Create Static Site**
7. Wait for deployment to complete
8. You'll get a frontend URL (e.g., `https://task-manager-frontend.onrender.com`)

### Step 4: Update Backend ALLOWED_ORIGINS

Go back to your backend service on Render and update the environment variable:
```
ALLOWED_ORIGINS=https://task-manager-frontend.onrender.com
```

This ensures CORS allows requests from your frontend.

## Testing Your Deployment

1. Visit your frontend URL: `https://task-manager-frontend.onrender.com`
2. Try to register or login
3. Check browser console for any errors (F12)
4. If you see "Could not connect to registration server", verify:
   - Backend service is running on Render
   - `VITE_API_URL` environment variable is set correctly on frontend
   - `ALLOWED_ORIGINS` includes your frontend URL on backend

## Troubleshooting

### Error: "Could not connect to the registration server"
- Check that `VITE_API_URL` is set in frontend environment variables
- Verify the URL matches your actual backend service URL
- Check backend logs on Render (Render Dashboard → Your Backend Service → Logs)

### Error: "CORS error" or cross-origin issues
- Update `ALLOWED_ORIGINS` on backend to include your frontend URL
- Frontend URL should be like `https://your-frontend.onrender.com`
- Use comma-separated values for multiple origins (no spaces)

### Database connection fails
- Verify `MONGODB_URI` is correct in backend environment variables
- Check MongoDB Atlas firewall rules (should allow all IPs: 0.0.0.0/0)
- Test the connection string locally first

### Socket.IO connection issues
- Socket.IO now uses `API_BASE_URL` from frontend config
- Ensure backend and frontend URLs are properly configured
- Check browser console for WebSocket connection errors

## Files Modified for Render Deployment

✅ `frontend/src/pages/Register.jsx` - Uses configured API
✅ `frontend/src/pages/Login.jsx` - Uses configured API
✅ `frontend/src/pages/RegisterCompany.jsx` - Uses configured API
✅ `frontend/src/pages/RegisterCreator.jsx` - Uses configured API
✅ `frontend/src/pages/CompanyList.jsx` - Uses configured API
✅ `frontend/src/pages/Dashboard.jsx` - Uses configured API & Socket.IO
✅ `frontend/src/pages/WorkspaceSettings.jsx` - Uses configured API & Socket.IO
✅ `frontend/.env.example` - Created with setup instructions
✅ `backend/.env.example` - Created with setup instructions

## Next Steps

1. Create a `.env` file in the frontend directory with your backend URL
2. Ensure both services are deployed and running
3. Update CORS and VITE_API_URL with correct URLs
4. Test the full registration and login flow
