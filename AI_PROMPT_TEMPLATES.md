# AI PROMPT TEMPLATES
## Complete Code Generation Guide

This document contains detailed, copy-paste ready prompts for generating every component of the platform using AI assistants (ChatGPT, Claude, etc.).

---

## DATABASE & BACKEND PROMPTS

### PROMPT 1: Prisma Schema (Database Design)

```
I need a complete Prisma schema for a coding practice platform. Create schema.prisma with these specifications:

TABLES & FIELDS:

1. User
   - id: Auto-increment primary key
   - email: Unique, required string
   - passwordHash: Required string (bcrypt hash)
   - username: Unique, required string (3-20 chars)
   - createdAt: Timestamp, default now
   - emailVerified: Boolean, default false
   - Relationships: Has many Attempt, Analysis, UserProgress (one-to-one)

2. Problem
   - id: Auto-increment primary key
   - title: Required string (max 255 chars)
   - slug: Unique string (URL-friendly)
   - description: Text (markdown format)
   - difficulty: Enum (Easy, Medium, Hard)
   - starterCodePython: Text (optional)
   - constraints: Text (optional)
   - examples: JSON array (format: [{input: "", output: "", explanation: ""}])
   - concepts: String array (e.g., ["arrays", "loops"])
   - createdAt: Timestamp
   - Relationships: Has many TestCase, Attempt

3. TestCase
   - id: Auto-increment primary key
   - problemId: Foreign key to Problem
   - input: Text (stdin input for Judge0)
   - expectedOutput: Text
   - isHidden: Boolean (true for final test cases)
   - orderIndex: Integer (for display order)
   - Relationships: Belongs to Problem, has many AttemptResult

4. Attempt
   - id: Auto-increment primary key
   - userId: Foreign key to User
   - problemId: Foreign key to Problem
   - code: Text (full code snapshot)
   - language: String (default "python")
   - submittedAt: Timestamp
   - status: String (Accepted, Wrong Answer, Runtime Error, etc.)
   - errorType: String (nullable: SyntaxError, RuntimeError, LogicError)
   - runtimeMs: Integer (nullable)
   - memoryKb: Integer (nullable)
   - sessionId: UUID (groups attempts for same problem session)
   - Relationships: Belongs to User and Problem, has many AttemptResult

5. AttemptResult
   - id: Auto-increment primary key
   - attemptId: Foreign key to Attempt
   - testCaseId: Foreign key to TestCase
   - passed: Boolean
   - actualOutput: Text (nullable)
   - errorMessage: Text (nullable)
   - Relationships: Belongs to Attempt and TestCase

6. Analysis
   - id: Auto-increment primary key
   - userId: Foreign key to User
   - problemId: Foreign key to Problem
   - sessionId: UUID (matches Attempt.sessionId)
   - summary: Text (natural language summary)
   - conceptBreakdown: JSON (format: {concept: {understanding: "", timeSpent: 0, corrections: 0}})
   - attemptTimeline: JSON (array of attempt summaries)
   - recommendations: String array
   - timeComplexity: String (nullable, e.g., "O(n^2)")
   - createdAt: Timestamp
   - Relationships: Belongs to User and Problem

7. UserProgress
   - id: Auto-increment primary key
   - userId: Foreign key to User (unique)
   - problemsSolved: Integer (default 0)
   - problemsAttempted: Integer (default 0)
   - conceptMastery: JSON (format: {concept: {level: "", problemsAttempted: 0, problemsSolved: 0}})
   - lastActiveAt: Timestamp
   - Relationships: Belongs to User (one-to-one)

INDEXES:
- User.email (unique)
- User.username (unique)
- Problem.slug (unique)
- Attempt(userId, problemId)
- Attempt(sessionId)
- Analysis(sessionId)

DATABASE PROVIDER: PostgreSQL

OUTPUT: Complete schema.prisma file ready to use with Prisma.
```

---

### PROMPT 2: Database Seed Script

