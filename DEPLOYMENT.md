# Deployment Guide - Agent Mira

Complete guide for deploying Agent Mira to Vercel with MongoDB Atlas.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- MongoDB Atlas account (free tier is sufficient)
- Git installed locally

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **"M0 FREE"** tier
5. Choose your preferred cloud provider (AWS/Google/Azure) and region
6. Name your cluster (e.g., "agent-mira-cluster")
7. Click **"Create"**

### Step 2: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `agent-mira-user`
5. Click **"Autogenerate Secure Password"** and **SAVE THIS PASSWORD**
6. Database User Privileges: Select **"Read and write to any database"**
7. Click **"Add User"**

### Step 3: Whitelist IP Addresses

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Vercel)
   - This adds `0.0.0.0/0` to the allowlist
   - **Note**: This is necessary for Vercel's dynamic IPs
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with `agent-mira-user`
7. Replace `<password>` with the password you saved
8. Add database name before the `?`:
   ```
   mongodb+srv://agent-mira-user:YOUR_PASSWORD@cluster.mongodb.net/real-estate-chatbot?retryWrites=true&w=majority
   ```

✅ **Save this complete connection string - you'll need it for Vercel!**

## Part 2: Push to GitHub

### Step 1: Initialize Git (if not already done)

```bash
cd /path/to/real-estate-chatbot-agent
git init
```

### Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `agent-mira-chatbot` (or your choice)
3. Description: "AI-powered real estate chatbot with Next-Zen UI"
4. Visibility: **Public** (for free Vercel hosting)
5. Do NOT initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Step 3: Push Code

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Agent Mira chatbot MVP"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/agent-mira-chatbot.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub!

## Part 3: Deploy to Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
   - If first time: Click **"Import Git Repository"**
   - Authorize Vercel to access your GitHub
   - Select your `agent-mira-chatbot` repository
4. Click **"Import"**

### Step 2: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./` (default)

**Build Settings**:
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### Step 3: Add Environment Variables

Click **"Environment Variables"** section:

Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://agent-mira-user:YOUR_PASSWORD@cluster.mongodb.net/real-estate-chatbot?retryWrites=true&w=majority` | Production, Preview, Development |
| `OPENAI_API_KEY` | `your-openai-key` (optional) | Production, Preview, Development |

**Important**: 
- Paste your FULL MongoDB connection string
- Select all three environments (Production, Preview, Development)
- Click **"Add"** for each variable

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for build to complete
3. Once complete, you'll see: 🎉 **Congratulations!**

### Step 5: Get Your Live URL

- Your app is live at: `https://your-project-name.vercel.app`
- Example: `https://agent-mira-chatbot.vercel.app`

✅ **Your app is now live!**

## Part 4: Verify Deployment

### Test Checklist

1. **Homepage Loads**
   - Visit your Vercel URL
   - Should see Agent Mira chat interface

2. **Chat Functionality**
   - Type: `2 BHK under $500K in Miami`
   - Should return property cards

3. **Save Functionality**
   - Click heart icon on a property
   - Should fill with red (saved)
   - Refresh page, should still be saved

4. **Database Check**
   - Go to MongoDB Atlas
   - Collections → `savedProperties`
   - Should see your saved property

### Common Issues

#### Build Fails

**Error**: `Cannot find module`
- **Solution**: Check `package.json` has all dependencies
- Run `npm install` locally first

**Error**: `Module not found: Can't resolve 'fs'`
- **Solution**: Ensure `propertyUtils.ts` uses `require()` not `fs.readFileSync()`

#### MongoDB Connection Fails

**Error**: `MongoServerError: bad auth`
- **Solution**: Double-check username and password in connection string
- Make sure password is URL-encoded (replace special characters)

**Error**: `MongoNetworkError: connection timeout`
- **Solution**: Verify IP whitelist includes `0.0.0.0/0`

#### Properties Not Showing

**Error**: Empty results
- **Solution**: Check data files exist in `/data` folder
- Verify `require()` paths are correct

## Part 5: Continuous Deployment

### Automatic Deployments

Every time you push to GitHub, Vercel automatically redeploys:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main
```

- Vercel detects the push
- Builds and deploys automatically
- Live in ~2 minutes

### Preview Deployments

For pull requests:

```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "Add feature"
git push origin feature/new-feature
```

- Create PR on GitHub
- Vercel creates preview URL
- Test before merging to main

## Part 6: Custom Domain (Optional)

### Add Your Domain

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your domain (e.g., `agentmira.com`)
4. Follow DNS configuration instructions
5. Vercel provides automatic HTTPS

## Part 7: Monitoring

### Vercel Analytics

1. In Vercel dashboard, go to your project
2. Analytics tab
3. See real-time traffic, performance

### MongoDB Monitoring

1. In MongoDB Atlas, go to your cluster
2. Metrics tab
3. Monitor:
   - Connections
   - Operations per second
   - Storage usage

## Environment Variables Reference

### Required

- `MONGODB_URI`: Full MongoDB Atlas connection string

### Optional

- `OPENAI_API_KEY`: For enhanced NLP (future feature)

### Example .env.local (for local development)

```env
MONGODB_URI=mongodb+srv://agent-mira-user:YOUR_PASSWORD@cluster.mongodb.net/real-estate-chatbot?retryWrites=true&w=majority
OPENAI_API_KEY=sk-your-key-here
```

## Rollback Strategy

### Revert to Previous Deployment

1. Go to Vercel dashboard
2. Deployments tab
3. Find previous successful deployment
4. Click **"..."** → **"Promote to Production"**

### From Command Line

```bash
vercel rollback
```

## Production Checklist

Before announcing your app:

- [ ] MongoDB Atlas cluster is running
- [ ] Environment variables are set in Vercel
- [ ] Test all chat queries
- [ ] Test save/unsave functionality
- [ ] Check mobile responsiveness
- [ ] Verify HTTPS is active
- [ ] Test from different browsers
- [ ] Check MongoDB Atlas has data
- [ ] Set up monitoring alerts (optional)

## Cost Estimate

### Current Setup (MVP)

- **Vercel**: Free tier
  - Unlimited bandwidth (Fair Use)
  - 100 GB-Hours compute
  - Automatic HTTPS

- **MongoDB Atlas**: Free tier (M0)
  - 512 MB storage
  - Shared RAM
  - Good for ~1,000 active users

### When to Upgrade

**Vercel Pro** ($20/month):
- When you exceed 100 GB-Hours
- Need advanced analytics
- Team collaboration

**MongoDB M10** (~$57/month):
- When storage exceeds 512 MB
- Need more than 500 concurrent connections
- Require backups

## Support & Troubleshooting

### Vercel Support
- Docs: [vercel.com/docs](https://vercel.com/docs)
- Discord: [vercel.com/discord](https://vercel.com/discord)

### MongoDB Support
- Docs: [docs.mongodb.com](https://docs.mongodb.com)
- Community: [mongodb.com/community](https://www.mongodb.com/community)

### GitHub Issues
- Create issue in your repository
- Share error logs from Vercel build

---

## 🎉 Congratulations!

Your Agent Mira chatbot is now live and production-ready!

**Share your URL**: `https://your-project.vercel.app`

**Next Steps**:
1. Test with real users
2. Gather feedback
3. Iterate on features
4. Share on social media 🚀

---

**Deployed successfully?** Add your live URL to README.md and share with the hackathon judges!
