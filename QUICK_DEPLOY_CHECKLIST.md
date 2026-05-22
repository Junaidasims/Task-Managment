# Quick Deployment Checklist

## Pre-Deployment Setup (Local)

### Backend Preparation
- [ ] Generate a strong JWT secret:
  - Windows (PowerShell): `[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) })) | Set-Clipboard`
  - Or use online generator: https://generate-secret.vercel.app/
  
- [ ] Test backend locally:
  ```bash
  cd backend
  npm install
  npm run dev
  ```
  Should run on http://localhost:5000 ✓

- [ ] Update `backend/server.js` CORS with your frontend URL (after getting Vercel URL)

### Frontend Preparation
- [ ] Install dependencies:
  ```bash
  cd frontend
  npm install
  ```

- [ ] Test locally:
  ```bash
  npm run dev
  ```
  Should run on http://localhost:5173 ✓

---

## MongoDB Atlas Setup (5 min)

1. **Go to** https://www.mongodb.com/cloud/atlas
2. **Sign up/Login** with email or Google
3. **Create Organization** (skip if exists)
4. **Create Project** - name it "task-manager"
5. **Build Cluster**:
   - Choose FREE tier
   - Select region closest to you
   - Wait for cluster to be created
6. **Database Access**:
   - Add DB user with username/password
   - Write down username and password
7. **Network Access**:
   - Add IP 0.0.0.0/0 (allows all IPs - ok for free tier)
8. **Get Connection String**:
   - Click "Connect" → "Drivers" → "Node.js"
   - Copy connection string
   - Replace `<password>` with your actual password
   - Example: `mongodb+srv://user:password@cluster0.abc123.mongodb.net/taskmanager?retryWrites=true&w=majority`

---

## Backend Deployment to Render (5 min)

1. **Push to GitHub**:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/task-manager-api.git
   git branch -M main
   git push -u origin main
   ```

2. **Sign up at** https://render.com (use GitHub)

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Select your backend repo
   - Name: `task-manager-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables** (in Render Dashboard):
   ```
   NODE_ENV = production
   PORT = 10000
   MONGODB_URI = mongodb+srv://user:password@cluster0...
   JWT_SECRET = your_generated_secret_key_here
   ```

5. **Deploy** - Click deploy and wait 2-3 minutes

6. **Get Your Backend URL**:
   - After deployment, you'll see: `https://task-manager-api.onrender.com`
   - Save this URL ✓

---

## Frontend Deployment to Vercel (5 min)

### Step 1: Update Frontend Config
Update `frontend/.env.production`:
```
VITE_API_URL=https://task-manager-api.onrender.com
```

### Step 2: Push to GitHub
```bash
cd frontend
git init
git add .
git commit -m "ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/task-manager-ui.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel
1. **Go to** https://vercel.com (sign up with GitHub)
2. **Click** "Add New..." → "Project"
3. **Import** your frontend repository
4. **Framework**: Select "Vite"
5. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://task-manager-api.onrender.com`
6. **Deploy**
7. **Your frontend URL will be**: `https://your-project-name.vercel.app`

---

## Final Backend Update (2 min)

Update `backend/server.js` CORS to allow your Vercel frontend:

Replace this:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

With this:
```javascript
app.use(cors({
  origin: ['https://YOUR_VERCEL_URL.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

Also update Socket.IO CORS:
```javascript
const io = socketio(server, {
  cors: {
    origin: ['https://YOUR_VERCEL_URL.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

Then push changes:
```bash
git add .
git commit -m "update cors for production"
git push
```
Render will auto-redeploy ✓

---

## Testing (5 min)

1. **Test Backend API**:
   - Visit: `https://task-manager-api.onrender.com/`
   - Should see: `{"success":true,"message":"Task Manager API is running"}`

2. **Test Frontend**:
   - Visit your Vercel URL
   - Try registering a new account
   - Try creating a task
   - Check browser console (F12) for errors

3. **Check Connections**:
   - MongoDB: backend should connect (check Render logs)
   - Frontend to Backend: should work (test login)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Render shows "Application failed to start" | Check MongoDB connection string and ensure IP whitelist includes 0.0.0.0/0 |
| Frontend gives 404 errors for API calls | Check VITE_API_URL in Vercel env vars matches Render URL exactly |
| CORS errors in console | Update backend CORS to include your exact Vercel URL (no trailing slash) |
| Render service goes to sleep | Upgrade to paid tier or use keep-alive service |
| Socket.IO connection fails | Check Socket.IO CORS settings in backend/server.js |

---

## Useful Links
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Generate Secret: https://generate-secret.vercel.app/