```
Create a TypeScript Prisma seed script (seed.ts) that populates the database with 5 beginner-friendly Python coding problems.

REQUIREMENTS FOR EACH PROBLEM:

1. Two Sum
   - Difficulty: Easy
   - Concepts: ["arrays", "hash-tables"]
   - Description: Find two numbers that add up to target
   - Starter code: Function signature with TODO comment
   - Examples: 2-3 examples with input/output
   - Test cases: 6 total (3 visible, 3 hidden)
     - Basic: [2,7,11,15], target=9 → [0,1]
     - Edge: Empty array → []
     - Edge: No solution → []
     - Duplicates: [3,3], target=6 → [0,1]
     - Large numbers, negative numbers

2. Reverse String
   - Difficulty: Easy
   - Concepts: ["strings", "two-pointers"]
   - Test cases: Include empty string, single char, palindrome

3. FizzBuzz
   - Difficulty: Easy
   - Concepts: ["loops", "conditionals"]
   - Test cases: n=1 to n=100, edge cases

4. Valid Palindrome
   - Difficulty: Easy
   - Concepts: ["strings", "two-pointers"]
   - Test cases: Empty, special chars, case sensitivity

5. Fibonacci Number
   - Difficulty: Easy
   - Concepts: ["recursion", "dynamic-programming"]
   - Test cases: n=0, n=1, n=10, n=30

FORMAT FOR EACH PROBLEM:
{
  title: "Problem Title",
  slug: "problem-slug",
  description: "Markdown formatted description with constraints",
  difficulty: "Easy",
  starterCodePython: "def function_name(param):\n    # Your code here\n    pass",
  constraints: "Bullet points of constraints",
  examples: [
    {input: "Input description", output: "Expected output", explanation: "Why this works"}
  ],
  concepts: ["concept1", "concept2"],
  testCases: [
    {input: "stdin input", expectedOutput: "stdout output", isHidden: false, orderIndex: 0}
  ]
}

Use Prisma Client to create Problem and TestCase records.
Include proper error handling and transaction management.

OUTPUT: Complete seed.ts file that can be run with: npx prisma db seed
```

---

### PROMPT 3: Express Backend - Complete Implementation

