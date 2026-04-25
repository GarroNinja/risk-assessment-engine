# Tool-02 — Risk Assessment Engine
> Capstone Project 
---

## Developer Information

| Field | Detail |
|---|---|
| Role | Java Developer 3 |
| Responsibility | Full React Frontend |
| Sprint Duration | 20 working days |
| Demo Day | Friday 9 May 2026 |

---

## Project Overview

The Risk Assessment Engine is an AI-powered web application that enables
organisations to identify, classify, track and mitigate operational risks.
This repository contains the React frontend built during the internship
capstone sprint.

---

## My Contributions

### Day 1 — Frontend Project Setup
**Date:** Monday 20 April 2026
**Task:** Setup React with Vite — install Axios and Tailwind CSS,
set VITE_API_URL in .env, create pages/, components/, services/ folders

**Work completed:**
- Initialised React 18 project using Vite build tool
- Installed and configured Tailwind CSS v3 with PostCSS
- Configured Tailwind with project brand colour `#1B4F8A` and Arial font
- Installed Axios for HTTP communication with the backend API
- Installed React Router DOM for client-side navigation
- Created `.env` file and set `VITE_API_URL=http://localhost:8080/api`
- Created all required folders as per project specification:
  - `src/pages/` — page-level components
  - `src/components/` — reusable UI components
  - `src/services/` — Axios API call functions
  - `src/context/` — React context providers
- Built `AuthContext.jsx` — manages JWT token, login, logout and
  authentication state across the entire application
- Built `ProtectedRoute.jsx` — prevents unauthenticated access,
  redirects to login page automatically
- Built `api.js` — central Axios instance with JWT request interceptor
  and global 401 unauthorised response handler
- Created service files:
  - `authService.js` — login, register, token refresh
  - `riskService.js` — full CRUD, search, stats, CSV export
  - `aiService.js` — all AI microservice endpoint calls
- Created placeholder components for all 6 pages
- Configured all application routes in `App.jsx`

---

### Day 2 — List View Page
**Date:** Tuesday 21 April 2026
**Task:** Build list view page — table with all columns, Axios GET on
mount, loading skeleton while fetching, empty state message

**Work completed:**
- Built complete `ListPage.jsx` — the main risk register data table
- Implemented Axios GET request on component mount to fetch all risks
  from the backend API
- **Table columns implemented:**
  - ID, Title, Category, Severity, Status, Risk Score, Owner,
    Created Date, Actions
- **Loading skeleton** — animated placeholder rows displayed while
  the API request is in progress
- **Empty state** — informative message displayed when no records
  exist or a search returns no results
- **Colour-coded severity badges:**
  - HIGH — red
  - MEDIUM — yellow
  - LOW — green
- **Colour-coded risk score display:**
  - Score 75 and above — red
  - Score 40 to 74 — yellow
  - Score below 40 — green
- **Column sorting** — click any sortable column header to sort
  ascending, click again to reverse to descending
- **Debounced text search** — 300ms delay prevents unnecessary API
  calls while the user is still typing
- **Status filter** — dropdown to filter records by OPEN, MITIGATED
  or CLOSED
- **Severity filter** — dropdown to filter records by HIGH, MEDIUM
  or LOW
- **Clear filters** — button appears automatically when any filter
  is active and resets all filters in one click
- **Pagination controls** — Previous and Next buttons with current
  page number and total pages displayed
- **CSV export** — downloads the full dataset as a CSV file directly
  in the browser
- Row click navigation — clicking any row navigates to the detail page
- Edit and View action buttons per row in the Actions column
- Error banner with Retry button displayed when the API call fails
- Fixed bug: `risks.filter is not a function` error on search
  - Cause: backend search endpoint returning inconsistent response shape
  - Fix: added safe array extraction to handle all possible API
    response structures

---

### Day 3 — Create and Edit Form Page
**Date:** Wednesday 22 April 2026
**Task:** Build create/edit form — controlled inputs for all fields,
client-side validation with inline error messages, submit handler

**Work completed:**
- Built complete `FormPage.jsx` — single component handles both
  create and edit modes
  - Create mode: accessed via `/risks/new`
  - Edit mode: accessed via `/risks/:id/edit`
  - Mode detected automatically using `useParams()`
- **Controlled input fields — all 9 fields:**
  - Risk Title — text input, max 200 characters with live counter
  - Description — textarea
  - Category — dropdown (Operational, Financial, Strategic,
    Compliance, Reputational, Technical, Other)
  - Severity — dropdown (HIGH, MEDIUM, LOW)
  - Status — dropdown (OPEN, MITIGATED, CLOSED)
  - Risk Score — number input, range 0 to 100
  - Owner — text input
  - Mitigation Plan — textarea
  - Due Date — date picker
