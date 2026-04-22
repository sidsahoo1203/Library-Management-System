# Deployment Guide & Checklist 🚀

This document is for taking this project live to the internet using standard cloud platforms like **Render** (for the backend), **Vercel** (for the frontend), and **MongoDB Atlas** (for the database).

## ☑️ Deployment Checklist

- [ ] **Database Configuration**
  - Created a cluster on MongoDB Atlas.
  - Whitelisted IP ranges (e.g. `0.0.0.0/0` for universal cloud access).
  - Obtained the production connection string.
- [ ] **Backend (Node/Express) Setup**
  - Configured `process.env.PORT` to connect to cloud runner.
  - Set CORS origins to accept production frontend domain exclusively.
  - Tested running `npm start` natively.
- [ ] **Frontend (React/Vite) Setup**
  - Environment variables set pointing Axios `baseURL` to the live backend.
  - Tested production build functionality (`npm run build`).

---

## 🖥️ Command Reference

If you are using a standard Virtual Private Server (VPS) or container system, run these sequentially.

### 1. Database Start (If hosted locally, else skip for Atlas)
```bash
mongod --dbpath /var/lib/mongo
```

### 2. Backend Initialization (Production)
```bash
cd server
npm ci 
export NODE_ENV=production
export MONGODB_URI="mongodb+srv://<user>:<pwd>@cluster0.z7rbyml.mongodb.net/?retryWrites=true&w=majority"
export JWT_SECRET="your_highly_secure_randomly_generated_string"
export CLIENT_URL="https://your-frontend-domain.vercel.app"
npm start
```
*(Verify health with: `curl http://localhost:5000/health`)*

### 3. Frontend Build (Production)
```bash
cd client
npm ci
export VITE_API_BASE_URL="https://your-backend-domain.render.com"
npm run build
```
*(Upload the resulting `/dist` folder to your CDN or web server like Nginx/Netlify).*

---

## 📸 Presentation Visuals Checklist (For Professor)

*These are key frames of the application you should screenshot and include in your slide deck during your final presentation:*

1. **[SCREENSHOT] The Dual Login Interface:** Shows the tabbed security separation between Student and Admin.
2. **[SCREENSHOT] Super-Admin Analytics Dashboard:** Shows the dynamic Recharts pie graph representing real library data distribution.
3. **[SCREENSHOT] The Interactive Catalog Filter:** Demonstrates React state dynamically eliminating unavailable books based on a search regex.
4. **[SCREENSHOT] Student Pending Request Pipeline:** Shows the "My Books" student page indicating a "Pending" record.
5. **[SCREENSHOT] Admin Desk Approvals:** Demonstrates how the Admin converts the pending `issue._id` to an active transaction with automatically injected Due Dates over the API.
