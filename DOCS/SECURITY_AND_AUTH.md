# 🔒 Security & Authentication Specification - Vàng Heo Đất

Security and trust are the cornerstones of the Vàng Heo Đất experience. This document outlines the measures taken to protect user data and digital assets.

---

## 🔐 Authentication Strategy

We implement a **Social-First** authentication flow to ensure a frictionless but highly secure onboarding experience.

### Identity Providers

- **Google Sign-In**: Primary provider for Android/iOS.
- **Apple Sign-In**: Native provider for iOS (Ensuring parity).

### The "Forced Account Picker" Logic

To prevent session confusion in families, we call `GoogleSignin.signOut()` immediately before `signIn()`. This forces the native account picker to appear every time a logic change is requested, preventing accidental logins into wrong family profiles.

---

## 💾 Token Management & Storage

We avoid using standard `AsyncStorage` for session tokens as it is not encrypted.

- **Persistence Layer**: `expo-secure-store`.
- **Encryption**: Tokens are stored in the device's hardware-backed Secure Enclave (iOS) or Keystore (Android).
- **Auto-Refresh**: Managed by the `supabase-js` client with a custom adapter, ensuring the user is never logged out unexpectedly while the device is in their possession.

---

## 🛡️ Data Protection (RLS)

All database access is governed by **Row Level Security (RLS)** in PostgreSQL.

1. **Authentication Gate**: Any request without a valid JWT is rejected by the API Gateway.
2. **Schema Isolation**: The `public` schema is strictly locked. Tables like `piggy_balances` can only be read if the `piggy_id` matches a record in `piggies` owned by the user (`auth.uid()`).
3. **Audit Trails**: Critical actions (like claiming a gold gift) are recorded in the `gift_claim_audit` table with timestamps and IP metadata.

---

## 🔗 Infrastructure Security

### Grail API Communication

- All communication with the assets layer is conducted over **HTTPS (TLS 1.3)**.
- Grail's internal wallet IDs are never exposed in the UI; they are kept as internal references in Supabase.

### Environment Safety

- Secret keys (Supabase Anon, Grail Endpoints) are stored in `.env` and injected via `expo-constants` only during build time, preventing hard-coding in the source.
