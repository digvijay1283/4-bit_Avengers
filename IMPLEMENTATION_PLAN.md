# VitalAI — Implementation Plan

> **Preventive Health Companion** | Hackathon MVP  
> **Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · MongoDB (Mongoose) · Google Fit API  
> **Repo:** [4-bit_Avengers](https://github.com/digvijay1283/4-bit_Avengers)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure (Final)](#2-directory-structure-final)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Phase 0 — Project Setup & Auth](#phase-0--project-setup--auth)
5. [Phase 1 — Profile Module](#phase-1--profile-module)
6. [Phase 2 — Wearable Integration (Google Fit)](#phase-2--wearable-integration-google-fit)
7. [Phase 3 — Dashboard (Real-Time Health View)](#phase-3--dashboard-real-time-health-view)
8. [Phase 4 — Medicine Reminder System (OCR + Scheduler)](#phase-4--medicine-reminder-system-ocr--scheduler)
9. [Phase 5 — AI Chatbot (Health Intelligence Engine)](#phase-5--ai-chatbot-health-intelligence-engine)
10. [Phase 6 — Mental Health Tracker](#phase-6--mental-health-tracker)
11. [Phase 7 — Smart Alerts Module](#phase-7--smart-alerts-module)
12. [Phase 8 — Smart Reports](#phase-8--smart-reports)
13. [Phase 9 — Upload Past Medical Reports](#phase-9--upload-past-medical-reports)
14. [Data Models (MongoDB Collections)](#data-models-mongodb-collections)
15. [API Routes Summary](#api-routes-summary)
16. [Environment Variables](#environment-variables)
17. [Implementation Checklist](#implementation-checklist)

## Database Decision Update (MongoDB)

This project now uses **MongoDB Atlas + Mongoose** as the primary database.

- Source of truth connection is `MONGODB_URI` in `.env.local`
- Database name is controlled with `MONGODB_DB_NAME`
- Current user model lives in `models/User.ts`
- Connection utility lives in `lib/mongodb.ts`
- Index bootstrap endpoint: `GET /api/health/db`

### User Index Strategy (Implemented)

- `uq_users_email` → unique index on `email`
- `uq_users_phone_sparse` → unique sparse index on `phone`
- `idx_users_role_status` → compound index on `role + status`
- `idx_users_createdAt_desc` → descending index on `createdAt`

These indexes are defined at schema level in `models/User.ts` and synced via `User.ensureIndexes()`.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│  ┌────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth  │  │ Dashboard │  │ Chatbot  │  │ Reports  │  │
│  └───┬────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘  │
│      │             │              │              │        │
│  ┌───┴─────────────┴──────────────┴──────────────┴───┐   │
│  │              Next.js API Routes (server)           │   │
│  └───┬─────────────┬──────────────┬──────────────┬───┘   │
└──────┼─────────────┼──────────────┼──────────────┼───────┘
       │             │              │              │
  ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
  │MongoDB  │  │Google Fit │  │  OCR    │  │  AI/LLM   │
  │(Mongoose│  │   API     │  │(Tesser- │  │(Gemini /  │
  │ + Atlas)│  │           │  │ act.js) │  │ OpenAI)   │
  └─────────┘  └───────────┘  └─────────┘  └───────────┘
```

**Key design decisions:**

- **Next.js App Router** — file-based routing, server components by default
- **MongoDB Atlas + Mongoose** — primary database with schema-level indexes and validation
- **Server-side AI calls** — all LLM/OCR calls happen in API routes (secrets never leak to client)
- **Google Fit REST API** — OAuth 2.0 token flow, data fetched server-side and cached in MongoDB

---

## 2. Directory Structure (Actual)

> ✅ = exists · ⬜ = planned

```
D:\Cavista\
│
├── app/
│   ├── globals.css                   ✅ Theme tokens, Tailwind base
│   ├── layout.tsx                    ✅ Root layout (Manrope font, suppressHydrationWarning)
│   ├── page.tsx                      ✅ Landing / Home page
│   │
│   ├── (auth)/                       ✅ Auth route group
│   │   ├── layout.tsx                ✅ Split-screen branding layout
│   │   ├── login/page.tsx            ✅ Login form → /api/auth/login
│   │   └── signup/page.tsx           ✅ Signup form → /api/auth/signup
│   │
│   ├── (dashboard)/                  ✅ Authenticated app shell
│   │   ├── layout.tsx                ✅ Header + MobileNav shell
│   │   ├── dashboard/page.tsx        ✅ /dashboard → health overview + chat modal
│   │   ├── medi-reminder/page.tsx    ✅ /medi-reminder → medicine management
│   │   ├── chat/page.tsx             ✅ /chat → standalone chat page
│   │   ├── profile/page.tsx          ⬜ /profile
│   │   ├── mental-health/page.tsx    ⬜ /mental-health
│   │   ├── reports/page.tsx          ⬜ /reports
│   │   └── upload/page.tsx           ⬜ /upload → past medical reports
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        ✅ POST — verify creds, set JWT cookie
│       │   ├── signup/route.ts       ✅ POST — create user, set JWT cookie
│       │   └── me/route.ts           ✅ GET — read JWT, return userId/email/role
│       ├── health/
│       │   └── db/route.ts           ✅ GET — MongoDB health-check + index sync
│       ├── chat/
│       │   └── route.ts              ✅ POST — proxy to chatbot webhook
│       ├── ocr/
│       │   └── extract/route.ts      ✅ POST — OCR extraction
│       ├── twilio/
│       │   └── route.ts              ✅ POST — SMS alert dispatch
│       ├── google-fit/route.ts       ⬜ Wearable data fetch
│       ├── reports/route.ts          ⬜ PDF report generation
│       └── alerts/route.ts           ⬜ Alert evaluation
│
├── components/
│   ├── ui/                           ✅ Button, Card, Badge, Spinner, ProgressBar
│   ├── layout/                       ✅ Header, Footer, MobileNav
│   ├── dashboard/                    ✅ HeartRateCard, StepsCard, SleepCard,
│   │                                    BloodPressureCard, RiskScoreBadge,
│   │                                    WeeklyTrendChart, LiveMonitoring,
│   │                                    HeroSection, MissionSection, SpecialistGrid,
│   │                                    ProfileSnippet, RemindersWidget, DailyInsight
│   ├── medicine/                     ✅ MedicineCard, AudioAlertToggle,
│   │                                    DailyProgressWidget, LowStockAlert,
│   │                                    MainTabSwitcher, SubTabBar, MedicalTestCard
│   ├── chat/                         ✅ ChatWindow, ChatMessage, ChatInput,
│   │                                    ChatDashboardModal
│   ├── mental-health/                ⬜ MoodScore, StressIndicator, BreathingExercise
│   ├── reports/                      ⬜ ReportCard, ReportViewer
│   └── profile/                      ⬜ ProfileForm, EmergencyContacts
│
├── models/
│   └── User.ts                       ✅ Mongoose schema, 5 named indexes, userId (UUID)
│
├── hooks/
│   ├── index.ts                      ✅
│   ├── useGoogleFit.ts              ⬜
│   ├── useMedicine.ts               ⬜
│   └── useChat.ts                   ⬜
│
├── lib/
│   ├── mongodb.ts                    ✅ Mongoose connection (global cache)
│   ├── auth.ts                       ✅ hashPassword, comparePassword, signAuthToken, verifyAuthToken
│   ├── medicalReportParser.ts        ✅ Parse OCR output → structured data
│   ├── uuid.ts                       ✅ Client-safe randomUUID helper
│   ├── utils.ts                      ✅ cn(), formatDate()
│   ├── google-fit.ts                 ⬜ Google Fit API client
│   ├── ocr.ts                        ⬜ OCR processing logic
│   ├── ai.ts                         ⬜ LLM client (Gemini / OpenAI)
│   └── pdf.ts                        ⬜ PDF report generation
│
├── services/
│   ├── api.ts                        ← Base fetch client (existing)
│   ├── auth.service.ts               ← Auth operations
│   ├── health.service.ts             ← Health data CRUD
│   ├── medicine.service.ts           ← Medicine CRUD
│   └── report.service.ts             ← Report generation
│
├── stores/
│   └── index.ts                      ← Zustand stores (auth, health, UI)
│
├── types/
│   ├── index.ts                      ← Shared types (existing)
│   ├── health.ts                     ← HealthData, Vitals, RiskScore
│   ├── medicine.ts                   ← Medicine, Prescription, Reminder
│   ├── chat.ts                       ← ChatMessage, ChatSession
│   └── report.ts                     ← Report, ReportType
│
├── constants/
│   └── index.ts                      ← Routes, thresholds, config (existing)
│
└── public/
    ├── icons/                        ← App icons, favicons
    └── images/                       ← Static images
```

---

## 3. Tech Stack & Dependencies

### Installed & Active ✅

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | Framework (App Router + Turbopack) |
| `react` / `react-dom` | 19.2.4 | UI |
| `typescript` | 5.9.3 | Type safety (strict mode) |
| `tailwindcss` + `@tailwindcss/postcss` | 4.2.0 | Styling |
| `mongoose` | 9.2.1 | MongoDB ODM (Atlas) |
| `bcryptjs` | 3.0.3 | Password hashing (12 rounds) |
| `jsonwebtoken` | 9.0.3 | JWT auth (7-day httpOnly cookies) |
| `lucide-react` | latest | Icons |
| `recharts` | latest | Dashboard charts |
| `framer-motion` | latest | Animations |
| `clsx` | latest | Conditional classes |
| `geist` | latest | Geist font |

### Still To Install ⬜

| Package | Purpose | Command |
|---------|---------|---------|
| `zustand` | State management | `npm i zustand` |
| `react-hot-toast` | Toast notifications | `npm i react-hot-toast` |
| `@react-pdf/renderer` | PDF report generation | `npm i @react-pdf/renderer` |
| `date-fns` | Date utilities | `npm i date-fns` |
| `twilio` | SMS alerts (API route exists) | `npm i twilio` |

---

## Phase 0 — Project Setup & Auth ✅

> **Goal:** MongoDB + JWT auth, email/password login, protected dashboard shell.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|--------|
| 0.1 | Project scaffold — Next.js 16 + Tailwind 4 + TypeScript | ✅ | root config files |
| 0.2 | MongoDB Atlas connection utility + global cache | ✅ | `lib/mongodb.ts` |
| 0.3 | User model with 5 named indexes, `userId` (UUID) | ✅ | `models/User.ts` |
| 0.4 | Password hashing + JWT sign/verify helpers | ✅ | `lib/auth.ts` |
| 0.5 | Signup API route | ✅ | `app/api/auth/signup/route.ts` |
| 0.6 | Login API route | ✅ | `app/api/auth/login/route.ts` |
| 0.7 | Current user API route (JWT → userId) | ✅ | `app/api/auth/me/route.ts` |
| 0.8 | DB health-check + index sync endpoint | ✅ | `app/api/health/db/route.ts` |
| 0.9 | Auth layout (split-screen branding) | ✅ | `app/(auth)/layout.tsx` |
| 0.10 | Login page (form, error, redirect) | ✅ | `app/(auth)/login/page.tsx` |
| 0.11 | Signup page (form, error, redirect) | ✅ | `app/(auth)/signup/page.tsx` |
| 0.12 | Dashboard shell layout (Header + MobileNav) | ✅ | `app/(dashboard)/layout.tsx` |
| 0.13 | Route guard / middleware | ⬜ | `middleware.ts` |
| 0.14 | `useAuth` client-side hook | ⬜ | `hooks/useAuth.ts` |
| 0.15 | Zustand auth store | ⬜ | `stores/auth.store.ts` |

### `lib/auth.ts` — Current Implementation

```ts
// hashPassword(plain) → bcrypt hash (12 rounds)
// comparePassword(plain, hashed) → boolean
// signAuthToken({ sub, email, role }) → JWT (7 days, httpOnly cookie)
// verifyAuthToken(token) → AuthTokenPayload
```

---

## Phase 1 — Profile Module ⬜

> **Goal:** User profile CRUD, emergency contacts, basic health info.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 1.1 | Define `UserProfile` type | ⬜ | `types/index.ts` |
| 1.2 | MongoDB profile helper (upsert on signup) | ⬜ | `lib/mongodb.ts` |
| 1.3 | Build ProfileForm component | ⬜ | `components/profile/ProfileForm.tsx` |
| 1.4 | Build EmergencyContacts component | ⬜ | `components/profile/EmergencyContacts.tsx` |
| 1.5 | Build Profile page | ⬜ | `app/(dashboard)/profile/page.tsx` |
| 1.6 | Auto-populate profile doc on first signup | ⬜ | `app/api/auth/signup/route.ts` |

### MongoDB Document: `userProfiles` collection — `{uid}`

```ts
type UserProfile = {
  uid: string;
  name: string;
  email: string;
  age: number;
  height: number;       // cm
  weight: number;       // kg
  bloodGroup: string;
  chronicConditions: string[];
  emergencyContacts: {
    name: string;
    phone: string;
    relation: string;
  }[];
  googleFitConnected: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

---

## Phase 2 — Wearable Integration (Google Fit)

> **Goal:** OAuth to Google Fit, fetch heart rate / steps / sleep / calories, store in MongoDB.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 2.1 | Enable Google Fitness API in GCP console | GCP Console |
| 2.2 | Configure OAuth consent screen + credentials | GCP Console |
| 2.3 | Build OAuth flow (redirect → callback → store tokens) | `app/api/google-fit/route.ts` |
| 2.4 | Build Google Fit API client | `lib/google-fit.ts` |
| 2.5 | Fetch data types: heart rate, steps, calories, sleep | `lib/google-fit.ts` |
| 2.6 | Store fetched data in MongoDB | `lib/mongodb.ts` |
| 2.7 | Build `useGoogleFit` hook | `hooks/useGoogleFit.ts` |
| 2.8 | Add "Connect Google Fit" button in Profile | `components/profile/ProfileForm.tsx` |

### Google Fit API Endpoints

| Data Type | API Scope |
|-----------|-----------|
| Heart Rate | `fitness.heart_rate.read` |
| Steps | `fitness.activity.read` |
| Calories | `fitness.activity.read` |
| Sleep | `fitness.sleep.read` |

### Data Flow

```
User taps "Connect" → OAuth redirect → Google consent
→ Callback with auth code → Exchange for tokens
→ Store tokens in MongoDB (encrypted)
→ Periodic fetch via API route (or on dashboard load)
→ Store vitals in MongoDB: `health_data` collection, keyed by `uid + date`
```

### MongoDB Document: `healthData` collection — `{uid, date}`

```ts
type DailyHealth = {
  date: string;
  heartRate: {
    avg: number;
    min: number;
    max: number;
    readings: { time: string; value: number }[];
  };
  steps: number;
  distance: number;       // meters
  caloriesBurned: number;
  sleep: {
    totalMinutes: number;
    deepMinutes: number;
    lightMinutes: number;
    remMinutes: number;
    awakeMinutes: number;
  };
  riskScore: "low" | "medium" | "high";
  updatedAt: Timestamp;
};
```

---

## Phase 3 — Dashboard (Real-Time Health View)

> **Goal:** Display live vitals, trends, risk score.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 3.1 | Define health data types | `types/health.ts` |
| 3.2 | Build HeartRateCard (live BPM + sparkline) | `components/dashboard/HeartRateCard.tsx` |
| 3.3 | Build StepsCard (progress ring) | `components/dashboard/StepsCard.tsx` |
| 3.4 | Build SleepCard (bar breakdown) | `components/dashboard/SleepCard.tsx` |
| 3.5 | Build CalorieCard | `components/dashboard/CalorieCard.tsx` |
| 3.6 | Build RiskScoreBadge (Low/Medium/High) | `components/dashboard/RiskScoreBadge.tsx` |
| 3.7 | Build WeeklyTrendChart (Recharts line chart) | `components/dashboard/WeeklyTrendChart.tsx` |
| 3.8 | Build Chart wrapper component | `components/ui/Chart.tsx` |
| 3.9 | Assemble Dashboard page | `app/(dashboard)/dashboard/page.tsx` |
| 3.10 | Implement auto-refresh (poll every 5 min) | `hooks/useGoogleFit.ts` |
| 3.11 | Red highlight for abnormal readings | CSS conditional in cards |

### Risk Score Calculation (MVP — rule-based)

```
IF heartRate.avg > 100 OR heartRate.avg < 50  → HIGH
IF sleep.totalMinutes < 300                   → bump score
IF steps < 2000                               → bump score
IF missed_medicines > 2                       → bump score

Score mapping:
  0-1 flags  → LOW
  2-3 flags  → MEDIUM
  4+  flags  → HIGH
```

---

## Phase 4 — Medicine Reminder System (OCR + Scheduler)

> **Goal:** Upload prescription → OCR extract → set reminders → TTS + notifications.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 4.1 | Define Medicine & Reminder types | `types/medicine.ts` |
| 4.2 | Build PrescriptionUpload (image upload + preview) | `components/medicine/PrescriptionUpload.tsx` |
| 4.3 | Build OCR API route (Tesseract.js or Gemini Vision) | `app/api/ocr/route.ts` |
| 4.4 | Parse OCR output → extract medicine name, dosage, frequency | `lib/ocr.ts` |
| 4.5 | Build MedicineList (CRUD) | `components/medicine/MedicineList.tsx` |
| 4.6 | Build ReminderCard (Taken / Snooze / Reschedule) | `components/medicine/ReminderCard.tsx` |
| 4.7 | Implement browser notification + TTS | `lib/notifications.ts` |
| 4.8 | Build AdherenceChart (monthly %) | `components/medicine/AdherenceChart.tsx` |
| 4.9 | Build Medicine page | `app/(dashboard)/medicine/page.tsx` |
| 4.10 | Store reminders + compliance in MongoDB | `services/medicine.service.ts` |

### OCR Strategy (MVP)

**Option A — Tesseract.js (client-side, free)**
```
Upload image → Tesseract.js OCR → raw text
→ Send raw text to AI → structured JSON extraction
```

**Option B — Gemini Vision API (server-side, better accuracy)**
```
Upload image → Send to Gemini Vision API
→ Prompt: "Extract medicine names, dosages, and frequency from this prescription"
→ Structured JSON response
```

> **Recommendation:** Use **Option B** (Gemini Vision) for hackathon — better accuracy, less parsing code.

### MongoDB: `medicines` collection — `{uid, medicineId}`

```ts
type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;          // "twice daily", "every 8 hours"
  times: string[];             // ["08:00", "20:00"]
  prescriptionImageUrl?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: Timestamp;
};

type MedicineLog = {
  medicineId: string;
  scheduledTime: string;
  status: "taken" | "missed" | "snoozed";
  actionTime?: string;
  date: string;
};
```

### TTS Implementation

```ts
function announceMedicine(name: string) {
  const utterance = new SpeechSynthesisUtterance(
    `It's time to take your medicine: ${name}`
  );
  speechSynthesis.speak(utterance);
}
```

---

## Phase 5 — AI Chatbot (Health Intelligence Engine) ✅

> **Goal:** Conversational health companion via external AI webhook with rich formatted responses.

### Tasks

| # | Task | Status | File(s) |
|---|------|--------|---------|
| 5.1 | Chat API proxy route (webhook integration) | ✅ | `app/api/chat/route.ts` |
| 5.2 | `ChatWindow` — message state, auto-scroll, typing indicator | ✅ | `components/chat/ChatWindow.tsx` |
| 5.3 | `ChatMessage` — rich output parser (headings, lists, bold) | ✅ | `components/chat/ChatMessage.tsx` |
| 5.4 | `ChatInput` — textarea, Enter-to-send, Shift+Enter newline | ✅ | `components/chat/ChatInput.tsx` |
| 5.5 | `ChatDashboardModal` — floating FAB + blurred modal overlay | ✅ | `components/chat/ChatDashboardModal.tsx` |
| 5.6 | Chat page (standalone) | ✅ | `app/(dashboard)/chat/page.tsx` |
| 5.7 | `lib/uuid.ts` — client-safe UUID helper | ✅ | `lib/uuid.ts` |
| 5.8 | `useChat` hook | ⬜ | `hooks/useChat.ts` |
| 5.9 | Context injection (user vitals + medicine data) | ⬜ | `app/api/chat/route.ts` |

### Webhook Contract

```ts
// Request payload → POST https://synthomind.cloud/webhook/chatbot-basic
{ chatId: string; userId: string; sessionId: string; userChat: string }

// Response (single object or array)
{ output: string } | { output: string }[]
```

### Output Formatting (implemented in `ChatMessage.tsx`)

The `parseContent()` function converts raw bot text to structured blocks:
- `**Heading**` / `Short line:` → `<h4>` heading
- `- item` / `• item` → `<ul>` bullet list
- `1. item` / `1) item` → `<ol>` numbered list
- `**bold**` inline → `<strong>`
- Remaining lines → `<p>` paragraph

---

## Phase 6 — Mental Health Tracker

> **Goal:** Track mood, stress, sleep deprivation; suggest exercises.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 6.1 | Build MoodScore component (emoji picker + daily score) | `components/mental-health/MoodScore.tsx` |
| 6.2 | Build StressIndicator (gauge visualization) | `components/mental-health/StressIndicator.tsx` |
| 6.3 | Build BreathingExercise component (animated guide) | `components/mental-health/BreathingExercise.tsx` |
| 6.4 | Implement sentiment analysis on chat logs | `app/api/chat/route.ts` |
| 6.5 | Calculate stress score from sleep + sentiment | `lib/ai.ts` |
| 6.6 | Build Mental Health page | `app/(dashboard)/mental-health/page.tsx` |
| 6.7 | Store mood logs in MongoDB | `models/MentalHealth.ts` |

### Stress Score Calculation (MVP)

```
Inputs:
  - Sleep quality (from Google Fit)
  - Chat sentiment (from AI analysis)
  - Self-reported mood score (1-10)

Weights:
  sleep_factor = (sleep < 6hrs) ? 0.4 : 0.1
  sentiment_factor = negative_ratio * 0.3
  mood_factor = (10 - mood_score) / 10 * 0.3

stress_score = (sleep_factor + sentiment_factor + mood_factor) * 100
```

### MongoDB: `mentalHealth` collection — `{uid, date}`

```ts
type MentalHealthEntry = {
  date: string;
  moodScore: number;          // 1-10
  stressLevel: "low" | "moderate" | "high";
  stressScore: number;        // 0-100
  sentimentSummary?: string;
  sleepQuality: "poor" | "fair" | "good";
  exerciseSuggested?: string;
  createdAt: Timestamp;
};
```

---

## Phase 7 — Smart Alerts Module

> **Goal:** Trigger alerts for anomalies — in-app + push notifications.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 7.1 | Define alert rules (thresholds) | `constants/index.ts` |
| 7.2 | Build alert evaluation engine | `lib/alerts.ts` |
| 7.3 | Build in-app notification UI (toast + bell icon) | `components/ui/` |
| 7.4 | Implement Push Notifications (Web Push API) | `lib/notifications.ts` |
| 7.5 | Build alerts API route | `app/api/alerts/route.ts` |
| 7.6 | Store alert history in MongoDB | `models/Alert.ts` |

### Alert Triggers

| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Heart rate too high | > 120 bpm (resting) | 🔴 Critical |
| Heart rate too low | < 50 bpm | 🔴 Critical |
| Missed medicine | > 30 min past scheduled | 🟡 Warning |
| Sleep deprivation | < 4 hours | 🔴 Critical |
| Low steps (inactivity) | < 500 steps by 6 PM | 🟡 Warning |
| High stress trend | 3+ consecutive high days | 🟡 Warning |

---

## Phase 8 — Smart Reports

> **Goal:** Generate weekly/monthly PDF health reports.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 8.1 | Define Report types | `types/report.ts` |
| 8.2 | Build report data aggregation logic | `services/report.service.ts` |
| 8.3 | Build PDF template with @react-pdf/renderer | `lib/pdf.ts` |
| 8.4 | Build report API route | `app/api/reports/route.ts` |
| 8.5 | Build ReportCard component | `components/reports/ReportCard.tsx` |
| 8.6 | Build ReportViewer (in-app preview) | `components/reports/ReportViewer.tsx` |
| 8.7 | Build Reports page | `app/(dashboard)/reports/page.tsx` |

### Report Contents

| Section | Data Source |
|---------|-----------|
| Vitals Summary | Google Fit data (avg/min/max) |
| Steps & Activity | Daily step counts |
| Sleep Analysis | Sleep duration breakdown |
| Medicine Adherence | % taken vs scheduled |
| Risk Score Trend | Daily risk scores plotted |
| AI Recommendations | LLM-generated summary |

---

## Phase 9 — Upload Past Medical Reports

> **Goal:** Upload lab reports, OCR extract values, AI trend analysis.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 9.1 | Build file upload component | `components/ui/FileUpload.tsx` |
| 9.2 | Upload file to cloud storage (Cloudinary / S3 / GridFS) | `services/health.service.ts` |
| 9.3 | OCR extract lab values (Gemini Vision) | `app/api/ocr/route.ts` |
| 9.4 | Store extracted values in MongoDB | `models/LabReport.ts` |
| 9.5 | Build trend comparison (past vs present) | `components/reports/` |
| 9.6 | AI analysis of trends | `app/api/chat/route.ts` |
| 9.7 | Build Upload page | `app/(dashboard)/upload/page.tsx` |

### Extracted Lab Values

```ts
type LabReport = {
  id: string;
  uploadDate: string;
  reportDate: string;
  fileUrl: string;
  extractedValues: {
    label: string;       // "Fasting Blood Sugar"
    value: number;
    unit: string;        // "mg/dL"
    normalRange: string; // "70-100"
    status: "normal" | "high" | "low";
  }[];
  aiSummary?: string;
};
```

---

## Data Models (MongoDB Collections)

```
mongodb: cavista
├── users                              ← User (5 named indexes, userId UUID)
├── healthData                         ← DailyHealth (uid + date compound key)
├── medicines                          ← Medicine + MedicineLog (uid indexed)
├── mentalHealth                       ← MentalHealthEntry (uid + date)
├── labReports                         ← LabReport (uid + uploadDate)
├── chatSessions                       ← ChatSession (uid + sessionId)
├── alerts                             ← Alert history (uid + createdAt)
└── reports                            ← GeneratedReport (uid + type + date)
```

---

## API Routes Summary

### Implemented ✅

| Method | Route | Purpose |
|--------|-------|--------|
| `POST` | `/api/auth/signup` | Register new user, issue JWT cookie |
| `POST` | `/api/auth/login` | Login, issue JWT cookie |
| `GET` | `/api/auth/me` | Read JWT cookie → return current user |
| `GET` | `/api/health/db` | MongoDB health-check + index sync |
| `POST` | `/api/chat` | Proxy to `synthomind.cloud` chatbot webhook |
| `POST` | `/api/ocr/extract` | OCR extraction + medical report parsing |
| `POST` | `/api/twilio` | SMS alert dispatch |

### Planned ⬜

| Method | Route | Purpose |
|--------|-------|--------|
| `GET` | `/api/google-fit` | Fetch latest wearable data |
| `POST` | `/api/google-fit/connect` | Google Fit OAuth initiation |
| `GET` | `/api/reports/weekly` | Generate weekly health report |
| `GET` | `/api/reports/monthly` | Generate monthly health report |
| `POST` | `/api/alerts/evaluate` | Evaluate alert threshold conditions |

---

## Environment Variables

> All variables live in `.env.local` (single file — `.env.example` removed).

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Chatbot Webhook
CHATBOT_WEBHOOK_URL=https://synthomind.cloud/webhook/chatbot-basic

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cavista?retryWrites=true&w=majority
MONGODB_DB_NAME=cavista

# Auth
JWT_SECRET=<strong-random-secret>

# Planned — add when integrating
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM_NUMBER=
# GOOGLE_GENERATIVE_AI_API_KEY=
```

---

## Implementation Checklist

> Legend: ✅ Done · 🔄 Partial · ⬜ Not started

### Phase 0 — Setup & Auth ✅
- ✅ Project scaffold (Next.js 16 + Tailwind 4 + TypeScript 5 + Turbopack)
- ✅ MongoDB Atlas + Mongoose — `lib/mongodb.ts`, `models/User.ts` (5 named indexes)
- ✅ Password hashing — `lib/auth.ts` (bcryptjs, 12 rounds)
- ✅ JWT auth — `lib/auth.ts` (sign + verify, 7-day expiry, numeric `expiresIn`)
- ✅ `app/api/auth/signup/route.ts` — create user, issue httpOnly JWT cookie
- ✅ `app/api/auth/login/route.ts` — verify credentials, set cookie
- ✅ `app/api/auth/me/route.ts` — read JWT cookie, return `userId/email/role`
- ✅ `app/api/health/db/route.ts` — DB connection health-check + index sync
- ✅ Login page — `app/(auth)/login/page.tsx` (client form, redirect on success)
- ✅ Signup page — `app/(auth)/signup/page.tsx` (client form, redirect on success)
- ✅ Auth layout — `app/(auth)/layout.tsx` (split-screen, VitalAI branding panel)
- ✅ Dashboard layout — `app/(dashboard)/layout.tsx` (Header + MobileNav shell)
- ✅ `components/layout/Header.tsx`, `Footer.tsx`, `MobileNav.tsx`
- ⬜ Route guard / middleware (`middleware.ts`)
- ⬜ `hooks/useAuth.ts` — client-side auth state hook
- ⬜ Zustand auth store

### Phase 1 — Profile ⬜
- ⬜ `UserProfile` type in `types/index.ts`
- ⬜ `ProfileForm` component
- ⬜ `EmergencyContacts` component
- ⬜ Profile page — `app/(dashboard)/profile/page.tsx`
- ⬜ Auto-populate profile on first signup

### Phase 2 — Wearable Integration (Google Fit) ⬜
- ⬜ Enable Google Fitness API in GCP
- ⬜ OAuth flow for Google Fit
- ⬜ `lib/google-fit.ts` — API client
- ⬜ Fetch heart rate, steps, calories, sleep
- ⬜ Store fetched data in MongoDB
- ⬜ "Connect Google Fit" button in Profile

### Phase 3 — Dashboard ✅
- ✅ `HeartRateCard.tsx`
- ✅ `StepsCard.tsx`
- ✅ `SleepCard.tsx`
- ✅ `BloodPressureCard.tsx`
- ✅ `RiskScoreBadge.tsx`
- ✅ `WeeklyTrendChart.tsx`
- ✅ `LiveMonitoring.tsx` (real-time vitals panel)
- ✅ `HeroSection.tsx`, `MissionSection.tsx`, `SpecialistGrid.tsx`
- ✅ `ProfileSnippet.tsx`, `RemindersWidget.tsx`, `DailyInsight.tsx` (sidebar widgets)
- ✅ Dashboard page assembled — `app/(dashboard)/dashboard/page.tsx`
- ⬜ CalorieCard (separate component)
- ⬜ Auto-refresh polling (every 5 min)

### Phase 4 — Medicine Reminders 🔄
- ✅ Medicine page — `app/(dashboard)/medi-reminder/page.tsx`
- ✅ `MedicineCard.tsx` — card UI per medicine
- ✅ `AudioAlertToggle.tsx` — audio alert on/off
- ✅ `DailyProgressWidget.tsx` — today's adherence widget
- ✅ `LowStockAlert.tsx` — low stock warning component
- ✅ `MainTabSwitcher.tsx` + `SubTabBar.tsx` — tab navigation
- ✅ `MedicalTestCard.tsx` — test/lab result card
- ✅ OCR API route — `app/api/ocr/extract/route.ts`
- ✅ `lib/medicalReportParser.ts` — parse OCR output to structured data
- ⬜ `PrescriptionUpload` component (drag-and-drop image upload)
- ⬜ `AdherenceChart` (monthly % chart)
- ⬜ Browser push notifications + TTS

### Phase 5 — AI Chatbot ✅
- ✅ Chat API route — `app/api/chat/route.ts` (proxies to `https://synthomind.cloud/webhook/chatbot-basic`)
- ✅ `ChatWindow.tsx` — message state, auto-scroll, typing indicator
- ✅ `ChatMessage.tsx` — rich formatter (headings, bullets, numbered lists, bold)
- ✅ `ChatInput.tsx` — textarea, Enter-to-send, Shift+Enter for newline
- ✅ `ChatDashboardModal.tsx` — floating FAB + blurred transparent modal overlay
- ✅ Chat page — `app/(dashboard)/chat/page.tsx`
- ✅ `lib/uuid.ts` — client-safe UUID helper
- ⬜ `useChat` hook
- ⬜ Context injection (user vitals + medicine data passed to AI)

### Phase 6 — Mental Health ⬜
- ⬜ `MoodScore` component
- ⬜ `StressIndicator`
- ⬜ `BreathingExercise`
- ⬜ Sentiment analysis integration
- ⬜ Stress score calculation
- ⬜ Mental Health page — `app/(dashboard)/mental-health/page.tsx`

### Phase 7 — Smart Alerts 🔄
- ✅ `AudioAlertToggle.tsx` — audio alerts for medicine reminders
- ✅ `app/api/twilio/` — SMS alert dispatch via Twilio
- ✅ `LowStockAlert.tsx` — in-component low-stock flag
- ⬜ `lib/alerts.ts` — alert threshold evaluation engine
- ⬜ In-app toast notification UI
- ⬜ Web Push API setup
- ⬜ Alert history stored in MongoDB

### Phase 8 — Smart Reports ⬜
- ⬜ Report data aggregation service
- ⬜ PDF template (`lib/pdf.ts`)
- ⬜ Report API routes (`/api/reports/weekly`, `/api/reports/monthly`)
- ⬜ `ReportCard` + `ReportViewer` components
- ⬜ Reports page — `app/(dashboard)/reports/page.tsx`

### Phase 9 — Medical Report Upload 🔄
- ✅ `app/api/ocr/extract/route.ts` — OCR extraction endpoint
- ✅ `lib/medicalReportParser.ts` — structured data parser from OCR output
- ⬜ File upload UI component
- ⬜ Cloud storage integration (Cloudinary / S3 / GridFS)
- ⬜ Lab value trend comparison UI
- ⬜ Upload page — `app/(dashboard)/upload/page.tsx`

---

## Suggested Implementation Order (Hackathon Sprint)

| Priority | Phase | Status | Remaining |
|----------|-------|--------|-----------|
| 🔴 P0 | Phase 0 — Auth | ✅ Done | Route guard / middleware |
| 🔴 P0 | Phase 3 — Dashboard | ✅ Done | CalorieCard, auto-refresh |
| 🔴 P0 | Phase 5 — AI Chatbot | ✅ Done | Context injection, useChat hook |
| 🟠 P1 | Phase 4 — Medicine | 🔄 Partial | PrescriptionUpload, AdherenceChart, TTS |
| 🟠 P1 | Phase 7 — Alerts | 🔄 Partial | Alert engine, push notifications |
| 🟠 P1 | Phase 9 — Upload Reports | 🔄 Partial | Upload UI, storage integration |
| 🟡 P2 | Phase 1 — Profile | ⬜ Next | Full profile page + emergency contacts |
| 🟡 P2 | Phase 8 — Reports | ⬜ Next | PDF generation, report viewer |
| 🟢 P3 | Phase 2 — Google Fit | ⬜ Later | OAuth flow, wearable data sync |
| 🟢 P3 | Phase 6 — Mental Health | ⬜ Later | Mood tracker, stress score, breathing |

> **Current sprint focus:** Close out Phase 4 (medicine TTS + AdherenceChart) and Phase 1 (profile page) — these two complete the core user experience before the demo.

---

*Last updated: February 21, 2026*
