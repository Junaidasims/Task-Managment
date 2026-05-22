# Complete Deployment Guide: Task Manager App

This guide will help you deploy your Task Manager application with:
- **Backend**: Node.js/Express on Render
- **Database**: MongoDB Atlas
- **Frontend**: React/Vite on Vercel

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│           (https://your-project.vercel.app)                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│         React App Built with Vite & Tailwind CSS           │
│    - Serves static files                                   │
│    - Makes API calls to Backend                           │
│    - Uses Socket.IO for real-time updates                 │
└─────────────────────────────────────────────────────────────┘
                              ↓ (API Calls + WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Render)                         │
│              Node.js/Express REST API                       │
│    - Authentication (JWT)                                 │
│    - Task Management                                      │
│    - Company Management                                   │
│    - Real-time updates via Socket.IO                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Database (MongoDB Atlas Cloud)                 │
│         - Users, Tasks, Companies collections              │
│         - Automatic backups                               │
│         - Free tier available                             │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Deployment

### Phase 1: MongoDB Setup (10 minutes)

**1.1 Create MongoDB Atlas Account**
- Visit: https://www.mongodb.com/cloud/atlas
- Sign up with email or Google account
- Create an organization (any name)

**1.2 Create a Project & Cluster**
- Click "Create a Project" → Name: "task-manager"
- Click "Build a Database"
- Select "FREE" tier (M0)
- Choose region closest to you
- Wait for cluster creation (2-3 minutes)

**1.3 Set Up Database User**
- Go to "Database Access"
- Click "Add new database user"
- Username: `taskmanager`
- Password: Create a strong password (save it!)
- Database user privileges: "Read and write to any database"

**1.4 Configure Network Access**
- Go to "Network Access"
- Click "Add IP Address"
- Select "Allow access from anywhere" (0.0.0.0/0)
- This allows your Render instance to connect

**1.5 Get Connection String**
- Click "Connect" button on cluster
- Choose "Drivers" → "Node.js"
- Copy connection string
- Replace `<password>` with your actual password
- Example: `mongodb+srv://taskmanager:your_password@cluster0.abc123.mongodb.net/taskmanager?retryWrites=true&w=majority`

---

### Phase 2: Backend Deployment to Render (15 minutes)

**2.1 Prepare Your Repository**
```bash
# Navigate to backend folder
cd backend

# Initialize git if not already done
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial backend commit for deployment"
```

**2.2 Push to GitHub**
- Create a new GitHub repository named `task-manager-api`
- In your terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/task-manager-api.git
git branch -M main
git push -u origin main
```

**2.3 Deploy on Render**
- Visit: https://render.com
- Sign up with GitHub account (grant access)
- Click "New +" → "Web Service"
- Click "Connect" on your `task-manager-api` repository
- Fill in form:
  - **Name**: task-manager-api
  - **Environment**: Node
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free

**2.4 Add Environment Variables**
- In Render dashboard, go to "Environment" section
- Add each variable:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Generate with: `openssl rand -base64 32` |
| `ALLOWED_ORIGINS` | Leave blank for now, update later |

**2.5 Deploy**
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- Check "Logs" tab for any errors
- Once live, you'll see green "Live" status
- Note your URL: `https://task-manager-api.onrender.com`

**2.6 Test Backend**
```bash
# In browser or terminal:
curl https://task-manager-api.onrender.com/

# Should return:
# {"success":true,"message":"Task Manager API is running"}
```

---

### Phase 3: Frontend Deployment to Vercel (15 minutes)

**3.1 Update Frontend Configuration**
- Open `frontend/.env.production`
- Update with your Render backend URL:
```
VITE_API_URL=https://task-manager-api.onrender.com
```

**3.2 Prepare Your Repository**
```bash
# Navigate to frontend folder
cd frontend

# Initialize git if not already done
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial frontend commit for deployment"
```

**3.3 Push to GitHub**
- Create a new GitHub repository named `task-manager-ui` or `task-manager-frontend`
- In your terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/task-manager-ui.git
git branch -M main
git push -u origin main
```

**3.4 Deploy on Vercel**
- Visit: https://vercel.com
- Sign up with GitHub account (grant access)
- Click "Add New..." → "Project"
- Select your `task-manager-ui` repository
- Framework: **Vite**
- Build settings should auto-populate:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- Click "Deploy"

**3.5 Add Environment Variables**
- After deployment, go to "Settings" → "Environment Variables"
- Add variable:
  - **Name**: `VITE_API_URL`
  - **Value**: `https://task-manager-api.onrender.com`
- Redeploy: Click "Deployments" → last build → "Redeploy"

**3.6 Get Your Frontend URL**
- After redeploy completes, you'll see your URL
- Example: `https://task-manager-ui.vercel.app`

---

### Phase 4: Final Backend Configuration (5 minutes)

**4.1 Update CORS in Render**
- Go back to Render dashboard
- Click your `task-manager-api` service
- Go to "Environment" section
- Update `ALLOWED_ORIGINS`:
```
https://YOUR_VERCEL_URL.vercel.app,http://localhost:3000
```
- Save and service will redeploy automatically

**4.2 Verify Configuration**
The backend `server.js` now reads this environment variable automatically!

---

## Testing Your Deployment

### Test 1: Backend API Health
```bash
curl https://task-manager-api.onrender.com/
# Expected: {"success":true,"message":"Task Manager API is running"}
```

### Test 2: Frontend Access
- Open: `https://your-project-name.vercel.app`
- Page should load without 404 errors

### Test 3: User Registration
- Click "Register"
- Fill in form and submit
- Check browser console (F12) for errors
- Should redirect to login after successful registration

### Test 4: MongoDB Connection
- In Render Logs, verify no connection errors
- Check MongoDB Atlas "Activity" tab shows connections

### Test 5: Real-time Features
- Open app in two browser windows
- Create a task in one window
- Should appear in real-time in other window (via Socket.IO)

---

## Troubleshooting

### Issue: "Failed to connect to MongoDB"
**Solution:**
1. Check MongoDB URI is correct in Render env vars
2. Ensure IP 0.0.0.0/0 is in MongoDB Atlas Network Access
3. Verify username/password is correct

### Issue: "CORS error in browser console"
**Solution:**
1. Check ALLOWED_ORIGINS in Render matches your exact Vercel URL
2. No trailing slashes: ✓ `https://app.vercel.app` ✗ `https://app.vercel.app/`
3. Verify protocol: ✓ `https://` (Vercel always HTTPS)

### Issue: "Socket.IO connection failed"
**Solution:**
1. Check Socket.IO CORS in backend/server.js is updated
2. Verify Vercel URL is in allowed origins
3. Socket.IO should auto-fallback from WebSocket to polling

### Issue: Render service goes to sleep after 15 minutes
**Reason:** Free tier auto-sleeps when inactive
**Solution:** 
- Upgrade to paid tier ($7/month)
- Or use a service like [kping.me](https://kping.me) to ping every 14 minutes

### Issue: "Cannot GET /" on frontend
**Solution:**
1. Build didn't succeed - check Vercel build logs
2. Check `.env.production` exists and has correct API URL
3. Redeploy from Vercel dashboard

---

## Environment Variables Reference

### Backend (.env.production in Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster...
JWT_SECRET=<generated_strong_secret>
ALLOWED_ORIGINS=https://app.vercel.app,http://localhost:3000
```

### Frontend (.env.production in Vercel)
```
VITE_API_URL=https://task-manager-api.onrender.com
```

---

## Security Best Practices

✓ **Already Implemented:**
- JWT authentication for API
- Password hashing with bcryptjs
- CORS whitelist for production

✓ **Still To Do:**
- Update JWT_SECRET in Render regularly
- Update MongoDB password periodically
- Monitor API logs for suspicious activity
- Consider SSL/TLS (automatic with Render & Vercel)

---

## Performance Tips

1. **Reduce Render Cold Starts:**
   - Upgrade to paid tier
   - Keep API warm with periodic requests

2. **Optimize Frontend:**
   - Images should be optimized
   - Consider caching strategies
   - Monitor bundle size

3. **Database:**
   - Add MongoDB indexes for frequent queries
   - Monitor Atlas storage usage

---

## Useful Resources

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/

---

## Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Deploy backend to Render
3. ✅ Deploy frontend to Vercel
4. ✅ Test all features
5. Consider custom domain setup
6. Set up error monitoring (Sentry)
7. Implement analytics

---

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Render/Vercel logs
3. Check MongoDB Atlas connection
4. Verify environment variables exactly match

Good luck with your deployment! 🚀
