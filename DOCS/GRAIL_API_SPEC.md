# GRAIL API Specification — Vàng Heo Đất

This document serves as the local reference for integrating with Oro's GRAIL API. 
**Source:** https://docs.grail.oro.finance/

## 1. General Config
- **Base URL (Devnet):** `https://oro-tradebook-devnet.up.railway.app`
- **Authentication:** Header `x-api-key: <YOUR_API_KEY>`
- **Blockchain:** Solana (Devnet for testing).

## 2. Custodial User Management
### Create User (Wallet PDA)
- **Endpoint:** `POST /api/users`
- **Purpose:** Creates a custodial wallet on Solana for the user.
- **Request Body:**
  ```json
  {
    "kycHash": "string",
    "userWalletAddress": "string",
    "metadata": { "referenceId": "user-uuid", "tags": ["heodat"] }
  }
  ```
- **Response:** Returns the `userPda` address.

### Get User Details
- **Endpoint:** `GET /api/users/:userId`
- **Note:** Includes gold balance in `balancesManagedByProgram.gold.amount`.

## 3. Trading (Buy Gold)
### Get Buy Estimate
- **Endpoint:** `POST /api/trading/estimate-buy`
- **Body:** `{ "goldAmount": number }`

### Purchase Gold
- **Endpoint:** `POST /api/trading/purchases/user`
- **Body:**
  ```json
  {
    "userId": "string",
    "goldAmount": number,
    "maxUsdcAmount": number,
    "co_sign": false,
    "userAsFeePayer": true
  }
  ```
- **Response:** Returns `serializedTx` (Base64). The Partner (backend) must sign this before submission.

## 4. Pricing
### Current Gold Price
- **Endpoint:** `GET /api/trading/gold/price`
- **Public:** No `x-api-key` required.
- **Unit:** Troy ounce (need to convert to grams for UI: 1 troy ounce ≈ 31.1035 grams).

## 5. Security Checklist for Agents
1. **Never** call these endpoints from the Mobile app.
2. Use **Edge Functions** as a proxy.
3. Store `x-api-key` in Supabase Secrets.
4. Log all `serializedTx` and result transaction hashes to the `transactions` table.
