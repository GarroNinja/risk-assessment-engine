# Tool-02 — Risk Assessment Engine
> Capstone Project 

---

## Developer Information

| Field | Detail |
|---|---|
| Role | Java Developer 3 |
| Responsibility | Full React Frontend |



---

## Project Overview

An AI-powered web application for identifying, classifying, tracking
and mitigating operational risks. This repository contains the complete
React frontend built during the internship capstone sprint.

---

## My Contributions

### Day 1 — Project Setup
**Task:** Setup React with Vite, install Axios and Tailwind CSS,
set VITE_API_URL in .env, create pages/, components/, services/ folders

- React 18 + Vite project initialised
- Tailwind CSS v3 configured with brand colour `#1B4F8A` and Arial font
- Axios and React Router DOM installed
- `.env` file created with `VITE_API_URL=http://localhost:8080/api`
- Folder structure created: `pages/`, `components/`, `services/`, `context/`
- `AuthContext.jsx` — JWT login, logout, isAuthenticated state
- `ProtectedRoute.jsx` — redirects unauthenticated users to login
- `api.js` — Axios instance with JWT interceptor and 401 handler
- Service files created: `authService.js`, `riskService.js`, `aiService.js`
- All 6 page placeholders and routes configured in `App.jsx`

---

### Day 2 — List View Page
**Task:** Build list view page — table with all columns, Axios GET on
mount, loading skeleton while fetching, empty state message

- Full data table with 9 columns: ID, Title, Category, Severity,
  Status, Score, Owner, Created Date, Actions
- Axios GET on mount to fetch all risks from backend
- Animated loading skeleton while fetching
- Empty state message when no records found
- Colour-coded severity badges and score numbers
- Click column header to sort ascending or descending
- Debounced 300ms text search
- Status and severity filter dropdowns
- Clear filters button
- Pagination controls with page number display
- CSV export downloads file to browser
- Row click navigates to detail page
- Error banner with Retry button on API failure
- Fixed: `risks.filter is not a function` — safe array extraction added

---

### Day 3 — Create and Edit Form
**Task:** Build create/edit form — controlled inputs for all fields,
client-side validation with inline error messages, submit handler

- Single `FormPage.jsx` handles both create and edit modes
- 9 controlled fields: Title, Description, Category, Severity,
  Status, Score, Owner, Mitigation Plan, Due Date
- Inline validation errors shown after user touches each field
- Live score colour bar — red 75+, yellow 40–74, green 0–39
- Edit mode fetches existing record and pre-fills all fields
- Submit spinner, success banner and auto-redirect after save
- Specific error messages for 401, 403, 400, 404, Network Error
- Reset button clears all fields on create form
- Fixed: input focus lost on every keystroke — moved Field component
  outside FormPage to prevent React remounting it

---

### Day 4 — API Connection and Pagination
**Task:** Connect list page to GET /all API — handle Spring Page
response, implement pagination controls, sort by column headers

- Connected to real `GET /risks/all` backend endpoint
- Spring Page response handled: reads `content`, `totalPages`,
  `totalElements`, `number`
- Full pagination: First, Prev, page pills, Next, Last buttons
- Shows record range — e.g. "Showing 1–10 of 48 risks"
- Sort params `sortBy` and `sortDir` sent to API
- Active column highlighted in blue header
- Page resets to 0 when filters or search change

---

### Day 5 — Login, Register and Authentication
**Task:** Build login page — form, store JWT, AuthContext with
isAuthenticated, ProtectedRoute redirects if not logged in

- `LoginPage.jsx` — split panel UI, username/password form,
  show/hide password, inline validation, JWT stored on success
- `RegisterPage.jsx` — username, email, password, confirm password,
  success banner redirects to login
- `AuthContext.jsx` — stores token and user in localStorage,
  decodes role from JWT payload
- `ProtectedRoute.jsx` — saves attempted URL, redirects after login,
  supports requiredRole prop
- `App.jsx` — `/risks/new` placed before `/risks/:id` to prevent
  route collision

---

### Day 6 — Dashboard
**Task:** Build dashboard — 4 KPI cards from GET /stats, Recharts
BarChart showing data by category or status

- 4 KPI cards: Total Risks, High Severity, Open Risks, Mitigated
- Recharts BarChart with Category, Status and Severity view toggle
- Status breakdown with progress bars and resolution rate
- Severity summary panel
- Quick actions panel with navigation buttons
- Mock data fallback when backend is not running
- Animated skeleton loading for all cards and chart

---

### Day 7 — Detail Page
**Task:** Detail page — all fields, colour-coded score/status badge,
Edit/Delete buttons, AI Analysis card section

- All risk fields displayed: Title, Description, Category, Severity,
  Status, Score, Owner, Due Date, Created, Last Updated, Mitigation Plan
- Colour-coded severity and status badges
- SVG score ring — red 75+, yellow 40–74, green 0–39
- Overdue badge if due date has passed
- Edit button navigates to edit form pre-filled
- Delete button opens confirmation modal, redirects after delete
- AI Analysis card with Describe and Recommend tabs
- Quick info and Actions sidebar cards
- Animated skeleton while loading, error state with back button

---

### Day 8 — AI Panel Component
**Task:** AI panel in UI — Ask AI button, loading spinner,
formatted AI response card, Retry on error

