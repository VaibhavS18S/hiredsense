# HireSense AI — Enterprise Talent Acquisition & Resume Intelligence Platform

> **Intelligence that honors candidate evidence.** An enterprise recruitment SaaS platform crafted for modern talent teams to manage jobs, screen resumes with transparent explainable AI, compare candidates side-by-side, explore skill gaps, and make evidence-based shortlisting decisions.

---

## 1. Distinctive Visual Identity & Product Design

HireSense AI breaks away from generic AI dashboards (no glowing neon orbs, excessive purple-blue gradients, or floating particles). Instead, it adopts an editorial talent intelligence identity inspired by the clarity of Linear, the precision of Stripe, and the refinement of editorial portfolio websites:

- **Warm Off-White Background**: `#F7F7F4` (`bg-[#F7F7F4]`)
- **Deep Ink Typography**: `#171A21` (`text-[#171A21]`)
- **Dark Forest-Green Primary Accent**: `#176B52` (`hover: #135742`)
- **Muted Sage Surfaces**: `#E8F0EA` (`border: #D5E2D8`)
- **Restrained Amber**: `#D97706` for attention and pending states
- **Thin Neutral Borders**: `#E2E4DE` with subtle shadows and generous whitespace
- **Editorial Typography**: Inter / Newsreader heading style

---

## 2. Technology Stack

### Frontend
- **React.js 18** with **Vite 5**
- **Tailwind CSS 3** with custom warm/forest/sage color palette
- **React Router 6** for 20 connected client routes
- **Lucide React** icons
- **Recharts** for executive screening velocity and funnel drop-off analytics
- **Framer Motion** for subtle layout transitions
- **TanStack Query** for API state management

### Backend
- **Node.js** & **Express.js**
- **MongoDB Atlas with Mongoose** (with built-in automatic In-Memory fallback for zero-dependency standalone execution)
- **JWT Authentication** with secure HTTP-only cookies and Bearer tokens
- **bcryptjs** for salted password hashing
- **Multer** for file handling (PDF, DOCX, TXT)
- **pdf-parse** & **mammoth** for document text extraction
- **SHA-256 Hash Engine** for duplicate resume detection

### AI & NLP Matching Engine
- **Pluggable AI Provider Layer**: Configurable Hugging Face Inference API / Sentence Embeddings (`HF_API_KEY`, `HF_EMBEDDING_MODEL`)
- **Deterministic High-Precision Local Vector Space Engine**: Sublinear TF-IDF + Cosine Vector Engine with n-gram embedding fallback ensuring 100% reliability offline
- **500+ Skill Taxonomy & Extraction Service**: Categorized into Frontend, Backend, Cloud/DevOps, Database, AI/ML, Design, Architecture, and Testing

---

## 3. Core Modules & Functionality

### A. Executive Recruitment Dashboard (`/dashboard`)
- **Database-Derived KPIs**: Active Jobs, Candidates Screened, Awaiting Review, Shortlist Conversion Rate (%), and Avg Time to Shortlist (days).
- **Screening Velocity Over Time**: Recharts area chart plotting daily screening throughput and high-match frequency (&ge;75%).
- **Pipeline Stage Funnel**: Real-time distribution across all 7 recruitment phases.
- **Top Matching Candidates**: Instant links to top-scoring talent.
- **Skill Availability & Gap Insights**: Frequency distribution of technical competencies across the talent pool.
- **Multi-dimensional Filtering**: Filter by specific job opening and date range (7d, 30d, 90d, All time).

### B. Job Description Intelligence (`/jobs`, `/jobs/new`, `/jobs/:jobId`, `/jobs/:jobId/edit`)
- Full Job CRUD (Create, Edit, Duplicate, Archive, Delete).
- Separation of **Mandatory Skills** (critical, min years) and **Preferred Skills**.
- **Real-Time Job Readiness Analyzer**: Live score (0-100%) checking completeness, missing criteria (salary, experience), and flagging vague buzzwords ("rockstar", "ninja", "guru", "fast-paced environment").
- **AI Job Enhancer**: One-click automatic generation of mandatory skills, preferred skills, and responsibilities based on job title.

### C. Smart Resume Processing Center (`/screening`, `/screening/upload`)
- Bulk drag-and-drop resume upload supporting PDF, DOCX, and TXT (up to 15MB each).
- **Duplicate Detection**: SHA-256 fingerprinting prevents re-screening duplicate files.
- **6-Stage Visual Pipeline Stepper**:
  `Upload & Validation → Text Extraction → Entity Parsing → Skill Identification → Job Matching → Recruiter Review`
- Actionable error feedback for scanned or unreadable documents.

### D. Resume Intelligence and Candidate Profiles (`/candidates`, `/candidates/:candidateId`)
- Contact info, experience timeline, education timeline, certifications, and links.
- **Skills Grouped by Category**: Frontend, Backend, Database, Cloud & DevOps, AI/ML, Design.
- **Data Correction Controls**: In-app modal allowing recruiters to correct OCR/parser mistakes (with full audit logging).
- **Original Resume Preview**: Raw extracted text viewer.
- **Timestamped Recruiter Notes**: Internal team observations and interview feedback.

