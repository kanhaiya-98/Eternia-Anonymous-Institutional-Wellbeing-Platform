# 🌌 Eternia — Anonymous Institutional Wellbeing Platform

> **Hackathon Prototype** — A role-based mental health support platform built for Indian educational institutions. Eternia enables anonymous peer support, expert counselling, real-time voice communication, and a structured escalation system — all linked by a universal identity model called the **Eternia Code**.

---

## 📸 Overview

Eternia is a full-stack web application that connects students with mental health support while preserving anonymity. Institutional authorities (admins, SPOCs, doctors) have dedicated dashboards with real-time capabilities.

```
Student signs up with Eternia Code
    ↓
Role-based dashboard (Student / Doctor / SPOC / Admin)
    ↓
Student can: Book doctor, join BlackBox voice, connect with peers
    ↓
Doctor can: View student sessions, escalate critical cases
    ↓
SPOC sees: Live escalation alerts + student emergency contacts
    ↓
Admin can: Add users, assign roles, view all escalations
```

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS + CSS custom properties |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (username + password via fake email) |
| **Real-time** | Supabase Realtime (Broadcast channels) |
| **Voice** | Agora RTC SDK (WebRTC-based) |
| **UI Components** | shadcn/ui |

---

## ✨ Features

### 🔐 Authentication & Identity
- **Eternia Code** onboarding — institution issues a code (e.g. `DEMO2025`)
- Username + Password signup (no email ever shown to user)
- **Role-based routing** after login → Student, Doctor, SPOC, Admin, Intern
- Fake email pattern: `{username}@eternia.app` stored in Supabase Auth
- Session cookies managed by `@supabase/ssr`

### 👤 Student Portal (`/dashboard`)
- Book **Doctor Sessions**
- **Peer Connect** — join shared voice channels
- **BlackBox** — anonymous real-time voice room (Agora RTC)
- **Profile page** — save emergency contact (stored in `user_private` table)
- Self Help Tools (Coming Soon)

### 🎙️ BlackBox — Anonymous Voice (`/blackbox`)
- Powered by **Agora RTC SDK**
- Users join a shared channel anonymously (random UID)
- Animated canvas visualizer (audio-reactive orb)
- Mute / unmute controls
- Multiple users in the same channel can hear each other live
- No identity exchange — truly anonymous

### 🩺 Doctor Dashboard (`/dashboard/doctor`)
- Lists **real students** fetched from Supabase `public.users`
- Generates ETR codes from user UUIDs
- **Escalate Case** button:
  1. Fetches student's emergency contact from `user_private`
  2. Stores escalation in `escalation_log` table
  3. Broadcasts via **Supabase Realtime** to SPOC + Admin simultaneously

### 🛡️ SPOC Dashboard (`/dashboard/spoc`)
- Live subscription to escalation events (< 1s latency)
- Each escalation card shows:
  - Student username & Eternia Code
  - Escalation level (L1 / L2 / L3)
  - **Emergency contact name, relation, and clickable phone number**
- **Acknowledge** button — removes from queue and persists to DB
- Acknowledged cases never reappear after page refresh

### 🔧 Admin Dashboard (`/dashboard/admin`)
- **Live user list** from Supabase (no mock data)
- Role count breakdown (Students / Experts / SPOCs / Interns / Admins)
- **Add User modal** — create Doctor, SPOC, Intern, or Admin accounts directly
- Escalation history tab — full audit log
- Real-time escalation feed (same Realtime channel)

### 📋 Escalation Flow
```
Doctor Dashboard → click "Escalate Case"
        │
        ├── API: fetch emergency contact from user_private
        ├── DB: insert into escalation_log
        └── Realtime: broadcast to "escalations" channel
                │
                ├── SPOC Dashboard → card appears instantly ← acknowledge → gone from DB
                └── Admin Dashboard → appears in Escalations tab
```

---

## 🗂️ Project Structure

```
eternia/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page (username + password)
│   │   ├── activate/       # Signup page (after Eternia Code scan)
│   │   └── scan/           # Eternia Code entry + QR scan
│   ├── api/
│   │   ├── auth/
│   │   │   └── signin/     # POST — sign in via username+password
│   │   ├── me/             # GET — current user profile + role
│   │   ├── admin/
│   │   │   └── users/      # GET list users | POST create user | PATCH update role
│   │   ├── escalate/       # POST escalate | PATCH acknowledge | GET list
│   │   ├── profile/        # GET + POST — emergency contact via user_private
│   │   └── validate-code/  # POST — resolve Eternia Code → institution UUID
│   ├── dashboard/
│   │   ├── page.tsx        # Student dashboard
│   │   ├── doctor/         # Doctor dashboard with escalation
│   │   ├── spoc/           # SPOC dashboard with live escalations
│   │   ├── admin/          # Admin dashboard with user management
│   │   └── intern/         # Intern dashboard
│   ├── blackbox/           # Anonymous voice room (Agora)
│   ├── profile/            # Student profile + emergency contact
│   ├── expert/             # Doctor booking
│   └── peer-connect/       # Peer voice connection
├── components/
│   ├── navbar.tsx          # Real username from Supabase, role-aware
│   └── ui/                 # shadcn/ui components
├── hooks/
│   └── use-agora-voice.ts  # Agora RTC hook (join/leave/mute/volume)
├── lib/
│   ├── auth.ts             # Server actions (signUp, signOut, etc.)
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client (cookie-based SSR)
│       └── middleware.ts   # Auth guard for middleware
├── middleware.ts            # Protects /dashboard/* routes
└── supabase/
    └── migrations/
        ├── 001_schema.sql            # Full DB schema (17 tables)
        ├── 002_rls_policies.sql      # Row Level Security
        ├── 003_triggers.sql          # handle_new_user trigger
        ├── 004_seed.sql              # Seed data (demo institution)
        ├── 005_fix_handle_new_user.sql # Robust trigger fix
        └── 006_escalation_log.sql    # Escalation table + emergency contact cols
```

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Supabase — get from Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Agora — get from console.agora.io
NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local`** — it's in `.gitignore`. Use `.env.local.example` as a template.

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- A Supabase project
- An Agora account (free tier works)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/kanhaiya-98/esqd.git
cd esqd

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, service role key, and Agora App ID

# 4. Run database migrations
# Go to Supabase Dashboard → SQL Editor → New Query
# Run each file in order: 001, 002, 003, 004, 005, 006

# 5. Start the dev server
npm run dev

# App runs at http://localhost:3000
```