```
Create a production-ready Node.js Express TypeScript backend for a coding practice platform.

PROJECT STRUCTURE:
backend/
├── src/
│   ├── server.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validators.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── problem.routes.ts
│   │   ├── submission.routes.ts
│   │   └── analysis.routes.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── problemController.ts
│   │   ├── submissionController.ts
│   │   └── analysisController.ts
│   ├── services/
│   │   ├── judge0Service.ts
│   │   └── analysisService.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── asyncHandler.ts
│   └── types/
│       └── express.d.ts
├── package.json
└── tsconfig.json

IMPLEMENTATION DETAILS:

1. server.ts
   - Express app initialization
   - Middleware: helmet, cors, express.json, express-rate-limit
   - Route mounting: /api/auth, /api/problems, /api/submit, /api/analysis
   - Error handling middleware
   - Port configuration from env (default 5000)

2. middleware/auth.ts
   - JWT verification middleware
   - Extract token from Authorization header (Bearer token)
   - Verify with jwt.verify(token, process.env.JWT_SECRET)
   - Attach user to req.user
   - Return 401 if invalid/expired

3. middleware/errorHandler.ts
   - Global error handler
   - Format errors: {success: false, error: {message, status, stack (dev only)}}
   - Log errors with timestamp and request details
   - Handle Prisma errors specifically

4. controllers/authController.ts
   - register(req, res, next):
     * Validate email, username, password (min 8 chars)
     * Check if email/username exists
     * Hash password with bcrypt (12 rounds)
     * Create user in DB
     * Generate JWT token (24h expiry)
     * Return {success: true, token, user: {id, email, username}}
   
   - login(req, res, next):
     * Find user by email
     * Compare password with bcrypt
     * Generate JWT token
     * Update lastActiveAt
     * Return token and user data

5. controllers/problemController.ts
   - listProblems(req, res, next):
     * Query params: difficulty (Easy/Medium/Hard), concepts (array)
     * Return problems with: id, title, slug, difficulty, concepts
     * Exclude description, testCases, starter code
   
   - getProblem(req, res, next):
     * Param: slug
     * Return full problem including description, examples, starter code
     * Include ONLY visible test cases (isHidden = false)
     * Exclude hidden test cases

6. controllers/submissionController.ts
   - submitCode(req, res, next):
     * Body: {problemId, code, language, sessionId}
     * Create Attempt record with status "Pending"
     * For each test case:
       - Call judge0Service.submitCode(code, testCase.input, testCase.expectedOutput)
       - Store result in AttemptResult
     * Update Attempt with overall status (all pass = Accepted, any fail = Wrong Answer)
     * Return {attemptId, status, results: [{testCaseId, passed, actualOutput}]}
   
   - getAttempts(req, res, next):
     * Param: sessionId
     * Return all attempts for this session with results
     * Include code, status, error, runtime, timestamp

7. controllers/analysisController.ts
   - generateAnalysis(req, res, next):
     * Body: {sessionId}
     * Fetch all attempts for session
     * Call analysisService.analyze(attempts, problem)
     * Store analysis in DB
     * Return analysis with summary, concept breakdown, timeline
   
   - getAnalysis(req, res, next):
     * Param: sessionId
     * Return stored analysis or 404 if not generated

8. services/judge0Service.ts
   - submitCode(sourceCode, stdin, expectedOutput):
     * POST to Judge0: {source_code, language_id: 71, stdin, expected_output, cpu_time_limit: 5, memory_limit: 262144}
     * Get submission token
     * Poll GET /submissions/{token} until status.id !== 1 or 2 (processing)
     * Return {status, stdout, stderr, time, memory}
   
   - getLanguageId(language):
     * Map: python → 71, javascript → 63, java → 62, cpp → 54

9. services/analysisService.ts
   - analyze(attempts, problem):
     * POST to Python analysis service at ANALYSIS_SERVICE_URL
     * Body: {attempts, problem}
     * Return analysis JSON

ENVIRONMENT VARIABLES:
- PORT
- DATABASE_URL
- JWT_SECRET
- JUDGE0_URL
- JUDGE0_API_KEY (if using RapidAPI)
- ANALYSIS_SERVICE_URL

DEPENDENCIES:
express, cors, helmet, express-rate-limit, jsonwebtoken, bcrypt, dotenv, @prisma/client, axios

DEV DEPENDENCIES:
typescript, ts-node, @types/node, @types/express, @types/jsonwebtoken, @types/bcrypt, nodemon

PACKAGE.JSON SCRIPTS:
- dev: ts-node src/server.ts
- build: tsc
- start: node dist/server.js

OUTPUT: All files with complete, production-ready implementation. Include proper TypeScript types, error handling, and logging.
```

---

## ANALYSIS SERVICE PROMPTS

### PROMPT 4: Python Analysis Service

