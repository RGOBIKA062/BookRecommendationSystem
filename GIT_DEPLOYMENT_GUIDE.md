# 🚀 Git Deployment Guide for Book Recommendation System

## ✅ What We've Completed

Your project is now properly configured for Git deployment with:

- ✅ **Secure API Key Management**: API keys are now in `.env` files (not tracked by Git)
- ✅ **Comprehensive .gitignore**: Prevents sensitive files from being committed
- ✅ **Environment Examples**: `.env.example` file for easy setup by others
- ✅ **Deployment Scripts**: Updated package.json with production-ready scripts
- ✅ **Complete Documentation**: Professional README with setup instructions
- ✅ **Clean Git History**: Committed all improvements

## 📋 Pre-Deployment Checklist

Before pushing to GitHub, verify these items:

### 1. Environment Variables ✅
- [x] API keys are in `backend/.env` (not tracked by Git)
- [x] Example file `backend/.env.example` exists for reference
- [x] Server.js uses standard `.env` file

### 2. Security ✅
- [x] `.gitignore` includes all sensitive files
- [x] No API keys in tracked files
- [x] Old `default.env` file removed

### 3. Dependencies ✅
- [x] All npm packages installed
- [x] Backend dependencies installed
- [x] Concurrently package added for development

## 🌐 Step-by-Step GitHub Deployment

### Option A: Create New Repository on GitHub

1. **Go to GitHub.com** and sign in to your account

2. **Create a New Repository**:
   - Click the "+" icon → "New repository"
   - Repository name: `BookRecommendationSystem` (or your preferred name)
   - Description: "A full-stack book recommendation system with AI chatbot"
   - Make it **Public** (or Private if you prefer)
   - ❌ **DO NOT** initialize with README (we already have one)
   - Click "Create repository"

3. **Connect Your Local Repository**:
   ```powershell
   cd "c:\Book Recommendation\book"
   
   # Add GitHub remote
   git remote add origin https://github.com/YOUR_USERNAME/BookRecommendationSystem.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```

### Option B: Push to Existing Repository

If you already have a repository:

```powershell
cd "c:\Book Recommendation\book"

# Add your existing repository URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push your changes
git push -u origin main
```

## 🔧 Setting Up for Collaborators

When someone clones your repository, they need to:

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/BookRecommendationSystem.git
cd BookRecommendationSystem
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Set Up Environment Variables
```bash
cd backend
cp .env.example .env
```

Then edit the `.env` file with their own API keys:
```env
GROQ_API_KEY=their_groq_api_key_here
OPENAI_API_KEY=their_openai_api_key_here
```

### 4. Start the Application
```bash
npm run start:dev
```

## 🚀 Deployment Platforms

### Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
1. Connect GitHub repository to Vercel
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Auto-deploy on push to main branch

#### Backend on Railway:
1. Connect GitHub repository to Railway
2. Add environment variables in Railway dashboard:
   - `PORT` = 5001
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = your secret key
   - `GROQ_API_KEY` = your Groq API key
   - `OPENAI_API_KEY` = your OpenAI API key

### Heroku (Full Stack)

#### Frontend + Backend:
1. Create Heroku app
2. Add environment variables in Heroku dashboard
3. Connect GitHub repository
4. Enable automatic deployments

### Netlify (Frontend) + Railway/Heroku (Backend)

Similar to Vercel setup but using Netlify for frontend hosting.

## 🔐 Environment Variables for Production

When deploying, set these environment variables in your hosting platform:

### Backend Environment Variables:
```env
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bookrecommendation
JWT_SECRET=your_super_secure_jwt_secret_for_production
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### Frontend Environment Variables (if needed):
```env
VITE_API_URL=https://your-backend-url.herokuapp.com/api
```

## 📝 Git Workflow for Future Changes

### Daily Development:
```powershell
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/new-feature-name

# Make your changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "feat: add new feature description"

# Push feature branch
git push origin feature/new-feature-name

# Create Pull Request on GitHub
# Merge after review
```

### Quick Fixes:
```powershell
# Make changes directly on main (for small fixes)
git add .
git commit -m "fix: description of what was fixed"
git push origin main
```

## 🛠️ Useful Git Commands

### Check Status:
```powershell
git status                    # See changed files
git log --oneline -5         # See recent commits
git diff                     # See unstaged changes
```

### Undo Changes:
```powershell
git checkout -- filename    # Undo changes to specific file
git reset --hard HEAD       # Undo all uncommitted changes
git reset HEAD~1             # Undo last commit (keep changes)
```

### Branch Management:
```powershell
git branch                   # List branches
git branch feature-name      # Create new branch
git checkout feature-name    # Switch to branch
git merge feature-name       # Merge branch to current
git branch -d feature-name   # Delete branch
```

## ⚠️ Important Security Notes

### Never Commit These Files:
- `.env` files
- `node_modules/`
- Database files
- API keys in any form
- Personal configuration files

### Safe to Commit:
- `.env.example` files
- Source code
- Configuration templates
- Documentation
- Build configurations

## 🆘 Troubleshooting

### Common Issues:

#### Git Push Rejected:
```powershell
git pull origin main --rebase
git push origin main
```

#### Forgot to Add .env to .gitignore:
```powershell
git rm --cached backend/.env
git commit -m "Remove .env from tracking"
git push origin main
```

#### API Keys Accidentally Committed:
1. **Immediately** revoke and regenerate all API keys
2. Remove sensitive data from Git history
3. Update `.env` with new keys

## ✅ Final Checklist

Before going live, ensure:

- [ ] All API keys are regenerated (if any were accidentally committed)
- [ ] Database is set up (MongoDB Atlas for production)
- [ ] Environment variables are configured on hosting platform
- [ ] DNS is configured (if using custom domain)
- [ ] SSL certificates are active
- [ ] Application is tested in production environment

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review Git documentation
3. Check hosting platform documentation
4. Create GitHub issues for project-specific problems

---

**Your project is now ready for Git deployment! 🎉**

The application will work perfectly after following this setup guide.