- Reusable `AiPanel.jsx` component used across the application
- 4 tabs: Describe, Recommend, Categorise, RAG Query
- Ask AI button calls the Flask AI service on port 5000
- Animated loading skeleton while waiting for AI response
- Describe tab — formatted blue response card with AI text
- Recommend tab — colour-coded priority cards (red/yellow/green)
- Categorise tab — confidence bar with reasoning text
- RAG Query tab — text input, answer card and numbered source chunks
- Meta badges showing model, cached status, response time, tokens
- Retry button in error banner
- Specific error messages for 429, 400 and Network Error

---

### Day 9 — Search and Filter Bar
**Task:** Search and filter bar — debounced 300ms text search,
status dropdown, date range picker, URL query params

- Debounced 300ms search using useRef timer
- Clear button inside search input
- Status and severity filter dropdowns
- Advanced Filters toggle reveals date range picker
- From and To date inputs filter rows by createdDate
- All filters written to URL using useSearchParams
- Active filter badges — one pill per active filter with X to remove
- Filter count badge on the Filters button
- Clear All button resets every filter in one click

---

### Day 10 — CSV Export and SSE Streaming
**Task:** React export — CSV download button, streaming report
display using EventSource, analytics page with Recharts

- CSV export downloads dated file with spinner during export
- `ReportStreamer.jsx` — connects to Flask `/generate-report/stream`
  using EventSource
- Streams tokens one by one with blinking cursor
- SSE toggle switch, Stop button closes stream mid-way
- Falls back to REST generateReport if SSE connection fails
- Structured report card rendered when streaming is complete
- Shows executive summary, overview, top items, recommendations

---

### Day 11 — Analytics Page
**Task:** Analytics page — BarChart by category, LineChart over time
(6 months), PieChart by status, period selector

- 4 KPI cards at top of page from GET /stats
- BarChart by category with toggle for category, severity, status views
- AreaChart LineChart — new risks per month with gradient fill
- Period selector toggles 3M, 6M and All time
- PieChart by status — donut chart with custom tooltip
- PieChart by severity — separate donut with red/yellow/green colours
- Status breakdown with progress bars and resolution rate
- Severity summary cards with mini progress bars
- Refresh button re-fetches all data
- CSV export with spinner
- Mock data fallback with amber warning banner
- AI Report Streamer section at bottom of page

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | Frontend UI framework |
| Vite | Latest | Dev server and build tool |
| Tailwind CSS | 3.x | Utility-first CSS |
| Axios | Latest | HTTP client |
| React Router DOM | Latest | Client-side routing |
| Recharts | Latest | Charts and analytics |

---

## Folder Structure
```
frontend/
├── .env
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
├── main.jsx
├── App.jsx
├── index.css
├── context/
│   └── AuthContext.jsx
├── components/
│   ├── ProtectedRoute.jsx
│   ├── LoadingSkeleton.jsx
│   ├── EmptyState.jsx
│   ├── StatusBadge.jsx
│   ├── Pagination.jsx
│   ├── ErrorBoundary.jsx
│   ├── AiPanel.jsx
│   └── ReportStreamer.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── ListPage.jsx
│   ├── DetailPage.jsx
│   ├── FormPage.jsx
│   ├── DashboardPage.jsx
│   └── AnalyticsPage.jsx
└── services/
├── api.js
├── riskService.js
├── authService.js
└── aiService.js
```
---

## Environment Variables

| Variable | Description | Value |
|---|---|---|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:8080/api` |
| `VITE_AI_URL` | AI microservice base URL | `http://localhost:5000` |

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or higher |
| npm | 9 or higher |

---

## Setup Instructions

**Step 1 — Clone the repository**
```bash
git clone [repository URL from mentor]
cd your-project-folder/frontend
```

**Step 2 — Install dependencies**
```bash
npm install
```
**Step 4 — Set environment variables in `.env`**
```
VITE_API_URL=http://localhost:8080/api
VITE_AI_URL=http://localhost:5000
```

**Step 3 — Start development server**
```bash
npm run dev
```

**Step 4 — Open in browser**
http://localhost:5173

---

## Application Routes

| Route | Page | Status |
|---|---|---|
| `/login` | Login page | Complete |
| `/register` | Register page | Complete |
| `/` | Dashboard | Complete |
| `/risks` | Risk register table | Complete |
| `/risks/new` | Create risk form | Complete |
| `/risks/:id` | Risk detail view | Complete |
| `/risks/:id/edit` | Edit risk form | Complete |
| `/analytics` | Analytics and charts | Complete |

---

## Bugs Fixed

| Day | Bug | Root Cause | Fix |
|---|---|---|---|
| Day 1 | `npx tailwindcss init -p` failing | Tailwind v4 changed init command | Installed `tailwindcss@3` |
| Day 2 | `risks.filter is not a function` on search | Backend returning object not array | Safe array extraction added |
| Day 3 | Input loses focus after every keystroke | Field component defined inside FormPage | Moved Field to module scope |
| Day 5 | `/risks/new` matched by `/risks/:id` | Route order wrong in App.jsx | Placed `/risks/new` before `/:id` |

---

*Tool-02 — Risk Assessment Engine | Capstone Project | Java Developer 3 | Frontend Only*