```
Create a Python FastAPI microservice that analyzes coding attempts and generates insights.

PROJECT STRUCTURE:
analysis-service/
├── main.py
├── models.py
├── analyzers/
│   ├── __init__.py
│   ├── ast_analyzer.py
│   ├── diff_analyzer.py
│   ├── error_classifier.py
│   ├── concept_detector.py
│   └── summary_generator.py
├── requirements.txt
└── README.md

IMPLEMENTATION:

1. models.py - Pydantic Models
   - AttemptInput: id, code, status, errorType, submittedAt, testCaseResults[], runtimeMs, memoryKb
   - ProblemInput: title, difficulty, concepts[]
   - AnalysisRequest: attempts[], problem
   - ConceptAnalysis: understanding (strong/moderate/weak), timeSpent, corrections
   - AttemptSummary: attemptNumber, timestamp, error, changesMade
   - AnalysisResponse: summary, conceptBreakdown, attemptTimeline, recommendations, timeComplexity

2. main.py - FastAPI Application
   - POST /analyze endpoint
   - CORS middleware for backend origin
   - Health check: GET /health
   - Error handling with proper HTTP status codes

3. analyzers/ast_analyzer.py
   - parse_code(code: str) -> dict:
     * Use ast.parse(code)
     * Walk AST with ast.walk(tree)
     * Count: For/While loops, If statements, function definitions, recursion calls
     * Detect list operations: ast.List, ast.Subscript, list methods
     * Detect string operations: string methods, slicing
     * Return {loops: 0, conditionals: 0, recursion: 0, lists: 0, strings: 0, functions: 0}
   
   - estimate_time_complexity(parsed_ast: dict) -> str:
     * No loops: "O(1)"
     * Single loop: "O(n)"
     * Nested loops (2 levels): "O(n^2)"
     * Recursion with halving (binary search pattern): "O(log n)"
     * Tree recursion: "O(2^n)"

4. analyzers/diff_analyzer.py
   - compute_diff(code1: str, code2: str) -> list[str]:
     * Use difflib.unified_diff(code1.splitlines(), code2.splitlines())
     * Return list of changed lines with context
   
   - summarize_changes(diff: list[str]) -> str:
     * Parse diff to extract added/removed lines
     * Generate summary: "Added error handling on line 5", "Removed redundant loop", etc.

5. analyzers/error_classifier.py
   - classify_error(status: str, errorType: str, testResults: list) -> dict:
     * Map Judge0 status to error category:
       - Accepted → No error
       - Wrong Answer → Logic error
       - Runtime Error → Runtime error (index out of bounds, null reference, etc.)
       - Time Limit Exceeded → Efficiency issue
       - Compilation Error → Syntax error
     * Analyze test results to infer specific issue:
       - All basic cases pass, edge case fails → Edge case handling
       - First few pass, later fail → Boundary condition
     * Return {category: "", specificIssue: "", recommendation: ""}

6. analyzers/concept_detector.py
   - detect_concepts(code: str, ast_analysis: dict) -> dict:
     * Based on AST counts, determine concepts used:
       - loops > 0 → "loops"
       - conditionals > 0 → "conditionals"
       - recursion > 0 → "recursion"
       - lists > 0 → "arrays"
       - strings > 0 → "string-manipulation"
     * Check for edge case handling:
       - If code contains: len(x) == 0, if not x, if x is None → "edge-cases"
     * Return {concept: {used: bool, proficiency: "beginner/intermediate/advanced"}}

7. analyzers/summary_generator.py
   - generate_summary(attempts: list, concept_analysis: dict, error_progression: list) -> str:
     * Template-based generation:
       - Identify strong concepts: "You demonstrated strong understanding of {concept}"
       - Identify weak concepts: "You struggled with {concept}"
       - Describe error progression: "Your solution failed initially due to {error}, which you corrected in attempt {N}"
       - Efficiency note: "Your final solution has {complexity} time complexity. Optimal is {optimal}."
     * Return 2-4 sentence summary

8. Main Analysis Flow (in main.py /analyze endpoint)
   ```python
   def analyze_attempts(request: AnalysisRequest):
       # Parse all attempts
       ast_analyses = [ast_analyzer.parse_code(a.code) for a in request.attempts]
       
       # Compute diffs between consecutive attempts
       diffs = [diff_analyzer.compute_diff(request.attempts[i].code, request.attempts[i+1].code) 
                for i in range(len(request.attempts)-1)]
       
       # Classify errors for each attempt
       errors = [error_classifier.classify_error(a.status, a.errorType, a.testCaseResults) 
                 for a in request.attempts]
       
       # Detect concepts used
       concepts = concept_detector.detect_concepts(request.attempts[-1].code, ast_analyses[-1])
       
       # Estimate time complexity of final solution
       time_complexity = ast_analyzer.estimate_time_complexity(ast_analyses[-1])
       
       # Build concept breakdown
       concept_breakdown = {}
       for concept in request.problem.concepts:
           concept_breakdown[concept] = {
               "understanding": calculate_understanding(concept, attempts, errors),
               "timeSpent": calculate_time_spent(concept, attempts),
               "corrections": count_corrections(concept, diffs)
           }
       
       # Build attempt timeline
       timeline = []
       for i, attempt in enumerate(request.attempts):
           timeline.append({
               "attemptNumber": i + 1,
               "timestamp": attempt.submittedAt,
               "error": errors[i]["category"],
               "changesMade": diff_analyzer.summarize_changes(diffs[i]) if i < len(diffs) else "Initial attempt"
           })
       
       # Generate summary
       summary = summary_generator.generate_summary(request.attempts, concept_breakdown, errors)
       
       # Generate recommendations
       recommendations = generate_recommendations(concept_breakdown, errors)
       
       return AnalysisResponse(
           summary=summary,
           conceptBreakdown=concept_breakdown,
           attemptTimeline=timeline,
           recommendations=recommendations,
           timeComplexity=time_complexity
       )
   ```

REQUIREMENTS.TXT:
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
radon==6.0.1
python-dateutil==2.8.2

OUTPUT: All files with complete implementation, including helper functions for calculating understanding levels, time spent, and recommendations. Include docstrings and type hints throughout.
```

