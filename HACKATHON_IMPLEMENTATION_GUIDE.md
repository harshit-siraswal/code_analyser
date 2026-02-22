# HACKATHON IMPLEMENTATION GUIDE
## Deep Analysis Coding Practice Platform

**Timeline:** 48-72 hours (Hackathon Sprint)  
**Budget:** $0 (Zero-cost deployment)  
**Developer:** Solo or 2-3 person team  
**AI-Assisted Development:** Yes (90% AI-generated code)

---

## OVERVIEW

This guide provides a streamlined implementation path for building the Deep Analysis Coding Platform during a hackathon. We'll use AI to generate most of the code, focusing on rapid deployment and core functionality demonstration.

### What We'll Build (Hackathon MVP)

✅ **User Authentication** (JWT-based)  
✅ **5-10 Curated Problems** (Python only)  
✅ **Code Editor** (Monaco Editor integration)  
✅ **Code Execution** (Judge0 integration)  
✅ **Basic Analysis Engine** (AST parsing + error classification)  
✅ **Analysis Display** (Summary + timeline)  
✅ **Simple Dashboard** (problems solved, recent activity)

🚫 **Not in Hackathon Scope:**  
- ML-powered analysis  
- Multi-language support (only Python)  
- Advanced recommendations engine  
- Social features  
- Complex progress tracking

---

## PHASE 0: PREREQUISITES (1 hour)

### Required Accounts (All Free)

1. **GitHub Account** - Version control & deployment trigger
2. **Vercel Account** - Frontend hosting (sign up with GitHub)
3. **Railway Account** OR **Render Account** - Backend hosting
4. **Neon Account** - PostgreSQL database
5. **Oracle Cloud Free Tier** - Judge0 hosting (optional for hackathon - can use Judge0 demo API)

### Local Development Setup

```bash
# Install Node.js 20 LTS
# Download from: https://nodejs.org/

# Install Python 3.11+
# Download from: https://www.python.org/

# Install Git
# Download from: https://git-scm.com/

# Verify installations
node --version  # Should be v20.x
python --version  # Should be 3.11+
git --version
```

### Directory Structure

```bash
mkdir coding-analysis-platform
cd coding-analysis-platform

# Create subdirectories
mkdir frontend backend analysis-service database
```

---

## PHASE 1: DATABASE SETUP (30 minutes)

### Step 1.1: Create Neon Database

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project: "coding-platform-db"
4. Copy connection string (looks like: `postgresql://user:pass@ep-xxx.neon.tech/neondb`)

### Step 1.2: Design Database Schema

**AI PROMPT 1 - Database Schema:**

```
Create a Prisma schema for a coding practice platform with the following requirements:

DATABASE TABLES:
1. User: id, email, passwordHash, username, createdAt, emailVerified
2. Problem: id, title, slug, description, difficulty (Easy/Medium/Hard), starterCodePython, constraints, examples (JSON), createdAt
3. TestCase: id, problemId, input, expectedOutput, isHidden, orderIndex
4. Attempt: id, userId, problemId, code, language, submittedAt, status, errorType, runtimeMs, memoryKb, sessionId
5. AttemptResult: id, attemptId, testCaseId, passed, actualOutput, errorMessage
6. Analysis: id, userId, problemId, sessionId, summary, conceptBreakdown (JSON), attemptTimeline (JSON), recommendations (String array), timeComplexity, createdAt
7. UserProgress: id, userId, problemsSolved, problemsAttempted, conceptMastery (JSON), lastActiveAt

RELATIONSHIPS:
- User → Attempt (one-to-many)
- User → Analysis (one-to-many)
- Problem → TestCase (one-to-many)
- Problem → Attempt (one-to-many)
- Attempt → AttemptResult (one-to-many)

Use PostgreSQL. Include proper indexes on userId, problemId, sessionId.
Output the complete schema.prisma file.
```

Save the AI response as `backend/prisma/schema.prisma`

### Step 1.3: Seed Database with Problems

**AI PROMPT 2 - Seed Data:**

