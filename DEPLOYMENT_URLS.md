# Deployment URLs & Credentials Reference
# Keep this file safe and update after each deployment

## MongoDB Atlas
- Project URL: https://www.mongodb.com/cloud/atlas
- Connection String: mongodb+srv://taskmanager:PASSWORD@cluster0.mongodb.net/taskmanager
- Status: [ ] Created & Connected

## Render Backend
- Dashboard: https://dashboard.render.com
- Service Name: task-manager-api
- Live URL: https://task-manager-api.onrender.com (update after first deploy)
- Status: [ ] Deployed
- Environment Variables: [ ] Configured

## Vercel Frontend
- Dashboard: https://vercel.com/dashboard
- Project Name: task-manager-ui
- Live URL: https://task-manager-ui.vercel.app (update after first deploy)
- Status: [ ] Deployed
- Environment Variables: [ ] Configured

## GitHub Repositories
- Backend Repo: https://github.com/YOUR_USERNAME/task-manager-api
- Frontend Repo: https://github.com/YOUR_USERNAME/task-manager-ui

## Quick Redeploy
To redeploy after code changes:
- Backend: `git push` (automatic redeploy on Render)
- Frontend: `git push` (automatic redeploy on Vercel)

## Emergency Checklist
If something breaks:
1. Check Render service logs: Dashboard → Your Service → Logs
2. Check Vercel build logs: Dashboard → Your Project → Deployments → Build Logs
3. Check MongoDB connection: Atlas → Database → Collections
4. Verify environment variables in both services match exactly
5. Clear browser cache and hard refresh (Ctrl+Shift+R)
