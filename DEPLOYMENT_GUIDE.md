# Deployment Guide: Render + MongoDB + Vercel

## Part 1: Backend Deployment to Render with MongoDB

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project
4. Create a new cluster (free tier available)
5. Set up database access with a username/password
6. Get your connection string (will look like: `mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority`)

### Step 2: Push Backend to GitHub
1. Initialize git in your backend folder:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a GitHub repository
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/task-manager-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy Backend to Render
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository (select the backend folder)
5. Fill in the service details:
   - **Name**: task-manager-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to you

### Step 4: Add Environment Variables in Render
In the Render dashboard, go to Environment:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `MONGODB_URI`: `mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority`
- `JWT_SECRET`: Generate a strong secret (use: `openssl rand -base64 32`)

### Step 5: Update CORS in Backend
Update your server.js CORS configuration:
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

---

## Part 2: Frontend Deployment to Vercel

### Step 1: Update Frontend API Configuration
1. Update your frontend to use environment variables for the API URL
2. Create a `frontend/.env.local` for development:
   ```
   VITE_API_URL=http://localhost:5000
   ```

3. Create `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   ```

4. Update your API calls in your React components:
   ```javascript
   // Example in your API file (e.g., frontend/src/api/config.js)
   export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

### Step 2: Push Frontend to GitHub
1. Initialize git in your frontend folder:
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a GitHub repository for frontend
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/task-manager-frontend.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your frontend GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or just leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 4: Add Environment Variables in Vercel
In Vercel dashboard environment variables:
- `VITE_API_URL`: `https://your-render-url.onrender.com`

### Step 5: Deploy
- Click "Deploy"
- Vercel will automatically build and deploy

---

## Part 3: Socket.IO Configuration for Production

Update your Socket.IO configuration in `backend/server.js`:

```javascript
const io = socketio(server, {
  cors: {
    origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## Testing Your Deployment

1. **Backend**: Visit `https://your-render-url.onrender.com/` - should see JSON response
2. **Frontend**: Visit your Vercel URL - should load and connect to backend
3. **Check Console**: Open browser dev tools and check for CORS errors
4. **API Calls**: Test login/register to ensure backend connection works

---

## Troubleshooting

### Cold Start Issues on Render
- Free tier services sleep after 15 minutes of inactivity
- Consider upgrading to paid tier for production

### CORS Errors
- Ensure Render and Vercel URLs are whitelisted in CORS configuration
- Check environment variables are set correctly

### MongoDB Connection Errors
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for all IPs)
- Test connection locally first

### Socket.IO Connection Failed
- Check that Socket.IO CORS origins match your frontend URL
- Verify firewall allows WebSocket connections

---

## Next Steps
1. Update your backend `.env` with MongoDB Atlas URI and a strong JWT_SECRET
2. Deploy to Render
3. Get your Render URL
4. Update frontend `.env.production` with Render URL
5. Deploy to Vercel