```
Create a Prisma seed script that adds 5 beginner-friendly Python coding problems to the database.

REQUIREMENTS:
- Each problem should have: title, slug, description, difficulty, starter code, constraints, 2-3 examples
- Include 5-8 test cases per problem (mix of basic and edge cases)
- Problems should cover: strings, arrays, loops, conditionals, basic recursion
- Examples: Two Sum, Reverse String, FizzBuzz, Valid Palindrome, Fibonacci

Output the complete seed.ts file using Prisma Client.
```

Save as `backend/prisma/seed.ts`

### Step 1.4: Apply Schema

```bash
cd backend
npm init -y
npm install prisma @prisma/client

# Create .env file
echo "DATABASE_URL=your_neon_connection_string" > .env

# Initialize Prisma and migrate
npx prisma migrate dev --name init
npx prisma db seed
```

---

## PHASE 2: BACKEND API (3 hours)

### Step 2.1: Project Setup

```bash
cd backend
npm install express cors helmet express-rate-limit jsonwebtoken bcrypt dotenv
npm install --save-dev @types/node @types/express typescript ts-node
```

### Step 2.2: Generate Backend Code with AI

**AI PROMPT 3 - Backend Structure:**

```
Create a Node.js Express backend for a coding practice platform with the following:

FOLDER STRUCTURE:
backend/
├── src/
│   ├── server.ts (main entry point)
│   ├── middleware/
│   │   ├── auth.ts (JWT verification middleware)
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts (register, login)
│   │   ├── problem.routes.ts (list problems, get problem details)
│   │   ├── submission.routes.ts (submit code, get results)
│   │   └── analysis.routes.ts (request analysis, get analysis)
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── problemController.ts
│   │   ├── submissionController.ts
│   │   └── analysisController.ts
│   └── services/
│       ├── judge0Service.ts (interact with Judge0 API)
│       └── analysisService.ts (call Python analysis service)

REQUIREMENTS:
- TypeScript
- JWT authentication with 24-hour expiry
- bcrypt password hashing (12 rounds)
- Rate limiting: 10 submissions/minute
- CORS enabled for frontend origin
- Environment variables for: PORT, DATABASE_URL, JWT_SECRET, JUDGE0_URL, ANALYSIS_SERVICE_URL
- Error handling middleware
- Input validation on all routes

Implement:
1. POST /api/auth/register - create new user
2. POST /api/auth/login - return JWT token
3. GET /api/problems - list all problems (public)
4. GET /api/problems/:slug - get problem details (public)
5. POST /api/submit - submit code (protected, requires auth)
6. GET /api/attempts/:sessionId - get all attempts for a session (protected)
7. POST /api/analysis - generate analysis (protected)
8. GET /api/analysis/:sessionId - get analysis (protected)

For Judge0 integration:
- POST to Judge0: {source_code, language_id: 71 (Python), stdin, expected_output}
- Poll for result using submission token
- Store attempt with results in database

Output all files with complete implementation.
```

### Step 2.3: Judge0 Integration Options

**Option A: Use Judge0 Demo API (Fastest for Hackathon)**
```javascript
// In .env
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key  // Get from https://rapidapi.com/judge0-official/api/judge0-ce
```

**Option B: Self-host on Oracle Cloud (Production-ready)**
See "APPENDIX A: Judge0 Self-Hosting" at the end of this document.

### Step 2.4: Start Backend

```bash
# Create .env
cat > .env << EOF
PORT=5000
DATABASE_URL=your_neon_connection_string
JWT_SECRET=$(openssl rand -hex 32)
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key
ANALYSIS_SERVICE_URL=http://localhost:8000
EOF

# Run server
npm run dev
```

---

## PHASE 3: ANALYSIS SERVICE (2 hours)

### Step 3.1: Python Service Setup

```bash
cd analysis-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn radon
```

### Step 3.2: Generate Analysis Code

**AI PROMPT 4 - Analysis Service:**