---

## 🗄️ Database Setup

Run these SQL migrations **in order** in your Supabase SQL Editor:

| File | Purpose |
|---|---|
| `001_schema.sql` | All 17 core tables (users, institutions, sessions, etc.) |
| `002_rls_policies.sql` | Row Level Security policies |
| `003_triggers.sql` | `handle_new_user` trigger — auto-creates public.users on signup |
| `004_seed.sql` | Demo institution with Eternia Code `DEMO2025` |
| `005_fix_handle_new_user.sql` | Makes trigger resilient (audit log failure no longer blocks signup) |
| `006_escalation_log.sql` | Simple escalation log table with emergency contact columns |

### Critical Supabase Settings

1. **Disable Email Confirmation:**
   Dashboard → Authentication → Providers → Email → **Toggle OFF "Confirm email"**

2. **Agora — Testing Mode:**
   [console.agora.io](https://console.agora.io) → Your Project → ensure App Certificate is **not enabled** (Testing Mode allows `null` tokens)

---

## 🎮 Demo Flow (Hackathon)

### Setup (1 min)
1. Sign up at `/scan` with Eternia Code `DEMO2025`
2. Choose username + password → redirected to login
3. Login → routed to Student Dashboard

### Role-Based Demo (open 4 tabs)
| Tab | URL | Who |
|---|---|---|
| 1 | `/dashboard` | Student — book sessions, view modules |
| 2 | `/blackbox` | Student — join anonymous voice room |
| 3 | `/dashboard/doctor` | Doctor — view students, click Escalate |
| 4 | `/dashboard/spoc` | SPOC — see live escalation + contact |

### BlackBox Voice Demo
- Open `/blackbox` in **two browser tabs**
- Tap the orb in both → they connect via Agora
- Voice flows between tabs in real time

### Escalation Demo
1. Admin adds a Doctor account at `/dashboard/admin` → Add User
2. Student saves emergency contact at `/profile`
3. Open **Doctor dashboard** → Escalate Case for a student
4. Watch **SPOC dashboard** (other tab) — card appears in < 1 second
5. SPOC sees emergency contact phone → click to call
6. SPOC clicks **Acknowledge & Close** → card disappears from queue permanently

---

## 🧩 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signin` | Sign in with username + password |
| `GET` | `/api/me` | Get current user profile + role |
| `GET/POST` | `/api/profile` | Get/save user profile + emergency contact |
| `POST` | `/api/validate-code` | Resolve Eternia Code → institution UUID |
| `GET/POST/PATCH` | `/api/escalate` | List / create / acknowledge escalations |
| `GET/POST/PATCH` | `/api/admin/users` | List / create / update users (admin only) |

---

## 🔒 Security Notes

- All sensitive PII fields in `user_private` are labelled `_encrypted` (AES-256-GCM in production; stored plain for hackathon prototype)
- Service role key is **server-side only** — never exposed to browser
- RLS is enabled on all core tables — only relaxed on `escalation_log` for demo
- Middleware protects all `/dashboard/*` routes from unauthenticated access
- Session cookies managed by `@supabase/ssr` with automatic refresh

---

## 👥 Roles

| Role | Dashboard | Capabilities |
|---|---|---|
| `STUDENT` | `/dashboard` | Book sessions, BlackBox, Peer Connect, Profile |
| `EXPERT` | `/dashboard/doctor` | View students, escalate cases |
| `INTERN` | `/dashboard/intern` | Limited support access |
| `SPOC` | `/dashboard/spoc` | Monitor escalations, contact emergency contacts |
| `ADMIN` | `/dashboard/admin` | Full user management, all escalation history |

> **Students** sign up via the normal onboarding flow (`/scan` → `/activate`).  
> **Experts, SPOCs, Interns, and Admins** are created directly from the Admin Dashboard.

---

## 📦 Key Dependencies

```json
{
  "next": "15.x",
  "react": "19.x",
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "agora-rtc-sdk-ng": "^4.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

---

## 🏗️ Built For

**Hackathon 2025** — Demonstrating:
- Eternia Code-based institutional onboarding
- Role-based authentication and dashboards
- Real-time anonymous voice communication (BlackBox)
- Doctor → SPOC escalation workflow with live notifications
- Emergency contact system integrated into escalation protocol

---

## 📄 License

MIT — Built as a hackathon prototype. Not intended for production use without a full security audit and DPDP Act 2023 compliance review.

---

<p align="center">
  Built with ❤️ for student wellbeing
</p>
