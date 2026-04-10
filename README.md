# 🐷 Gold Piggy Bank (Vàng Heo Đất)

A premium custodial gold savings application for parents and children, built on Solana and Supabase.

## 🚀 Technology Stack

- **Mobile**: React Native + Expo (SDK 54)
- **Styling**: NativeWind (Tailwind CSS) & Reanimated
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Blockchain**: Oro Grail Protocol (Solana)
- **State Management**: TanStack Query (Server State) & Zustand (UI State)
- **I18n**: react-i18next (English & Vietnamese)

## 🏗 Project Architecture

The project follows a modular, security-first architecture:

- `app/`: Expo Router navigation shell.
- `src/components/ui/`: Reusable primitive design system.
- `src/services/`: Client-side service wrappers for Edge Functions.
- `supabase/functions/`: Secure Deno Edge Functions (Backend-as-a-Service).
- `supabase/migrations/`: Type-safe SQL schema with RLS and Audit trails.

## 🔐 Security Standards

- **Zero Client Secrets**: No GRAIL API keys are stored or called from the mobile app. All integrations pass through Supabase Edge Functions.
- **Atomic Operations**: Critical transactions (buying gold, claiming gifts) use SQL-level locks and audit logging to prevent race conditions.
- **Navigation Guards**: JWT-based session management ensuring consistent auth state.

## 🛠 Features (Phase 1 MVP)

- [x] Primitive UI Design System
- [x] Secure Session Management
- [x] Navigation & Deep Linking (heodat://gift/...)
- [x] Gold Price & Balance Integration (GRAIL)
- [x] Atomic Gift Claiming Logic
- [ ] Wallet & Transaction History (Sprint 6)

## 📦 Setup & Development

1. Clone the repository.
2. Install dependencies: `pnpm install`
3. Configure environment: Copy `.env.example` to `.env`.
4. Run locally: `pnpm expo start`

---

_Developed — mocchaust64_