```
Create a Python FastAPI microservice that analyzes coding attempts.

FILE STRUCTURE:
analysis-service/
├── main.py (FastAPI app)
├── analyzers/
│   ├── ast_analyzer.py (parse Python code with AST)
│   ├── diff_analyzer.py (compute code diffs)
│   ├── error_classifier.py (classify error types)
│   └── concept_detector.py (detect concepts used)
└── models.py (Pydantic models)

ENDPOINT:
POST /analyze
Request body: {
  "attempts": [
    {
      "id": 1,
      "code": "def solution()...",
      "status": "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded",
      "errorType": "SyntaxError" | "RuntimeError" | "LogicError" | null,
      "submittedAt": "2025-02-09T10:00:00Z",
      "testCaseResults": [{"passed": true, "input": "...", "output": "..."}]
    }
  ],
  "problem": {
    "title": "Two Sum",
    "difficulty": "Easy",
    "concepts": ["arrays", "hash-tables"]
  }
}

Response: {
  "summary": "You understood arrays correctly but struggled with edge cases...",
  "conceptBreakdown": {
    "loops": {"understanding": "strong", "timeSpent": 120, "corrections": 0},
    "edgeCases": {"understanding": "weak", "timeSpent": 300, "corrections": 2}
  },
  "attemptTimeline": [
    {"attemptNumber": 1, "timestamp": "...", "error": "SyntaxError", "changesMade": "Added colon after for loop"}
  ],
  "recommendations": ["Practice edge case handling", "Review Python syntax"],
  "timeComplexity": "O(n^2)"
}

ANALYSIS LOGIC:
1. AST Parsing: Count loops, conditionals, recursion, list operations
2. Diff Analysis: Use difflib to show line-by-line changes between attempts
3. Error Classification: Map Judge0 status codes to error types
4. Concept Detection: Pattern match AST nodes to concepts (For/While = loops, If = conditionals, etc.)
5. Time Complexity: Heuristic based on nested loops (1 loop = O(n), 2 nested = O(n^2), recursion = check for halving pattern)
6. Summary Generation: Template-based natural language summary

Output complete implementation with all files.
```

### Step 3.3: Start Analysis Service

```bash
uvicorn main:app --reload --port 8000
```

---

## PHASE 4: FRONTEND (4 hours)

### Step 4.1: Setup React App

```bash
cd frontend
npx create-react-app . --template typescript
npm install react-router-dom axios @monaco-editor/react zustand react-query tailwindcss
npx tailwindcss init
```

### Step 4.2: Configure TailwindCSS

**AI PROMPT 5 - Tailwind Config:**

```
Create a tailwind.config.js for a coding platform with:
- Custom colors: primary (blue), secondary (green), error (red), warning (orange)
- Dark mode support
- Custom fonts: 'Inter' for UI, 'JetBrains Mono' for code
```

### Step 4.3: Generate Frontend Components

**AI PROMPT 6 - Frontend Structure:**

```
Create a React TypeScript frontend for a coding practice platform.

FOLDER STRUCTURE:
src/
├── App.tsx
├── index.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ProblemListPage.tsx
│   ├── ProblemDetailPage.tsx
│   ├── AnalysisPage.tsx
│   └── DashboardPage.tsx
├── components/
│   ├── Navbar.tsx
│   ├── CodeEditor.tsx (Monaco Editor wrapper)
│   ├── TestCaseResults.tsx
│   ├── AnalysisSummary.tsx
│   ├── ConceptBreakdown.tsx
│   ├── AttemptTimeline.tsx
│   └── ProtectedRoute.tsx
├── services/
│   └── api.ts (axios instance with auth interceptor)
├── hooks/
│   └── useAuth.ts (authentication hook)
├── store/
│   └── authStore.ts (Zustand auth state)
└── types/
    └── index.ts (TypeScript interfaces)

PAGES:
1. LoginPage: Email/password form, redirect to dashboard on success
2. RegisterPage: Email/username/password form
3. ProblemListPage: Grid of problem cards with difficulty badges, filter by difficulty
4. ProblemDetailPage:
   - Problem description with examples
   - Monaco code editor with Python syntax highlighting
   - "Run" button (test visible test cases)
   - "Submit" button (evaluate all test cases)
   - Test case results display
   - "Analyze" button (appears after first submission)
   - Timer showing time spent
5. AnalysisPage:
   - Summary section (natural language explanation)
   - Concept breakdown table
   - Attempt timeline (visual flow of attempts)
   - Recommendations list
6. DashboardPage:
   - Stats: problems solved, attempts made
   - Recent activity list
   - Weak areas identified

REQUIREMENTS:
- Use Monaco Editor for code editing
- JWT token stored in localStorage
- Axios interceptor adds "Authorization: Bearer <token>" to all requests
- Protected routes redirect to login if not authenticated
- Loading states for all async operations
- Error handling with toast notifications
- Responsive design (TailwindCSS)
- Auto-save code to localStorage every 30 seconds

Output all files with complete implementation.
```