- **Form sections for structured layout:**
  - Basic Information
  - Classification
  - Score and Ownership
  - Mitigation
- **Client-side validation with inline error messages:**
  - Title: required, minimum 5 characters, maximum 200 characters
  - Description: required, minimum 10 characters
  - Category, Severity, Status: required selection
  - Risk Score: required, must be a number between 0 and 100
  - Owner: required
  - Due Date: cannot be set in the past
- Validation errors appear only after the user has interacted
  with a field — not on initial page load
- Fields re-validate in real time as the user types after first touch
- On form submit — all fields validate simultaneously with an
  error count summary displayed above the submit button
- **Live risk score indicator** — colour bar updates in real time
  as the score value is typed
  - 75 and above — red bar
  - 40 to 74 — yellow bar
  - 0 to 39 — green bar
- **Edit mode behaviour:**
  - Fetches existing record from API on page load
  - Displays animated skeleton while data is loading
  - Pre-populates all 9 fields with existing values
- Submit button displays a spinner animation during the API call
- Success banner displayed on completion with automatic redirect
  to the list page after 1.2 seconds
- Specific error messages for each HTTP failure type:
  - 401 — Session expired, please log in again
  - 403 — Access denied
  - 400 — Invalid data submitted
  - 404 — API endpoint not found
  - Network Error — Cannot reach the server
- Reset button on create form clears all fields and errors
- Fixed critical bug: input fields losing focus after every keystroke
  - Cause: `Field` wrapper component was defined inside `FormPage`,
    causing React to treat it as a new component on every state
    change and unmount and remount the input element
  - Fix: moved `Field` component definition to outside `FormPage`
    so React preserves the component instance across renders

---

### Day 4 — Connect List Page to Backend API
**Date:** Thursday 17 April 2026
**Task:** Connect list page to GET /all API — handle Spring Page
response, implement pagination controls, sort by column headers

**Work completed:**
- Connected list page to real backend `GET /risks/all` endpoint
- Correctly handles Spring Boot Page response object:
  - Reads `content` array — the actual records
  - Reads `totalPages` — for pagination controls
  - Reads `totalElements` — for record count display
  - Reads `number` — current page index
- Safe array extractor handles all API response shapes — plain array,
  Spring Page object, or any nested structure
- Full pagination footer implemented:
  - First, Previous, page number pills, Next, Last buttons
  - Smart ellipsis for large page counts
  - Shows record range — e.g. "Showing 1–10 of 48 risks"
  - Scrolls to top of page on page change
- Sort by column — sends `sortBy` and `sortDir` params to API
- Active sorted column highlighted in blue in the table header
- Sort direction arrow indicator on active column
- Mini inline score bar added to each row for quick visual scanning
- Specific error messages for Network Error, 401 and 403 responses
- Page resets to 0 automatically when search or filters change

---

### Day 5 — Login Page, JWT and Authentication
**Date:** Friday 18 April 2026
**Task:** Build login page — form, store JWT, AuthContext with
isAuthenticated, ProtectedRoute redirects if not logged in

**Work completed:**
- Built complete `LoginPage.jsx` with professional UI
  - Brand logo icon and application name header
  - Email and password controlled input fields
  - Show/hide password toggle button
  - Client-side validation — email format check, password min length
  - Errors shown inline after field is touched
  - Submit spinner animation during API call
  - Specific error messages for 401, 403, 404 and Network Error
  - Demo credentials panel for testing all three roles
  - Auto-redirects to dashboard on successful login
  - Redirects to dashboard if user is already logged in
- Updated `AuthContext.jsx`:
  - Initialises token from localStorage on page load using lazy
    useState initialiser — persists login across browser refresh
  - `login(jwt)` — stores token in both state and localStorage
  - `logout()` — clears token from both state and localStorage
  - `getRole()` — decodes JWT payload to extract user role
  - Exposes `isAuthenticated`, `token`, `role`, `login`, `logout`
  - Throws clear error if `useAuth` is used outside `AuthProvider`
  - Wrapped `login`, `logout`, `getRole` in `useCallback` for
    performance
- Updated `ProtectedRoute.jsx`:
  - Uses React Router `Navigate` instead of `window.location.href`
  - Saves the attempted URL in router state so user is redirected
    back after login
  - Supports optional `requiredRole` prop for role-based access
  - Shows Access Denied page for authenticated but unauthorised users