---

## FRONTEND PROMPTS

### PROMPT 5: React Frontend - Complete Implementation

```
Create a modern React TypeScript frontend for a coding practice platform with all components, pages, and services.

PROJECT STRUCTURE:
frontend/
├── public/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProblemListPage.tsx
│   │   ├── ProblemDetailPage.tsx
│   │   ├── AnalysisPage.tsx
│   │   └── DashboardPage.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── TestCaseResults.tsx
│   │   ├── AnalysisSummary.tsx
│   │   ├── ConceptBreakdown.tsx
│   │   ├── AttemptTimeline.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useLocalStorage.ts
│   ├── store/
│   │   └── authStore.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── index.css
├── package.json
└── tailwind.config.js

IMPLEMENTATION REQUIREMENTS:

1. types/index.ts - TypeScript Interfaces
   ```typescript
   interface User {
     id: number;
     email: string;
     username: string;
   }

   interface Problem {
     id: number;
     title: string;
     slug: string;
     description: string;
     difficulty: 'Easy' | 'Medium' | 'Hard';
     starterCodePython: string;
     constraints: string;
     examples: Example[];
     concepts: string[];
   }

   interface Example {
     input: string;
     output: string;
     explanation: string;
   }

   interface TestCase {
     id: number;
     input: string;
     expectedOutput: string;
   }

   interface Attempt {
     id: number;
     code: string;
     status: string;
     errorType: string | null;
     submittedAt: string;
     runtimeMs: number | null;
     results: TestCaseResult[];
   }

   interface TestCaseResult {
     testCaseId: number;
     passed: boolean;
     actualOutput: string;
     errorMessage: string | null;
   }

   interface Analysis {
     summary: string;
     conceptBreakdown: Record<string, ConceptAnalysis>;
     attemptTimeline: AttemptSummary[];
     recommendations: string[];
     timeComplexity: string;
   }

   interface ConceptAnalysis {
     understanding: 'strong' | 'moderate' | 'weak';
     timeSpent: number;
     corrections: number;
   }

   interface AttemptSummary {
     attemptNumber: number;
     timestamp: string;
     error: string;
     changesMade: string;
   }
   ```

2. services/api.ts - Axios Instance with Interceptors
   - Create axios instance with baseURL from env
   - Request interceptor: Add Authorization header if token exists
   - Response interceptor: Handle 401 errors (redirect to login)
   - Export API functions:
     * auth.register(email, username, password)
     * auth.login(email, password)
     * problems.list(filters?)
     * problems.get(slug)
     * submissions.submit(problemId, code, sessionId)
     * submissions.getAttempts(sessionId)
     * analysis.generate(sessionId)
     * analysis.get(sessionId)

3. store/authStore.ts - Zustand Auth Store
   ```typescript
   interface AuthState {
     user: User | null;
     token: string | null;
     isAuthenticated: boolean;
     login: (email: string, password: string) => Promise<void>;
     register: (email: string, username: string, password: string) => Promise<void>;
     logout: () => void;
     setUser: (user: User, token: string) => void;
   }
   ```
   - Persist token to localStorage
   - Load token on app initialization

4. pages/LoginPage.tsx
   - Email and password input fields
   - Submit button that calls authStore.login
   - Link to register page
   - Show error message if login fails
   - Redirect to /problems on success
   - TailwindCSS styling: centered card, gradient background

5. pages/RegisterPage.tsx
   - Email, username, password input fields
   - Password confirmation field
   - Submit button that calls authStore.register
   - Form validation: email format, password min 8 chars, passwords match
   - Link to login page
   - Show error/success messages

6. pages/ProblemListPage.tsx
   - Grid of problem cards (3 columns on desktop, 1 on mobile)
   - Each card shows: title, difficulty badge (color-coded), concepts tags
   - Filter dropdown: All / Easy / Medium / Hard
   - Click card to navigate to /problem/:slug
   - Loading state while fetching problems
   - Use React Query for data fetching and caching

7. pages/ProblemDetailPage.tsx
   - Layout: 50% problem description (left), 50% code editor (right)
   - Problem section:
     * Title and difficulty badge
     * Description (markdown rendered)
     * Examples in formatted boxes
     * Constraints
   - Editor section:
     * Monaco Editor with Python syntax highlighting
     * "Run" button (test visible cases only)
     * "Submit" button (evaluate all cases)
     * Timer showing time spent (starts when component mounts)
     * Auto-save code to localStorage every 30 seconds
   - Test results displayed below editor after submission
   - "Analyze" button appears after first submission
   - Navigate to /analysis/:sessionId when clicked

8. components/CodeEditor.tsx
   - Wrapper for Monaco Editor
   - Props: value, onChange, language
   - Theme: vs-dark
   - Options: minimap disabled, fontSize 14, lineNumbers on
   - Auto-import Monaco Editor dynamically

9. components/TestCaseResults.tsx
   - Display table of test results
   - Columns: Test Case #, Status (✓/✗), Expected Output, Actual Output
   - Color code rows: green for pass, red for fail
   - Collapsible details for each test case

10. pages/AnalysisPage.tsx
    - 4 sections: Summary, Concept Breakdown, Attempt Timeline, Recommendations
    - Summary: Display analysis.summary in large, readable text
    - Concept Breakdown: Table with columns: Concept, Understanding (badge), Time Spent, Corrections
    - Attempt Timeline: Vertical timeline with attempt numbers, timestamps, errors, changes
    - Recommendations: Bulleted list of analysis.recommendations
    - "Back to Problems" button

11. components/AnalysisSummary.tsx
    - Hero section with summary text
    - Time complexity badge
    - Efficiency tip if not optimal

12. components/ConceptBreakdown.tsx
    - Table component with sortable columns
    - Understanding level shown as colored badges (green=strong, yellow=moderate, red=weak)
    - Click concept to show detailed breakdown (modal or expanded row)

13. components/AttemptTimeline.tsx
    - Vertical timeline with connecting line
    - Each attempt shown as a card with:
      * Attempt number and timestamp
      * Error type (if any)
      * Changes made summary
      * View code diff button (opens modal)

14. pages/DashboardPage.tsx
    - Stats cards: Problems Solved, Problems Attempted, Average Attempts per Problem
    - Recent activity list (last 5 problems)
    - Concept mastery chart (bar chart or radar chart)
    - Weak areas highlighted (concepts with "weak" understanding)
    - "Continue Practicing" button linking to recommended problem

15. components/Navbar.tsx
    - Logo/title on left
    - Navigation links: Problems, Dashboard
    - User menu on right: Username dropdown with Logout option
    - Mobile responsive: hamburger menu

16. App.tsx - Routing
    ```typescript
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><ProblemListPage /></ProtectedRoute>} />
        <Route path="/problems" element={<ProtectedRoute><ProblemListPage /></ProtectedRoute>} />
        <Route path="/problem/:slug" element={<ProtectedRoute><ProblemDetailPage /></ProtectedRoute>} />
        <Route path="/analysis/:sessionId" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    ```

TAILWIND CONFIG:
- Colors: primary (blue-600), secondary (green-600), danger (red-600), warning (orange-500)
- Fonts: Inter for UI, JetBrains Mono for code
- Dark mode support
- Custom shadows and animations

DEPENDENCIES:
react, react-dom, react-router-dom, @monaco-editor/react, axios, zustand, @tanstack/react-query, tailwindcss, react-markdown

OUTPUT: All files with complete implementation, proper TypeScript typing, responsive design, and loading/error states. Include dark mode toggle in Navbar.
```