### Step 4.4: Environment Configuration

```bash
# Create .env.local
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env.local
```

### Step 4.5: Start Frontend

```bash
npm start
```

---

## PHASE 5: DEPLOYMENT (2 hours)

### Step 5.1: Deploy Database

Already done! Neon database is live.

### Step 5.2: Deploy Backend to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend repository
5. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `JWT_SECRET`
   - `JUDGE0_URL`
   - `JUDGE0_API_KEY`
   - `ANALYSIS_SERVICE_URL` (will update after deploying analysis service)
6. Railway auto-detects Node.js and deploys
7. Copy the public URL (e.g., `https://your-app.railway.app`)

**Alternative: Deploy to Render**

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Add same environment variables as Railway
6. Click "Create Web Service"

### Step 5.3: Deploy Analysis Service (with Backend)

**Option: Run on same Railway/Render instance**

Update backend deployment:

```bash
# In backend root, create requirements.txt for Python service
pip freeze > requirements.txt

# Create Dockerfile that runs both Node and Python
```

**AI PROMPT 7 - Multi-Service Dockerfile:**

```
Create a Dockerfile that runs both a Node.js Express backend and a Python FastAPI service on the same container.

REQUIREMENTS:
- Base image: node:20-bullseye (includes Python)
- Install Python 3.11+ and pip
- Copy backend/ and analysis-service/ directories
- Install npm dependencies for backend
- Install pip dependencies for analysis service
- Expose ports 5000 (backend) and 8000 (analysis)
- Use supervisord or pm2 to run both services
- Start command runs both servers

Output complete Dockerfile and any necessary config files.
```

### Step 5.4: Deploy Frontend to Vercel

1. Push frontend code to GitHub repository
2. Go to https://vercel.com
3. Sign in with GitHub
4. Click "New Project" → Import your frontend repo
5. Configure:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variable: `REACT_APP_API_URL=https://your-backend.railway.app/api`
6. Click "Deploy"
7. Vercel provides a URL like `https://your-app.vercel.app`

### Step 5.5: Update CORS

Update backend to allow Vercel origin:

```javascript
// In backend/src/server.ts
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:3000']
}));
```

Redeploy backend after this change.

---

## PHASE 6: TESTING & DEMO PREP (1 hour)

### Test Checklist

✅ User can register and login  
✅ Problem list loads correctly  
✅ Code editor works with syntax highlighting  
✅ Submit button creates attempt and executes code  
✅ Test case results display correctly  
✅ Analyze button generates analysis  
✅ Analysis page shows summary, concepts, timeline  
✅ Dashboard shows user stats  

### Demo Script

1. **Opening (30 seconds):**
   - "Existing coding platforms only tell you if you're right or wrong. We show you HOW you solve problems."

2. **Problem Selection (30 seconds):**
   - Browse problem list, select "Two Sum"
   - Show problem description and examples

3. **First Attempt - Intentional Error (1 minute):**
   - Write code with syntax error (missing colon)
   - Submit → Show syntax error result
   - Fix syntax, submit again → Wrong answer (edge case failure)
   - Fix edge case, submit → Accepted

4. **Analysis Reveal (2 minutes):**
   - Click "Analyze" button
   - Show summary: "You demonstrated strong loop logic but struggled with syntax initially"
   - Show concept breakdown table
   - Show attempt timeline (visual flow of 3 attempts)
   - Highlight personalized recommendations

