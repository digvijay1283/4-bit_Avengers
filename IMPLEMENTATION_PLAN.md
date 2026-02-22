# VitalAI — System Architecture & Implementation Plan

> **Preventive Health Companion** — AI-Powered Health Monitoring Platform  
> **Stack:** Next.js 16 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · MongoDB Atlas (Mongoose 9) · n8n AI Workflows · Twilio · Cloudinary  
> **Repo:** [4-bit_Avengers](https://github.com/digvijay1283/4-bit_Avengers)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Directory Structure](#3-directory-structure)
4. [Module Breakdown](#4-module-breakdown)
   - [M0 — Authentication & RBAC](#m0--authentication--rbac)
   - [M1 — User Profile](#m1--user-profile)
   - [M2 — Health Dashboard](#m2--health-dashboard)
   - [M3 — Medicine Reminder System](#m3--medicine-reminder-system)
   - [M4 — Medical Reports & Upload](#m4--medical-reports--upload)
   - [M5 — Mental Health & AI Chat](#m5--mental-health--ai-chat)
   - [M6 — AI Voice Assistant (Live2D)](#m6--ai-voice-assistant-live2d)
   - [M7 — Doctor Console & QR Sharing](#m7--doctor-console--qr-sharing)
   - [M8 — Alerts & Notifications](#m8--alerts--notifications)
5. [Data Models (MongoDB)](#5-data-models-mongodb)
6. [API Routes Reference](#6-api-routes-reference)
7. [External Service Integrations](#7-external-service-integrations)
8. [Environment Variables](#8-environment-variables)
9. [Redundant Code — Cleanup Checklist](#9-redundant-code--cleanup-checklist)

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js App Router)                    │
│                                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │
│  │   Auth   │ │ Dashboard │ │ Medicine │ │ Reports │ │ Mental Health│  │
│  │  (JWT)   │ │ (Vitals)  │ │(OCR+TTS) │ │(Upload) │ │(Chat+Voice) │  │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬────┘ └──────┬───────┘  │
│       │              │            │             │              │          │
│  ┌────┴──────────────┴────────────┴─────────────┴──────────────┴─────┐   │
│  │                  Next.js API Routes (Server-side)                  │   │
│  │           RBAC middleware · JWT verification · Auth guards         │   │
│  └────┬──────────┬──────────────┬──────────────┬──────────────┬──────┘   │
└───────┼──────────┼──────────────┼──────────────┼──────────────┼──────────┘
        │          │              │              │              │
   ┌────▼────┐ ┌───▼────┐  ┌─────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
   │MongoDB  │ │Tesser- │  │ n8n AI     │ │Cloudinary│ │   Twilio    │
   │ Atlas   │ │act.js  │  │ Workflows  │ │  (Files) │ │ (Voice/SMS) │
   │(Mongoose│ │ (OCR)  │  │(synthomind │ │          │ │             │
   │  ODM)   │ │        │  │  .cloud)   │ │          │ │             │
   └─────────┘ └────────┘  └────────────┘ └──────────┘ └─────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | File-based routing, server components by default, API routes colocated |
| **MongoDB Atlas + Mongoose** | Flexible schema for health data, schema-level indexes, cloud-hosted |
| **Server-side AI/OCR calls** | All LLM, OCR, and external webhook calls happen in API routes — secrets never leak to client |
| **n8n webhook orchestration** | AI chatbot, daily summaries, mental health recommendations, and report summaries all powered by n8n workflows hosted at `synthomind.cloud` |
| **RBAC (Role-Based Access)** | Two roles: `user` (patient) and `doctor`. Route guards enforce role-specific access |
| **JWT httpOnly cookies** | 7-day expiry, bcrypt (12 rounds) password hashing, no client-side token storage |
| **SSE for proactive messages** | Server-Sent Events channel per chat session for real-time proactive health nudges |

---

## 2. Tech Stack & Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | Framework (App Router + Turbopack) |
| `react` / `react-dom` | 19.2.4 | UI framework |
| `typescript` | 5.9.3 | Type safety (strict mode) |
| `tailwindcss` + `@tailwindcss/postcss` | 4.2.0 | Utility-first CSS |
| `mongoose` | 9.2.1 | MongoDB ODM |
| `bcryptjs` | 3.0.3 | Password hashing (12 rounds) |
| `jsonwebtoken` | 9.0.3 | JWT auth (7-day httpOnly cookies) |
| `tesseract.js` | 7.0.0 | Client/server OCR for prescriptions & reports |
| `cloudinary` | 2.9.0 | Medical report file hosting |
| `twilio` | 5.12.2 | Voice calls for missed medicine alerts |
| `pixi.js` + `pixi-live2d-display` | 7.4.3 / 0.4.0 | Live2D avatar rendering (AI Voice Assistant) |
| `recharts` | 3.7.0 | Dashboard health charts |
| `framer-motion` | 12.34.3 | UI animations |
| `lucide-react` | 0.575.0 | Icon library |
| `qrcode.react` | 4.2.0 | QR code generation for report sharing |
| `react-hot-toast` | 2.6.0 | Toast notifications |
| `clsx` | 2.1.1 | Conditional CSS class joining |
| `geist` | 1.7.0 | Geist font family |
| `@splinetool/react-spline` | 4.1.0 | ⚠️ Unused — see cleanup checklist |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `eslint` + `eslint-config-next` | Linting |
| `postcss` | CSS processing |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/jsonwebtoken` | TypeScript type definitions |

---

## 3. Directory Structure

```
4-bit_Avengers/
│
├── app/
│   ├── globals.css                      Theme tokens, Tailwind base styles
│   ├── layout.tsx                       Root layout (Manrope font, SessionProvider)
│   ├── page.tsx                         Landing / home page (public)
│   │
│   ├── (auth)/                          Auth route group (public)
│   │   ├── layout.tsx                   Split-screen branding layout
│   │   ├── login/page.tsx               Login form → POST /api/auth/login
│   │   └── signup/page.tsx              Signup form → POST /api/auth/signup
│   │
│   ├── (dashboard)/                     Authenticated app shell
│   │   ├── layout.tsx                   Header + MobileNav + auth guard
│   │   ├── dashboard/
│   │   │   ├── layout.tsx               Dashboard sub-layout
│   │   │   └── page.tsx                 Health overview + chat modal
│   │   ├── medi-reminder/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                 Medicine management + OCR + voice alerts
│   │   ├── reports/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                 Report list + upload + OCR + AI summary
│   │   ├── mental-health/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                 Questionnaire + mood + embedded AI chat
│   │   ├── assistant/
│   │   │   └── page.tsx                 Voice AI + Live2D avatar
│   │   ├── profile/
│   │   │   └── page.tsx                 User/doctor profile CRUD
│   │   ├── share/
│   │   │   └── page.tsx                 QR-based report sharing
│   │   ├── upload/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                 Standalone report upload
│   │   ├── chat/
│   │   │   └── page.tsx                 ⚠️ ORPHANED — to be removed
│   │   └── doctor/
│   │       ├── layout.tsx
│   │       ├── page.tsx                 Doctor console home
│   │       ├── profile/page.tsx         Doctor profile view
│   │       ├── patient/[id]/page.tsx    Patient detail (vitals, reports, meds)
│   │       └── shared/[token]/page.tsx  Shared patient data viewer
│   │
│   ├── api/                             29 route handlers (see §6)
│   │   ├── auth/                        login, signup, me, logout
│   │   ├── chat/                        AI chat proxy + SSE stream
│   │   ├── daily-summary/               n8n daily health summary
│   │   ├── doctor/patient/              Patient lookup (doctor-only)
│   │   ├── health/                      DB check + live vitals
│   │   ├── medicine/                    OCR prescription extraction
│   │   ├── medicines/                   CRUD + dose logging + guardian alerts
│   │   ├── mental-health/               Questionnaire + recommendations
│   │   ├── model/                       Live2D asset serving
│   │   ├── ocr/                         ⚠️ DUPLICATE — to be removed
│   │   ├── profile/                     Profile GET/PATCH
│   │   ├── reports/                     Report CRUD + upload pipeline
│   │   ├── report-upload-summary/       AI report summary
│   │   ├── routine-recommendation/      n8n routine suggestions
│   │   ├── share/                       QR share create + resolve
│   │   └── twilio/                      Voice call + status check
│   │
│   └── test/                            ⚠️ DEV-ONLY test harnesses
│       ├── ocr/page.tsx                 OCR test page
│       └── twilio/page.tsx              Twilio test page
│
├── components/
│   ├── assistant/                       Live2DViewer.tsx
│   ├── chat/                            ChatAssistant, ChatWindow, ChatMessage,
│   │                                    ChatInput, ChatDashboardModal,
│   │                                    VoiceModeOverlay, SplineScene(⚠️)
│   ├── dashboard/                       14 dashboard widgets (see §M2)
│   ├── doctor/                          9 doctor console components (see §M7)
│   ├── layout/                          Header, Footer(⚠️), MobileNav
│   ├── medicine/                        12 medicine components (see §M3)
│   ├── mental-health/                   MentalHealthContent, MentalHealthQuestionnaire
│   ├── profile/                         7 profile components (see §M1)
│   ├── reports/                         ReportsPageContent
│   ├── ui/                              Badge, Button, Card, ProgressBar, Spinner
│   └── upload/                          UploadContent
│
├── models/                              Top-level Mongoose models
│   ├── User.ts                          User auth + profile (all roles)
│   ├── HealthRecord.ts                  Health data entries (vitals, labs, reports)
│   ├── Report.ts                        Uploaded medical report files
│   └── ShareSession.ts                  QR-based share sessions
│
├── lib/
│   ├── auth.ts                          Password hashing, JWT sign/verify
│   ├── mongodb.ts                       Mongoose connection singleton
│   ├── rbac.ts                          RBAC guards (getAuthUser, requireRole, requireAuth)
│   ├── cloudinary.ts                    Cloudinary upload helper
│   ├── medicalReportParser.ts           OCR text → structured medical data
│   ├── reportNlp.ts                     NLP extraction (meds, findings, follow-ups)
│   ├── chatSessions.ts                  In-memory SSE session registry
│   ├── proactiveMessages.ts             Proactive health nudge message bank
│   ├── utils.ts                         cn() (class merge), formatDate()
│   ├── uuid.ts                          Browser-safe randomUUID helper
│   └── models/                          Domain-specific Mongoose models
│       ├── Medicine.ts                  Medicine schema + quantity tracking
│       ├── DoseLog.ts                   Dose action logging
│       └── MentalHealthQuestionnaire.ts Questionnaire responses + scores
│
├── hooks/
│   ├── index.ts                         useLocalStorage, useMediaQuery
│   ├── useDailySummary.ts               Cached daily AI summary (per user/day)
│   ├── useLiveHealth.ts                 Live vitals from /api/health/live
│   ├── useProfile.ts                    User profile data + helpers
│   └── useSession.tsx                   Auth session context (user, status, logout)
│
├── constants/index.ts                   Routes, nav items, health thresholds, pagination
├── types/                               index.ts, health.ts, medicine.ts
├── services/api.ts                      ⚠️ UNUSED — to be removed
├── stores/index.ts                      ⚠️ EMPTY — to be removed
├── model/                               Live2D Hiyori model assets
│   ├── Hiyori.model3.json
│   ├── Hiyori.moc3, .physics3.json, .pose3.json, .userdata3.json, .cdi3.json
│   ├── Hiyori.2048/                     Texture atlas
│   └── motions/                         Animation clips
│
└── public/
    └── live2dcubismcore.min.js          Live2D Cubism core runtime
```

---

## 4. Module Breakdown

### M0 — Authentication & RBAC

**Status: ✅ Fully Implemented**

Two-role system (patient `user` + `doctor`) with JWT-based auth and server-side RBAC guards.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Password hashing | `lib/auth.ts` | bcryptjs (12 rounds) |
| JWT tokens | `lib/auth.ts` | 7-day httpOnly cookie (`auth_token`) |
| RBAC middleware | `lib/rbac.ts` | `getAuthUser()`, `requireRole()`, `requireAuth()` |
| User model | `models/User.ts` | Email/password, role, profile fields, 5 named indexes |
| Login API | `app/api/auth/login/route.ts` | POST — verify creds, set cookie |
| Signup API | `app/api/auth/signup/route.ts` | POST — create user/doctor, set cookie |
| Current user | `app/api/auth/me/route.ts` | GET — JWT → user identity |
| Logout | `app/api/auth/logout/route.ts` | POST — clear cookie |
| Session hook | `hooks/useSession.tsx` | React Context provider: user, status, refresh, logout |
| Auth pages | `app/(auth)/login`, `app/(auth)/signup` | Split-screen branding layout |
| DB health check | `app/api/health/db/route.ts` | GET — MongoDB + index sync |

**User Index Strategy (schema-level):**
- `uq_users_email` — unique on `email`
- `uq_users_phone_sparse` — unique sparse on `phone`
- `idx_users_role_status` — compound on `role + status`
- `idx_users_createdAt_desc` — descending on `createdAt`

---

### M1 — User Profile

**Status: ✅ Fully Implemented**

| Component | File(s) | Description |
|-----------|---------|-------------|
| Profile API | `app/api/profile/route.ts` | GET (fetch) + PATCH (update) |
| Profile page | `app/(dashboard)/profile/page.tsx` | Full profile view/edit (488 LOC) |
| ProfileCard | `components/profile/ProfileCard.tsx` | Avatar + name card |
| PersonalInfo | `components/profile/PersonalInfo.tsx` | Name, DOB, blood type, address |
| HealthStatsRow | `components/profile/HealthStatsRow.tsx` | Key health metrics row |
| DailyRoutine | `components/profile/DailyRoutine.tsx` | Daily routine timeline |
| QuickBook | `components/profile/QuickBook.tsx` | Appointment booking widget |
| UpcomingAppointments | `components/profile/UpcomingAppointments.tsx` | Upcoming appointments list |
| DoctorProfileView | `components/profile/DoctorProfileView.tsx` | Doctor-specific profile view |
| useProfile hook | `hooks/useProfile.ts` | Profile data + helpers (getAge, getInitials) |

---

### M2 — Health Dashboard

**Status: ✅ Fully Implemented**

Real-time health overview with vitals cards, trends, AI insights, and routine recommendations.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Dashboard page | `app/(dashboard)/dashboard/page.tsx` | Server component assembling all widgets |
| HeroSection | `components/dashboard/HeroSection.tsx` | Greeting banner + daily summary |
| LiveMonitoring | `components/dashboard/LiveMonitoring.tsx` | Real-time vitals panel (HR, BP, sleep, steps, risk) |
| HeartRateCard | `components/dashboard/HeartRateCard.tsx` | Live BPM display |
| StepsCard | `components/dashboard/StepsCard.tsx` | Step count progress |
| SleepCard | `components/dashboard/SleepCard.tsx` | Sleep duration breakdown |
| BloodPressureCard | `components/dashboard/BloodPressureCard.tsx` | Current BP reading |
| RiskScoreBadge | `components/dashboard/RiskScoreBadge.tsx` | Health risk level badge |
| WeeklyTrendChart | `components/dashboard/WeeklyTrendChart.tsx` | Weekly vitals trend chart (Recharts) |
| RoutineRecommendation | `components/dashboard/RoutineRecommendation.tsx` | AI-generated daily routine |
| DailyInsight | `components/dashboard/DailyInsight.tsx` | AI health insight card |
| ProfileSnippet | `components/dashboard/ProfileSnippet.tsx` | Compact profile sidebar widget |
| RemindersWidget | `components/dashboard/RemindersWidget.tsx` | Upcoming medication reminders |
| MissionSection | `components/dashboard/MissionSection.tsx` | Health mission/goals |
| SpecialistGrid | `components/dashboard/SpecialistGrid.tsx` | Specialist doctor grid |
| ChatDashboardModal | `components/chat/ChatDashboardModal.tsx` | Floating FAB + chat modal overlay |
| Live vitals API | `app/api/health/live/route.ts` | GET — latest HealthRecord vitals |
| Routine API | `app/api/routine-recommendation/route.ts` | GET — n8n routine recommendations |
| Daily summary API | `app/api/daily-summary/route.ts` | GET — n8n daily health summary |
| useLiveHealth | `hooks/useLiveHealth.ts` | Live vitals hook with refresh |
| useDailySummary | `hooks/useDailySummary.ts` | Cached daily summary (per user/day) |

---

### M3 — Medicine Reminder System

**Status: ✅ Fully Implemented**

Upload prescriptions via OCR → manage medicines → TTS voice reminders → missed-dose guardian alerts.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Medicine page | `app/(dashboard)/medi-reminder/page.tsx` | Full medicine dashboard (400 LOC) |
| MedicineCard | `components/medicine/MedicineCard.tsx` | Per-medicine card with dose actions |
| AddMedicineFAB | `components/medicine/AddMedicineFAB.tsx` | FAB to add medicine (manual + OCR) |
| PrescriptionReviewModal | `components/medicine/PrescriptionReviewModal.tsx` | Review OCR results before save |
| EditMedicineModal | `components/medicine/EditMedicineModal.tsx` | Edit existing medicine |
| DailyProgressWidget | `components/medicine/DailyProgressWidget.tsx` | Today's adherence progress |
| VoiceReminderSystem | `components/medicine/VoiceReminderSystem.tsx` | TTS-based medicine alerts |
| MissedAlarmAlert | `components/medicine/MissedAlarmAlert.tsx` | Alert for consecutive missed doses |
| AudioAlertToggle | `components/medicine/AudioAlertToggle.tsx` | Audio on/off toggle |
| LowStockAlert | `components/medicine/LowStockAlert.tsx` | Low quantity warning |
| MainTabSwitcher | `components/medicine/MainTabSwitcher.tsx` | Medicines vs. Medical Tests tabs |
| SubTabBar | `components/medicine/SubTabBar.tsx` | All / Due Soon / Missed sub-tabs |
| MedicalTestCard | `components/medicine/MedicalTestCard.tsx` | Scheduled test card |
| Medicine model | `lib/models/Medicine.ts` | Mongoose schema (name, dosage, frequency, times, quantity, missedStreak) |
| DoseLog model | `lib/models/DoseLog.ts` | Dose action log (taken/snoozed/missed/skipped) |
| Medicines API | `app/api/medicines/route.ts` | GET (list + today's doses) / POST (create) |
| Medicine CRUD | `app/api/medicines/[id]/route.ts` | PATCH (update) / DELETE (soft-delete) |
| Dose logging | `app/api/medicines/[id]/dose/route.ts` | POST — record dose action |
| OCR extraction | `app/api/medicine/extract-tesseract/route.ts` | POST — image → Tesseract OCR → medicine parsing |
| Guardian alert | `app/api/medicines/alert-guardian/route.ts` | POST — Twilio call on consecutive misses |

**OCR Pipeline:**
```
Upload prescription image
  → Tesseract.js OCR (server-side)
    → Regex-based NLP extraction (medicine name, dosage, frequency, instruction)
      → PrescriptionReviewModal (user confirms/edits)
        → POST /api/medicines (save to DB)
```

**Voice Reminder Flow:**
```
Scheduled time arrives
  → VoiceReminderSystem checks due medicines
    → Browser TTS: "It's time to take [medicine name]"
      → User marks as taken/snoozed/skipped
        → If ≥2 consecutive misses → Twilio voice call to guardian
```

---

### M4 — Medical Reports & Upload

**Status: ✅ Fully Implemented**

Upload medical reports → Cloudinary storage → OCR extraction → AI-generated summary → shareable with doctors.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Reports page | `app/(dashboard)/reports/page.tsx` | Full report management (740 LOC) |
| Upload page | `app/(dashboard)/upload/page.tsx` | Standalone upload interface |
| ReportsPageContent | `components/reports/ReportsPageContent.tsx` | Report list/view component |
| UploadContent | `components/upload/UploadContent.tsx` | Drag-and-drop file upload |
| Report model | `models/Report.ts` | File URL, OCR text, extracted data, AI summary, status |
| HealthRecord model | `models/HealthRecord.ts` | Parsed health data entries |
| Reports API | `app/api/reports/route.ts` | GET (list) / DELETE (remove) |
| Upload pipeline | `app/api/reports/upload/route.ts` | POST — full pipeline (see below) |
| Summary API | `app/api/report-upload-summary/route.ts` | POST — n8n AI summary |
| Parser | `lib/medicalReportParser.ts` | OCR text → structured medical data |
| NLP engine | `lib/reportNlp.ts` | Regex NLP (medications, findings, follow-ups) |
| Cloudinary | `lib/cloudinary.ts` | Upload helper → secureUrl + publicId |

**Upload Pipeline:**
```
File selected → Upload to Cloudinary (get URL)
  → Tesseract.js OCR (extract raw text)
    → medicalReportParser + reportNlp (structured extraction)
      → Save Report + HealthRecord to MongoDB
        → Fire n8n webhooks:
          1. user-report-info (store user data)
          2. mental-cavista-summary (generate AI summary)
        → Return summary to client for display
```

---

### M5 — Mental Health & AI Chat

**Status: ✅ Fully Implemented**

Mental health questionnaire → AI-powered recommendations → embedded text chat → mood tracking → daily wellness tips.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Mental health page | `app/(dashboard)/mental-health/page.tsx` | Server component → MentalHealthContent |
| MentalHealthContent | `components/mental-health/MentalHealthContent.tsx` | Full page: mood check-in, weekly trend, stress level, AI insight, wellness tips, routine recommendations, embedded chat |
| MentalHealthQuestionnaire | `components/mental-health/MentalHealthQuestionnaire.tsx` | Multi-step questionnaire (first-time users) |
| ChatAssistant | `components/chat/ChatAssistant.tsx` | Embedded chat (conversation history, sidebar, search) — toggled via "Talk to AI" button |
| ChatWindow | `components/chat/ChatWindow.tsx` | Message list + input + auto-scroll + typing indicator |
| ChatMessage | `components/chat/ChatMessage.tsx` | Rich message renderer (headings, lists, bold) |
| ChatInput | `components/chat/ChatInput.tsx` | Text input + send (Enter/Shift+Enter) |
| VoiceModeOverlay | `components/chat/VoiceModeOverlay.tsx` | Full-screen voice mode |
| Questionnaire model | `lib/models/MentalHealthQuestionnaire.ts` | Answers (0–4) + computed scores |
| Chat API | `app/api/chat/route.ts` | POST — proxy to n8n chatbot webhook |
| SSE stream | `app/api/chat/stream/route.ts` | GET — SSE channel for proactive messages |
| Questionnaire API | `app/api/mental-health/questionnaire/route.ts` | GET/PUT/POST — fetch/autosave/submit |
| Recommendations API | `app/api/mental-health/recommendations/route.ts` | POST — n8n personalized recommendations |

**Mental Health Flow:**
```
First visit → MentalHealthQuestionnaire (multi-step, auto-save)
  → Submit → compute scores (anxiety, depression, trauma, severeMood, crisis)
    → Fire n8n webhook (user-data-store)
      → Fetch personalized recommendations from n8n
        → Display: mood check-in, weekly chart, stress gauge,
           AI insight, wellness tips, routine recommendations
        → "Talk to AI" button opens embedded ChatAssistant
        → "Voice Assistant" button links to /assistant
```

**Questionnaire Scoring Categories:**
- Anxiety score
- Depression score
- Trauma score
- Severe mood score
- Crisis indicator

---

### M6 — AI Voice Assistant (Live2D)

**Status: ✅ Fully Implemented**

Voice-first AI assistant with animated Live2D avatar (Hiyori), speech recognition, and TTS output.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Assistant page | `app/(dashboard)/assistant/page.tsx` | Full voice assistant (419 LOC) |
| Live2DViewer | `components/assistant/Live2DViewer.tsx` | Pixi.js Live2D renderer (client-only via next/dynamic) |
| Model assets | `model/Hiyori.*` | Live2D model files (textures, physics, motions) |
| Model API | `app/api/model/[...path]/route.ts` | GET — secure model asset serving |
| Core runtime | `public/live2dcubismcore.min.js` | Live2D Cubism SDK core |

**Voice Flow:**
```
User taps mic → SpeechRecognition API (continuous, interim results)
  → Silence detection (2.2s timeout) → auto-stop
    → Send final transcript to /api/chat
      → Receive AI reply + optional audio (base64)
        → Play server audio OR fallback to browser TTS
          → Live2D avatar animates during "speaking" phase
            → Phase cycles: idle → listening → processing → speaking → idle
```

**Access points:**
- Mental Health page → "Voice Assistant" button → `/assistant`
- Mobile nav → "AI" tab → `/assistant`

---

### M7 — Doctor Console & QR Sharing

**Status: ✅ Fully Implemented**

Doctor-specific console to view shared patient data via QR codes, with patient management.

| Component | File(s) | Description |
|-----------|---------|-------------|
| Doctor console | `app/(dashboard)/doctor/page.tsx` | Dashboard home (server component) |
| Doctor profile | `app/(dashboard)/doctor/profile/page.tsx` | Doctor profile view |
| Patient detail | `app/(dashboard)/doctor/patient/[id]/page.tsx` | Patient vitals/reports/meds (121 LOC) |
| Shared viewer | `app/(dashboard)/doctor/shared/[token]/page.tsx` | Token-based patient data (566 LOC) |
| DoctorHero | `components/doctor/DoctorHero.tsx` | Doctor dashboard hero banner |
| DoctorStatsGrid | `components/doctor/DoctorStatsGrid.tsx` | Stats grid (patients, sessions) |
| DoctorQuickActions | `components/doctor/DoctorQuickActions.tsx` | Quick action buttons |
| QRScannerCard | `components/doctor/QRScannerCard.tsx` | QR code scanner |
| RecentPatientsTable | `components/doctor/RecentPatientsTable.tsx` | Recent patients list |
| PatientProfileHeader | `components/doctor/PatientProfileHeader.tsx` | Patient header card |
| PatientVitalsPanel | `components/doctor/PatientVitalsPanel.tsx` | Patient vitals panel |
| PatientReportSummary | `components/doctor/PatientReportSummary.tsx` | Patient report summaries |
| PatientMedicineHistory | `components/doctor/PatientMedicineHistory.tsx` | Patient medicine history |
| Share page | `app/(dashboard)/share/page.tsx` | Patient-side QR sharing (397 LOC) |
| ShareSession model | `models/ShareSession.ts` | Token, shareCode, report IDs, TTL |
| Share create | `app/api/share/create/route.ts` | POST — create share session |
| Share resolve | `app/api/share/[token]/route.ts` | GET — doctor resolves token |
| Patient count | `app/api/doctor/patient/count/route.ts` | GET — unique patient count |
| Patient detail | `app/api/doctor/patient/[id]/route.ts` | GET — patient profile + records |

**QR Share Flow:**
```
Patient: Select reports → POST /api/share/create
  → Generate token + shareCode → Display QR code
    → Doctor: Scan QR / enter code → GET /api/share/[token]
      → Verify doctor role + check expiry
        → Return patient profile + selected reports
```

---

### M8 — Alerts & Notifications

**Status: ✅ Partially Implemented**

| Component | File(s) | Status |
|-----------|---------|--------|
| Voice alerts (TTS) | `VoiceReminderSystem.tsx` | ✅ Browser TTS for medicine reminders |
| Audio toggle | `AudioAlertToggle.tsx` | ✅ Toggle audio alerts on/off |
| Low stock alert | `LowStockAlert.tsx` | ✅ In-component low stock warning |
| Missed dose alert | `MissedAlarmAlert.tsx` | ✅ UI alert for consecutive misses |
| Guardian voice call | `medicines/alert-guardian/route.ts` | ✅ Twilio outbound call |
| Twilio call API | `twilio/call/route.ts` | ✅ Generic voice call endpoint |
| Twilio status | `twilio/status/route.ts` | ✅ Config verification |
| SSE proactive messages | `chat/stream/route.ts` | ✅ Real-time health nudges |
| Proactive message bank | `lib/proactiveMessages.ts` | ✅ Categorized message library |

---

## 5. Data Models (MongoDB)

### Collections & Mongoose Models

```
MongoDB: cavista
│
├── users                    → models/User.ts
│   Email, password, role (user/doctor/admin), profile fields,
│   doctor fields (specialization, license), 5 named indexes
│
├── healthrecords            → models/HealthRecord.ts
│   userId, type (vitals/lab/prescription/note/report),
│   title, summary, date, source, flexible data field
│
├── reports                  → models/Report.ts
│   userId, fileName, fileUrl, cloudinaryPublicId,
│   rawOcrText, extractedData, aiSummary, status
│
├── sharesessions            → models/ShareSession.ts
│   patientId, doctorId, token, shareCode,
│   reportIds, expiresAt (TTL)
│
├── medicines                → lib/models/Medicine.ts
│   userId, name, dosage, frequency, times[], form,
│   instruction, totalQuantity, remainingQuantity,
│   missedStreak, isActive
│
├── doselogs                 → lib/models/DoseLog.ts
│   medicineId, userId, scheduledTime, action
│   (taken/snoozed/missed/skipped), timestamp
│
└── mentalhealthquestionnaires → lib/models/MentalHealthQuestionnaire.ts
    userId, answers (0–4 scale array), completed,
    scores { anxiety, depression, trauma, severeMood, crisis }
```

> **Note:** Models are split across two directories: `models/` (top-level) and `lib/models/`. Consider consolidating into a single `models/` directory in a future refactor.

---

## 6. API Routes Reference

### Auth (4 routes)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/signup` | Register user/doctor, issue JWT cookie |
| POST | `/api/auth/login` | Verify credentials, set JWT cookie |
| GET | `/api/auth/me` | JWT → current user identity |
| POST | `/api/auth/logout` | Clear auth cookie |

### Health & Vitals (2 routes)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health/db` | MongoDB health-check + index sync |
| GET | `/api/health/live` | Latest live vitals for current user |

### Chat & AI (4 routes)

| Method | Route | Purpose | External |
|--------|-------|---------|----------|
| POST | `/api/chat` | Proxy to n8n chatbot webhook | n8n |
| GET | `/api/chat/stream` | SSE channel for proactive messages | — |
| GET | `/api/daily-summary` | Today's AI health summary | n8n |
| GET | `/api/routine-recommendation` | AI daily routine suggestions | n8n |

### Medicines (5 routes)

| Method | Route | Purpose | External |
|--------|-------|---------|----------|
| GET/POST | `/api/medicines` | List medicines + create new | — |
| PATCH/DELETE | `/api/medicines/[id]` | Update / soft-delete medicine | — |
| POST | `/api/medicines/[id]/dose` | Log dose action | — |
| POST | `/api/medicine/extract-tesseract` | OCR prescription extraction | Tesseract.js |
| POST | `/api/medicines/alert-guardian` | Guardian voice call on misses | Twilio |

### Mental Health (2 routes)

| Method | Route | Purpose | External |
|--------|-------|---------|----------|
| GET/PUT/POST | `/api/mental-health/questionnaire` | Fetch/autosave/submit questionnaire | n8n |
| POST | `/api/mental-health/recommendations` | Personalized recommendations | n8n |

### Reports (3 routes)

| Method | Route | Purpose | External |
|--------|-------|---------|----------|
| GET/DELETE | `/api/reports` | List / delete reports | — |
| POST | `/api/reports/upload` | Full upload pipeline | Cloudinary, Tesseract, n8n |
| POST | `/api/report-upload-summary` | AI summary for uploaded report | n8n |

### Profile (1 route)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/PATCH | `/api/profile` | Fetch / update user profile |

### Doctor (2 routes)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/doctor/patient/count` | Count unique shared patients |
| GET | `/api/doctor/patient/[id]` | Patient profile + health records |

### Share (2 routes)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/share/create` | Create share session (QR + code) |
| GET | `/api/share/[token]` | Resolve share token (doctor-only) |

### Twilio (2 routes)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/twilio/call` | Initiate outbound voice call |
| GET | `/api/twilio/status` | Check Twilio config status |

### Model Assets (1 route)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/model/[...path]` | Serve Live2D model files |

### ⚠️ To Remove (1 route)

| Method | Route | Reason |
|--------|-------|--------|
| POST | `/api/ocr/extract` | Duplicate of `/api/medicine/extract-tesseract` |

**Total: 29 route handlers (28 after cleanup)**

---

## 7. External Service Integrations

### n8n AI Workflows (synthomind.cloud)

| Webhook | Used By | Purpose |
|---------|---------|---------|
| `/webhook/cavista-mental-chatbot` | `/api/chat` | AI health chatbot responses |
| `/webhook/mental-cavista-chatbot` | `/api/daily-summary` | Daily health summary generation |
| `/webhook/user-data-store` | `/api/mental-health/questionnaire` | Store user questionnaire data |
| `/webhook-test/recom-system` | `/api/mental-health/recommendations` | Personalized recommendations |
| `/webhook/recom-system` | `/api/routine-recommendation` | Daily routine suggestions |
| `/webhook/user-report-info` | `/api/reports/upload` | Store report data for AI |
| `/webhook/mental-cavista-summary` | `/api/reports/upload`, `/api/report-upload-summary` | AI report summary |

### Twilio (Voice Calls)

| Feature | Route | Trigger |
|---------|-------|---------|
| Guardian alert call | `/api/medicines/alert-guardian` | ≥2 consecutive missed doses |
| Generic voice call | `/api/twilio/call` | Direct API call |

### Cloudinary (File Hosting)

| Feature | Route | Purpose |
|---------|-------|---------|
| Report upload | `/api/reports/upload` | Store medical report PDFs/images |

### Tesseract.js (Local OCR)

| Feature | Route | Purpose |
|---------|-------|---------|
| Prescription OCR | `/api/medicine/extract-tesseract` | Extract medicine data from images |
| Report OCR | `/api/reports/upload` | Extract text from medical reports |

---

## 8. Environment Variables

```env
# ── App ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Database (MongoDB Atlas) ─────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cavista
MONGODB_DB_NAME=cavista

# ── Auth ─────────────────────────────────────────────────────
JWT_SECRET=<strong-random-secret>

# ── n8n AI Webhooks ──────────────────────────────────────────
CHATBOT_WEBHOOK_URL=https://synthomind.cloud/webhook/cavista-mental-chatbot
DAILY_SUMMARY_WEBHOOK_URL=https://synthomind.cloud/webhook/mental-cavista-chatbot
USER_DATA_STORE_WEBHOOK_URL=https://synthomind.cloud/webhook/user-data-store
RECOMMENDATION_WEBHOOK_URL=https://synthomind.cloud/webhook-test/recom-system
ROUTINE_WEBHOOK_URL=https://synthomind.cloud/webhook/recom-system
REPORT_INFO_WEBHOOK_URL=https://synthomind.cloud/webhook/user-report-info
REPORT_SUMMARY_WEBHOOK_URL=https://synthomind.cloud/webhook/mental-cavista-summary

# ── Cloudinary ───────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# ── Twilio ───────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_FROM_NUMBER=<phone-number>
```

---

## 9. Redundant Code — Cleanup Checklist

The following files/directories are **unused, orphaned, or duplicated** and should be removed:

### 🔴 High Priority — Dead Code

| # | Item | Path | Reason |
|---|------|------|--------|
| 1 | **Orphaned chat page** | `app/(dashboard)/chat/page.tsx` | No navigation links to `/chat`. Chat is embedded in mental-health page (`ChatAssistant`) and dashboard (`ChatDashboardModal`). Inaccessible to users. |
| 2 | **Duplicate OCR endpoint** | `app/api/ocr/extract/route.ts` | Duplicate of `/api/medicine/extract-tesseract`. Only used by the test page. No production code calls it. |
| 3 | **OCR test page** | `app/test/ocr/page.tsx` | Dev-only test harness. Should not ship to production. |
| 4 | **Twilio test page** | `app/test/twilio/page.tsx` | Dev-only test harness. Should not ship to production. |
| 5 | **SplineScene component** | `components/chat/SplineScene.tsx` | Never imported or rendered by any page or component. Completely dead code. |
| 6 | **Footer component** | `components/layout/Footer.tsx` | Never imported anywhere. The landing page has its own inline footer. |
| 7 | **Empty Zustand store** | `stores/index.ts` | Placeholder with only `export {}`. No actual stores. Not imported anywhere. |
| 8 | **Unused API client** | `services/api.ts` | Base fetch wrapper — never imported by any component. All code uses raw `fetch()`. |

### 🟡 Medium Priority — Unnecessary Root Files

| # | Item | Path | Reason |
|---|------|------|--------|
| 9 | **Tesseract data file** | `eng.traineddata` | ~100MB file. Tesseract.js downloads its own trained data from CDN at runtime. No code references a custom `langPath`. Dead weight. |
| 10 | **HTML mockup** | `stitch-dashboard.html` | Not referenced by any code. Old design prototype. |
| 11 | **HTML mockup** | `stitch-screen1.html` | Same. |
| 12 | **HTML mockup** | `stitch-screen2.html` | Same. |
| 13 | **HTML mockup** | `stitch-screen3.html` | Same. |
| 14 | **HTML mockup** | `stitch-screen4.html` | Same. |

### 🟢 Low Priority — Constants & Package Cleanup

| # | Item | Path | Reason |
|---|------|------|--------|
| 15 | **`ROUTES.CHAT` constant** | `constants/index.ts` | No navigation leads to `/chat`. Remove constant + its `ROUTE_ACCESS` entry. |
| 16 | **`@splinetool/*` packages** | `package.json` | Only used by dead `SplineScene.tsx`. Run: `npm uninstall @splinetool/react-spline @splinetool/runtime` |

### 🔧 Architectural Improvement Suggestions

| # | Suggestion | Description |
|---|-----------|-------------|
| A | **Consolidate Mongoose models** | Models split between `models/` and `lib/models/`. Move all to single `models/` directory. |
| B | **Extract large pages** | Several pages exceed 400+ LOC (reports: 740, doctor/shared: 566, profile: 488, assistant: 419, medi-reminder: 400, share: 397). Extract logic into hooks and smaller sub-components. |
| C | **Use `ROUTES` constants consistently** | Some links use `ROUTES.ASSISTANT`, others hardcode `"/assistant"`. Standardize. |

---

*Last updated: February 22, 2026*
