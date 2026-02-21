# VitalAI — Implementation Plan

> **Preventive Health Companion** | Hackathon MVP  
> **Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Firebase · Google Fit API  
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
14. [Data Models (Firebase Collections)](#data-models-firebase-collections)
15. [API Routes Summary](#api-routes-summary)
16. [Environment Variables](#environment-variables)
17. [Implementation Checklist](#implementation-checklist)

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
  │Firebase │  │Google Fit │  │  OCR    │  │  AI/LLM   │
  │Auth +   │  │   API     │  │(Tesser- │  │(Gemini /  │
  │Firestore│  │           │  │ act.js) │  │ OpenAI)   │
  └─────────┘  └───────────┘  └─────────┘  └───────────┘
```

**Key design decisions:**

- **Next.js App Router** — file-based routing, server components by default
- **Firebase** — Auth (Google OAuth), Firestore (NoSQL data), Storage (file uploads)
- **Server-side AI calls** — all LLM/OCR calls happen in API routes (secrets never leak to client)
- **Google Fit REST API** — OAuth 2.0 token flow, data fetched server-side and cached in Firestore

---

## 2. Directory Structure (Final)

```
D:\Cavista\
│
├── app/
│   ├── globals.css
│   ├── layout.tsx                    ← Root layout (font, metadata, providers)
│   ├── page.tsx                      ← Landing / Home page
│   │
│   ├── (auth)/                       ← Auth routes group (no layout nesting)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/                  ← Authenticated app shell
│   │   ├── layout.tsx                ← Sidebar + Header layout
│   │   ├── dashboard/page.tsx        ← /dashboard → Health overview
│   │   ├── profile/page.tsx          ← /profile
│   │   ├── medicine/page.tsx         ← /medicine → Reminders
│   │   ├── mental-health/page.tsx    ← /mental-health
│   │   ├── reports/page.tsx          ← /reports
│   │   ├── upload/page.tsx           ← /upload → Past medical reports
│   │   └── chat/page.tsx             ← /chat → AI Chatbot
│   │
│   └── api/                          ← Server-side API routes
│       ├── auth/
│       │   └── [...nextauth]/route.ts  (if using NextAuth)
│       ├── google-fit/
│       │   └── route.ts              ← Fetch wearable data
│       ├── ocr/
│       │   └── route.ts              ← Process prescription images
│       ├── chat/
│       │   └── route.ts              ← AI chatbot endpoint
│       ├── reports/
│       │   └── route.ts              ← Generate PDF reports
│       └── alerts/
│           └── route.ts              ← Smart alert logic
│
├── components/
│   ├── ui/                           ← Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── Chart.tsx                 ← Recharts wrapper
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── dashboard/
│   │   ├── HeartRateCard.tsx
│   │   ├── StepsCard.tsx
│   │   ├── SleepCard.tsx
│   │   ├── CalorieCard.tsx
│   │   ├── RiskScoreBadge.tsx
│   │   └── WeeklyTrendChart.tsx
│   │
│   ├── medicine/
│   │   ├── PrescriptionUpload.tsx
│   │   ├── MedicineList.tsx
│   │   ├── ReminderCard.tsx
│   │   └── AdherenceChart.tsx
│   │
│   ├── mental-health/
│   │   ├── MoodScore.tsx
│   │   ├── StressIndicator.tsx
│   │   └── BreathingExercise.tsx
│   │
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   │
│   ├── reports/
│   │   ├── ReportCard.tsx
│   │   └── ReportViewer.tsx
│   │
│   └── profile/
│       ├── ProfileForm.tsx
│       └── EmergencyContacts.tsx
│
├── hooks/
│   ├── index.ts                      ← Generic hooks (existing)
│   ├── useAuth.ts                    ← Firebase auth state
│   ├── useGoogleFit.ts              ← Fetch wearable data
│   ├── useMedicine.ts               ← Medicine CRUD + reminders
│   └── useChat.ts                   ← Chatbot streaming
│
├── lib/
│   ├── utils.ts                      ← cn(), formatDate() (existing)
│   ├── firebase.ts                   ← Firebase app init
│   ├── firestore.ts                  ← Firestore helpers (CRUD)
│   ├── google-fit.ts                 ← Google Fit API client
│   ├── ocr.ts                        ← OCR processing logic
│   ├── ai.ts                         ← LLM client (Gemini / OpenAI)
│   └── pdf.ts                        ← PDF report generation
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

### Core (already installed)

| Package | Purpose |
|---------|---------|
| `next` | Framework |
| `react` / `react-dom` | UI |
| `typescript` | Type safety |
| `tailwindcss` + `@tailwindcss/postcss` | Styling |
| `clsx` | Conditional classes |

### To Install

| Package | Purpose | Command |
|---------|---------|---------|
| `firebase` | Auth + Firestore + Storage | `npm i firebase` |
| `firebase-admin` | Server-side Firebase | `npm i firebase-admin` |
| `recharts` | Dashboard charts | `npm i recharts` |
| `tesseract.js` | Client-side OCR | `npm i tesseract.js` |
| `zustand` | State management | `npm i zustand` |
| `react-hot-toast` | Toast notifications | `npm i react-hot-toast` |
| `lucide-react` | Icons | `npm i lucide-react` |
| `@react-pdf/renderer` | PDF generation | `npm i @react-pdf/renderer` |
| `date-fns` | Date utilities | `npm i date-fns` |
| `ai` | Vercel AI SDK (streaming) | `npm i ai` |
| `@ai-sdk/google` | Gemini integration | `npm i @ai-sdk/google` |
| `next-auth` | Auth (optional) | `npm i next-auth` |
| `framer-motion` | Animations | `npm i framer-motion` |

**One-liner install:**
```bash
npm i firebase firebase-admin recharts tesseract.js zustand react-hot-toast lucide-react @react-pdf/renderer date-fns ai @ai-sdk/google framer-motion
```

---

## Phase 0 — Project Setup & Auth

> **Goal:** Firebase init, authentication (Google OAuth), protected routes.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 0.1 | Create Firebase project in console, enable Auth (Google) + Firestore + Storage | Firebase Console |
| 0.2 | Add Firebase config to `.env.local` | `.env.local` |
| 0.3 | Initialize Firebase client SDK | `lib/firebase.ts` |
| 0.4 | Initialize Firebase Admin SDK | `lib/firebase-admin.ts` |
| 0.5 | Build `useAuth` hook (sign in, sign out, onAuthStateChanged) | `hooks/useAuth.ts` |
| 0.6 | Create auth store (Zustand) | `stores/auth.store.ts` |
| 0.7 | Build Login page (Google sign-in button) | `app/(auth)/login/page.tsx` |
| 0.8 | Build Register page (optional — Google OAuth auto-creates) | `app/(auth)/register/page.tsx` |
| 0.9 | Create auth middleware / route guard | `middleware.ts` or layout-level check |
| 0.10 | Create `(dashboard)/layout.tsx` with auth guard, sidebar, header | `app/(dashboard)/layout.tsx` |

### `lib/firebase.ts` — Skeleton

```ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Phase 1 — Profile Module

> **Goal:** User profile CRUD, emergency contacts.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 1.1 | Define `UserProfile` type | `types/index.ts` |
| 1.2 | Create Firestore helper for profiles | `lib/firestore.ts` |
| 1.3 | Build ProfileForm component | `components/profile/ProfileForm.tsx` |
| 1.4 | Build EmergencyContacts component | `components/profile/EmergencyContacts.tsx` |
| 1.5 | Build Profile page | `app/(dashboard)/profile/page.tsx` |
| 1.6 | Auto-create profile doc on first login | `hooks/useAuth.ts` |

### Firestore Document: `users/{uid}`

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

> **Goal:** OAuth to Google Fit, fetch heart rate / steps / sleep / calories, store in Firestore.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 2.1 | Enable Google Fitness API in GCP console | GCP Console |
| 2.2 | Configure OAuth consent screen + credentials | GCP Console |
| 2.3 | Build OAuth flow (redirect → callback → store tokens) | `app/api/google-fit/route.ts` |
| 2.4 | Build Google Fit API client | `lib/google-fit.ts` |
| 2.5 | Fetch data types: heart rate, steps, calories, sleep | `lib/google-fit.ts` |
| 2.6 | Store fetched data in Firestore | `lib/firestore.ts` |
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
→ Store tokens in Firestore (encrypted)
→ Periodic fetch via API route (or on dashboard load)
→ Store vitals in Firestore: health_data/{uid}/daily/{date}
```

### Firestore Document: `health_data/{uid}/daily/{YYYY-MM-DD}`

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
| 4.10 | Store reminders + compliance in Firestore | `services/medicine.service.ts` |

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

### Firestore: `medicines/{uid}/items/{medicineId}`

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

## Phase 5 — AI Chatbot (Health Intelligence Engine)

> **Goal:** Conversational health companion that analyzes vitals, reports, and gives recommendations.

### Tasks

| # | Task | File(s) |
|---|------|---------|
| 5.1 | Define Chat types | `types/chat.ts` |
| 5.2 | Set up Vercel AI SDK + Gemini | `lib/ai.ts` |
| 5.3 | Build chat API route (streaming) | `app/api/chat/route.ts` |
| 5.4 | Build ChatWindow component | `components/chat/ChatWindow.tsx` |
| 5.5 | Build ChatMessage (user vs AI bubble) | `components/chat/ChatMessage.tsx` |
| 5.6 | Build ChatInput (text + voice) | `components/chat/ChatInput.tsx` |
| 5.7 | Build `useChat` hook (streaming) | `hooks/useChat.ts` |
| 5.8 | Feed user context to AI (vitals, medicines, history) | `app/api/chat/route.ts` |
| 5.9 | Build Chat page | `app/(dashboard)/chat/page.tsx` |

### System Prompt (MVP)

```
You are VitalAI, a preventive health companion. You have access to the user's:
- Current vitals (heart rate, steps, sleep, calories)
- Medicine schedule and adherence
- Past medical reports

Your job:
1. Answer health questions accurately
2. Analyze their vitals and flag concerns
3. Recommend diet, exercise, and sleep improvements
4. Give early risk warnings
5. Be empathetic and supportive

IMPORTANT: You are NOT a doctor. Always recommend consulting a healthcare
professional for serious concerns. Never diagnose conditions.
```

### AI Context Injection

```ts
// Before sending to LLM, prepend user health context
const context = `
User Profile: ${JSON.stringify(profile)}
Today's Vitals: ${JSON.stringify(todayHealth)}
Medicine Adherence: ${adherencePercent}%
Recent Risk Score: ${riskScore}
`;
```

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
| 6.7 | Store mood logs in Firestore | Firestore |

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

### Firestore: `mental_health/{uid}/daily/{date}`

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
| 7.6 | Store alert history in Firestore | Firestore |

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
| 9.2 | Upload to Firebase Storage | `services/health.service.ts` |
| 9.3 | OCR extract lab values (Gemini Vision) | `app/api/ocr/route.ts` |
| 9.4 | Store extracted values in Firestore | Firestore |
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

## Data Models (Firebase Collections)

```
firestore/
├── users/{uid}                        ← UserProfile
├── health_data/{uid}/
│   └── daily/{YYYY-MM-DD}            ← DailyHealth
├── medicines/{uid}/
│   ├── items/{medicineId}            ← Medicine
│   └── logs/{logId}                   ← MedicineLog
├── mental_health/{uid}/
│   └── daily/{date}                   ← MentalHealthEntry
├── lab_reports/{uid}/
│   └── reports/{reportId}             ← LabReport
├── chat_sessions/{uid}/
│   └── sessions/{sessionId}           ← ChatSession
├── alerts/{uid}/
│   └── history/{alertId}              ← Alert
└── reports/{uid}/
    └── generated/{reportId}           ← GeneratedReport
```

---

## API Routes Summary

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/auth/google` | Google OAuth callback |
| `GET` | `/api/google-fit` | Fetch latest wearable data |
| `POST` | `/api/google-fit/connect` | Initiate Google Fit OAuth |
| `POST` | `/api/ocr` | Process prescription/report image |
| `POST` | `/api/chat` | AI chatbot (streaming) |
| `GET` | `/api/reports/weekly` | Generate weekly report |
| `GET` | `/api/reports/monthly` | Generate monthly report |
| `POST` | `/api/alerts/evaluate` | Evaluate alert conditions |

---

## Environment Variables

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Google Fit OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=       # Gemini API key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Implementation Checklist

### Phase 0 — Setup & Auth
- [ ] Create Firebase project
- [ ] Add env variables
- [ ] `lib/firebase.ts` — client init
- [ ] `lib/firebase-admin.ts` — admin init
- [ ] `hooks/useAuth.ts`
- [ ] `stores/auth.store.ts`
- [ ] Login page
- [ ] Auth middleware / route guard
- [ ] Dashboard layout (sidebar + header)

### Phase 1 — Profile
- [ ] `UserProfile` type
- [ ] `ProfileForm` component
- [ ] `EmergencyContacts` component
- [ ] Profile page
- [ ] Auto-create profile on first login

### Phase 2 — Wearable Integration
- [ ] Enable Google Fitness API
- [ ] OAuth flow for Google Fit
- [ ] `lib/google-fit.ts` — API client
- [ ] Fetch heart rate, steps, calories, sleep
- [ ] Store in Firestore
- [ ] "Connect Google Fit" button

### Phase 3 — Dashboard
- [ ] HeartRateCard
- [ ] StepsCard
- [ ] SleepCard
- [ ] CalorieCard
- [ ] RiskScoreBadge
- [ ] WeeklyTrendChart
- [ ] Dashboard page assembly
- [ ] Auto-refresh polling
- [ ] Abnormal reading highlights

### Phase 4 — Medicine Reminders
- [ ] PrescriptionUpload component
- [ ] OCR API route (Gemini Vision)
- [ ] OCR parser
- [ ] MedicineList CRUD
- [ ] ReminderCard (Taken/Snooze/Reschedule)
- [ ] Browser notifications + TTS
- [ ] AdherenceChart
- [ ] Medicine page

### Phase 5 — AI Chatbot
- [ ] Chat API route (streaming)
- [ ] ChatWindow, ChatMessage, ChatInput
- [ ] `useChat` hook
- [ ] Context injection (vitals, meds, history)
- [ ] Chat page

### Phase 6 — Mental Health
- [ ] MoodScore component
- [ ] StressIndicator
- [ ] BreathingExercise
- [ ] Sentiment analysis integration
- [ ] Stress score calculation
- [ ] Mental Health page

### Phase 7 — Smart Alerts
- [ ] Alert threshold constants
- [ ] Alert evaluation engine
- [ ] In-app toast notifications
- [ ] Push notification setup
- [ ] Alert history storage

### Phase 8 — Smart Reports
- [ ] Report data aggregation
- [ ] PDF template
- [ ] Report API route
- [ ] ReportCard + ReportViewer
- [ ] Reports page

### Phase 9 — Medical Report Upload
- [ ] File upload component
- [ ] Firebase Storage upload
- [ ] OCR extraction for lab values
- [ ] Trend comparison UI
- [ ] Upload page

---

## Suggested Implementation Order (Hackathon Sprint)

| Priority | Phase | Estimated Time | Reason |
|----------|-------|---------------|--------|
| 🔴 P0 | Phase 0 — Auth | 2-3 hours | Foundation — everything depends on this |
| 🔴 P0 | Phase 1 — Profile | 1-2 hours | Required for personalization |
| 🔴 P0 | Phase 3 — Dashboard | 3-4 hours | Core visual — **demo centerpiece** |
| 🟠 P1 | Phase 4 — Medicine | 3-4 hours | Unique differentiator (OCR + TTS) |
| 🟠 P1 | Phase 5 — Chatbot | 2-3 hours | High impact, AI SDK makes it fast |
| 🟡 P2 | Phase 2 — Google Fit | 3-4 hours | OAuth is complex; can use mock data initially |
| 🟡 P2 | Phase 7 — Alerts | 2 hours | Builds on existing data |
| 🟢 P3 | Phase 6 — Mental Health | 2-3 hours | Nice-to-have for hackathon |
| 🟢 P3 | Phase 8 — Reports | 2-3 hours | Nice-to-have for hackathon |
| 🟢 P3 | Phase 9 — Upload Reports | 2 hours | Stretch goal |

> **Hackathon tip:** Start with mock health data for the dashboard while Google Fit OAuth is being set up in parallel. The dashboard with charts is the most visually impressive part for the demo.

---

*Last updated: February 21, 2026*