5. **Dashboard (30 seconds):**
   - Navigate to dashboard
   - Show problems solved, concepts mastered, weak areas

6. **Closing (30 seconds):**
   - "This is just the MVP. We're collecting rich behavioral data that will power ML recommendations, misconception detection, and adaptive learning paths."

---

## TROUBLESHOOTING

### Backend won't connect to database
```bash
# Test connection
npx prisma studio
# If fails, regenerate Prisma client
npx prisma generate
```

### Judge0 returns 401 Unauthorized
- Check API key is correct in .env
- Verify you're using the right endpoint (demo vs self-hosted)

### Frontend can't reach backend
- Check CORS is configured correctly
- Verify REACT_APP_API_URL has correct backend URL
- Check browser console for error messages

### Analysis service crashes
```bash
# Check Python dependencies
pip install -r requirements.txt
# Test AST parsing manually
python -c "import ast; print(ast.parse('def f(): pass'))"
```

---

## APPENDIX A: JUDGE0 SELF-HOSTING (Optional)

### Oracle Cloud Setup

1. Go to https://www.oracle.com/cloud/free/
2. Sign up for free tier (requires credit card but won't charge)
3. Create ARM-based VM:
   - Image: Ubuntu 22.04
   - Shape: Ampere A1 (4 OCPUs, 24GB RAM)
   - Public IP: Yes
4. SSH into VM:
   ```bash
   ssh ubuntu@<public-ip>
   ```

### Install Judge0

```bash
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker

# Clone Judge0
git clone https://github.com/judge0/judge0
cd judge0

# Configure docker-compose.yml
# Set REDIS_PASSWORD, POSTGRES_PASSWORD
# Set resource limits

# Start Judge0
sudo docker-compose up -d

# Check status
sudo docker-compose ps
```

### Expose Judge0 API

```bash
# Open firewall port 2358
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2358 -j ACCEPT
sudo netfilter-persistent save

# Test endpoint
curl http://<public-ip>:2358/system_info
```

Update backend .env:
```
JUDGE0_URL=http://<public-ip>:2358
```

---

## APPENDIX B: AI PROMPTS SUMMARY

Quick reference for all AI prompts used:

1. **Prisma Schema** - Database design with 7 tables
2. **Seed Data** - 5 Python problems with test cases
3. **Backend API** - Express server with 8 endpoints
4. **Analysis Service** - FastAPI with AST parsing
5. **Tailwind Config** - Custom theme configuration
6. **Frontend Components** - React app with 6 pages
7. **Multi-Service Dockerfile** - Node + Python container

---

## COST BREAKDOWN

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Free | $0 |
| Railway/Render | Free | $0 |
| Neon Database | Free | $0 |
| Judge0 (RapidAPI) | Free | $0 (100 requests/day) |
| Oracle Cloud | Free Tier | $0 |
| **TOTAL** | | **$0** |

---

## SUCCESS METRICS

Track these during the hackathon:

- ✅ **Demo Completion**: Full user flow works end-to-end
- ✅ **Analysis Quality**: Summary accurately reflects user behavior
- ✅ **Performance**: Page loads < 2 seconds, analysis < 10 seconds
- ✅ **Stability**: No crashes during 10 consecutive problem attempts
- ✅ **User Experience**: Smooth, intuitive interface

---

## NEXT STEPS AFTER HACKATHON

1. Add more problems (expand to 50+)
2. Implement JavaScript language support
3. Build ML models for concept mastery prediction
4. Add social features (leaderboards, peer comparison)
5. Integrate with LeetCode/HackerRank problem sets
6. Build instructor dashboard for bootcamps

---

## RESOURCES

- **Prisma Docs**: https://www.prisma.io/docs
- **Judge0 API**: https://ce.judge0.com/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **FastAPI**: https://fastapi.tiangolo.com/
- **TailwindCSS**: https://tailwindcss.com/docs

---

**Good luck with your hackathon! 🚀**

Remember: The goal is a working demo that showcases the unique value proposition—understanding HOW users solve problems, not just whether they succeed. Focus on making the analysis insight compelling and the user experience smooth.