- Updated `App.jsx`:
  - Login route redirects to dashboard if already authenticated
  - All protected routes wrapped with `ProtectedRoute`
  - Fallback `*` route redirects to dashboard

---
## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | Frontend UI framework |
| Vite | Latest | Development server and build tool |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| Axios | Latest | HTTP client for REST API calls |
| React Router DOM | Latest | Client-side page routing |
| Recharts | Latest | Chart library for analytics dashboard |

---

## Project Folder Structure
'''
frontend/
├── .env                          ← Environment variables
├── .env.example                  ← Environment variable reference
├── .gitignore                    ← Excludes node_modules and .env
├── index.html                    ← HTML entry point
├── package.json                  ← Dependencies and scripts
├── vite.config.js                ← Vite configuration
├── tailwind.config.js            ← Tailwind CSS configuration
├── postcss.config.js             ← PostCSS configuration
└── src/
├── main.jsx                  ← Application entry point
├── App.jsx                   ← Root component and route definitions
├── index.css                 ← Tailwind CSS directives
├── context/
│   └── AuthContext.jsx       ← Authentication state management
├── components/
│   ├── ProtectedRoute.jsx    ← Route authentication guard
│   ├── LoadingSkeleton.jsx   ← Animated loading placeholder
│   ├── EmptyState.jsx        ← No data message component
│   ├── StatusBadge.jsx       ← Colour-coded status label
│   ├── Pagination.jsx        ← Page navigation controls
│   ├── ErrorBoundary.jsx     ← React error boundary wrapper
│   └── AiPanel.jsx           ← AI analysis panel (Day 8)
├── pages/
│   ├── LoginPage.jsx         ← complete: Day 5
│   ├── ListPage.jsx          ← Complete: Day 2
│   ├── DetailPage.jsx        ← Planned: Day 7
│   ├── FormPage.jsx          ← Complete: Day 3
│   ├── DashboardPage.jsx     ← Planned: Day 6
│   └── AnalyticsPage.jsx     ← Planned: Day 11
└── services/
├── api.js                ← Axios instance and interceptors
├── riskService.js        ← Risk entity API functions
├── authService.js        ← Authentication API functions
└── aiService.js          ← AI microservice API functions

'''
---

## Environment Variables

| Variable | Description | Example Value |
|---|---|---|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:8080/api` |

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
git clone [repository URL provided by mentor]
cd your-project-folder/frontend
```

**Step 2 — Install dependencies**
```bash
npm install
```

**Step 3 — Create environment file**
```bash
cp .env.example .env
```

**Step 4 — Configure environment variables**

Open `.env` and set the following:
VITE_API_URL=http://localhost:8080/api

**Step 5 — Start the development server**
```bash
npm run dev
```

**Step 6 — Open in browser**
http://localhost:5173

---

## Application Routes

| Route | Page | Status |
|---|---|---|
| `/login` | Login page | Planned — Day 5 |
| `/` | Dashboard with KPI cards | Planned — Day 6 |
| `/risks` | Risk register list table | Complete — Day 2 |
| `/risks/new` | Create new risk form | Complete — Day 3 |
| `/risks/:id` | Risk detail view | Planned — Day 7 |
| `/risks/:id/edit` | Edit existing risk form | Complete — Day 3 |
| `/analytics` | Analytics and charts | Planned — Day 11 |

---

## Daily Commit Log

| Day | Date | Commit Message |
|---|---|---|
| Day 1 | Mon 20 Apr 2026 | Day 1 — React Vite setup, Tailwind CSS, Axios, folder structure, AuthContext |
| Day 2 | Tue 21 Apr 2026 | Day 2 — List view page, table, skeleton loader, empty state, search, filter, pagination, sort |
| Day 3 | Wed 22 Apr 2026 | Day 3 — Create/edit form, controlled inputs, client-side validation, submit handler |

---

## Issues Resolved

| Day | Issue | Root Cause | Resolution |
|---|---|---|---|
| Day 1 | `npx tailwindcss init -p` failing with npm error | Tailwind v4 changed the initialisation command and is incompatible with this project setup | Installed `tailwindcss@3` explicitly |
| Day 2 | `risks.filter is not a function` crash when using search | Backend search endpoint returning an object instead of an array in some cases | Added defensive array extraction logic to handle all possible response shapes from the API |
| Day 3 | All input fields losing focus after typing a single character | `Field` wrapper component was defined inside `FormPage`, causing React to create a new component type on every state update and unmount the focused input | Moved `Field` component definition to module scope outside `FormPage` |

---

*Tool-02 — Risk Assessment Engine | Capstone *