### E. Explainable AI Matching Engine (`/settings/scoring`)
- Transparent, weighted match scoring normalized out of 100:
  - **Skill Alignment (40%)**: Mandatory (85%) and preferred (15%) requirement coverage.
  - **Semantic Similarity (30%)**: Vector cosine distance between resume and job description.
  - **Relevant Experience (20%)**: Candidate years vs role minimums.
  - **Qualification Alignment (10%)**: Degree hierarchy matching (PhD &ge; MS &ge; BS).
- **Evidence Citations**: Exact resume excerpt quotes supporting each matched requirement.
- **Recruiter Manual Override**: Ability to adjust match scores with mandatory justification.
- **Active Weights Validation**: Enforces that configured weights strictly sum to 100%.

### F. Candidate Comparison Studio (`/compare`)
- Side-by-side comparison matrix for 2 to 4 candidates.
- Aligned columns comparing match scores, component breakdowns, mandatory skill coverage checklists, experience years, education credentials, and identified skill gaps.

### G. Recruitment Pipeline & Kanban Board (`/pipeline`)
- Drag-and-drop & one-click stage moves across 7 stages:
  `New → Screening → Shortlisted → Interview → Offer → Hired → Rejected`
- Job opening filtering and candidate search.
- **Undo Button**: Instant reversion of accidental stage moves.
- **Bulk Actions**: Select multiple candidates to advance or reject simultaneously.

### H. Advanced Search & Talent Pool (`/talent-pool`)
- Full-text search across candidate names, resumes, extracted skills, and locations.
- Sliders for minimum match score and experience duration.
- **Saved Searches**: Create, name, reload, and delete reusable filter presets.

### I. Interview Intelligence (`/interviews`)
- Suggested interview question generator targeting job criteria and candidate specific skill gaps.
- Structured candidate rubric scored on a 1-5 scale to prevent halo effect and bias.
- Interactive interview notes and recommendation recording (Strong Yes, Yes, Neutral, No).

### J. Reports & Export Center (`/reports`)
- Role-wise screening summary reports.
- Funnel velocity and stage drop-off analytics.
- Skills frequency distribution charts.
- **CSV Data Export**: One-click export of candidate rankings.

### K. Governance, Privacy & GDPR (`/settings/privacy`, `/settings/team`)
- **Configurable Data Retention Policy**: 180, 365, or 730 days.
- **Blind / Anonymized Screening Mode**: Masks names, photos, emails, and phone numbers for unbiased evaluation.
- **GDPR Candidate Data Portability Export**: Download authorized JSON candidate package.
- **Right to be Forgotten**: Permanent purge cascading through resumes, applications, and assessments.
- **Activity Audit Trail**: Immutable ledger tracking all job edits, score overrides, and data exports.

---

## 4. Quickstart & Installation Guide

### Prerequisites
- Node.js 18+ and npm installed (portable Node.js v20 is bundled in `.tools/nodejs` for standalone Windows operation).

### Step 1: Environment Configuration
Create or inspect `server/.env`:
```env
PORT=5000
NODE_ENV=development

# Optional: MongoDB Atlas URI (If left empty, HireSense starts an In-Memory DB automatically!)
MONGODB_URI=

# JWT Secrets
JWT_SECRET=hiresense_super_secure_jwt_secret_key_2026_recruit_intelligence
JWT_EXPIRES_IN=7d

# Optional: Hugging Face API (If left empty, HireSense uses its built-in Local Semantic Vector Engine)
HF_API_KEY=
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

CLIENT_URL=http://localhost:5173
```

### Step 2: Seed the Database
Populate realistic jobs, candidates, resumes, and Kanban applications:
```bash
cd server
npm run seed
```

### Step 3: Run the Backend Server
```bash
cd server
npm run dev
```
*The server will be running on `http://localhost:5000`.*

### Step 4: Run the Frontend Client
In a new terminal:
```bash
cd client
npm run dev
```
*The frontend will be running on `http://localhost:5173`.*

---

## 5. Demo Credentials

The database is pre-seeded with realistic enterprise talent profiles and active recruitment data:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Global Talent Lead (Admin)** | `recruiter@hiresense.ai` | `Password123!` |
| **Senior Technical Recruiter** | `marcus.vance@hiresense.ai` | `Password123!` |
| **VP of Engineering (Hiring Manager)** | `devin.thorne@hiresense.ai` | `Password123!` |

*(A convenient "Auto-fill Demo Account" button is available on the Login screen).*

---

## 6. Testing

Run the automated backend test suite verifying hashing, skill taxonomy extraction, AI matching weights, and job readiness analysis:
```bash
cd server
npm test
```

Build the production frontend bundle:
```bash
cd client
npm run build
```

---

## 7. Responsible Screening Pledge

HireSense AI enforces ethical talent intelligence:
- **No Protected Characteristics**: Does not factor gender, age, ethnicity, caste, religion, or disability into scores.
- **No Automated Rejection**: Score thresholds serve solely to organize human recruiter review.
- **Transparent Evidence**: Every score component is justified with exact resume text excerpts.
- **Human in the Loop**: Recruiters retain full authority through documented score overrides.