---

### PROMPT 6: TailwindCSS Configuration

```
Create a tailwind.config.js for a modern coding practice platform.

REQUIREMENTS:

1. Custom Colors:
   - primary: Blue gradient (50-900)
   - secondary: Green gradient
   - accent: Purple gradient
   - success: Green-500
   - warning: Orange-500
   - danger: Red-500
   - neutral: Gray gradient

2. Custom Fonts:
   - sans: 'Inter', system-ui
   - mono: 'JetBrains Mono', monospace

3. Dark Mode: class-based

4. Custom Utilities:
   - Gradient backgrounds for hero sections
   - Card shadows
   - Button hover effects
   - Badge styles

5. Custom Components:
   - .btn-primary, .btn-secondary
   - .card
   - .badge-easy, .badge-medium, .badge-hard

OUTPUT: Complete tailwind.config.js with all customizations.
```

---

## DEPLOYMENT PROMPTS

### PROMPT 7: Multi-Service Dockerfile

```
Create a Dockerfile that runs both a Node.js Express backend and a Python FastAPI analysis service in a single container.

REQUIREMENTS:

BASE IMAGE: node:20-bullseye (includes Node.js and supports Python)

STEPS:
1. Install Python 3.11 and pip
2. Install supervisord for process management
3. Copy backend/ and analysis-service/ directories
4. Install Node.js dependencies (npm install in backend/)
5. Build TypeScript (npm run build)
6. Install Python dependencies (pip install -r requirements.txt in analysis-service/)
7. Expose ports 5000 (backend) and 8000 (analysis service)
8. Create supervisord.conf to run both services
9. CMD to start supervisord

SUPERVISORD CONFIG:
- Program 1: Node backend (npm start in /app/backend)
- Program 2: Python service (uvicorn main:app --host 0.0.0.0 --port 8000 in /app/analysis-service)
- Auto-restart both on failure
- Log to stdout/stderr

OUTPUT: Complete Dockerfile and supervisord.conf ready for Railway/Render deployment.
```

---

## TESTING PROMPTS

### PROMPT 8: Test Data Generator

```
Create a Node.js script that generates realistic test data for the platform.

GENERATE:
1. 10 test users with realistic names and emails
2. 20 problems covering various concepts and difficulties
3. 50 test cases per problem (mix of basic, edge, stress tests)
4. 100 sample attempts with realistic code variations
5. 20 sample analyses with diverse insights

Save to JSON files:
- users.json
- problems.json
- test_cases.json
- attempts.json
- analyses.json

Include script to load JSON into database using Prisma.

OUTPUT: data-generator.ts and load-data.ts
```

---

These prompts are designed to be copy-pasted directly into AI assistants. Each prompt is self-contained with all necessary context and requirements.
